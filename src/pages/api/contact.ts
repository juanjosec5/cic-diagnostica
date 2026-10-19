import type { APIRoute } from 'astro';
import { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } from 'astro:env/server';
import { Resend } from 'resend';
import { normalizeContact, validateContact, type ContactData } from '../../lib/contact';
import { CONSENT_TEXT_VERSION, interestOptions, privacy } from '../../data/site';

// Runs on demand as a Vercel serverless function; the rest of the site is static.
export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Header-safe text for the subject line.
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').slice(0, 80);

const interestLabel = (key: string) => interestOptions.find((o) => o.key === key)?.label ?? 'Otra';

function buildEmail(d: ContactData) {
  const interest = interestLabel(d.interes);
  const who = d.institucion ? `${d.nombre} (${d.institucion})` : d.nombre;
  const subject = `[Web] ${interest}: ${oneLine(who)}`;

  // The form only sends these when "contrato" is selected.
  const contractRows: [string, string][] =
    d.interes === 'contrato'
      ? [
          ['NIT de la institución', d.nit],
          ['Consumo mensual aproximado', d.consumo],
        ]
      : [];

  const rows: [string, string][] = [
    ['Nombre', d.nombre],
    ['Institución / empresa', d.institucion],
    ['Teléfono / WhatsApp', d.telefono],
    ['Tipo de cliente', d.tipo],
    ['Me interesa', interest],
    ...contractRows,
    ['Municipio', d.municipio],
    ['Mensaje', d.mensaje],
  ];

  // Proof of the data-processing authorization (Decreto 1377 de 2013, art. 8).
  const consentRows: [string, string][] = [
    ['Autorización tratamiento de datos (Ley 1581)', 'Sí'],
    ['Texto de autorización', CONSENT_TEXT_VERSION],
    ['Política vigente', `v${privacy.version} – ${new URL('/politica-de-datos', import.meta.env.SITE).href}`],
    ['Fecha y hora (Bogotá)', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })],
    ['Origen', 'Formulario web'],
  ];

  const cell = 'padding:10px 12px;border:1px solid #dbe4ee;vertical-align:top;';
  const table = (list: [string, string][]) =>
    `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px;font-size:14px;">${list
      .map(
        ([label, value]) =>
          `<tr><th align="left" style="${cell}background:#eef5fc;width:200px;">${escapeHtml(label)}</th>` +
          `<td style="${cell}white-space:pre-wrap;">${value ? escapeHtml(value) : '<span style="color:#8a99aa;">—</span>'}</td></tr>`,
      )
      .join('')}</table>`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#16263a;">
<h2 style="color:#0b4f8a;margin:0 0 12px;">Nueva solicitud desde la web</h2>
${table(rows)}
<h3 style="color:#0b4f8a;margin:20px 0 8px;font-size:15px;">Registro de autorización</h3>
${table(consentRows)}
<p style="font-size:12px;color:#4d5f73;margin-top:16px;">Contacte al cliente por teléfono o WhatsApp.
Conserve este correo según la política de datos; no lo reenvíe fuera de la empresa.</p>
</body></html>`;

  const text = [...rows, ['Registro de autorización', ''], ...consentRows]
    .map(([label, value]) => `${label}: ${value || '—'}`)
    .join('\n');
  return { subject, html, text };
}

export const POST: APIRoute = async ({ request }) => {
  let input: Record<string, unknown>;
  try {
    const type = request.headers.get('content-type') ?? '';
    input = type.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400);
  }
  if (!input || typeof input !== 'object') return json({ ok: false, error: 'invalid_body' }, 400);

  // Honeypot filled: pretend success so bots don't retry, but send nothing.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return json({ ok: true });
  }

  const errors = validateContact(input);
  if (Object.keys(errors).length) return json({ ok: false, errors }, 400);

  const data = normalizeContact(input);
  const { subject, html, text } = buildEmail(data);

  if (!RESEND_API_KEY) {
    if (import.meta.env.DEV) {
      // Local development without a key: log instead of sending.
      console.info(`[contact] RESEND_API_KEY not set, mock send:\n${subject}\n${text}`);
      return json({ ok: true, mocked: true });
    }
    console.error('[contact] RESEND_API_KEY is not configured');
    return json({ ok: false, error: 'not_configured' }, 500);
  }
  if (!CONTACT_TO) {
    console.error('[contact] CONTACT_TO is not configured');
    return json({ ok: false, error: 'not_configured' }, 500);
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO.split(',').map((s) => s.trim()).filter(Boolean),
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[contact] Resend error', error);
      return json({ ok: false, error: 'send_failed' }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('[contact] Unexpected error', err);
    return json({ ok: false, error: 'send_failed' }, 502);
  }
};
