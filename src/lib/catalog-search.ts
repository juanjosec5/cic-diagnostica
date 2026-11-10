// Catalog search and the WhatsApp quote message. No data imports: this runs in the browser and at build time.

/** Compact payload served at /catalogo/productos.json: categories and segments as indexes, so 5,000 rows stay small. */
export interface CatalogPayload {
  updatedAt: string;
  /** `comun`: shared supplies, shown under every segmento (see CATEGORIAS_COMUNES in scripts/catalog/taxonomy.mjs). */
  categorias: { slug: string; label: string; comun: boolean }[];
  segmentos: { slug: string; label: string }[];
  /** [cod, nombre, categoría index, segmento index, bajoPedido 0/1, supplier code before CIC codes ('' if none)] */
  productos: [string, string, number, number, 0 | 1, string?][];
}

export interface Item {
  cod: string;
  /** Supplier code before CIC codes, '' if none. */
  antes: string;
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

/** Per product in the quote list. 3 digits fit the stepper; a larger order is a conversation anyway. */
export const MAX_QTY = 999;

/** A product in the quote list, as saved in the browser. */
export interface ListEntry {
  cod: string;
  qty: number;
}

export const clampQty = (n: number) => (Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(1, Math.round(n))) : 1);

/**
 * The saved list from localStorage, whatever it holds: the old format (codes only, before quantities) loads with
 * quantity 1, bad entries and duplicates are dropped, quantities are clamped.
 */
export function readSavedList(raw: unknown): ListEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ListEntry[] = [];
  for (const entry of raw) {
    const cod = typeof entry === 'string' ? entry : typeof entry?.cod === 'string' ? entry.cod : '';
    if (!cod || seen.has(cod)) continue;
    seen.add(cod);
    out.push({ cod, qty: typeof entry === 'string' ? 1 : clampQty(Number(entry.qty)) });
  }
  return out;
}

/**
 * Lists saved before the switch to CIC codes hold supplier codes: swap each for its CIC code (`aliases`: supplier → CIC).
 * Unknown codes stay, so a product that comes back to the catalog later reappears in the list.
 */
export function upgradeList(list: ListEntry[], aliases: Map<string, string>): ListEntry[] {
  const seen = new Set<string>();
  const out: ListEntry[] = [];
  for (const e of list) {
    const cod = aliases.get(e.cod) ?? e.cod;
    if (seen.has(cod)) continue;
    seen.add(cod);
    out.push({ cod, qty: e.qty });
  }
  return out;
}

/** A PDF export needs a filter and at most this many products (about 25 pages): "export all" would be 5,000+. */
export const MAX_EXPORT_ITEMS = 600;

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

// CIC codes stay one token ("cd10000016"): normalize would split them into "cd 10000016", and "1000" would then match
// every Agujas code as a number prefix.
const CIC_CODE = /^cd\d+$/i;
const codeToken = (cod: string) => (CIC_CODE.test(cod) ? cod.toLowerCase() : normalize(cod));
/** What people type: "CD 1000…" or "cd1000…" → one token, like the code in the key. */
const queryTokens = (query: string) => normalize(query).replace(/\bcd (?=\d)/g, 'cd').split(' ').filter(Boolean);

export function searchKey(cod: string, nombre: string, categoria: string, antes = '') {
  const base = ` ${codeToken(cod)} ${normalize(`${antes} ${nombre} ${categoria}`)} `;
  const extra = Object.entries(EXPANSIONS)
    .filter(([abbr]) => base.includes(` ${abbr} `))
    .map(([, full]) => full);
  return `${base}${extra.join(' ')} `;
}

const isNumber = (token: string) => /^\d+(\.\d+)?$/.test(token);
/** Supplier codes (`antes`) are 4–5 digits: from this length a number may match the start of one while it's typed. */
const CODE_PREFIX_MIN_DIGITS = 4;
/**
 * A CIC code (CD10000016) typed without "CD" finds it from 5 digits on: fewer would match whole categorías ("1000"
 * is every Agujas code, and also "1000 ML").
 */
const CIC_DIGITS_MIN = 5;

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
  isNumber(token)
    ? key.includes(` ${token} `) ||
      (token.length >= CODE_PREFIX_MIN_DIGITS && key.includes(` ${token}`)) ||
      (token.length >= CIC_DIGITS_MIN && key.includes(` cd${token}`))
    : key.includes(token);

/** Every word of the query must appear somewhere in the product (name, code, category or an expansion). */
export function matcher(query: string) {
  const tokens = queryTokens(query).map(stems);
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
  return payload.productos.map(([cod, nombre, cat, seg, bajoPedido, antes = '']) => ({
    cod,
    antes,
    nombre,
    cat,
    seg,
    bajoPedido: bajoPedido === 1,
    name: normalize(nombre),
    key: searchKey(cod, nombre, payload.categorias[cat].label, antes),
  }));
}

