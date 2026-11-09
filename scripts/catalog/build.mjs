// Turns the sales team's product sheet into the public catalog. Pure functions, so they can be tested without a file.
import { CATEGORIAS, SEGMENTOS, slugify } from './taxonomy.mjs';

export const SHEET = 'Listado por segmento';

// Exports can put a title above the header (Numbers writes "Table 1"), so look for it in the first rows.
const HEADER_SEARCH_ROWS = 5;

// Source column → what we do with it. Only these columns are read; anything else in the sheet (Familia = supplier,
// Bv = price) is ignored and never reaches the public JSON.
const COLUMNS = { segmento: 'Segmento', categoria: 'Categoría', cod: 'Cod', nombre: 'Nombre', activo: 'Activo', stock: 'stock a hoy' };

const toTaxonomy = (labels) => labels.map((label) => ({ slug: slugify(label), label }));

/**
 * @param {string[][]} rows sheet rows, header first
 * @param {{ updatedAt: string }} options refresh date (YYYY-MM-DD), shown on the page
 * @returns {{ catalog?: object, errors: string[], skipped: number }}
 */
export function buildCatalog(rows, { updatedAt }) {
  const headerAt = Math.max(0, rows.slice(0, HEADER_SEARCH_ROWS).findIndex((r) => r.some((h) => String(h).trim() === COLUMNS.cod)));
  const header = rows[headerAt] ?? [];
  const data = rows.slice(headerAt + 1);
  const index = {};
  const errors = [];
  for (const [key, name] of Object.entries(COLUMNS)) {
    index[key] = header.findIndex((h) => h.trim() === name);
    if (index[key] < 0) errors.push(`Missing column "${name}" (found: ${header.join(', ')})`);
  }
  if (errors.length) return { errors, skipped: 0 };

  const categorias = toTaxonomy(CATEGORIAS);
  const segmentos = toTaxonomy(SEGMENTOS);
  const catSlug = new Map(categorias.map((c) => [c.label, c.slug]));
  const segSlug = new Map(segmentos.map((s) => [s.label, s.slug]));

  const productos = [];
  const seen = new Map();
  let skipped = 0;

  data.forEach((row, i) => {
    const line = headerAt + i + 2; // row number as the spreadsheet shows it
    const get = (key) => String(row[index[key]] ?? '').trim();
    if (row.every((v) => String(v).trim() === '')) return;
    if (get('activo').toLowerCase() !== 'si') {
      skipped++;
      return;
    }

    const cod = get('cod');
    const nombre = get('nombre').replace(/\s+/g, ' ');
    const categoria = catSlug.get(get('categoria'));
    const segmento = segSlug.get(get('segmento'));
    const stockText = get('stock');
    // A count, so "1.192" / "1,192" are thousands separators (CSV exports format numbers).
    const stock = Number(stockText.replace(/[.,\s]/g, ''));

    if (!cod) errors.push(`Row ${line}: empty Cod`);
    if (!nombre) errors.push(`Row ${line}: empty Nombre (Cod ${cod})`);
    if (!categoria) errors.push(`Row ${line}: unknown Categoría "${get('categoria')}" (add it to scripts/catalog/taxonomy.mjs if it's new)`);
    if (!segmento) errors.push(`Row ${line}: unknown Segmento "${get('segmento')}" (add it to scripts/catalog/taxonomy.mjs if it's new)`);
    if (stockText === '' || Number.isNaN(stock)) errors.push(`Row ${line}: stock "${stockText}" is not a number (Cod ${cod})`);
    if (cod && seen.has(cod)) errors.push(`Row ${line}: duplicate Cod ${cod} (first at row ${seen.get(cod)})`);
    if (!seen.has(cod)) seen.set(cod, line);

    // Publish only whether it's in stock, never the quantity.
    productos.push({ cod, nombre, categoria, segmento, bajoPedido: !(stock > 0) });
  });

  if (errors.length) return { errors, skipped };

  productos.sort((a, b) => a.cod.localeCompare(b.cod, 'es', { numeric: true }));
  const count = (key, slug) => productos.filter((p) => p[key] === slug).length;

  return {
    catalog: {
      updatedAt,
      total: productos.length,
      // Unused labels are dropped so the page never shows an empty pill.
      categorias: categorias.map((c) => ({ ...c, count: count('categoria', c.slug) })).filter((c) => c.count),
      segmentos: segmentos.map((s) => ({ ...s, count: count('segmento', s.slug) })).filter((s) => s.count),
      productos,
    },
    errors,
    skipped,
  };
}

/** What changed between two catalogs, by Cod. Printed on every refresh so the PR is reviewable. */
export function diffCatalogs(prev, next) {
  const before = new Map((prev?.productos ?? []).map((p) => [p.cod, p]));
  const after = new Map(next.productos.map((p) => [p.cod, p]));
  const added = [...after.keys()].filter((c) => !before.has(c));
  const removed = [...before.keys()].filter((c) => !after.has(c));
  const changed = [...after.keys()].filter((c) => {
    const a = before.get(c);
    const b = after.get(c);
    return a && (a.nombre !== b.nombre || a.categoria !== b.categoria || a.segmento !== b.segmento);
  });
  const stock = [...after.keys()].filter((c) => before.has(c) && before.get(c).bajoPedido !== after.get(c).bajoPedido);
  return { added, removed, changed, stock };
}

/**
 * A spread sample for the sales team to check the classification: at least `min` per categoría, the rest proportional.
 * Deterministic (seeded), so re-running gives the same rows.
 */
export function reviewSample(productos, size, { min = 2, seed = 1 } = {}) {
  let s = seed;
  // LCG: tiny and seedable, enough for picking rows.
  const rand = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const byCat = Map.groupBy(productos, (p) => p.categoria);
  const sample = [];
  for (const items of byCat.values()) {
    const take = Math.min(items.length, Math.max(min, Math.round((items.length / productos.length) * size)));
    const pool = [...items];
    for (let i = 0; i < take; i++) sample.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return sample;
}
