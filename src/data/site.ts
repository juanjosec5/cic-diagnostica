/**
 * Editable site content. Everything a non-developer may need to change
 * (contact details, WhatsApp number, numbers, products, route, FAQ) lives here.
 * Values wrapped in [brackets] are placeholders; see README > Placeholders.
 * Only publish numbers and claims that are confirmed.
 */

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const company = {
  name: 'CIC Diagnóstica',
  legalName: 'CIC Diagnóstica S.A.S.',
  nit: '901.456.745-4',
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
  // The same hours for search engines (JSON-LD). Keep both in sync.
  openingHours: [
    { days: weekdays, opens: '07:00', closes: '12:00' },
    { days: weekdays, opens: '14:00', closes: '17:00' },
    { days: ['Saturday'], opens: '07:30', closes: '11:00' },
  ],
  // Shown in the proof row, the contact section and the form's success message.
  responseTime: '24 horas',
};

/**
 * Data-protection policy facts (Ley 1581 de 2012). Used by /politica-de-datos and the contact email.
 * [DATO] values must come from the company; the policy page shows a "en revisión" notice while any remain.
 * Bump `version` (and CONSENT_TEXT_VERSION below if the checkbox text changes) on every substantial change.
 */
export const privacy = {
  version: '1.1',
  effectiveDate: '19 de octubre de 2026',
  requestEmail: company.email,
  responsibleArea: 'Gerencia',
  // Mail for cicdiagnostica.com is hosted on the domain's cPanel server (MX → 174.136.57.9, VivaWebHost).
  emailProvider: 'VivaWebHost (alojamiento del dominio)',
  leadRetention:
    'las solicitudes se conservan en el correo de la gerencia mientras sean necesarias para la relación comercial, y usted puede pedir su supresión en cualquier momento',
  // Confirmed by the company (2026-10-19): total assets are below 100.000 UVT, so registration isn't required.
  rnbd:
    'No estamos obligados a inscribir nuestras bases de datos en el Registro Nacional de Bases de Datos de la SIC, porque nuestros activos totales no superan 100.000 UVT (Decreto 1074 de 2015, artículo 2.2.2.26.1.2). Esto no nos exime de cumplir las demás obligaciones de la Ley 1581 de 2012 descritas en esta política.',
};

/** Version of the consent checkbox text in the contact form; recorded in each notification email as proof. */
export const CONSENT_TEXT_VERSION = 'v1';

/** True while a value still holds a [bracketed] placeholder; such values are hidden on the page. */
export const isPlaceholder = (value: string): boolean => /\[.*\]/.test(value);

/**
 * Municipalities with direct delivery: those with a CIC Laboratorios site (ciclaboratorios.com/sedes),
 * grouped by subregion. The list and its count are derived from this everywhere on the page.
 */
export const deliveryZones: { zone: string; towns: string[] }[] = [
  {
    zone: 'Norte del Valle',
    towns: ['Ansermanuevo', 'Caicedonia', 'Cartago', 'La Unión', 'Obando', 'Roldanillo', 'Zarzal'],
  },
  {
    zone: 'Centro del Valle',
    towns: ['Buga', 'Andalucía', 'Bugalagrande', 'Darién', 'Restrepo', 'San Pedro', 'Tuluá', 'Yotoco'],
  },
  { zone: 'Sur del Valle', towns: ['Dagua', 'Guacarí', 'La Cumbre'] },
];

export const municipalities = deliveryZones.flatMap((z) => z.towns);

/** Orders above this value ship without freight charge (COP). */
export const freeFreightFrom = '$600.000';

/** Prefilled WhatsApp messages, one per button intent. */
// Prefilled WhatsApp messages. "(web)" tells the team the chat came from the site. Each ends with one short
// field after a line break: WhatsApp puts the cursor at the end, so the visitor only types the answer.
export const whatsappMessages = {
  general: 'Hola, quisiera información sobre sus productos. (web)\nMe interesa: ',
  quote: 'Hola, quisiera una cotización. (web)\nProductos, cantidades y municipio: ',
  urgent: 'Hola, necesito hacer un pedido urgente. (web)\nProductos, cantidades y municipio: ',
  contract: 'Hola, quisiera información sobre un contrato de suministro para hospital o IPS. (web)\nInstitución y municipio: ',
  outsideRoute: 'Hola, ¿hacen entregas en mi municipio? (web)\nMunicipio y productos: ',
} as const;

