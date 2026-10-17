import type { APIRoute } from 'astro';
import { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } from 'astro:env/server';
import { Resend } from 'resend';
import { normalizeContact, validateContact, type ContactData } from '../../lib/contact';
import { interestOptions } from '../../data/site';

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

  const rows: [string, string][] = [
    ['Nombre', d.nombre],
    ['Institución / empresa', d.institucion],
    ['Correo', d.correo],
    ['Teléfono / WhatsApp', d.telefono],
    ['Tipo de cliente', d.tipo],
    ['Me interesa', interest],
    ['Municipio', d.municipio],
    ['Mensaje', d.mensaje],
    ['Autorización de datos (Ley 1581)', 'Sí'],
  ];

  const cell = 'padding:10px 12px;border:1px solid #dbe4ee;vertical-align:top;';
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#16263a;">
<h2 style="color:#0b4f8a;margin:0 0 12px;">Nueva solicitud desde la web</h2>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px;font-size:14px;">
${rows
  .map(
    ([label, value]) =>
      `<tr><th align="left" style="${cell}background:#eef5fc;width:200px;">${escapeHtml(label)}</th>` +
      `<td style="${cell}white-space:pre-wrap;">${value ? escapeHtml(value) : '<span style="color:#8a99aa;">—</span>'}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="font-size:12px;color:#4d5f73;margin-top:16px;">Responda este correo para contestarle directamente al cliente.</p>
</body></html>`;

  const text = rows.map(([label, value]) => `${label}: ${value || '—'}`).join('\n');
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
      console.info('[contact] RESEND_API_KEY not set, mock send:\n' + subject + '\n' + text);
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
      replyTo: data.correo,
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
