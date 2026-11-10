#!/usr/bin/env node
// GA4 summary for the sales team: leads by button, most requested products, searches without results.
// Read-only (analytics.readonly). No dependencies: signs a service-account JWT with node:crypto and calls the
// GA4 Data API over fetch.
//
// Credentials (a service account with Viewer access to the property), first one set wins:
//   GA_SA_KEY_B64   the key JSON, base64-encoded (for cloud environments: `base64 -i key.json | pbcopy`)
//   GA_SA_KEY_JSON  the key JSON itself
//   GA_KEY          path to the key file (local use)
//
// Period: since the previous report day (Monday → from Friday, Friday → from Monday), up to yesterday.
// Otherwise the last 7 days. Override with --from YYYY-MM-DD --to YYYY-MM-DD.
// Usage: npm run ga:report [-- --from 2026-11-01 --to 2026-11-07]
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { analytics } from '../src/data/site.ts';

const PROPERTY = `properties/${analytics.propertyId}`;
const DATA_API = `https://analyticsdata.googleapis.com/v1beta/${PROPERTY}:runReport`;

function loadKey() {
  const { GA_SA_KEY_B64, GA_SA_KEY_JSON, GA_KEY } = process.env;
  const raw = GA_SA_KEY_B64
    ? Buffer.from(GA_SA_KEY_B64, 'base64').toString('utf8')
    : GA_SA_KEY_JSON ?? (GA_KEY ? readFileSync(GA_KEY, 'utf8') : null);
  if (!raw) fail('No credentials: set GA_SA_KEY_B64, GA_SA_KEY_JSON or GA_KEY (see the top of this file).');
  try {
    return JSON.parse(raw);
  } catch {
    fail('The credentials are not valid JSON (if base64, check it was copied whole).');
  }
}

async function accessToken(key) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: key.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: key.token_uri, iat: now, exp: now + 3600 };
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(claims)}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  const body = await res.json();
  if (!res.ok) fail(`Google sign-in failed: ${body.error} ${body.error_description ?? ''}`);
  return body.access_token;
}

/** Reporting period as YYYY-MM-DD in Bogotá: since the previous report day, up to yesterday. */
export function period(today = new Date(), args = process.argv.slice(2)) {
  const arg = (name) => args[args.indexOf(name) + 1];
  if (args.includes('--from')) return { from: arg('--from'), to: args.includes('--to') ? arg('--to') : arg('--from') };
  const bogota = new Date(today.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const daysBack = { 1: 3, 5: 4 }[bogota.getDay()] ?? 7; // Monday covers Fri–Sun, Friday covers Mon–Thu
  const iso = (d) => d.toISOString().slice(0, 10);
  const shift = (n) => new Date(Date.UTC(bogota.getFullYear(), bogota.getMonth(), bogota.getDate() - n));
  return { from: iso(shift(daysBack)), to: iso(shift(1)) };
}

const eventIs = (name) => ({ filter: { fieldName: 'eventName', stringFilter: { value: name } } });
const and = (...expressions) => ({ andGroup: { expressions } });

async function report(token, { from, to }, body) {
  const res = await fetch(DATA_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateRanges: [{ startDate: from, endDate: to }], ...body }),
  });
  const json = await res.json();
  if (!res.ok) fail(`GA4 report failed: ${json.error?.message ?? res.status}`);
  return (json.rows ?? []).map((r) => [...(r.dimensionValues ?? []).map((v) => v.value), ...r.metricValues.map((v) => Number(v.value))]);
}

const table = (rows, empty) => (rows.length ? rows.map((r) => `  - ${r.join(' · ')}`).join('\n') : `  (${empty})`);

async function main() {
  const key = loadKey();
  const token = await accessToken(key);
  const range = period();
  const [[visitors = 0, sessions = 0] = []] = await report(token, range, { metrics: [{ name: 'activeUsers' }, { name: 'sessions' }] });
  const leads = await report(token, range, {
    dimensions: [{ name: 'customEvent:location' }, { name: 'customEvent:method' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: eventIs('generate_lead'),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  });
  const products = await report(token, range, {
    dimensions: [{ name: 'itemId' }, { name: 'itemName' }],
    metrics: [{ name: 'itemsCheckedOut' }, { name: 'itemsAddedToCart' }],
    orderBys: [{ metric: { metricName: 'itemsCheckedOut' }, desc: true }],
    limit: 15,
  });
  const notFound = await report(token, range, {
    dimensions: [{ name: 'searchTerm' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: and(eventIs('search'), { filter: { fieldName: 'customEvent:results', stringFilter: { value: '0' } } }),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 20,
  });
  const [[exports = 0] = []] = await report(token, range, { metrics: [{ name: 'eventCount' }], dimensionFilter: eventIs('export_pdf') });

  const totalLeads = leads.reduce((n, r) => n + r[2], 0);
  console.log(`Resumen de www.cicdiagnostica.com: ${range.from} a ${range.to}
Solo cuenta visitantes que aceptaron cookies.

Visitantes: ${visitors} · Sesiones: ${sessions} · Contactos (WhatsApp y formulario): ${totalLeads} · PDF exportados: ${exports}

Contactos por botón (ubicación · canal · cantidad):
${table(leads.map(([loc, method, n]) => [loc || '(sin ubicación)', method || '?', n]), 'ninguno en el periodo')}

Productos más pedidos (código · producto · unidades pedidas · unidades agregadas):
${table(products.filter((r) => r[2] || r[3]), 'ninguna lista enviada en el periodo')}

Búsquedas sin resultados (lo que buscan y no encuentran · veces):
${table(notFound, 'ninguna en el periodo')}`);
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
