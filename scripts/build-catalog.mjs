#!/usr/bin/env node
// Catalog refresh (every 1–2 weeks):
//   1. Put the new export in data/raw/ (gitignored: it has prices and suppliers). .xlsx, or .csv saved as "CSV UTF-8".
//   2. npm run catalog            → rewrites src/data/catalog.json and prints what changed
//      npm run catalog -- --sample → also writes data/raw/revision-clasificacion.csv for the sales team
//   3. Open a PR with the JSON, check the Vercel preview, merge.
// Options: [file] (default: newest .xlsx/.csv in data/raw), --date YYYY-MM-DD (default: today), --sample [N] (default 100).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { SHEET, buildCatalog, diffCatalogs, reviewSample } from './catalog/build.mjs';
import { readCsv as parseCsv } from './catalog/csv.mjs';
import { readSheet } from './catalog/xlsx.mjs';

const RAW_DIR = 'data/raw';
const OUT = 'src/data/catalog.json';
const REVIEW_OUT = join(RAW_DIR, 'revision-clasificacion.csv');
// Supplier code → CIC code, from npm run codes:assign. Gitignored like the export.
const CODES = join(RAW_DIR, 'codigos-cic.csv');
// Products not in the export yet (committed; public fields only, CIC codes from the register).
const EXTRA = 'data/productos-adicionales.csv';
// Duplicates and products not sold, as decided by the sales team (committed; supplier codes only).
const RETIRED = 'data/productos-retirados.csv';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const value = args[i + 1];
  const hasValue = value !== undefined && !value.startsWith('--');
  args.splice(i, hasValue ? 2 : 1);
  return hasValue ? value : true;
};
const sampleFlag = flag('--sample');
const date = flag('--date') ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) fail(`--date must be YYYY-MM-DD, got "${date}"`);

const source = args[0] ?? newestSource();
const rows = extname(source).toLowerCase() === '.csv' ? readCsv(source) : readSheet(source, SHEET);
const codes = existsSync(CODES) ? readCodes(CODES) : undefined;
const extra = existsSync(EXTRA) ? readCsv(EXTRA) : undefined;
const retired = existsSync(RETIRED) ? readRetired(RETIRED) : undefined;
const { catalog, errors, skipped } = buildCatalog(rows, { updatedAt: date, codes, extra, retired });
if (errors.length) fail(`${errors.length} problem(s) in ${basename(source)}${extra ? ` or ${basename(EXTRA)}` : ''}, nothing written:\n  ${errors.slice(0, 30).join('\n  ')}`);

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : undefined;
const diff = diffCatalogs(prev, catalog);
writeFileSync(OUT, serialize(catalog));

console.log(`✓ ${OUT}: ${catalog.total} products, ${catalog.categorias.length} categorías, ${catalog.segmentos.length} segmentos` +
  (skipped ? `, ${skipped} inactive or retired skipped` : '') +
  `, ${catalog.productos.filter((p) => p.bajoPedido).length} bajo pedido. Source: ${basename(source)}, date ${date}.`);
if (prev) {
  const show = (label, cods) => {
    if (!cods.length) return;
    console.log(`  ${label}: ${cods.length} (${cods.slice(0, 8).join(', ')}${cods.length > 8 ? ', …' : ''})`);
  };
  show('added', diff.added);
  show('removed', diff.removed);
  show('renamed/reclassified', diff.changed);
  show('stock status changed', diff.stock);
  show('recoded (supplier → CIC code)', diff.recoded);
  if (!diff.added.length && !diff.removed.length && !diff.changed.length && !diff.stock.length && !diff.recoded.length) console.log('  no product changes');
}

if (sampleFlag) {
  const size = sampleFlag === true ? 100 : Number(sampleFlag);
  const label = (list, slug) => list.find((x) => x.slug === slug).label;
  const sample = reviewSample(catalog.productos, size);
  const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ['Cod', 'Nombre', 'Categoría', 'Segmento', '¿Correcto? (Sí/No)', 'Categoría correcta', 'Segmento correcto'],
    ...sample.map((p) => [p.cod, p.nombre, label(catalog.categorias, p.categoria), label(catalog.segmentos, p.segmento), '', '', '']),
  ];
  // BOM + ";" so Excel in Spanish opens it with accents and columns intact.
  writeFileSync(REVIEW_OUT, '﻿' + lines.map((l) => l.map(cell).join(';')).join('\r\n') + '\r\n');
  console.log(`✓ ${REVIEW_OUT}: ${sample.length} products to check (gitignored)`);
}

function newestSource() {
  const files = existsSync(RAW_DIR)
    ? readdirSync(RAW_DIR).filter((f) => /\.(xlsx|csv)$/i.test(f) && !/^(revision-|codigos-)/.test(f)).map((f) => join(RAW_DIR, f))
    : [];
  if (!files.length) fail(`No .xlsx or .csv in ${RAW_DIR}/. Put the export there or pass its path.`);
  return files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

/** Supplier code → the CIC code that replaces it ('' = removed, not sold). */
function readRetired(path) {
  const [header, ...rows] = readCsv(path);
  const supplier = header.indexOf('Código proveedor');
  const replacement = header.indexOf('Reemplazado por');
  if (supplier < 0 || replacement < 0) fail(`${basename(path)}: needs the columns "Código proveedor" and "Reemplazado por"`);
  return new Map(rows.filter((r) => r[supplier]).map((r) => [r[supplier].trim(), (r[replacement] ?? '').trim()]));
}

/** Supplier code → CIC code, for the export's products (the CIC list's own products have no supplier code). */
function readCodes(path) {
  const [header, ...rows] = readCsv(path);
  const cic = header.indexOf('Código CIC');
  const supplier = header.indexOf('Código proveedor');
  if (cic < 0 || supplier < 0) fail(`${basename(path)}: needs the columns "Código CIC" and "Código proveedor"`);
  return new Map(rows.filter((r) => r[supplier]).map((r) => [r[supplier].trim(), r[cic].trim()]));
}

function readCsv(path) {
  try {
    return parseCsv(path);
  } catch (e) {
    fail(e.message);
  }
}

// One product per line, so a refresh PR shows exactly which products changed.
function serialize({ productos, ...meta }) {
  const head = JSON.stringify(meta, null, 2).replace(/\n}$/, '');
  return `${head},\n  "productos": [\n${productos.map((p) => `    ${JSON.stringify(p)}`).join(',\n')}\n  ]\n}\n`;
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}
