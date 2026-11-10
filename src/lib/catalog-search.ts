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

/** Lowercase, no accents, punctuation as spaces: "TENSIOM. W.A." → "tensiom w a". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();

export function searchKey(cod: string, nombre: string, categoria: string) {
  const base = ` ${normalize(`${cod} ${nombre} ${categoria}`)} `;
  const extra = Object.entries(EXPANSIONS)
    .filter(([abbr]) => base.includes(` ${abbr} `))
    .map(([, full]) => full);
  return `${base}${extra.join(' ')} `;
}

// "guantes" → "guante", "cateteres" → "cateter": names are mostly singular, people type plurals.
const stems = (token: string) => {
  if (token.length > 5 && token.endsWith('es')) return [token, token.slice(0, -2), token.slice(0, -1)];
  if (token.length > 3 && token.endsWith('s')) return [token, token.slice(0, -1)];
  return [token];
};

/** Every word of the query must appear somewhere in the product (name, code, category or an expansion). */
export function matcher(query: string) {
  const tokens = normalize(query).split(' ').filter(Boolean).map(stems);
  if (!tokens.length) return () => true;
  return (key: string) => tokens.every((variants) => variants.some((v) => key.includes(v)));
}

export function toItems(payload: CatalogPayload): Item[] {
  return payload.productos.map(([cod, nombre, cat, seg, bajoPedido]) => ({
    cod,
    nombre,
    cat,
    seg,
    bajoPedido: bajoPedido === 1,
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
