/**
 * Editable site content. Everything a non-developer may need to change
 * (contact details, WhatsApp number, numbers, products, route, FAQ) lives here.
 * Values wrapped in [brackets] are placeholders; see README > Placeholders.
 * Only publish numbers and claims that are confirmed.
 */

export const company = {
  name: 'CIC Diagnóstica',
  legalName: 'CIC Diagnóstica S.A.S. [RAZÓN SOCIAL]',
  nit: '[NIT 000.000.000-0]',
  // Digits only, with country code, no "+" or spaces (e.g. 573001234567).
  whatsapp: '573174020722',
  // Human-readable version shown on the page.
  whatsappDisplay: '+57 317 402 0722',
  email: 'supervisor@cicdiagnostica.com',
  street: 'Carrera 13 # 4-51',
  city: 'Buga',
  region: 'Valle del Cauca',
  get address() {
    return `${this.street}, ${this.city}, ${this.region}`;
  },
  hours: ['Lunes a viernes: 7:00 a.m. – 12:00 m. y 2:00 p.m. – 5:00 p.m.', 'Sábados: 7:30 a.m. – 11:00 a.m.'],
  // Shown in the proof row, the contact section and the form's success message.
  responseTime: '24 horas',
};

/**
 * Fixed delivery routes: the municipalities with a CIC laboratorios site, by weekday.
 * A day without fixed towns shows its `note` instead.
 * The list of municipalities and their count are derived from this everywhere on the page.
 */
export const routeDays: { day: string; towns?: string[]; note?: string }[] = [
  { day: 'Lunes', towns: ['Cali', 'Yumbo', 'Vijes', 'Dagua', 'La Cumbre'] },
  { day: 'Martes', towns: ['Palmira', 'Candelaria', 'Pradera', 'Florida'] },
  { day: 'Miércoles', towns: ['Buga', 'Guacarí', 'El Cerrito', 'Ginebra'] },
  { day: 'Jueves', towns: ['Tuluá', 'Zarzal', 'Roldanillo', 'Cartago'] },
  { day: 'Viernes', note: 'Envíos a municipios cercanos' },
];

export const municipalities = routeDays.flatMap((d) => d.towns ?? []);

/** Orders above this value ship without freight charge (COP). */
export const freeFreightFrom = '$600.000';

/** Prefilled WhatsApp messages, one per button intent. */
export const whatsappMessages = {
  general: 'Hola, CIC Diagnóstica. Quisiera más información sobre sus productos.',
  quote: 'Hola, CIC Diagnóstica. Quisiera solicitar una cotización de insumos de laboratorio.',
  urgent: 'Hola, CIC Diagnóstica. Tengo un pedido urgente: nos estamos quedando sin insumos.',
  catalog: 'Hola, CIC Diagnóstica. Quisiera conocer los precios de los productos de su catálogo.',
  contract: 'Hola, CIC Diagnóstica. Me interesa un contrato de suministro para mi institución.',
  outsideRoute: 'Hola, CIC Diagnóstica. Quisiera saber si pueden hacer entregas en mi municipio.',
  hospital: 'Hola, CIC Diagnóstica. Escribo de un hospital / IPS y me interesa un convenio de suministro.',
  lab: 'Hola, CIC Diagnóstica. Escribo de un laboratorio clínico y quisiera una cotización de reactivos e insumos.',
  drugstore: 'Hola, CIC Diagnóstica. Escribo de una droguería y quisiera conocer sus productos y condiciones.',
  independent: 'Hola, CIC Diagnóstica. Quisiera cotizar algunos insumos para mi consultorio o establecimiento.',
} as const;

export type WhatsAppIntent = keyof typeof whatsappMessages;

/** Proof row under the hero. Only confirmed figures. */
export const stats = [
  { value: 'Desde 2021', label: 'en el mercado' },
  { value: '40+', label: 'clientes activos' },
  { value: String(municipalities.length), label: 'municipios con ruta fija' },
  { value: `< ${company.responseTime}`, label: 'tiempo de respuesta' },
];

export const clientPlans: {
  icon: string;
  title: string;
  benefits: string[];
  cta: string;
  whatsapp: WhatsAppIntent;
}[] = [
  {
    icon: 'hospital',
    title: 'Hospitales e IPS',
    benefits: [
      'Contratos de suministro u órdenes de compra',
      'Facturación centralizada',
      'Cupo de crédito con pago a 30 a 45 días',
      'Entregas programadas con vehículos propios',
    ],
    cta: 'Solicitar convenio',
    whatsapp: 'hospital',
  },
  {
    icon: 'flask',
    title: 'Laboratorios clínicos',
    benefits: [
      'Reactivos, toma de muestras y consumibles en un solo proveedor',
      'Despachos todos los días en nuestras rutas',
      'Sin pedido mínimo',
      'Abastecemos al laboratorio clínico CIC: conocemos su operación',
    ],
    cta: 'Cotizar para mi laboratorio',
    whatsapp: 'lab',
  },
  {
    icon: 'pill',
    title: 'Droguerías',
    benefits: [
      'Pruebas rápidas y elementos de bioseguridad',
      'Sin pedido mínimo',
      'Entrega en su municipio según el calendario de ruta',
    ],
    cta: 'Cotizar para mi droguería',
    whatsapp: 'drugstore',
  },
  {
    icon: 'user',
    title: 'Consultorios y otros establecimientos',
    benefits: [
      'Veterinarias, fisioterapia, odontología, clínicas ortopédicas y más',
      'Sin pedido mínimo ni contrato',
      'La misma línea que usan hospitales y laboratorios',
      'Cotización directa por WhatsApp',
    ],
    cta: 'Cotizar por WhatsApp',
    whatsapp: 'independent',
  },
];

