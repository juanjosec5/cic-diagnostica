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
  address: '[Calle 00 # 00-00, Cali, Valle del Cauca]',
  city: 'Cali',
  region: 'Valle del Cauca',
  hours: ['[Lunes a viernes: 7:00 a.m. – 5:00 p.m.]'],
  // Shown in the proof row, the contact section and the form's success message.
  responseTime: '24 horas',
  // Used for canonical URL, Open Graph and JSON-LD. Also set `site` in astro.config.mjs.
  url: 'https://www.cicdiagnostica.com',
};

/**
 * Delivery route: which weekday our own vehicles reach each municipality.
 * The list of municipalities and their count are derived from this everywhere on the page.
 */
export const routeDays = [
  { day: 'Lunes', towns: ['Cali', 'Jamundí', 'Yumbo'] },
  { day: 'Martes', towns: ['Palmira', 'Candelaria', 'Pradera', 'Florida'] },
  { day: 'Miércoles', towns: ['Buga', 'Guacarí', 'El Cerrito', 'Ginebra'] },
  { day: 'Jueves', towns: ['Tuluá', 'Zarzal', 'Roldanillo', 'Cartago'] },
  { day: 'Viernes', towns: ['Buenaventura'] },
];

export const municipalities = routeDays.flatMap((d) => d.towns);

/** Prefilled WhatsApp messages, one per button intent. */
export const whatsappMessages = {
  general: 'Hola, CIC Diagnóstica. Quisiera más información sobre sus productos.',
  quote: 'Hola, CIC Diagnóstica. Quisiera solicitar una cotización de insumos de laboratorio.',
  urgent: 'Hola, CIC Diagnóstica. Tengo un pedido urgente: nos estamos quedando sin insumos.',
  catalog: 'Hola, CIC Diagnóstica. ¿Me pueden enviar el catálogo con precios, por favor?',
  contract: 'Hola, CIC Diagnóstica. Me interesa un contrato de suministro para mi institución.',
  outsideRoute: 'Hola, CIC Diagnóstica. Quisiera saber si pueden hacer entregas en mi municipio.',
  hospital: 'Hola, CIC Diagnóstica. Escribo de un hospital / IPS y me interesa un convenio de suministro.',
  lab: 'Hola, CIC Diagnóstica. Escribo de un laboratorio clínico y quisiera una cotización de reactivos e insumos.',
  drugstore: 'Hola, CIC Diagnóstica. Escribo de una droguería y quisiera conocer sus productos y condiciones.',
  independent: 'Hola, CIC Diagnóstica. Quisiera cotizar algunos insumos para mi consultorio.',
} as const;

export type WhatsAppIntent = keyof typeof whatsappMessages;

/** Proof row under the hero. Replace the bracketed values with confirmed figures. */
export const stats = [
  { value: '[00]', label: 'años en el mercado' },
  { value: '[000]', label: 'clientes activos' },
  { value: String(municipalities.length), label: 'municipios con entrega propia' },
  { value: `< ${company.responseTime}`, label: 'tiempo de respuesta' },
];

