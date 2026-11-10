#!/usr/bin/env node
// CIC codes: one per product, from the sales export (supplier codes) plus CIC's own product lists. The output is the
// register of which code belongs to which product. Products go into Quality Manager one by one, by hand, the first
// time a client asks for them, with the code from this register (the website shows it too). When a product is in both, the CIC list's values win (they come from CIC's
// inventory); likely pairs are flagged for the team, since names alone can't prove a duplicate.
//   npm run codes:assign [-- --export data/raw/portfolio_diag.xlsx --cic data/raw/cic/lista-julio.xlsx]
// Writes data/raw/codigos-cic.csv (gitignored: it has suppliers). Re-running keeps every code already assigned (a code
// never changes) and numbers only new products. Codes already published in src/data/catalog.json (cod + antes) count
// as assigned too, so losing the CSV can't reassign them.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { assignCodes, cicListName, classifyCicName, ivaFrom } from './catalog/assign.mjs';
import { SHEET } from './catalog/build.mjs';
import { parseCode } from './catalog/codes.mjs';
import { readCsv } from './catalog/csv.mjs';
import { CATEGORIA_NUM } from './catalog/taxonomy.mjs';
import { readSheet } from './catalog/xlsx.mjs';

const OUT = 'data/raw/codigos-cic.csv';
const PUBLISHED = 'src/data/catalog.json';
const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const exportPath = opt('--export', 'data/raw/portfolio_diag.xlsx');
const cicPath = opt('--cic', 'data/raw/cic/lista-julio.xlsx');

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

/** Rows as objects by header name; the header is the first row (within the first 10) that has all `required`. */
function table(rows, required, source) {
  const at = rows.slice(0, 10).findIndex((r) => required.every((h) => r.some((c) => String(c).trim() === h)));
  if (at < 0) fail(`${source}: no header with ${required.join(', ')}`);
  const header = rows[at].map((h) => String(h).trim());
  return rows.slice(at + 1).map((r) => Object.fromEntries(header.map((h, i) => [h, String(r[i] ?? '').trim()])));
}

// Sales export: active products, classified already.
const exported = table(readSheet(exportPath, SHEET), ['Cod', 'Nombre', 'Categoría', 'Segmento', 'Activo'], exportPath)
  .filter((r) => r.Cod && r.Activo.toLowerCase() === 'si')
  .map((r) => ({ key: `P:${r.Cod}`, supplierCod: r.Cod, proveedor: r.Familia ?? '', nombre: r.Nombre.replace(/\s+/g, ' '), categoria: r['Categoría'], segmento: r.Segmento, iva: 'pendiente', origen: 'Exportación' }));

// The usual segmento of each categoría, for CIC list products (they come without one).
const segmentoOf = new Map();
for (const [cat, items] of Map.groupBy(exported, (p) => p.categoria)) {
  const counts = Map.groupBy(items, (p) => p.segmento);
  segmentoOf.set(cat, [...counts].sort((a, b) => b[1].length - a[1].length)[0][0]);
}

// CIC list: name + presentación, IVA; no codes, no categoría.
const unclassified = [];
const cicList = table(readSheet(cicPath, 'Hoja1'), ['PRODUCTO', 'PRESENTACION'], cicPath)
  .filter((r) => r.PRODUCTO && r.PRESENTACION)
  .map((r) => {
    const nombre = cicListName(r.PRODUCTO, r.PRESENTACION);
    const categoria = classifyCicName(nombre);
    if (!categoria) unclassified.push(nombre);
    return { key: `C:${nombre}`, supplierCod: '', proveedor: '', nombre, categoria, segmento: segmentoOf.get(categoria) ?? '', iva: ivaFrom(r.IVA), origen: 'Lista CIC' };
  });
if (unclassified.length) fail(`No categoría rule (CIC_LIST_RULES in scripts/catalog/assign.mjs) for:\n  ${unclassified.join('\n  ')}`);

const products = [...exported, ...cicList];
const dupKeys = [...Map.groupBy(products, (p) => p.key)].filter(([, v]) => v.length > 1).map(([k]) => k);
if (dupKeys.length) fail(`Same product twice: ${dupKeys.slice(0, 10).join(', ')}`);

