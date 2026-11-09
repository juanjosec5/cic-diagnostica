import type { APIRoute } from 'astro';

import { routes } from '../data/site';
import { categoriaPath, categorias } from '../lib/catalog';

// Few pages don't justify @astrojs/sitemap. New pages go in `routes` (src/data/site.ts), which the links use too;
// catalog category pages come from the catalog data.
const paths = [...Object.values(routes), ...categorias.map((c) => categoriaPath(c.slug))];

export const GET: APIRoute = ({ site }) =>
  new Response(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>\n`).join('') +
      '</urlset>\n',
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
