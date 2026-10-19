/**
 * Contact form validation shared by the browser script and the API route,
 * so both enforce the same rules and return the same Spanish messages.
 */

export const LIMITS = { short: 120, phone: 30, nit: 30, consumption: 1000, message: 3000 } as const;

export const FIELDS = [
  'nombre',
  'institucion',
  'telefono',
  'tipo',
  'interes',
  'nit',
  'consumo',
  'municipio',
  'mensaje',
  'consentimiento',
] as const;

export type ContactField = (typeof FIELDS)[number];
export type ContactData = Record<ContactField, string>;
export type ContactErrors = Partial<Record<ContactField, string>>;


/** Picks known fields from untrusted input, coerced to trimmed strings. */
export function normalizeContact(input: Record<string, unknown>): ContactData {
  return Object.fromEntries(
    FIELDS.map((f) => [f, typeof input[f] === 'string' ? (input[f] as string).trim() : '']),
  ) as ContactData;
}

export function validateContact(input: Record<string, unknown>): ContactErrors {
  const d = normalizeContact(input);
  const errors: ContactErrors = {};

  if (!d.nombre) errors.nombre = 'Escriba su nombre.';
  else if (d.nombre.length > LIMITS.short) errors.nombre = 'El nombre es demasiado largo.';

  const digits = d.telefono.replace(/\D/g, '');
  if (!d.telefono) errors.telefono = 'Escriba un teléfono o WhatsApp.';
  else if (digits.length < 7 || digits.length > 15 || d.telefono.length > LIMITS.phone)
    errors.telefono = 'Escriba un número válido, por ejemplo 300 123 4567.';

  if (!d.mensaje) errors.mensaje = 'Cuéntenos qué productos necesita.';
  else if (d.mensaje.length > LIMITS.message)
    errors.mensaje = `El mensaje no puede superar ${LIMITS.message} caracteres.`;

  if (!d.consentimiento) errors.consentimiento = 'Para enviar el formulario, autorice el tratamiento de sus datos.';

  for (const f of ['institucion', 'tipo', 'interes', 'municipio'] as const) {
    if (d[f].length > LIMITS.short) errors[f] = 'El texto es demasiado largo.';
  }
  if (d.nit.length > LIMITS.nit) errors.nit = 'El NIT es demasiado largo.';
  if (d.consumo.length > LIMITS.consumption)
    errors.consumo = `El consumo no puede superar ${LIMITS.consumption} caracteres.`;

  return errors;
}
