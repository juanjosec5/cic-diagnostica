// Catalog search and the WhatsApp quote message. No data imports: this runs in the browser and at build time.

/** Compact payload served at /catalogo/productos.json: categories and segments as indexes, so 5,000 rows stay small. */
export interface CatalogPayload {
  updatedAt: string;
  /** `comun`: shared supplies, shown under every segmento (see CATEGORIAS_COMUNES in scripts/catalog/taxonomy.mjs). */
  categorias: { slug: string; label: string; comun: boolean }[];
  segmentos: { slug: string; label: string }[];
  /** [cod, nombre, categoría index, segmento index, bajoPedido 0/1] */
  productos: [string, string, number, number, 0 | 1][];
}

export interface Item {
  cod: string;
  nombre: string;
  cat: number;
  seg: number;
  bajoPedido: boolean;
  /** Normalized name, for ranking (computed once, not per keystroke). */
  name: string;
  key: string;
}

/** Most WhatsApp apps open long prefilled messages, but very long links fail on some phones. */
export const MAX_LIST_ITEMS = 30;

// Abbreviations that appear in the product names (counted in the 2026-11 export), expanded so a search for the
// full word finds them. Keys are already normalized (see `normalize`).
const EXPANSIONS: Record<string, string> = {
  tensiom: 'tensiometro',
  fonendo: 'fonendoscopio',
  laringo: 'laringoscopio',
  otoscop: 'otoscopio',
  inmov: 'inmovilizador',
  hidroco: 'hidrocoloide',
  'w a': 'welch allyn',
  ped: 'pediatrico',
  adu: 'adulto',
  iny: 'inyectable',
  algod: 'algodon',
  // Tube cap colours: names say "TAPA LILA" or "AMARILLO", people type either gender, and lila = morado.
  amarillo: 'amarilla',
  amarilla: 'amarillo',
  rojo: 'roja',
  roja: 'rojo',
  lila: 'morado morada',
  morado: 'lila',
  morada: 'lila',
};

/**
 * Lowercase, no accents, punctuation as spaces, numbers kept whole and apart from units:
 * "TENSIOM. W.A." → "tensiom w a", "JERINGA 5ML 21G X 1,5" → "jeringa 5 ml 21 g x 1.5".
 */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(\d),(?=\d)/g, '$1.') // decimal comma → dot, so "1,5" and "1.5" are the same number
    .replace(/[^a-z0-9ñ.]+/g, ' ')
    .replace(/(?<!\d)\.|\.(?!\d)/g, ' ') // a dot that isn't a decimal point is punctuation
    .replace(/(\d)(?=[a-zñ])|([a-zñ])(?=\d)/g, '$1$2 ') // "5ml" → "5 ml", "x100" → "x 100"
    .replace(/\s+/g, ' ')
    .trim();

export function searchKey(cod: string, nombre: string, categoria: string) {
  const base = ` ${normalize(`${cod} ${nombre} ${categoria}`)} `;
  const extra = Object.entries(EXPANSIONS)
    .filter(([abbr]) => base.includes(` ${abbr} `))
    .map(([, full]) => full);
  return `${base}${extra.join(' ')} `;
}

const isNumber = (token: string) => /^\d+(\.\d+)?$/.test(token);
/** Product codes are 4–5 digits: from this length a number may match the start of a code while it's being typed. */
const CODE_PREFIX_MIN_DIGITS = 4;

// "guantes" → "guante", "cateteres" → "cateter": names are mostly singular, people type plurals.
const stems = (token: string) => {
  if (isNumber(token)) return [token];
  if (token.length > 5 && token.endsWith('es')) return [token, token.slice(0, -2), token.slice(0, -1)];
  if (token.length > 3 && token.endsWith('s')) return [token, token.slice(0, -1)];
  return [token];
};

// Words match as a substring (so typing "fonendo" already finds them). Numbers must match a whole number: "5" is not
// in "1.5", "50" or code 3915. Long ones (codes) may match as the start of one.
const tokenMatches = (key: string, token: string) =>
  isNumber(token) ? key.includes(` ${token} `) || (token.length >= CODE_PREFIX_MIN_DIGITS && key.includes(` ${token}`)) : key.includes(token);

/** Every word of the query must appear somewhere in the product (name, code, category or an expansion). */
export function matcher(query: string) {
  const tokens = normalize(query).split(' ').filter(Boolean).map(stems);
  if (!tokens.length) return () => true;
  return (key: string) => tokens.every((variants) => variants.some((v) => tokenMatches(key, v)));
}

/** Whether a normalized name starts with the query's first word (or its singular), for ranking. Null: no query. */
export function startsWithQuery(query: string) {
  const first = normalize(query).split(' ')[0];
  if (!first) return null;
  const variants = stems(first);
  return (name: string) => variants.some((v) => name.startsWith(v));
}

export function toItems(payload: CatalogPayload): Item[] {
  return payload.productos.map(([cod, nombre, cat, seg, bajoPedido]) => ({
    cod,
    nombre,
    cat,
    seg,
    bajoPedido: bajoPedido === 1,
    name: normalize(nombre),
    key: searchKey(cod, nombre, payload.categorias[cat].label),
  }));
}

/**
 * Ends with a short field after a line break, like the site's other prefilled messages (see whatsappMessages).
 * "(web-catalogo)" tells the team the chat came from the catalog; the item count shows if a long message got cut.
 */
export function quoteMessage(items: { cod: string; nombre: string }[]) {
  const lines = items.map((p) => `• ${p.cod} · ${p.nombre}`);
  const what = items.length === 1 ? 'este producto' : `estos ${items.length} productos`;
  return `Hola, quisiera cotizar ${what} del catálogo. (web-catalogo)\n\n${lines.join('\n')}\n\nCantidades y municipio: `;
}
