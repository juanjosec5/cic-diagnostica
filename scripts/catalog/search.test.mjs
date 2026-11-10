import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_QTY, clampQty, matcher, normalize, quoteMessage, readSavedList, searchKey, startsWithQuery } from '../../src/lib/catalog-search.ts';

const finds = (query, nombre, cod = '1', categoria = 'Diagnóstico y monitoreo') => matcher(query)(searchKey(cod, nombre, categoria));

test('ignores case, accents and punctuation', () => {
  assert.equal(normalize('TENSIOM. W.A. Estéril'), 'tensiom w a esteril');
  assert.ok(finds('estéril', 'AGUJA ESTERIL 21G'));
  assert.ok(finds('AGUJA esteril', 'aguja estéril 21G'));
});

test('every word must match, in any order', () => {
  assert.ok(finds('guante 8.5', 'GUANTE QUIRURGICO ESTERIL TALLA 8.5'));
  assert.ok(!finds('guante 9', 'GUANTE QUIRURGICO ESTERIL TALLA 8.5'));
});

test('plurals find singular names', () => {
  assert.ok(finds('guantes', 'GUANTE NITRILO TALLA M'));
  assert.ok(finds('cateteres', 'CATETER IV 22G'));
  assert.ok(finds('jeringas', 'JERINGA 5 ML'));
});

test('full words find abbreviated names', () => {
  assert.ok(finds('tensiometro', 'TENSIOM. DURASHOCK ANEROIDE DS45-11C'));
  assert.ok(finds('fonendoscopio', 'FONENDO. LITTMANN CLASSIC III'));
  assert.ok(finds('welch allyn', 'BOMBILLO OTOSCOPIO W.A. 03100 3.5V'));
  // an abbreviation only expands as a whole word: "pedal" isn't "ped."
  assert.ok(!finds('pediatrico', 'SILLA CON PEDAL'));
});

test('tube colours match in either gender, and lila matches morado', () => {
  assert.ok(finds('tubo tapa amarilla', 'TUBO VACUTAINER AMARILLO B.D x 100 UND. TAPA ROSCA'));
  assert.ok(finds('tubo amarillo', 'TUBO DE RECOLECCION DE SANGRE TAPA AMARILLA 5ML'));
  assert.ok(finds('tubo morado', 'TUBO DE RECOLECCION DE SANGRE TAPA LILA 4ML'));
  assert.ok(finds('tubo roja', 'TUBO VACUTAINER ROJO B.D x 100'));
});

test('numbers match whole numbers, not digits inside other numbers or codes', () => {
  assert.equal(normalize('JERINGA 5ML 21G X 1,5'), 'jeringa 5 ml 21 g x 1.5');
  assert.ok(finds('jeringa 5 ml', 'JERINGA 5ML 21G X 1 1/2'));
  assert.ok(finds('jeringa 5ml', 'JERINGA 5 ML'));
  assert.ok(!finds('jeringa 5 ml', 'JERINGA 3ML 21G X 1.5'), '"5" inside 1.5');
  assert.ok(!finds('jeringa 5 ml', 'JERINGA 50 ML'), '"5" inside 50');
  assert.ok(!finds('guante 9', 'GUANTE NITRILO TALLA 6.5', '3915'), '"9" inside the code');
  assert.ok(finds('guante 8.5', 'GUANTE QUIRURGICO TALLA 8,5'));
  // a product code: whole, or the start of it once 4+ digits are typed
  assert.ok(finds('33429', 'AGUJA 32G', '33429'));
  assert.ok(finds('3342', 'AGUJA 32G', '33429'));
  assert.ok(!finds('342', 'AGUJA 32G', '33429'));
});

test('ranking: a plural query promotes names starting with the singular', () => {
  const starts = startsWithQuery('guantes');
  assert.ok(starts(normalize('GUANTE NITRILO TALLA M')));
  assert.ok(!starts(normalize('CAJA PARA GUANTES')));
  assert.equal(startsWithQuery('  '), null);
});

test('finds by code and by category', () => {
  assert.ok(finds('0986', 'JABON DE CALENDULA', '0986'));
  assert.ok(finds('monitoreo', 'TERMOMETRO DIGITAL'));
});

test('empty query matches everything', () => {
  assert.ok(finds('   ', 'ANYTHING'));
});