/** Brands we distribute. Set `logo` to a file in /public (e.g. '/brands/marca.svg') to show the image. */
export const brands: { name: string; logo?: string }[] = [
  { name: '[Marca 1]' },
  { name: '[Marca 2]' },
  { name: '[Marca 3]' },
  { name: '[Marca 4]' },
  { name: '[Marca 5]' },
  { name: '[Marca 6]' },
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
      'Convenios y contratos de suministro',
      'Facturación centralizada',
      'Precio fijo y pago a 30 o 60 días',
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
      'Stock reservado para su consumo mensual',
      'Entregas semanales o quincenales',
      'Respaldo de un grupo con laboratorio clínico propio',
    ],
    cta: 'Cotizar para mi laboratorio',
    whatsapp: 'lab',
  },
  {
    icon: 'pill',
    title: 'Droguerías',
    benefits: [
      'Pruebas rápidas y elementos de bioseguridad',
      'Contrato de suministro con precio fijo',
      'Entrega en su municipio según el calendario de ruta',
    ],
    cta: 'Cotizar para mi droguería',
    whatsapp: 'drugstore',
  },
  {
    icon: 'user',
    title: 'Consultorios e independientes',
    benefits: [
      'Pedidos sin necesidad de contrato',
      'Cotización directa por WhatsApp',
      'Los mismos productos que usan hospitales y laboratorios',
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
    items: ['Tubos al vacío', 'Agujas y holders', 'Torniquetes', 'Recolectores de orina y coprológico'],
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
    icon: 'beaker',
    title: 'Vidriería y plásticos',
    items: ['Tubos de ensayo', 'Pipetas', 'Gradillas', 'Frascos y cajas de Petri'],
  },
  {
    icon: 'shield',
    title: 'Bioseguridad',
    items: ['Guantes de nitrilo y látex', 'Tapabocas y respiradores', 'Batas desechables', 'Guardianes'],
  },
];

export const contractBenefits = [
  { icon: 'lock', title: 'Precio fijo', text: 'El precio acordado se mantiene durante toda la vigencia del contrato.' },
  { icon: 'calendar', title: 'Entregas programadas', text: 'Despachos semanales o quincenales según su consumo.' },
  { icon: 'card', title: 'Pago a 30 o 60 días', text: 'Crédito para instituciones con contrato de suministro.' },
  { icon: 'box', title: 'Stock reservado', text: 'Apartamos su inventario para que no se quede sin insumos.' },
  { icon: 'chart', title: 'Informe mensual', text: 'Reporte de consumo para planear compras y presupuesto.' },
];

export const contractSteps = [
  { title: 'Envíe su consumo mensual', text: 'Compártanos qué productos usa y en qué cantidades.' },
  { title: 'Reciba una propuesta', text: 'Le enviamos precios fijos, frecuencia de entrega y plazo de pago.' },
  { title: 'Lo visita un asesor', text: 'Nuestro asesor comercial revisa la propuesta con usted en su sede.' },
  { title: 'Firme y empiece a recibir', text: 'Firmamos el contrato y programamos las primeras entregas.' },
];

/** Documents purchasing departments can request. */
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
    a: 'Todavía no tenemos tienda en línea. Escríbanos por WhatsApp o diligencie el formulario y le enviamos el catálogo con precios y una cotización.',
  },
  {
    q: '¿Hay un pedido mínimo?',
    a: '[Definir pedido mínimo]. También atendemos pedidos pequeños de consultorios e independientes.',
  },
  {
    q: '¿Ofrecen crédito?',
    a: 'Sí. Los clientes con contrato de suministro pueden pagar a 30 o 60 días. [Condiciones del crédito para compras sin contrato].',
  },
  {
    q: '¿Cuánto tarda una entrega?',
    a: 'Entregamos con personal y vehículos propios según el calendario de ruta: cada municipio tiene un día fijo de entrega. [Tiempo de entrega para pedidos urgentes].',
  },
  {
    q: `¿Entregan fuera de los ${municipalities.length} municipios?`,
    a: 'Evaluamos cada caso según el volumen y la ubicación. Escríbanos y le confirmamos.',
  },
  {
    q: '¿Qué documentación entregan para licitaciones?',
    a: 'Le enviamos RUT, certificado de Cámara de Comercio, registros sanitarios INVIMA y fichas técnicas de los productos.',
  },
];

/** Options for the contact form selects. */
export const clientTypeOptions = [
  'Hospital / IPS',
  'Laboratorio clínico',
  'Droguería',
  'Consultorio / independiente',
  'Otro',
];

export const interestOptions = [
  { key: 'cotizacion', label: 'Cotización' },
  { key: 'contrato', label: 'Contrato de suministro' },
  { key: 'catalogo', label: 'Catálogo con precios' },
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