// Likely duplicates: same product type (first word) and every number/size of the CIC name in the export name, with
// exactly one candidate. Only a flag: the team confirms, then deletes the export row in Quality Manager.
const norm = (s) => ` ${s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/(\d),(\d)/g, '$1.$2').replace(/[^A-Z0-9./]+/g, ' ').replace(/\b(\d+) ?(G|ML|MM|FR|L|CC|UL|GR)\b/g, '$1$2').trim()} `;
const stem = (w) => w.replace(/(ES|S)$/, '');
const exportNorm = exported.map((p) => ({ p, n: norm(p.nombre) }));
const duplicateOf = new Map();
for (const c of cicList) {
  const words = norm(c.nombre).trim().split(' ');
  const nums = words.filter((w) => /\d/.test(w));
  const hits = exportNorm.filter(({ n }) => stem(n.trim().split(' ')[0]) === stem(words[0]) && nums.every((t) => n.includes(` ${t} `) || n.includes(` X${t} `)));
  if (hits.length === 1) duplicateOf.set(c.key, hits[0].p);
}

// Keep what was already assigned: the register, and the codes published on the website (committed, so they survive
// even if the register is lost). The two must agree.
const previous = new Map();
if (existsSync(OUT)) {
  for (const r of table(readCsv(OUT), ['Código CIC', 'Clave'], OUT)) previous.set(r.Clave, r['Código CIC']);
}
const conflicts = [];
for (const p of existsSync(PUBLISHED) ? JSON.parse(readFileSync(PUBLISHED, 'utf8')).productos : []) {
  if (!p.antes) continue;
  const key = `P:${p.antes}`;
  if (previous.has(key) && previous.get(key) !== p.cod) conflicts.push(`supplier ${p.antes}: ${previous.get(key)} in ${OUT}, ${p.cod} on the website`);
  else previous.set(key, p.cod);
}
if (conflicts.length) fail(`The register and the website disagree, nothing written:\n  ${conflicts.slice(0, 20).join('\n  ')}`);
const codes = assignCodes(products, previous);

// Checker: every code valid and unique, new codes in their categoría's range.
const problems = [];
const seen = new Map();
for (const p of products) {
  const code = codes.get(p.key);
  const parsed = parseCode(code);
  if (!parsed) problems.push(`${p.nombre}: invalid code ${code}`);
  else if (!previous.has(p.key) && parsed.catNum !== CATEGORIA_NUM[p.categoria]) problems.push(`${p.nombre}: ${code} outside ${p.categoria}`);
  if (seen.has(code)) problems.push(`${code} given to "${seen.get(code)}" and "${p.nombre}"`);
  seen.set(code, p.nombre);
}
if (problems.length) fail(`${problems.length} problem(s), nothing written:\n  ${problems.slice(0, 20).join('\n  ')}`);

const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
const lines = [['Código CIC', 'Código proveedor', 'Proveedor', 'Nombre', 'Categoría', 'Segmento', 'IVA', 'Origen', 'Posible duplicado (revisar)', 'Clave']];
for (const p of [...products].sort((a, b) => codes.get(a.key).localeCompare(codes.get(b.key)))) {
  const dup = duplicateOf.get(p.key);
  lines.push([codes.get(p.key), p.supplierCod, p.proveedor, p.nombre, p.categoria, p.segmento, p.iva, p.origen, dup ? `${dup.supplierCod} ${dup.nombre}` : '', p.key]);
}
// BOM + ";" so Excel in Spanish opens it with accents and columns intact.
writeFileSync(OUT, '﻿' + lines.map((l) => l.map(cell).join(';')).join('\r\n') + '\r\n');

const fresh = products.filter((p) => !previous.has(p.key)).length;
const perCat = Map.groupBy(products, (p) => p.categoria);
const biggest = [...perCat].sort((a, b) => b[1].length - a[1].length)[0];
console.log(`✓ ${OUT}: ${products.length} codes (${exported.length} export + ${cicList.length} CIC list), ${fresh} new, ${previous.size} kept.`);
console.log(`  checker: all valid and unique · biggest categoría ${biggest[0]} ${biggest[1].length}/9999 · IVA: ${products.filter((p) => p.iva !== 'pendiente').length} known, ${products.filter((p) => p.iva === 'pendiente').length} pendiente · ${duplicateOf.size} possible duplicates flagged`);
