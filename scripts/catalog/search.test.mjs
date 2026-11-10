import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matcher, normalize, quoteMessage, searchKey, startsWithQuery } from '../../src/lib/catalog-search.ts';

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

test('quote message lists code and name, and ends with the field to fill', () => {
  const text = quoteMessage([{ cod: '0986', nombre: 'JABON DE CALENDULA' }, { cod: '33429', nombre: 'AGUJA 32G' }]);
  assert.match(text, /^Hola, quisiera cotizar estos 2 productos del catálogo\. \(web-catalogo\)/);
  assert.match(quoteMessage([{ cod: '1', nombre: 'X' }]), /cotizar este producto/);
  assert.match(text, /• 0986 · JABON DE CALENDULA\n• 33429 · AGUJA 32G/);
  assert.ok(text.endsWith('Cantidades y municipio: '));
});