/** Product categories. Add, remove or reorder freely; the layout adapts. */
export const productCategories = [
  {
    icon: 'flask',
    title: 'Reactivos de laboratorio',
    items: ['Química clínica', 'Hematología', 'Inmunología', 'Uroanálisis'],
  },
  {
    icon: 'droplet',
    title: 'Toma de muestras',
    items: ['Tubos al vacío', 'Agujas, jeringas y holders', 'Torniquetes', 'Recolectores de orina y coprológico'],
  },
  {
    icon: 'test',
    title: 'Pruebas rápidas',
    items: ['Embarazo', 'VIH, sífilis y hepatitis', 'Antígeno respiratorio', 'Drogas de abuso'],
  },
  {
    icon: 'box',
    title: 'Consumibles',
    items: ['Puntas de micropipeta', 'Láminas y laminillas', 'Algodón y gasas', 'Alcohol y antisépticos'],
  },
  {
    icon: 'shield',
    title: 'Bioseguridad',
    items: ['Guantes de nitrilo y látex', 'Tapabocas y respiradores', 'Batas desechables', 'Guardianes'],
  },
];

export const contractBenefits = [
  {
    icon: 'lock',
    title: 'Precio estable',
    text: 'Por lo general mantenemos el precio acordado; solo algunos productos importados pueden variar con el dólar.',
  },
  {
    icon: 'calendar',
    title: 'Entregas programadas',
    text: 'Acordamos las fechas con usted y despachamos en las rutas de la semana; para volúmenes grandes, despacho dedicado.',
  },
  { icon: 'card', title: 'Pago a 30 a 45 días', text: 'Cupo de crédito acordado con gerencia.' },
  {
    icon: 'check',
    title: 'Sin consumo mínimo',
    text: 'Al completar el cupo del contrato, renovamos con un otrosí o un contrato nuevo.',
  },
];

export const contractSteps = [
  { title: 'Solicite una cotización', text: 'Le respondemos en 2 a 48 horas con precios y condiciones.' },
  {
    title: 'Negociamos con usted',
    text: 'Por lo general de forma digital; si lo prefiere, nuestro asesor comercial lo visita en su sede.',
  },
];

/** Documents purchasing departments can request. INVIMA records and data sheets come from each manufacturer. */
export const supplierDocuments = [
  'RUT',
  'Certificado de Cámara de Comercio',
  'Registros sanitarios INVIMA',
  'Fichas técnicas de los productos',
];

/**
 * Client testimonials. The section stays hidden while this list is empty.
 * Only add quotes the client has approved, e.g.:
 * { quote: '…', name: 'Nombre Apellido', role: 'Coordinadora de compras', org: 'Hospital X', logo: '/clients/x.svg' }
 */
export const testimonials: { quote: string; name: string; role?: string; org?: string; logo?: string }[] = [];

export const faqs = [
  {
    q: '¿Puedo comprar en línea?',
    a: 'Todavía no tenemos tienda en línea. Puede ver nuestro catálogo en WhatsApp y pedirnos una cotización por ese medio o con el formulario.',
  },
  {
    q: '¿Hay un pedido mínimo?',
    a: `No hay pedido mínimo. El flete depende de la distancia y del valor del pedido; en compras superiores a ${freeFreightFrom} no cobramos flete.`,
  },
  {
    q: '¿Ofrecen crédito?',
    a: 'Los hospitales e IPS con contrato manejan un cupo de crédito con pago a 30 a 45 días. Otros clientes pueden acceder a crédito si cumplen los requisitos de la empresa.',
  },
  {
    q: '¿Cuánto tarda una entrega?',
    a: 'Si el producto está en stock, entregamos en 1 a 3 días hábiles según la ruta de la semana. Para volúmenes grandes coordinamos un despacho dedicado.',
  },
  {
    q: '¿Entregan fuera de las rutas?',
    a: 'Sí, entregamos en todo el Valle del Cauca. Fuera de las rutas principales se cobra flete.',
  },
  {
    q: '¿Participan en licitaciones?',
    a: 'Sí, participamos en licitaciones públicas. Enviamos RUT, certificado de Cámara de Comercio, registros sanitarios INVIMA y fichas técnicas en 48 horas hábiles.',
  },
  {
    q: '¿Emiten factura electrónica?',
    a: 'Sí, todas nuestras ventas se facturan electrónicamente.',
  },
];

/** Options for the contact form selects. */
export const clientTypeOptions = [
  'Hospital / IPS',
  'Laboratorio clínico',
  'Droguería',
  'Consultorio / independiente',
  'Veterinaria',
  'Fisioterapia',
  'Odontología',
  'Clínica ortopédica',
  'Otro',
];

export const interestOptions = [
  { key: 'cotizacion', label: 'Cotización' },
  { key: 'contrato', label: 'Contrato de suministro' },
  { key: 'catalogo', label: 'Precios del catálogo' },
  { key: 'documentos', label: 'Documentos para proveedor' },
  { key: 'otra', label: 'Otra' },
] as const;

export const navLinks = [
  { href: '#planes', label: 'Planes' },
  { href: '#productos', label: 'Productos' },
  { href: '#contratos', label: 'Contratos' },
  { href: '#cobertura', label: 'Cobertura' },
  { href: '#contacto', label: 'Contacto' },
  { href: '#preguntas', label: 'Preguntas' },
];