test('quote message: quantity first, then code and name; ends with the municipality field', () => {
  const text = quoteMessage([
    { cod: '0986', nombre: 'JABON DE CALENDULA', qty: 2 },
    { cod: '33429', nombre: 'AGUJA 32G CJA X 100 UND', qty: 1 },
  ]);
  assert.match(text, /^Hola, quisiera cotizar estos 2 productos del catálogo\. \(web-catalogo\)/);
  assert.match(quoteMessage([{ cod: '1', nombre: 'X', qty: 1 }]), /cotizar este producto/);
  assert.match(text, /• Cant\. 2 · 0986 · JABON DE CALENDULA\n• Cant\. 1 · 33429 · AGUJA 32G CJA X 100 UND/);
  assert.ok(text.endsWith('Municipio: '));
});

test('saved list: old code-only format loads with quantity 1; bad entries, duplicates and quantities are fixed', () => {
  assert.deepEqual(readSavedList(['0986', '33429']), [{ cod: '0986', qty: 1 }, { cod: '33429', qty: 1 }]);
  assert.deepEqual(
    readSavedList([{ cod: '1', qty: 5 }, { cod: '1', qty: 9 }, { cod: '2', qty: 0 }, { cod: '3', qty: 5000 }, { qty: 2 }, null, 7]),
    [{ cod: '1', qty: 5 }, { cod: '2', qty: 1 }, { cod: '3', qty: MAX_QTY }],
  );
  assert.deepEqual(readSavedList('nope'), []);
  assert.equal(clampQty(Number('abc')), 1);
  assert.equal(clampQty(2.6), 3);
});

// --- Shared filters (catalog page and PDF export) ---
import { describeFilters, exportProblem, filterItems, hasFilters, readFilters, toItems, writeFilters } from '../../src/lib/catalog-search.ts';

const payload = {
  updatedAt: '2026-11-09',
  categorias: [
    { slug: 'guantes', label: 'Guantes', comun: true },
    { slug: 'cuidado-oral', label: 'Cuidado oral', comun: false },
    { slug: 'vendas', label: 'Vendas', comun: false },
  ],
  segmentos: [
    { slug: 'medicina-general', label: 'Medicina general' },
    { slug: 'odontologia', label: 'Odontología' },
  ],
  productos: [
    ['1', 'GUANTE NITRILO M', 0, 0, 0],
    ['2', 'CEPILLO DENTAL', 1, 1, 0],
    ['3', 'VENDA ELASTICA', 2, 0, 1],
  ],
};
const items = toItems(payload);
const codes = (f) => filterItems(items, payload.categorias, f).results.map((p) => p.cod);

test('a specialty includes the shared categories, its own products first', () => {
  assert.deepEqual(codes({ query: '', cats: new Set(), seg: 1 }), ['2', '1']);
  assert.deepEqual(codes({ query: '', cats: new Set([2]), seg: 1 }), []);
});

test('base ignores the category filter (it drives the pill counts)', () => {
  const { base, results } = filterItems(items, payload.categorias, { query: '', cats: new Set([2]), seg: -1 });
  assert.equal(base.length, 3);
  assert.deepEqual(results.map((p) => p.cod), ['3']);
});

test('filters survive the URL round trip, keep other params, and ignore unknown slugs', () => {
  const f = { query: ' guante ', cats: new Set([0, 2]), seg: 1 };
  const params = writeFilters(new URLSearchParams('utm_source=wa'), f, payload);
  assert.equal(params.toString(), 'utm_source=wa&q=guante&cat=guantes%2Cvendas&seg=odontologia');
  const back = readFilters(params, payload);
  assert.deepEqual([back.query, [...back.cats], back.seg], ['guante', [0, 2], 1]);
  const bad = readFilters(new URLSearchParams('cat=nope,vendas&seg=nope'), payload);
  assert.deepEqual([[...bad.cats], bad.seg], [[2], -1]);
  assert.deepEqual([...readFilters(new URLSearchParams(), payload, 'vendas').cats], [2]);
});

test('export: needs a filter, at most 600 products, and some results', () => {
  const none = { query: '', cats: new Set(), seg: -1 };
  const some = { query: '', cats: new Set([0]), seg: -1 };
  assert.equal(exportProblem(none, 10), 'Filtre para exportar');
  assert.match(exportProblem(some, 601), /^Filtre más para exportar \(601 productos, máximo 600\)/);
  assert.equal(exportProblem(some, 600), '');
  assert.equal(exportProblem(some, 0), 'No hay productos para exportar');
});

test('export needs a filter; filters are described in words', () => {
  assert.equal(hasFilters({ query: '  ', cats: new Set(), seg: -1 }), false);
  assert.equal(hasFilters({ query: '', cats: new Set(), seg: 0 }), true);
  assert.deepEqual(describeFilters({ query: 'x', cats: new Set([0, 2]), seg: 1 }, payload), ['Guantes, Vendas', 'Odontología', '«x»']);
});
