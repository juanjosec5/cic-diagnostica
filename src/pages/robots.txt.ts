import type { APIRoute } from 'astro';

// Everything is crawlable except the form endpoint. The sitemap URL follows `site` (SITE_URL in production).
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nDisallow: /api/\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
