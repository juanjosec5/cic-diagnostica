// The only categorías and segmentos the catalog accepts. A value in the source file that isn't listed here fails
// the import, so a typo can't create a new filter pill. Adding one is a deliberate edit here (and a review).
export const CATEGORIAS = [
  'Agujas',
  'Antisépticos, desinfectantes e higiene',
  'Apósitos y curación de heridas',
  'Catéteres y cánulas',
  'Cintas y esparadrapos',
  'Cuidado oral',
  'Diagnóstico y monitoreo',
  'Emergencias y primeros auxilios',
  'Equipos de infusión y accesorios IV',
  'Espátulas y bajalenguas',
  'Espéculos',
  'Gasas, algodón y compresas',
  'Guantes',
  'Incontinencia y cuidado del paciente',
  'Instrumental quirúrgico',
  'Jeringas',
  'Medias de compresión',
  'Medicamentos',
  'Movilidad y descanso',
  'Nutrición y suplementos',
  'Ortopedia y soportes',
  'Ostomía',
  'Otros',
  'Pipetas',
  'Respiratorio y oxigenoterapia',
  'Ropa y bioseguridad',
  'Soluciones y líquidos',
  'Suturas y mallas',
  'Toma de muestras y laboratorio',
  'Vendas',
];

// General supplies every specialty buys. The source file gives each product one segmento, so without this a dentist
// filtering by Odontología would see no gloves. These show up under every segmento filter, after its own products.
/**
 * CIC product code category numbers (see codes.mjs). FROZEN: a number never changes and is never reused, because
 * it's part of every code created under it. A product keeps its code when it moves to another categoría.
 * New categoría: add it here with the next free number (390 → 400…). Renaming a label keeps its number.
 */
export const CATEGORIA_NUM = {
  'Agujas': 100,
  'Antisépticos, desinfectantes e higiene': 110,
  'Apósitos y curación de heridas': 120,
  'Catéteres y cánulas': 130,
  'Cintas y esparadrapos': 140,
  'Cuidado oral': 150,
  'Diagnóstico y monitoreo': 160,
  'Emergencias y primeros auxilios': 170,
  'Equipos de infusión y accesorios IV': 180,
  'Espátulas y bajalenguas': 190,
  'Espéculos': 200,
  'Gasas, algodón y compresas': 210,
  'Guantes': 220,
  'Incontinencia y cuidado del paciente': 230,
  'Instrumental quirúrgico': 240,
  'Jeringas': 250,
  'Medias de compresión': 260,
  'Medicamentos': 270,
  'Movilidad y descanso': 280,
  'Nutrición y suplementos': 290,
  'Ortopedia y soportes': 300,
  'Ostomía': 310,
  'Otros': 320,
  'Pipetas': 330,
  'Respiratorio y oxigenoterapia': 340,
  'Ropa y bioseguridad': 350,
  'Soluciones y líquidos': 360,
  'Suturas y mallas': 370,
  'Toma de muestras y laboratorio': 380,
  'Vendas': 390,
};

export const CATEGORIAS_COMUNES = [
  'Guantes',
  'Gasas, algodón y compresas',
  'Apósitos y curación de heridas',
  'Antisépticos, desinfectantes e higiene',
  'Ropa y bioseguridad',
  'Cintas y esparadrapos',
  'Agujas',
  'Jeringas',
];

export const SEGMENTOS = [
  'Cuidados intensivos',
  'Fisioterapia',
  'Medicina estética',
  'Medicina general',
  'Medicina pediátrica',
  'Medicina veterinaria',
  'Odontología',
  'Toma de muestras de laboratorio',
];

/** "Antisépticos, desinfectantes e higiene" → "antisepticos-desinfectantes-e-higiene" (used in URLs). */
export const slugify = (label) =>
  label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
