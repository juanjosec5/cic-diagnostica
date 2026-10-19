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
 * Data-protection policy facts (Ley 1581 de 2012). Used by /politica-de-datos and the contact email.
 * [DATO] values must come from the company; the policy page shows a "en revisión" notice while any remain.
 * Bump `version` (and CONSENT_TEXT_VERSION below if the checkbox text changes) on every substantial change.
 */
export const privacy = {
  version: '1.0',
  effectiveDate: '[DATO: fecha de vigencia]',
  requestEmail: company.email,
  responsibleArea: 'Gerencia',
  // Mail for cicdiagnostica.com is hosted on the domain's cPanel server (MX → 174.136.57.9, VivaWebHost).
  emailProvider: 'VivaWebHost (alojamiento del dominio)',
  analyticsRegion: '[DATO: país de alojamiento de Umami]',
  leadRetention:
    'las solicitudes se conservan en el correo de la gerencia mientras sean necesarias para la relación comercial, y usted puede pedir su supresión en cualquier momento',
  rnbd: '[DATO: inscrita en el RNBD / no obligada a inscribirse]',
};

/** Version of the consent checkbox text in the contact form; recorded in each notification email as proof. */
export const CONSENT_TEXT_VERSION = 'v1';

/** True while a value still holds a [bracketed] placeholder; such values are hidden on the page. */
export const isPlaceholder = (value: string): boolean => /\[.*\]/.test(value);

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
  general: 'Hola, CIC Diagnóstica. Quisiera recibir más información sobre sus productos.',
  quote: 'Hola, CIC Diagnóstica. Quisiera solicitar una cotización de insumos de laboratorio.',
  urgent: 'Hola, CIC Diagnóstica. Necesito hacer un pedido urgente porque nos estamos quedando sin insumos.',
  contract: 'Hola, CIC Diagnóstica. Quisiera información sobre un contrato de suministro para mi institución.',
  outsideRoute: 'Hola, CIC Diagnóstica. Quisiera saber si pueden hacer entregas en mi municipio.',
} as const;

export type WhatsAppIntent = keyof typeof whatsappMessages;

/** Proof row under the hero. Only confirmed figures. */
export const stats = [
  { icon: 'calendar', value: 'Desde 2021', label: 'en el sector salud' },
  { icon: 'user', value: '40+', label: 'clientes activos' },
  { icon: 'map', value: String(municipalities.length), label: 'municipios con ruta fija' },
  { icon: 'clock', value: `< ${company.responseTime}`, label: 'tiempo de respuesta' },
];

/** Delivery time for in-stock products; shown as a badge in the hero and in the FAQ. */
export const deliveryTime = '1 a 3 días hábiles';

export const clientPlans: { icon: string; title: string; benefits: string[] }[] = [
  {
    icon: 'hospital',
    title: 'Hospitales e IPS',
    benefits: ['Contrato u orden de compra', 'Crédito a 30–45 días', 'Facturación centralizada'],
  },
  {
    icon: 'flask',
    title: 'Laboratorios clínicos',
    benefits: ['Reactivos, toma de muestras y consumibles', 'Sin pedido mínimo'],
  },
  {
    icon: 'pill',
    title: 'Droguerías',
    benefits: ['Pruebas rápidas y bioseguridad', 'Sin pedido mínimo'],
  },
  {
    icon: 'user',
    title: 'Consultorios y otros establecimientos',
    benefits: ['Veterinarias, odontología, fisioterapia y más', 'Sin pedido mínimo ni contrato'],
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
    items: ['Tubos al vacío', 'Agujas, jeringas y portatubos (holders)', 'Torniquetes', 'Recolectores de orina y coprológico'],
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
  { icon: 'lock', title: 'Precio estable', text: 'Solo algunos importados varían con el dólar.' },
  { icon: 'calendar', title: 'Entregas programadas', text: 'En fechas acordadas, en nuestras rutas semanales.' },
  { icon: 'card', title: 'Pago a 30–45 días', text: 'Cupo de crédito acordado con gerencia.' },
  { icon: 'check', title: 'Sin consumo mínimo', text: 'Al completar el cupo, renovamos por otrosí.' },
];

export const contractSteps = [
  {
    title: 'Solicite una cotización',
    text: 'Cuéntenos qué necesita y, en máximo 48 horas, recibirá una propuesta con precios y condiciones para su institución.',
  },
  {
    title: 'Acordamos las condiciones',
    text: 'De forma digital o con visita del asesor a su sede.',
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
    a: 'Por ahora no contamos con tienda en línea. Puede consultar nuestro catálogo en WhatsApp y solicitarnos una cotización por ese medio o a través del formulario.',
  },
  {
    q: '¿Manejan un pedido mínimo?',
    a: `No, no manejamos pedido mínimo. El flete depende de la distancia y del valor del pedido, y en compras superiores a ${freeFreightFrom} no cobramos flete.`,
  },
  {
    q: '¿Ofrecen crédito?',
    a: 'Sí. Los hospitales e IPS con contrato de suministro manejan un cupo de crédito con pago a 30 a 45 días. Los demás clientes pueden acceder a crédito si cumplen los requisitos de la empresa.',
  },
  {
    q: '¿Cuánto tarda la entrega?',
    a: `Si el producto está disponible en inventario, lo entregamos en ${deliveryTime}, según la ruta de la semana. Para volúmenes grandes coordinamos un despacho dedicado.`,
  },
  {
    q: '¿Entregan fuera de sus rutas?',
    a: 'Sí, entregamos en todo el Valle del Cauca. Fuera de las rutas principales se cobra flete; consúltenos por WhatsApp para su municipio.',
  },
  {
    q: '¿Participan en licitaciones?',
    a: 'Sí, participamos en licitaciones públicas. Vea los documentos que enviamos en la sección «Documentos para proveedor».',
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