/**
 * Ends with a short field after a line break, like the site's other prefilled messages (see whatsappMessages).
 * "(web-catalogo)" tells the team the chat came from the catalog; the item count shows if a long message got cut.
 * The quantity goes first, as on a purchase order: "× 2" after names ending in "X 100 UND" would read as a product.
 */
export function quoteMessage(items: { cod: string; nombre: string; qty: number }[]) {
  const lines = items.map((p) => `• Cant. ${p.qty} · ${p.cod} · ${p.nombre}`);
  const what = items.length === 1 ? 'este producto' : `estos ${items.length} productos`;
  return `Hola, quisiera cotizar ${what} del catálogo. (web-catalogo)\n\n${lines.join('\n')}\n\nMunicipio: `;
}

// --- Filters: shared by the catalog page and the PDF export, so the PDF is exactly what the screen shows ---

export interface Filters {
  query: string;
  /** Category indexes into payload.categorias. */
  cats: Set<number>;
  /** Segment index into payload.segmentos, -1 for all. */
  seg: number;
}

export const hasFilters = (f: Filters) => f.query.trim() !== '' || f.cats.size > 0 || f.seg >= 0;

/** Why these results can't be exported as PDF, or '' if they can. One rule for the download icon and the PDF page. */
export function exportProblem(f: Filters, count: number) {
  if (!hasFilters(f)) return 'Filtre para exportar';
  if (count > MAX_EXPORT_ITEMS) return `Filtre más para exportar (${count.toLocaleString('es-CO')} productos, máximo ${MAX_EXPORT_ITEMS})`;
  if (!count) return 'No hay productos para exportar';
  return '';
}

/** Stable partition: items matching `pred` first, each group keeping its order. */
const moveToFront = (list: Item[], pred: (p: Item) => boolean) => [...list.filter(pred), ...list.filter((p) => !pred(p))];

/**
 * `results` in display order; `base` is the same before the category filter (it drives the pill counts, so a pill
 * never leads to 0 results). Shared categories (gloves, gauze…) count as part of every segment.
 */
export function filterItems(items: Item[], categorias: CatalogPayload['categorias'], { query, cats, seg }: Filters) {
  const match = matcher(query);
  const base = items.filter((p) => (seg < 0 || p.seg === seg || categorias[p.cat].comun) && match(p.key));
  let results = cats.size ? base.filter((p) => cats.has(p.cat)) : base;
  // Names that start with the first word typed go first ("guantes" → "GUANTE…" before "CAJA PARA GUANTES").
  const startsWith = startsWithQuery(query);
  if (startsWith) results = moveToFront(results, (p) => startsWith(p.name));
  // With a specialty picked, its own products before the shared supplies. Applied last, so it wins over the name match.
  if (seg >= 0) results = moveToFront(results, (p) => p.seg === seg);
  return { base, results };
}

/** ?q=&cat=a,b&seg=x → Filters. Unknown slugs are ignored. `defaultCat`: the category page's own category. */
export function readFilters(params: URLSearchParams, payload: CatalogPayload, defaultCat?: string): Filters {
  const catSlugs = params.get('cat')?.split(',') ?? (defaultCat ? [defaultCat] : []);
  const cats = new Set(catSlugs.map((slug) => payload.categorias.findIndex((c) => c.slug === slug)).filter((i) => i >= 0));
  return { query: params.get('q') ?? '', cats, seg: payload.segmentos.findIndex((s) => s.slug === params.get('seg')) };
}

/** Filters → q/cat/seg in `params` (other parameters, like utm_*, are left alone). */
export function writeFilters(params: URLSearchParams, { query, cats, seg }: Filters, payload: CatalogPayload) {
  ['q', 'cat', 'seg'].forEach((k) => params.delete(k));
  if (query.trim()) params.set('q', query.trim());
  if (cats.size) params.set('cat', [...cats].map((i) => payload.categorias[i].slug).join(','));
  if (seg >= 0) params.set('seg', payload.segmentos[seg].slug);
  return params;
}

/** "Guantes, Jeringas · Odontología · «nitrilo»": the active filters in words, for the status line and the PDF title. */
export function describeFilters({ query, cats, seg }: Filters, payload: CatalogPayload) {
  return [
    [...cats].map((i) => payload.categorias[i].label).join(', '),
    seg >= 0 ? payload.segmentos[seg].label : '',
    query.trim() ? `«${query.trim()}»` : '',
  ].filter(Boolean);
}