export type WhatsAppIntent = keyof typeof whatsappMessages;

/** Proof row under the hero. Only confirmed figures. */
export const stats = [
  { icon: 'calendar', value: 'Desde 2021', label: 'en el sector salud' },
  { icon: 'user', value: '40+', label: 'clientes activos' },
  { icon: 'map', value: String(municipalities.length), label: 'municipios con entrega gratis' },
  { icon: 'clock', value: 'Menos de 24 h', label: 'para responderle' },
];

/** Delivery time; shown as a badge in the hero and in the FAQ. */
export const deliveryTime = '1 a 3 días hábiles';

// What applies to every client type ("sin pedido mínimo", free delivery) is stated once, under the tiles.
export const clientPlans: { icon: string; title: string; benefits: string[]; link?: { href: string; text: string } }[] = [
  {
    icon: 'hospital',
    title: 'Hospitales e IPS',
    benefits: ['Contrato u orden de compra', 'Crédito a 30–45 días', 'Entregas en fechas acordadas'],
    link: { href: '#contratos', text: 'Ver condiciones de contrato' },
  },
  {
    icon: 'flask',
    title: 'Laboratorios clínicos',
    benefits: ['Reactivos, toma de muestras y consumibles', 'Despachos diarios'],
  },
  {
    icon: 'pill',
    title: 'Droguerías',
    benefits: ['Pruebas rápidas y bioseguridad', 'Compra sin contrato'],
  },
  {
    icon: 'user',
    title: 'Consultorios y otros establecimientos',
    benefits: ['Veterinarias, odontología, fisioterapia y más', 'Compra directa por WhatsApp'],
  },
];

/**
 * "Lo más pedido": the warehouse's top 5, in rank order. Update monthly (items and `period`).
 * Only list real best sellers; the label must stay true. `image` is a file in public/products/
 * (4:3, 640×480 WebP, ≤ 60 KB; originals stay local) with a 360 px copy next to it named `<name>-360.webp`;
 * without it the card shows the category icon.
 */
export const bestSellers: {
  period: string;
  items: { name: string; presentation?: string; category: string; icon: string; image?: string }[];
} = {
  period: 'octubre de 2026',
  items: [
    {
      name: 'Tubo tapa amarilla 5 ml',
      category: 'Toma de muestras',
      icon: 'droplet',
      image: '/products/tubo-tapa-amarilla-5ml.webp',
    },
    {
      name: 'Prueba rápida de drogas en orina 2 en 1 (THC/COC)',
      presentation: 'x 25 pruebas',
      category: 'Pruebas rápidas',
      icon: 'test',
      image: '/products/prueba-rapida-drogas-thc-coc.webp',
    },
    {
      name: 'Aguja múltiple 21 x 1½"',
      presentation: 'Caja x 100',
      category: 'Toma de muestras',
      icon: 'droplet',
      image: '/products/aguja-multiple-21x1-5.webp',
    },
    {
      name: 'Prueba rápida Hepatitis B (HBsAg)',
      presentation: 'x 30 pruebas',
      category: 'Pruebas rápidas',
      icon: 'test',
      image: '/products/prueba-rapida-hbsag.webp',
    },
    {
      name: 'Prueba rápida VIH, casete 3 líneas (suero/plasma)',
      presentation: 'x 40 pruebas',
      category: 'Pruebas rápidas',
      icon: 'test',
      image: '/products/prueba-rapida-vih.webp',
    },
  ],
};

/**
 * Product categories. Add, remove or reorder freely; the layout adapts.
 * `image` is a file prefix in public/products/lineas/: `<image>-360.webp` and `<image>-640.webp` (3:2).
 * Without it the card shows the icon.
 */
