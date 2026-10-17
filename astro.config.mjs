// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// Base URL for canonical, Open Graph and JSON-LD links. SITE_URL wins when set; otherwise Vercel's
// production domain, which is the *.vercel.app URL until a custom domain is added and then that
// domain, with no code change.
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (vercelDomain ? `https://${vercelDomain}` : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
  site,
  // Every page is prerendered except routes that opt out (src/pages/api/contact.ts).
  output: 'static',
  adapter: vercel(),
  // Astro 7 defaults to 'jsx' whitespace collapsing, which can drop spaces
  // between inline elements; keep the v5/v6 behavior.
  compressHTML: true,
  env: {
    schema: {
      // Server-only secrets: never bundled into client code.
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM: envField.string({
        context: 'server',
        access: 'secret',
        default: 'CIC Diagnostica <onboarding@resend.dev>',
      }),
      // Public by design: Umami website IDs are visible in the page source anyway.
      // Set it only for Production in Vercel so dev and preview visits aren't counted.
      PUBLIC_UMAMI_WEBSITE_ID: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
