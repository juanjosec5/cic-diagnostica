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