export const productCategories = [
  {
    icon: 'flask',
    title: 'Reactivos de laboratorio',
    image: '/products/lineas/reactivos',
    items: ['Química clínica', 'Hematología', 'Inmunología', 'Uroanálisis'],
  },
  {
    icon: 'droplet',
    title: 'Toma de muestras',
    image: '/products/lineas/toma-de-muestras',
    items: ['Tubos al vacío', 'Agujas, jeringas y portatubos', 'Torniquetes', 'Recolectores de orina y coprológico'],
  },
  {
    icon: 'test',
    title: 'Pruebas rápidas',
    image: '/products/lineas/pruebas-rapidas',
    items: ['Embarazo', 'VIH, sífilis y hepatitis', 'Antígeno respiratorio', 'Drogas de abuso'],
  },
  {
    icon: 'box',
    title: 'Consumibles',
    image: '/products/lineas/consumibles',
    items: ['Puntas de micropipeta', 'Láminas y laminillas', 'Algodón y gasas', 'Alcohol y antisépticos'],
  },
  {
    icon: 'shield',
    title: 'Bioseguridad',
    image: '/products/lineas/bioseguridad',
    items: ['Guantes de nitrilo y látex', 'Tapabocas y respiradores', 'Batas desechables', 'Guardianes'],
  },
];

export const contractBenefits = [
  { icon: 'lock', title: 'Precio estable', text: 'Solo algunos importados varían con el dólar.' },
  { icon: 'calendar', title: 'Entregas programadas', text: 'En las fechas acordadas, con nuestros despachos diarios.' },
  { icon: 'card', title: 'Pago a 30–45 días', text: 'Cupo de crédito acordado con gerencia.' },
  { icon: 'check', title: 'Sin consumo mínimo', text: 'Pida solo lo que necesita.' },
];

export const contractSteps = [
  {
    title: 'Solicite una propuesta',
    text: 'Cuéntenos qué necesita y, en máximo 48 horas, recibirá una propuesta con precios y condiciones para su institución.',
  },
  {
    title: 'Acordamos las condiciones',
    text: 'De forma digital o con visita del asesor a su sede.',
  },
  {
    title: 'Comenzamos las entregas',
    text: 'El contrato rige hasta agotar el cupo o llegar a la fecha acordada. Si necesita más antes, lo ampliamos con un otrosí o un contrato nuevo.',
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

/** `link` is shown after the answer: an in-page anchor (`href`) or a WhatsApp intent. */
export const faqs: { q: string; a: string; link?: { text: string; href?: string; intent?: WhatsAppIntent } }[] = [
  {
    q: '¿Cómo hago un pedido?',
    a: 'Por WhatsApp: revise nuestro catálogo, envíenos su lista y le respondemos con la cotización. También puede usar el formulario. Por ahora no tenemos tienda en línea.',
  },
  {
    q: '¿Manejan un pedido mínimo?',
    a: `No manejamos pedido mínimo. La entrega es gratis en ${municipalities.length} municipios del Valle del Cauca.`,
  },
  {
    q: '¿Ofrecen crédito?',
    a: 'Sí. Los hospitales e IPS con contrato de suministro manejan un cupo de crédito con pago a 30 a 45 días. Los demás clientes pueden acceder a crédito si cumplen los requisitos de la empresa.',
  },
  {
    q: '¿Cuánto tarda la entrega?',
    a: `Despachamos todos los días y entregamos en ${deliveryTime}. Los pedidos urgentes o grandes los priorizamos con un despacho especial.`,
  },
  {
    q: '¿Entregan en otros municipios?',
    a: `Sí, en el resto del Valle del Cauca y fuera de él. Allí el flete depende de la distancia y es gratis en compras de más de ${freeFreightFrom}.`,
    link: { text: 'Consultar mi municipio por WhatsApp', intent: 'outsideRoute' },
  },
  {
    q: '¿Participan en licitaciones?',
    a: 'Sí, participamos en licitaciones públicas y le enviamos los documentos de proveedor en 48 horas hábiles.',
    link: { text: 'Ver documentos para proveedor', href: '#documentos' },
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
  { key: 'cotizacion', label: 'Cotización o precios' },
  { key: 'contrato', label: 'Contrato de suministro' },
  { key: 'documentos', label: 'Documentos para proveedor' },
  { key: 'otra', label: 'Otra' },
] as const;

export const navLinks = [
  { href: '#productos', label: 'Productos' },
  { href: '#cobertura', label: 'Cobertura' },
  { href: '#clientes', label: 'Clientes' },
  { href: '#contratos', label: 'Contratos' },
  { href: '#preguntas', label: 'Preguntas' },
  { href: '#contacto', label: 'Contacto' },
];
