import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignCodes, cicListName, classifyCicName, ivaFrom } from './assign.mjs';
import { makeCode, parseCode } from './codes.mjs';

const p = (key, nombre, categoria = 'Agujas') => ({ key, nombre, categoria });

test('numbers each categoría separately, in name order', () => {
  const codes = assignCodes([p('a', 'AGUJA 23G'), p('b', 'AGUJA 21G'), p('c', 'JERINGA 5 ML', 'Jeringas')]);
  assert.equal(codes.get('b'), makeCode(100, 1));
  assert.equal(codes.get('a'), makeCode(100, 2));
  assert.equal(codes.get('c'), makeCode(250, 1));
});

test('keeps earlier codes, even after a reclassification, and numbers new products after them', () => {
  const previous = new Map([['a', makeCode(100, 5)]]);
  const codes = assignCodes([p('a', 'AGUJA 23G', 'Jeringas'), p('b', 'AGUJA 21G')], previous);
  assert.equal(codes.get('a'), makeCode(100, 5));
  assert.equal(codes.get('b'), makeCode(100, 6));
  assert.ok([...codes.values()].every(parseCode));
});

test('fails on a categoría without a number', () => {
  assert.throws(() => assignCodes([p('a', 'X', 'Nueva')]), /No CATEGORIA_NUM for "Nueva"/);
});

test('IVA: a rate, or pendiente (blank and 0 are not proof of exento)', () => {
  assert.equal(ivaFrom('0.19'), '19');
  assert.equal(ivaFrom('19'), '19');
  assert.equal(ivaFrom('0,05'), '5');
  assert.equal(ivaFrom(''), 'pendiente');
  assert.equal(ivaFrom('0'), 'pendiente');
});

test('CIC list names get their presentación and typo fixes', () => {
  assert.equal(cicListName('AGUJA HIPODERM 22G X 1', '(CAJA X 100 UND)'), 'AGUJA HIPODERM 22G X 1 CAJA X 100 UND');
  assert.equal(cicListName('TUBP TAPA ROJA 6 ML', '100 UND'), 'TUBO TAPA ROJA 6 ML 100 UND');
  assert.equal(cicListName('MASCARILLA N95', '(UND)'), 'MASCARILLA N95 X UND');
  assert.equal(cicListName('AGAR SANGRE PAQ X 10 UND', 'PAQ X 10 UND'), 'AGAR SANGRE PAQ X 10 UND');
});

test('classifies CIC list names; unknown ones get no guess', () => {
  assert.equal(classifyCicName('TUBO ENDOTRAQUEAL 6.0 C/B'), 'Respiratorio y oxigenoterapia');
  assert.equal(classifyCicName('TUBO TAPA LILA 2 ML'), 'Toma de muestras y laboratorio');
  assert.equal(classifyCicName('SONDA FOLEY 14FR 2 VIAS'), 'Catéteres y cánulas');
  assert.equal(classifyCicName('LAMINILLAS CUBRE OBJETOS 22X22'), 'Toma de muestras y laboratorio');
  assert.equal(classifyCicName('PRODUCTO NUEVO RARO'), undefined);
});
