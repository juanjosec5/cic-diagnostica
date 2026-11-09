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
import { readSheet } from './catalog/xlsx.mjs';

const RAW_DIR = 'data/raw';
const OUT = 'src/data/catalog.json';
const REVIEW_OUT = join(RAW_DIR, 'revision-clasificacion.csv');

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
const { catalog, errors, skipped } = buildCatalog(rows, { updatedAt: date });
if (errors.length) fail(`${errors.length} problem(s) in ${basename(source)}, nothing written:\n  ${errors.slice(0, 30).join('\n  ')}`);

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : undefined;
const diff = diffCatalogs(prev, catalog);
writeFileSync(OUT, serialize(catalog));

console.log(`✓ ${OUT}: ${catalog.total} products, ${catalog.categorias.length} categorías, ${catalog.segmentos.length} segmentos` +
  (skipped ? `, ${skipped} inactive skipped` : '') +
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
  if (!diff.added.length && !diff.removed.length && !diff.changed.length && !diff.stock.length) console.log('  no product changes');
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
    ? readdirSync(RAW_DIR).filter((f) => /\.(xlsx|csv)$/i.test(f) && !f.startsWith('revision-')).map((f) => join(RAW_DIR, f))
    : [];
  if (!files.length) fail(`No .xlsx or .csv in ${RAW_DIR}/. Put the export there or pass its path.`);
  return files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

// RFC 4180 with "," or ";" (Excel in Spanish uses ";"). Must be UTF-8: a Windows-1252 export garbles accents.
function readCsv(path) {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  if (text.includes('�')) fail(`${basename(path)} isn't UTF-8. In Excel use "Guardar como → CSV UTF-8", or use the .xlsx.`);
  const firstLine = text.slice(0, text.indexOf('\n'));
  const occurrences = (ch) => firstLine.split(ch).length - 1;
  const delimiter = occurrences(';') > occurrences(',') ? ';' : ',';
  const rows = [[]];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      rows.at(-1).push(cell);
      cell = '';
    } else if (ch === '\n') {
      rows.at(-1).push(cell.replace(/\r$/, ''));
      rows.push([]);
      cell = '';
    } else {
      cell += ch;
    }
  }
  rows.at(-1).push(cell);
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
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
