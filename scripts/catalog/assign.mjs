// First assignment of CIC codes (see codes.mjs) and the rules to classify CIC's own lists, which come without
// categoría. Pure functions, tested in assign.test.mjs; the script is scripts/assign-codes.mjs.
import { nextCode } from './codes.mjs';
import { CATEGORIA_NUM } from './taxonomy.mjs';

/**
 * Codes for every product. `previous` (key → code, from an earlier run) is kept as is: a code never changes. New
 * products are numbered per categoría in name order (so sizes of the same product sit together), after the highest
 * number already used.
 * @param {{ key: string, nombre: string, categoria: string }[]} products categoria is a label from CATEGORIAS
 * @param {Map<string, string>} [previous]
 * @returns {Map<string, string>} key → code
 */
export function assignCodes(products, previous = new Map()) {
  const codes = new Map();
  const used = [...previous.values()];
  const fresh = [];
  for (const p of products) {
    if (previous.has(p.key)) codes.set(p.key, previous.get(p.key));
    else fresh.push(p);
  }
  fresh.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
  for (const p of fresh) {
    const catNum = CATEGORIA_NUM[p.categoria];
    if (catNum === undefined) throw new Error(`No CATEGORIA_NUM for "${p.categoria}" (${p.nombre})`);
    const code = nextCode(catNum, used);
    used.push(code);
    codes.set(p.key, code);
  }
  return codes;
}

/** IVA as the inventory field: the lists give a rate ("0.19") or nothing, and nothing is not the same as exento. */
export function ivaFrom(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'pendiente';
  const rate = Number(text.replace(',', '.'));
  if (rate === 0.19 || rate === 19) return '19';
  if (rate === 0.05 || rate === 5) return '5';
  return 'pendiente'; // 0 can mean exento or excluido: the supplier has to say which
}

// [pattern on a CIC list name, categoría]. First match wins. Unmatched names stop the script, so a new kind of
// product gets a rule instead of a guess. Categorías follow where the catalog already files similar products.
export const CIC_LIST_RULES = [
  [/^TUBO ENDOTRAQUEAL/, 'Respiratorio y oxigenoterapia'],
  [/^(TUBOS?|TUBP|TAPA PARA TUBO|EPENDORF|EPPENDORF|MICROHEMATOCRITOS|PORTA CAMISA)\b/, 'Toma de muestras y laboratorio'],
  [/^(AGUJA|PERICRANEAL|LANCETA)/, 'Agujas'],
  [/^JERINGA/, 'Jeringas'],
  [/^PIPETA|^PUNTAS? /, 'Pipetas'],
  [/^(PAÑITOS ALGODÓN ALCOHOL|ALCOHOL|AGUA OXIGENADA|YODOPOVIDONA|WESCOHEX)/, 'Antisépticos, desinfectantes e higiene'],
  [/^(ALGODÓN|APLICADORES|COMPRESAS|GASA)/, 'Gasas, algodón y compresas'],
  [/^TORNIQUETE/, 'Emergencias y primeros auxilios'],
  [/^CURA /, 'Apósitos y curación de heridas'],
  [/^(MASCARILLA|TAPABOCA|BATA|KIT CIRU|GORRO|POLAINA|FUNDAS|GUARDIAN|ROLLO MULTIUSO)/, 'Ropa y bioseguridad'],
  [/^(KIT DE CIT|ESPECULO)/, 'Espéculos'],
  [/^SABANA|^BOLSA URINARIO/, 'Incontinencia y cuidado del paciente'],
  [/^GUANTES/, 'Guantes'],
  [/^(AGUA ESTERIL|AGUA IRRIGACION|AGUA DESMINERALIZADA|SOLUCION|LACTATO)/, 'Soluciones y líquidos'],
  [/^(CUCHILLAS|LAPIZ ELECTRO)/, 'Instrumental quirúrgico'],
  [/^(EQUIPO M(A|I)CROGOTEO|LLAVE 3 VIAS|TAPON HEPARINIZADO|EQUI BURETA)/, 'Equipos de infusión y accesorios IV'],
  [/^(KIT MICRONEBULIZACION|HUMIDIFICADOR|INHALOCAMARA|CANULA NASAL)/, 'Respiratorio y oxigenoterapia'],
  [/^(SONDA|CATETER)/, 'Catéteres y cánulas'],
  [/^ENEMA/, 'Medicamentos'],
  [/^BAJA LENGUAS/, 'Espátulas y bajalenguas'],
  [/^(ESPARADRAPO|TRANSPORE|MICROPORE)/, 'Cintas y esparadrapos'],
  [/^VENDA/, 'Vendas'],
  [/^(TENSIOMETRO|PULSIOXIMETRO|GEL CONDUCTOR)/, 'Diagnóstico y monitoreo'],
  [/^CONDONES/, 'Otros'],
  [
    /^(TIRAS|KIT DE GLUCOMETRO|PRUEBA|DENGUE|ASO |PCR |RF |RPR |VDRL|HEMOCLASIFICADOR|SUERO DE COOMBS|MEDIO DE TRANSPORTE|AGAR |CARGA GLUCOSA|LAMINA|LAMINILLAS|CANASTILLA|HISOPO|CINTA INDICADORA|CITOCEPILLO|ESPATULA|CITOFIJADOR|PORTALAMINAS|RECOLECTOR DE ORINA|CAJA COPROLOGICO)/,
    'Toma de muestras y laboratorio',
  ],
];

export const classifyCicName = (name) => CIC_LIST_RULES.find(([re]) => re.test(name))?.[1];

// Obvious typos in the July list, fixed in the name sent to the inventory.
const FIXES = [
  [/^TUBP\b/, 'TUBO'],
  [/^EPENDORF/, 'EPPENDORF'],
  [/CITLOGIA/, 'CITOLOGIA'],
  [/SOLCUION/, 'SOLUCION'],
  [/BISTURY/, 'BISTURI'],
  [/1\.O ML/, '1.0 ML'],
];

/** "AGUJA HIPODERM 22G X 1" + "(CAJA X 100 UND)" → "AGUJA HIPODERM 22G X 1 CAJA X 100 UND" (typos fixed). */
export function cicListName(name, presentacion) {
  let nombre = FIXES.reduce((s, [re, to]) => s.replace(re, to), name.trim().replace(/\s+/g, ' ').toUpperCase());
  const p = presentacion.trim().replace(/\s+/g, ' ').replace(/^\((.*)\)$/, '$1').toUpperCase();
  if (p && !nombre.includes(p)) nombre += p === 'UND' ? ' X UND' : ` ${p}`;
  return nombre;
}
