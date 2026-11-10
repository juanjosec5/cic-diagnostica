// CIC product codes: "CD" + categoría number (3 digits, CATEGORIA_NUM in taxonomy.mjs) + product number (4 digits,
// a sequence per categoría) + a Luhn check digit. 10 characters, e.g. CD10000016 (Agujas, product 1).
// A code is permanent: the categoría digits mean "categoría when the code was created", and IVA is not part of the
// code (it's a field in the inventory system, so a rate change never changes a code). The check digit catches a
// mistyped or swapped digit when a code is dictated by phone or typed into WhatsApp.

const PREFIX = 'CD';
const CODE = new RegExp(`^${PREFIX}(\\d{3})(\\d{4})(\\d)$`);
export const MAX_SEQ = 9999;

/** Luhn (mod 10) check digit for a string of digits. Also computable in Excel if the inventory system can't. */
export function luhn(digits) {
  let sum = 0;
  // From the right, double every other digit starting with the last one (it sits next to the check digit).
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

export function makeCode(catNum, seq) {
  if (!Number.isInteger(catNum) || catNum < 100 || catNum > 999) throw new Error(`Categoría number must be 100–999, got ${catNum}`);
  if (!Number.isInteger(seq) || seq < 1 || seq > MAX_SEQ) throw new Error(`Product number must be 1–${MAX_SEQ}, got ${seq}`);
  const digits = `${catNum}${String(seq).padStart(4, '0')}`;
  return `${PREFIX}${digits}${luhn(digits)}`;
}

/** { catNum, seq } for a valid code; null if the format or the check digit is wrong. */
export function parseCode(code) {
  const m = CODE.exec(String(code).trim().toUpperCase());
  if (!m || luhn(m[1] + m[2]) !== Number(m[3])) return null;
  return { catNum: Number(m[1]), seq: Number(m[2]) };
}

/** Next free code in a categoría: highest product number used + 1 (numbers are never reused). */
export function nextCode(catNum, existingCodes) {
  let max = 0;
  for (const code of existingCodes) {
    const parsed = parseCode(code);
    if (parsed?.catNum === catNum) max = Math.max(max, parsed.seq);
  }
  if (max >= MAX_SEQ) throw new Error(`Categoría ${catNum} has used all ${MAX_SEQ} product numbers`);
  return makeCode(catNum, max + 1);
}
