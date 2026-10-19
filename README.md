# CIC Diagnostica – landing page

One-page site for CIC Diagnostica, a medical and laboratory supplies distributor in Valle del Cauca. Its job is to turn visitors into WhatsApp conversations or contact-form emails.

- **Astro 7** static page + one serverless API route (`/api/contact`) on **Vercel** via `@astrojs/vercel`.
- **Resend** sends form submissions to the sales inbox. The API key only lives on the server.
- No UI framework, no client framework. Two tiny scripts: mobile menu and the contact form.

## Project structure

```
├── astro.config.mjs        # Vercel adapter, env var schema (astro:env)
├── .env.example            # RESEND_API_KEY, CONTACT_TO, CONTACT_FROM
├── public/                 # favicon, apple-touch-icon, og-image.png (1200×630), brand/ (logo files)
└── src/
    ├── data/site.ts        # ← ALL editable content: contact, WhatsApp, stats, plans, products, route, FAQ
    ├── lib/
    │   ├── whatsapp.ts     # waLink(intent) → https://wa.me/<number>?text=<message>
    │   └── contact.ts      # form validation shared by browser and API
    ├── layouts/Layout.astro# <head>: SEO, Open Graph, LocalBusiness JSON-LD
    ├── styles/global.css   # design tokens, buttons, base styles
    ├── components/         # one component per section
    └── pages/
        ├── index.astro     # assembles the sections
        └── api/contact.ts  # POST endpoint (prerender = false → Vercel function)
```

## Local development

```bash
npm install
cp .env.example .env      # optional; leave RESEND_API_KEY empty to mock sends
npm run dev               # http://localhost:4322 (4321 belongs to the CIC laboratorios site)
npm run check             # type check
npm run build             # production build (.vercel/output)
```

Without `RESEND_API_KEY`, `npm run dev` doesn't send email. It logs the message to the terminal (`npx astro dev logs`) and returns success, so you can test the whole flow. In production a missing key returns an error, and the visitor is told to write on WhatsApp or by email.

## Editing content

Everything is in `src/data/site.ts`:

| What | Where |
| --- | --- |
| WhatsApp number (digits only, with `57`) | `company.whatsapp` |
| Number as shown on the page | `company.whatsappDisplay` |
| Prefilled WhatsApp messages (quote, urgent, catalog, contract, one per client type…) | `whatsappMessages` |
| Email, address, hours, NIT, legal name, response time | `company` |
| Proof row under the hero (years, clients, municipalities, response time) | `stats` |
| Plan cards per client type, with their WhatsApp button | `clientPlans` |
| Product categories and example items | `productCategories` (icons: `flask droplet test box beaker shield`) |
| Delivery route: municipalities grouped by weekday (a day without fixed towns takes a `note`) | `routeDays` |
| Free-freight threshold (coverage note and FAQ) | `freeFreightFrom` |
| Supplier documents list | `supplierDocuments` |
| Testimonials (section hidden while empty) | `testimonials` |
| FAQ | `faqs` |
| Client-type and "me interesa" options of the form | `clientTypeOptions`, `interestOptions` |

**Numbers stay consistent by construction.** The municipality count shown in the proof row, coverage section and meta description is `municipalities.length`, which is derived from `routeDays`. The response time comes from `company.responseTime` in the proof row, contact section and success message. Change each value once in the data file and it updates everywhere. Only publish numbers and claims you can back up.

Icons live in `src/components/Icon.astro`. To add one, add an SVG path to the `paths` map.

## Contact form

`src/pages/api/contact.ts`:

