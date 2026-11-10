import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SEQ, luhn, makeCode, nextCode, parseCode } from './codes.mjs';
import { CATEGORIAS, CATEGORIA_NUM } from './taxonomy.mjs';

test('luhn matches the standard example', () => {
  assert.equal(luhn('7992739871'), 3);
  assert.equal(luhn('0000000'), 0);
});

test('makeCode builds CD + categoría + product number + check digit', () => {
  const code = makeCode(100, 1);
  assert.match(code, /^CD1000001\d$/);
  assert.equal(code.length, 10);
  assert.deepEqual(parseCode(code), { catNum: 100, seq: 1 });
  assert.deepEqual(parseCode(code.toLowerCase()), { catNum: 100, seq: 1 });
});

test('rejects out-of-range parts', () => {
  assert.throws(() => makeCode(99, 1));
  assert.throws(() => makeCode(100, 0));
  assert.throws(() => makeCode(100, MAX_SEQ + 1));
});

test('the check digit catches a mistyped digit and swapped neighbours', () => {
  const code = makeCode(260, 615);
  const digits = code.slice(2);
  for (let i = 0; i < digits.length; i++) {
    const typo = digits.slice(0, i) + ((Number(digits[i]) + 1) % 10) + digits.slice(i + 1);
    assert.equal(parseCode(`CD${typo}`), null, `typo at ${i}`);
  }
  for (let i = 0; i < digits.length - 1; i++) {
    if (digits[i] === digits[i + 1]) continue;
    const swapped = digits.slice(0, i) + digits[i + 1] + digits[i] + digits.slice(i + 2);
    // Luhn misses only 0↔9 swaps
    if (!/09|90/.test(digits[i] + digits[i + 1])) assert.equal(parseCode(`CD${swapped}`), null, `swap at ${i}`);
  }
  assert.equal(parseCode('32881'), null); // supplier codes aren't CIC codes
});

test('nextCode continues after the highest number in that categoría only', () => {
  const existing = [makeCode(100, 1), makeCode(100, 7), makeCode(110, 50), 'basura'];
  assert.equal(nextCode(100, existing), makeCode(100, 8));
  assert.equal(nextCode(120, existing), makeCode(120, 1));
  assert.throws(() => nextCode(100, [makeCode(100, MAX_SEQ)]), /used all/);
});

test('every categoría has a unique, valid number (add new ones to CATEGORIA_NUM)', () => {
  assert.deepEqual(CATEGORIAS.filter((c) => !(c in CATEGORIA_NUM)), []);
  const nums = Object.values(CATEGORIA_NUM);
  assert.equal(new Set(nums).size, nums.length);
  assert.ok(nums.every((n) => Number.isInteger(n) && n >= 100 && n <= 999));
});
