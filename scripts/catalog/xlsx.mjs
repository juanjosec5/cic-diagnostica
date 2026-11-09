// Minimal .xlsx reader: one sheet, cell text only. An .xlsx is a zip of XML files; Node's zlib can inflate it,
// so the catalog refresh needs no spreadsheet dependency. No zip64, formulas are read as their cached value.
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

function unzip(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('Not a zip/xlsx file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Corrupt zip central directory');
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (size === 0xffffffff || local === 0xffffffff) throw new Error('zip64 is not supported');
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + size);
    files.set(name, () => {
      if (method === 0) return raw.toString('utf8');
      if (method === 8) return inflateRawSync(raw).toString('utf8');
      throw new Error(`Unsupported zip compression method ${method} in ${name}`);
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s) =>
  s.replace(/&(?:#x([0-9a-f]+)|#(\d+)|(amp|lt|gt|quot|apos));/gi, (_, hex, dec, named) =>
    hex ? String.fromCodePoint(parseInt(hex, 16))
    : dec ? String.fromCodePoint(Number(dec))
    : { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[named.toLowerCase()],
  );

const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w:]+)="([^"]*)"/g)].map(([, k, v]) => [k, decode(v)]));

// Text of every <t> inside a fragment: plain strings and rich-text runs alike.
const textOf = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join('');

const columnIndex = (ref) => [...ref.replace(/\d+$/, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

/** Rows of one sheet as arrays of strings (empty cells are ''). Sheet names: `listSheets`. */
export function readSheet(path, sheetName) {
  const files = unzip(readFileSync(path));
  const read = (name) => {
    const get = files.get(name);
    if (!get) throw new Error(`Missing ${name} in ${path}`);
    return get();
  };

  const rels = Object.fromEntries(
    [...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b([^>]*)\/?>/g)].map(([, a]) => {
      const { Id, Target } = attrs(a);
      return [Id, Target.startsWith('/') ? Target.slice(1) : `xl/${Target}`];
    }),
  );
  const sheets = [...read('xl/workbook.xml').matchAll(/<sheet\b([^>]*)\/?>/g)].map(([, a]) => attrs(a));
  const sheet = sheets.find((s) => s.name === sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found. Sheets: ${sheets.map((s) => s.name).join(', ')}`);

  const shared = files.has('xl/sharedStrings.xml')
    ? [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
    : [];

  return [...read(rels[sheet['r:id']]).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(([, rowXml]) => {
    const row = [];
    for (const [, a, body = ''] of rowXml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const { r, t } = attrs(a);
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const value =
        t === 's' ? shared[Number(v)]
        : t === 'inlineStr' ? textOf(body)
        : v === undefined ? ''
        : decode(v);
      row[columnIndex(r)] = value ?? '';
    }
    return Array.from(row, (v) => v ?? '');
  });
}
