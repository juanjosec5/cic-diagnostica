import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog, diffCatalogs, reviewSample } from './build.mjs';
import { slugify } from './taxonomy.mjs';

const HEADER = ['Segmento', 'Categoría', 'Cod', 'Nombre', 'Familia', 'Bv', 'Activo', 'stock a hoy'];
const row = (over = {}) => {
  const r = { Segmento: 'Medicina general', Categoría: 'Guantes', Cod: '0986', Nombre: 'GUANTE  NITRILO TALLA M', Familia: '188-BSN', Bv: '32500', Activo: 'Si', 'stock a hoy': '5', ...over };
  return HEADER.map((h) => r[h]);
};
const build = (...rows) => buildCatalog([HEADER, ...rows], { updatedAt: '2026-11-09' });

test('publishes only whitelisted fields, keeps leading zeros, never price, supplier or quantity', () => {
  const { catalog, errors } = build(row());
  assert.deepEqual(errors, []);
  assert.deepEqual(catalog.productos, [
    { cod: '0986', nombre: 'GUANTE NITRILO TALLA M', categoria: 'guantes', segmento: 'medicina-general', bajoPedido: false },
  ]);
  const json = JSON.stringify(catalog);
  assert.ok(!json.includes('32500') && !json.includes('BSN'));
});

test('stock 0 or negative is bajo pedido', () => {
  const { catalog } = build(row({ Cod: '1', 'stock a hoy': '0' }), row({ Cod: '2', 'stock a hoy': '-3' }));
  assert.ok(catalog.productos.every((p) => p.bajoPedido));
});

test('rejects duplicate codes, unknown categories, empty names and non-numeric stock', () => {
  const { catalog, errors } = build(
    row({ Cod: '1' }),
    row({ Cod: '1' }),
    row({ Cod: '2', Categoría: 'Guantez' }),
    row({ Cod: '3', Nombre: ' ' }),
    row({ Cod: '4', 'stock a hoy': 'n/a' }),
  );
  assert.equal(catalog, undefined);
  assert.equal(errors.length, 4);
  assert.match(errors.join('\n'), /duplicate Cod 1 \(first at row 2\)/);
  assert.match(errors.join('\n'), /unknown Categoría "Guantez"/);
});

test('fails on a missing column, accepts reordered columns', () => {
  assert.match(buildCatalog([HEADER.filter((h) => h !== 'Cod'), []], { updatedAt: 'x' }).errors[0], /Missing column "Cod"/);
  const reordered = [...HEADER].reverse();
  const { errors } = buildCatalog([reordered, row().reverse()], { updatedAt: 'x' });
  assert.deepEqual(errors, []);
});

test('finds the header below an export title and reports real row numbers', () => {
  const { catalog, errors } = buildCatalog([['Table 1'], HEADER, row(), row()], { updatedAt: 'x' });
  assert.equal(catalog, undefined);
  assert.match(errors[0], /Row 4: duplicate Cod 0986 \(first at row 3\)/);
});

test('reads stock with thousands separators', () => {
  const { catalog } = build(row({ Cod: '1', 'stock a hoy': '1.192' }), row({ Cod: '2', 'stock a hoy': '0' }));
  assert.deepEqual(catalog.productos.map((p) => p.bajoPedido), [false, true]);
});

test('skips inactive and blank rows; drops empty categories', () => {
  const { catalog, skipped } = build(row(), row({ Cod: '2', Activo: 'No' }), ['', '', '', '', '', '', '', '']);
  assert.equal(catalog.total, 1);
  assert.equal(skipped, 1);
  assert.deepEqual(catalog.categorias.map((c) => c.slug), ['guantes']);
});

test('diff reports added, removed, reclassified and stock changes', () => {
  const prev = build(row({ Cod: '1' }), row({ Cod: '2' }), row({ Cod: '3' })).catalog;
  const next = build(row({ Cod: '1', Categoría: 'Agujas' }), row({ Cod: '3', 'stock a hoy': '0' }), row({ Cod: '4' })).catalog;
  assert.deepEqual(diffCatalogs(prev, next), { added: ['4'], removed: ['2'], changed: ['1'], stock: ['3'], recoded: [] });
});

