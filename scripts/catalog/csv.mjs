import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

// RFC 4180 with "," or ";" (Excel in Spanish uses ";"). Must be UTF-8: a Windows-1252 export garbles accents.
export function readCsv(path) {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  if (text.includes('�')) throw new Error(`${basename(path)} isn't UTF-8. In Excel use "Guardar como → CSV UTF-8", or use the .xlsx.`);
  // Judge by the first lines, not just the first: exports may start with a title row ("Table 1").
  const head = text.split('\n', 5).join('\n');
  const occurrences = (ch) => head.split(ch).length - 1;
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
