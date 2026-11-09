import type { APIRoute } from 'astro';
import { payload } from '../../lib/catalog';

// Static file at build time (output: 'static'). The catalog page fetches it after first paint.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(payload()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