test('with CIC codes: publishes them as cod, keeps the supplier code as antes, diff shows recoded', () => {
  const codes = new Map([['0986', 'CD22000012']]);
  const prev = build(row()).catalog;
  const { catalog, errors } = buildCatalog([HEADER, row()], { updatedAt: 'x', codes });
  assert.deepEqual(errors, []);
  assert.deepEqual(catalog.productos[0], { cod: 'CD22000012', antes: '0986', nombre: 'GUANTE NITRILO TALLA M', categoria: 'guantes', segmento: 'medicina-general', bajoPedido: false });
  assert.deepEqual(diffCatalogs(prev, catalog), { added: [], removed: [], changed: [], stock: [], recoded: ['CD22000012'] });
});

test('with CIC codes: a product without one, or an invalid one, stops the import', () => {
  const { catalog, errors } = buildCatalog([HEADER, row({ Cod: '1' }), row({ Cod: '2' })], { updatedAt: 'x', codes: new Map([['2', 'CD22000013']]) });
  assert.equal(catalog, undefined);
  assert.match(errors.join('\n'), /no CIC code for Cod 1/);
  assert.match(errors.join('\n'), /invalid CIC code CD22000013/);
});

test('review sample covers every category and is deterministic', () => {
  const productos = Array.from({ length: 300 }, (_, i) => ({ cod: String(i), categoria: i < 290 ? 'a' : 'b' }));
  const one = reviewSample(productos, 20);
  assert.ok(one.some((p) => p.categoria === 'b'));
  assert.deepEqual(one, reviewSample(productos, 20));
});

test('marks the shared categories', () => {
  const { catalog } = build(row({ Cod: '1' }), row({ Cod: '2', Categoría: 'Medicamentos' }));
  assert.deepEqual(catalog.categorias.map((c) => [c.slug, c.comun]), [['guantes', true], ['medicamentos', false]]);
});

test('slugify strips accents and punctuation', () => {
  assert.equal(slugify('Antisépticos, desinfectantes e higiene'), 'antisepticos-desinfectantes-e-higiene');
});

const EXTRA_HEADER = ['Cod', 'Nombre', 'Categoría', 'Segmento', 'Disponibilidad'];
const extraRow = (over = {}) => {
  const r = { Cod: 'CD38000014', Nombre: 'PRUEBA RAPIDA HBSAG CAJA X 25', Categoría: 'Toma de muestras y laboratorio', Segmento: 'Toma de muestras de laboratorio', Disponibilidad: 'En inventario', ...over };
  return EXTRA_HEADER.map((h) => r[h]);
};
const withExtra = (...extraRows) => buildCatalog([HEADER, row()], { updatedAt: 'x', extra: [EXTRA_HEADER, ...extraRows] });

test('merges additional products with their CIC code and availability', () => {
  const { catalog, errors } = withExtra(extraRow(), extraRow({ Cod: 'CD38000022', Disponibilidad: 'Bajo pedido' }));
  assert.deepEqual(errors, []);
  assert.deepEqual(catalog.productos.map((p) => [p.cod, p.bajoPedido]), [['0986', false], ['CD38000014', false], ['CD38000022', true]]);
});

test('additional products need a valid CIC code, a known availability and no duplicate code', () => {
  const { catalog, errors } = withExtra(extraRow({ Cod: 'W0001' }), extraRow({ Cod: 'CD38000015' }), extraRow({ Disponibilidad: 'Sí' }), extraRow());
  assert.equal(catalog, undefined);
  const all = errors.join('\n');
  assert.match(all, /row 2: Cod "W0001" is not a valid CIC code/);
  assert.match(all, /row 3: Cod "CD38000015" is not a valid CIC code/);
  assert.match(all, /row 4: Disponibilidad "Sí" must be/);
  assert.match(all, /row 5: duplicate Cod CD38000014 \(first at productos adicionales row 4\)/);
});

test('fails on a missing column in the additional products', () => {
  const { errors } = buildCatalog([HEADER, row()], { updatedAt: 'x', extra: [['Cod', 'Nombre']] });
  assert.match(errors.join('\n'), /Productos adicionales: Missing column "Categoría"/);
});