- Accepts JSON (what the page sends) or a regular form post.
- Validates required fields (nombre, teléfono/WhatsApp, mensaje, consent) and phone length, and caps text lengths (message ≤ 3000 chars). It uses the same rules as the browser (`src/lib/contact.ts`).
- When "Contrato de suministro" is selected, the form shows two extra optional fields (NIT de la institución, consumo mensual aproximado). They are disabled while hidden, so they're only submitted and emailed for contract requests.
- The contracts and supplier-documents buttons scroll to the form with the matching "Me interesa" option preselected.
- Hidden honeypot field `website`: if it's filled, the endpoint answers `ok` and sends nothing.
- HTML-escapes every value into a table email. The subject is `[Web] Contrato de suministro: Nombre (Institución)`. The form has no email field (the company contacts requesters by phone or WhatsApp), so there is no `reply_to`.
- Returns `200 {ok:true}`, `400 {ok:false, errors:{field: message}}`, or `5xx`. On 5xx or a network error the page tells the visitor to use WhatsApp or email, and keeps what they typed.

### Environment variables

| Variable | Required | Example |
| --- | --- | --- |
| `RESEND_API_KEY` | yes (production) | `re_xxxxxxxx` |
| `CONTACT_TO` | yes (production) | `ventas@cicdiagnostica.com` (comma-separate several) |
| `CONTACT_FROM` | no | `CIC Diagnostica <web@cicdiagnostica.com>`. Default: `CIC Diagnostica <onboarding@resend.dev>` |
| `SITE_URL` | no | Canonical base URL, e.g. `https://www.cicdiagnostica.com`. Defaults to Vercel's production domain. |
| `PUBLIC_UMAMI_WEBSITE_ID` | no (Production only) | Umami website ID, see [Tracking](#tracking-umami) |

These are declared in `astro.config.mjs` as `context: 'server', access: 'secret'`, so Astro refuses to import them into client code.

> **Testing before the domain is verified:** `onboarding@resend.dev` works as `CONTACT_FROM` without any DNS setup, but Resend only delivers it to the email address of your own Resend account. Set `CONTACT_TO` to that address until the domain is verified.

## Privacy and consent

The data-protection work follows `docs/privacy-plan.md` (Ley 1581 de 2012; not legal advice).

- **`/politica-de-datos`** is the data-processing policy. Company facts come from `company` and `privacy` in `src/data/site.ts`. While any value is still a `[DATO: …]` placeholder, the page shows an "en revisión" notice. **A Colombian habeas-data lawyer must review it before launch.**
- **Consent banner** (`ConsentBanner.astro`, logic in `src/lib/consent.ts`):
  - "Aceptar" and "Rechazar" have the same weight.
  - The choice is stored in `localStorage` as `cic-consent` `{ v, analytics, ts }`. Bump `CONSENT_VERSION` to ask everyone again.
  - Any element with `data-consent-open` reopens the banner, e.g. the footer's "Preferencias de cookies".
- **Before consent and after "Rechazar":** no Vercel Analytics, no Umami and no Google Maps. The map shows a "Ver mapa" button that loads it for that visit only.
- **After "Aceptar":** Vercel Analytics (`inject()`), Umami and the map load automatically. Withdrawing consent reloads the page without them.
- **Contact form:**
  - The consent text links to the policy, and a hint asks people not to include patient data.
  - Each notification email ends with a **Registro de autorización** (consent text version `CONSENT_TEXT_VERSION`, policy version, Bogotá date and time). That email is the proof of consent, so keep it.



## Security

- **Headers** (`vercel.json`, applied by Vercel to every response): `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `Permissions-Policy`. Vercel adds HSTS itself.
  - The CSP allows `'self'`, Umami (`cloud.umami.is`, `gateway.umami.is`) and the Google Maps iframe (`www.google.com`).
  - It allows `'unsafe-inline'` scripts and styles, because Astro inlines small component scripts and styles. The site renders no user content.
  - **When you add a new third-party script or iframe, add its origin to the CSP**, otherwise the browser blocks it.
- **Contact API** (`src/pages/api/contact.ts`):
  - rejects bodies over 16 KB with a 413;
  - accepts only the listed select values;
  - times out the Resend call after 8 s (504), and the browser gives up after 15 s; both show the WhatsApp/email fallback;
  - drops honeypot submissions;
  - escapes all HTML in the email.
- **Rate limiting (do this in Vercel):**
  - Go to **Project → Firewall → Configure → New Rule**: *If* Request Path *equals* `/api/contact` *and* Method *equals* `POST`, *then* **Rate Limit** 5 requests per 60 s per IP → **Deny** (Log first if unsure).
  - Also turn on a usage alert in Resend.
- **`npm audit`:** it reports `path-to-regexp` (GHSA-9wv6-86v2-598j) through `@astrojs/vercel` → `@vercel/routing-utils`.
  - That code runs only during `astro build` on our own route patterns. It is not in the deployed function, so it is **not exploitable**.
  - **Don't run `npm audit fix --force`**: it downgrades the adapter to 8.x, which is incompatible with Astro 7.
  - Update `@astrojs/vercel` when a fixed version ships.

## Tracking (Umami)

Clicks and form outcomes go to [Umami Cloud](https://cloud.umami.is), which is cookieless. The script loads only when `PUBLIC_UMAMI_WEBSITE_ID` is set **and** the visitor tapped "Aceptar" in the consent banner (see *Privacy and consent*).

**Setup:** sign up at <https://cloud.umami.is>, go to **Websites → Add website** (domain `cicdiagnostica.com`), and copy the *Website ID*. In Vercel, add `PUBLIC_UMAMI_WEBSITE_ID` for **Production only**, so preview and dev visits aren't counted, then redeploy. It's a public value: it ends up in the page source by design.

Tracking is centralized, so components don't need per-element tags:

- `src/components/Tracking.astro` loads the script and runs one delegated click listener that classifies every link.
- `src/lib/analytics.ts` exposes `track()`, which does nothing when Umami isn't loaded. The contact form uses it.

| Event | When | Data |
| --- | --- | --- |
| `whatsapp_click` | Any WhatsApp link | `intent` (key from `whatsappMessages`: quote, urgent, contract, outsideRoute, general…), `section`, `label` |
| `cta_click` | In-page button/link outside the nav (e.g. "Enviar una solicitud", contract, catalog, documents) | `target`, `section`, `label`, `interest` (preselected form option) |
| `nav_click` | Header menu link | `target`, `label` |
| `email_click` | Any `mailto:` link | `section` |
| `call_click` | Any `tel:` link ("Llamar" in Contacto) | `section` |
| `internal_click` | Link to another page of the site (e.g. `/politica-de-datos`) | `url`, `section` |
| `outbound_click` | Any other external link | `url`, `section` |
| `faq_open` | FAQ question expanded | `question` |
| `form_submit` | Form sent successfully | `interest`, `client_type` |
| `form_invalid` | Validation errors | `fields`, `source` (client/server) |
| `form_failed` | Send failed | `interest`, `client_type`, `reason` (HTTP status or `network`) |

`section` is the id of the page section (`inicio`, `planes`, `productos`, `contratos`, `cobertura`, `contacto`…), or `header`, `footer` or `floating` for the floating button. In Umami, open **Events** and filter by these properties. For example, `whatsapp_click` by `intent` shows which offers start conversations. A WhatsApp click means the chat was opened, not that a message was sent.

## Deploy (step by step)

1. **Resend account**: sign up at <https://resend.com> using the inbox that should receive leads. Go to **API Keys → Create API key** (permission: *Sending access*) and copy the `re_…` key.
2. **GitHub**: the code is already at `github.com/juanjosec5/cic-diagnostica` (`main`).
3. **Vercel account**: sign up at <https://vercel.com> with your GitHub account (Hobby/free plan).
4. **Import**: **Add New… → Project → Import** `cic-diagnostica`. Vercel detects Astro, so keep the defaults (build `npm run build`).
5. **Environment variables**: before clicking Deploy (or later in **Settings → Environment Variables**), add `RESEND_API_KEY`, `CONTACT_TO` and `CONTACT_FROM` for *Production* and *Preview*. Then **Deploy**.
6. **Test**: open the `*.vercel.app` URL, submit the form, and check the inbox. Function logs are in **Vercel → Project → Logs**.
7. **Custom domain** (optional): **Vercel → Settings → Domains → Add** `cicdiagnostica.com` and `www.cicdiagnostica.com`, then create the DNS records Vercel shows at your registrar. The canonical and Open Graph URLs follow automatically: they come from Vercel's production domain (`VERCEL_PROJECT_PRODUCTION_URL`). If both the apex and `www` are attached, Vercel picks the shorter one, so set `SITE_URL=https://www.cicdiagnostica.com` (or whichever domain is primary) in Vercel to pin it.
8. **Verify your domain in Resend**: **Resend → Domains → Add domain** (`cicdiagnostica.com`, or a subdomain like `mail.cicdiagnostica.com`). Add the DNS records Resend lists (SPF/MX `TXT`+`MX` on `send.`, DKIM `TXT` on `resend._domainkey`, optional DMARC) at your registrar and click **Verify**. Once it shows *Verified*:
   - set `CONTACT_FROM` to e.g. `CIC Diagnostica <web@cicdiagnostica.com>`
   - set `CONTACT_TO` to the real sales inbox(es)
   - **Deployments → … → Redeploy** so the new values take effect.

Every push to `main` deploys to production. Other branches get preview URLs.

## Brand assets

Originals in `public/brand/`, named by what they show:

| File | Shows | Used in |
| --- | --- | --- |
| `logo-horizontal-color.png` | Horizontal: blue drops + navy wordmark | Source for the header logo |
| `logo-horizontal-color-sm.png` | Same, 96 px tall, without the "~ CIC" text | Header, from 640 px up |
| `logo-symbol.png` | Drops only, cropped from the horizontal logo | Header on phones |
| `logo-horizontal-on-dark.png` / `-sm.png` | Horizontal: blue drops + white wordmark (`-sm` without "~ CIC") | Footer (navy background) |
| `logo-stacked-color.png` / `-sm.png` | Stacked: drops over navy wordmark (`-sm`: 480 px tall, without "~ CIC") | JSON-LD `logo`, OG image |
| `logo-stacked-on-dark.png` | Stacked: blue drops + white wordmark | Not used yet (dark backgrounds) |
| `logo-horizontal-white.png`, `logo-stacked-white.png` | All-white versions | Not used yet (photos, dark backgrounds) |
| `logo-seal.png` | Round seal with curved wordmark | Not used yet (stamps, stickers) |

`public/favicon.ico` (16, 32 and 48 px), `public/favicon.png` and `public/apple-touch-icon.png` are the drops on a navy circle. The `-sm` files, the symbol and the icons are generated from the originals (the site doesn't show the "~ CIC" text, so it is erased in those copies); the originals are kept untouched. Regenerate the copies if the originals change.

## Placeholders to replace

All in `src/data/site.ts` unless noted. `company.legalName` and `company.nit` are hidden (footer and JSON-LD) while they hold a `[bracketed]` placeholder; see `isPlaceholder`.

- [ ] `company.nit`: `[NIT 000.000.000-0]`
- [ ] `company.legalName`: `CIC Diagnóstica S.A.S. [RAZÓN SOCIAL]`
- [ ] `testimonials`: add 2–3 approved quotes to show the section
- [ ] Consent text in `src/components/ContactForm.astro` mentions a "política de tratamiento de datos". Publish that policy (required by Ley 1581) and link it there.
- [ ] `public/og-image.png`: social preview image; replace with a branded one if you have a logo. It's a static image, so keep any numbers out of it.
- [ ] **SVG logo** (optional): the logos are PNG today. When SVGs arrive, swap the files listed under *Brand assets* and keep the same names.
