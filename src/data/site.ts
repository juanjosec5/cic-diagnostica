/**
 * Editable site content. Everything a non-developer may need to change
 * (contact details, WhatsApp number, products, municipalities, FAQ) lives here.
 * Values wrapped in [brackets] are placeholders; see README > Placeholders.
 */

export const company = {
  name: 'CIC Diagnostica',
  legalName: 'CIC Diagnostica S.A.S. [RAZÓN SOCIAL]',
  nit: '[NIT 000.000.000-0]',
  // Digits only, with country code, no "+" or spaces (e.g. 573001234567).
  whatsapp: '570000000000',
  // Human-readable version shown on the page.
  whatsappDisplay: '+57 [300 000 0000]',
  email: '[ventas@cicdiagnostica.com]',
  address: '[Calle 00 # 00-00, Cali, Valle del Cauca]',
  city: 'Cali',
  region: 'Valle del Cauca',
  hours: ['Lunes a viernes: [7:00 a.m. – 5:00 p.m.]', 'Sábados: [8:00 a.m. – 12:00 m.]'],
  // Used for canonical URL, Open Graph and JSON-LD. Also set `site` in astro.config.mjs.
  url: 'https://www.cicdiagnostica.com',
};

/** Prefilled WhatsApp messages, one per button intent. */
export const whatsappMessages = {
  general: 'Hola, CIC Diagnostica. Quisiera más información sobre sus productos.',
  quote: 'Hola, CIC Diagnostica. Quisiera solicitar una cotización de insumos de laboratorio.',
  catalog: 'Hola, CIC Diagnostica. ¿Me pueden enviar el catálogo con precios, por favor?',
  contract: 'Hola, CIC Diagnostica. Me interesa un contrato de suministro para mi institución.',
  outsideRoute: 'Hola, CIC Diagnostica. Quisiera saber si pueden hacer entregas en mi municipio.',
} as const;

export type WhatsAppIntent = keyof typeof whatsappMessages;

export const heroFacts = [
  { icon: 'map', value: '16', label: 'municipios del Valle con entrega' },
  { icon: 'truck', value: 'Flota propia', label: 'entregas con personal y vehículos propios' },
  { icon: 'card', value: '30 a 60 días', label: 'de crédito para clientes con contrato' },
];

export const clientTypes = [
  {
    icon: 'hospital',
    title: 'Hospitales e IPS',
    text: 'Suministro programado con contrato, precio fijo y crédito a 30 o 60 días.',
  },
  {
    icon: 'flask',
    title: 'Laboratorios clínicos',
    text: 'Reactivos, tubos y consumibles con stock reservado para que nunca se detenga su operación.',
  },
  {
    icon: 'pill',
    title: 'Droguerías',
    text: 'Pruebas rápidas y material de bioseguridad con reposición frecuente y precios de distribuidor.',
  },
  {
    icon: 'user',
    title: 'Consultorios e independientes',
    text: 'Pedidos pequeños con la misma calidad, atención directa por WhatsApp.',
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

/** Municipalities on the delivery route. Replace with the real 16. */
export const municipalities = [
  'Cali',
  'Palmira',
  'Jamundí',
  'Yumbo',
  'Candelaria',
  'Buga',
  'Tuluá',
  'Cartago',
  'Buenaventura',
  'Florida',
  'Pradera',
  'El Cerrito',
  'Ginebra',
  'Guacarí',
  'Zarzal',
  'Roldanillo',
];

export const faqs = [
  {
    q: '¿Puedo comprar en línea?',
    a: 'Todavía no tenemos tienda en línea. Escríbanos por WhatsApp o diligencie el formulario y le enviamos el catálogo con precios y una cotización.',
  },
  {
    q: '¿Hay un pedido mínimo?',
    a: '[Definir pedido mínimo]. Para pedidos más pequeños, consúltenos: atendemos también a consultorios e independientes.',
  },
  {
    q: '¿Ofrecen crédito?',
    a: 'Sí. Los clientes con contrato de suministro pueden pagar a 30 o 60 días, sujeto a estudio de crédito. Las compras ocasionales se pagan de contado.',
  },
  {
    q: '¿Cuánto tarda una entrega?',
    a: 'En los municipios de nuestra ruta entregamos en [1 a 3 días hábiles] con personal y vehículos propios. Los clientes con contrato reciben en las fechas programadas.',
  },
  {
    q: '¿Entregan fuera de los 16 municipios?',
    a: 'Evaluamos cada caso según el volumen y la ubicación. Escríbanos y le confirmamos.',
  },
  {
    q: '¿Qué documentación entregan para licitaciones?',
    a: 'Le enviamos RUT, certificado de cámara de comercio, registros sanitarios INVIMA y fichas técnicas de los productos, además de los documentos que su proceso requiera.',
  },
];

/** Options for the contact form selects. `value` is what gets emailed. */
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
  { key: 'otra', label: 'Otra' },
] as const;

export const navLinks = [
  { href: '#clientes', label: 'Clientes' },
  { href: '#productos', label: 'Productos' },
  { href: '#contratos', label: 'Contratos' },
  { href: '#cobertura', label: 'Cobertura' },
  { href: '#contacto', label: 'Contacto' },
  { href: '#preguntas', label: 'Preguntas' },
];
