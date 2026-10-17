// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Keep in sync with company.url in src/data/site.ts.
  site: 'https://www.cicdiagnostica.com',
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
