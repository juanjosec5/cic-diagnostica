import type { APIRoute } from 'astro';

// Two pages don't justify @astrojs/sitemap. Add new pages here, with the trailing slash: pages are built as
// folders, so that's the form their canonical URL uses (see Layout.astro).
const paths = ['/', '/politica-de-datos/'];

export const GET: APIRoute = ({ site }) =>
  new Response(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>\n`).join('') +
      '</urlset>\n',
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
