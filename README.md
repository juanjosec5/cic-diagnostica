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
    ├── data/site.ts        # ← ALL editable content: contact, WhatsApp, stats, plans, products, coverage, FAQ
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
| "Lo más pedido" top 5 (review monthly: items and photos in `public/products/`) | `bestSellers` |
| Product categories and example items | `productCategories` (icons: `flask droplet test box beaker shield`) |
| Direct-delivery municipalities, grouped by subregion (from ciclaboratorios.com/sedes) | `deliveryZones` |
| Free-freight threshold (coverage note and FAQ) | `freeFreightFrom` |
| Supplier documents list | `supplierDocuments` |
| Testimonials (section hidden while empty) | `testimonials` |
| FAQ | `faqs` |
| Client-type and "me interesa" options of the form | `clientTypeOptions`, `interestOptions` |

**Numbers stay consistent by construction.** The municipality count shown in the proof row and the coverage section is `municipalities.length`, which is derived from `deliveryZones`. The response time comes from `company.responseTime` in the proof row, contact section and success message. Change each value once in the data file and it updates everywhere. Only publish numbers and claims you can back up.

Icons live in `src/components/Icon.astro`. To add one, add an SVG path to the `paths` map.

## Product catalog data

`src/data/catalog.json` is generated from the sales team's product export. Don't edit it by hand. Refresh it every 1–2 weeks:

1. Save the export in `data/raw/`. That folder is gitignored because the export holds prices, suppliers and stock. Prefer the `.xlsx` (sheet `Listado por segmento`). A CSV works if it's UTF-8, but exports can lose data: a Numbers export cut off a product name, and non-UTF-8 CSVs garble accents and drop leading zeros from codes. If you use a CSV, check the change report for unexpected "renamed" products.
2. Run `npm run catalog`. It rewrites the JSON and prints what changed: products added, removed, reclassified, or whose stock status changed. Add `-- --sample` to also write `data/raw/revision-clasificacion.csv`, a spread sample for the sales team to check the classification.
3. Open a PR with the JSON, check the Vercel preview, then merge.

The pages are `/catalogo/` (search, filters, quote list) and one static page per categoría (`/catalogo/<slug>/`, also in the sitemap). Code: `src/components/Catalog.astro` (UI), `src/lib/catalog-search.ts` (search, synonyms, WhatsApp message; tested in `scripts/catalog/search.test.mjs`), `src/lib/catalog.ts` (build-time data). The browser downloads `/catalogo/productos.json`, which is generated from the same data. If a product is written with an abbreviation people don't search for, add it to `EXPANSIONS` in `catalog-search.ts`.

What gets published: code, name, categoría, segmento, and an "out of stock" flag (`bajoPedido`). Price (`Bv`), supplier (`Familia`) and stock quantities never leave the script. The import stops without writing anything if a code is duplicated, a required field is empty, or a categoría/segmento isn't in `scripts/catalog/taxonomy.mjs`. That list is the guard against typos creating new filters. To add a real new category, add it there. Tests: `npm test`.

### CIC product codes

The catalog uses CIC's own codes, assigned in the inventory system (Quality Manager). Format: `CD` + categoría number (3 digits) + product number (4 digits) + check digit. 10 characters, e.g. `CD10000016` (Agujas, product 1). Code: `scripts/catalog/codes.mjs`.
- **Categoría numbers:** `CATEGORIA_NUM` in `scripts/catalog/taxonomy.mjs`. They're frozen: never change or reuse a number. A new categoría gets the next free number, and a test fails until it has one.
- **Codes are permanent:** a product keeps its code when it's reclassified. The digits mean "categoría when created".
- **IVA isn't in the code:** it's a field in the inventory system (`pendiente / excluido / exento / 5 / 19`), so a rate change never changes a code.
- **Check digit:** Luhn (mod 10). It catches a mistyped digit and most swapped neighbours.
- **Code register:** `npm run codes:assign` writes `data/raw/codigos-cic.csv` (gitignored, it has suppliers). It records which code belongs to which product. Products go into Quality Manager by hand, one at a time, the first time a client asks for them, using the code from the register or the website. Nobody imports 5,000 items. Sources: the sales export plus CIC's own list (`data/raw/cic/lista-julio.xlsx`). Each row has the CIC code, supplier code, supplier, name, categoría, segmento and IVA.
  - When a product is in both sources, the CIC list wins. Likely pairs are flagged in "Posible duplicado (revisar)": confirm each one and drop the export row in Quality Manager. Names alone can't prove a duplicate, so the flag is only a hint.
  - CIC list products are classified by `CIC_LIST_RULES` in `scripts/catalog/assign.mjs`. A name no rule matches stops the script.
  - Re-running keeps every code already assigned and numbers only new products. Codes published in `src/data/catalog.json` count as assigned too, so losing the CSV can't reassign them. If the two disagree, the script stops. Back up the CSV anyway: it's the only place that holds the codes of CIC list products not yet on the website. A built-in checker verifies that each code is valid, unique and in its categoría's range.
- **On the website:** when `data/raw/codigos-cic.csv` exists, `npm run catalog` publishes the CIC code as `cod`, and the supplier code as `antes`. The import stops if a product has no CIC code or an invalid one.
  - `antes` is never shown, but it keeps old codes working during the transition: search finds a product by its old code, and quote lists saved in browsers before the switch swap to the new codes on load (`upgradeList`).
  - Search finds a CIC code with or without `CD`, from 5 digits on ("1000" stays a quantity).
  - GA4: `item_id` changed from supplier to CIC codes on the switch date, so compare product reports before and after it with that in mind.

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

These are declared in `astro.config.mjs` as `context: 'server', access: 'secret'`, so Astro refuses to import them into client code.

> **Testing before the domain is verified:** `onboarding@resend.dev` works as `CONTACT_FROM` without any DNS setup, but Resend only delivers it to the email address of your own Resend account. Set `CONTACT_TO` to that address until the domain is verified.

## Analytics (Google Analytics 4)

- **Property:** `analytics.measurementId` in `src/data/site.ts`. GA4 loads only after "Aceptar" and only on `analytics.host` (`www.cicdiagnostica.com`), so Vercel previews and local development send nothing.
- **No ads features:** Google signals and ad personalization are off. Cookies last `analytics.retentionMonths` (14), as the policy says; the property's data retention must match (GA4 Admin). Withdrawing consent deletes the `_ga` cookies.
- **GA4 setting this site needs:** Admin → Data streams → web stream → Enhanced measurement → Page views → *Show advanced settings* → turn **off** "Page changes based on browser history events". The catalog updates its URL while filtering; with this on, every keystroke counts as a page view. The CSP in `vercel.json` allows only `googletagmanager.com` and `google-analytics.com`.
- **Events** (`track()` in `src/lib/track.ts`; it does nothing until GA4 has loaded):

| Event | When | Parameters |
| --- | --- | --- |
| `generate_lead` (key event) | Any WhatsApp button, a catalog list sent, or the contact form sent | `method` (`whatsapp` / `formulario`), `location` (`data-track` on the link, else the section id, else `footer`; `otro` means a link outside all of these: `inicio`, `header-cotizar`, `boton-flotante`, `barra-urgente`, `catalogo-barra`, `catalogo-lista`, `catalogo-sin-resultados`, `formulario-urgente`, `formulario-error`, `contacto`…), `products` and `units` for the catalog (the same list sent twice counts once), `interest` for the form |
| `begin_checkout` | A catalog list sent to WhatsApp | `items`: code, name, categoría and quantity of each product (feeds GA4's item reports: most requested products) |
| `add_to_cart` | "Agregar" in the catalog | `items` (one product, quantity 1) |
| `search` | A catalog search, 1.5 s after typing stops (3+ characters) | `search_term`, `results` across the whole catalog, ignoring filters (0 = something we don't carry, or name differently) |
| `export_pdf` | The catalog's PDF download | `products` |

To track a new WhatsApp button under its own name, add `data-track="nombre"` to the link.

**Summary report:** `npm run ga:report` prints (in English, as the owner asked) leads by button, most requested products and searches without results, for the period since the previous report day (Monday → from Friday, Friday → from Monday). It reads GA4 with a service account that has Viewer access to the property (`analytics.propertyId`). The credentials come from `GA_KEY` (a path to the key file), or `GA_SA_KEY_B64` / `GA_SA_KEY_JSON` in cloud environments. Never commit the key. A scheduled Claude routine runs it every Monday and Friday at 8:00 (Bogotá) and emails the summary.

## Privacy and consent

Data protection follows Ley 1581 de 2012 (this is not legal advice).

- **`/politica-de-datos`** is the data-processing policy. Company facts come from `company` and `privacy` in `src/data/site.ts`. While any value is still a `[DATO: …]` placeholder, the page shows an "en revisión" notice. **A Colombian habeas-data lawyer must review it before launch.**
- **`/robots.txt`** and **`/sitemap.xml`** are generated by `src/pages/robots.txt.ts` and `src/pages/sitemap.xml.ts`, using `site` (so `SITE_URL` in production). Add every new page to the sitemap's `paths`, with a trailing slash to match its canonical URL.
- **Consent banner** (`ConsentBanner.astro`, logic in `src/lib/consent.ts`):
  - "Aceptar" and "Rechazar" have the same weight.
  - The choice is stored in `localStorage` as `cic-consent` `{ v, analytics, ts }`. Bump `CONSENT_VERSION` to ask everyone again.
  - Any element with `data-consent-open` reopens the banner, e.g. the footer's "Preferencias de cookies".
- **Before consent and after "Rechazar":** no Google Analytics and no Google Maps. The map shows a "Ver mapa" button that loads it for that visit only.
- **After "Aceptar":** Google Analytics (`Analytics.astro`) and the map load automatically. Withdrawing consent reloads the page without them.
- **Contact form:**
  - The consent text links to the policy, and a hint asks people not to include patient data.
  - Each notification email ends with a **Registro de autorización** (consent text version `CONSENT_TEXT_VERSION`, policy version, Bogotá date and time). That email is the proof of consent, so keep it.



## Security

- **Headers** (`vercel.json`, applied by Vercel to every response): `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `Permissions-Policy`. Vercel adds HSTS itself.
  - The CSP allows `'self'` and the Google Maps iframe (`www.google.com`).
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
| `logo-horizontal-color-sm.png` | Same, 96 px tall, without the "~ CIC" text | Source of the `.webp` copy used in the header (from 640 px up) and on the policy page |
| `logo-symbol.png` | Drops only, cropped from the horizontal logo | Source of the `.webp` copy used in the header on phones |
| `logo-horizontal-on-dark.png` / `-sm.png` | Horizontal: blue drops + white wordmark (`-sm` without "~ CIC") | Footer (navy background) |
| `logo-stacked-color.png` / `-sm.png` | Stacked: drops over navy wordmark (`-sm`: 480 px tall, without "~ CIC") | JSON-LD `logo`, OG image |
| `logo-stacked-on-dark.png` | Stacked: blue drops + white wordmark | Not used yet (dark backgrounds) |
| `logo-horizontal-white.png`, `logo-stacked-white.png` | All-white versions | Not used yet (photos, dark backgrounds) |
| `logo-seal.png` | Round seal with curved wordmark | Not used yet (stamps, stickers) |

`public/favicon.ico` (16, 32 and 48 px), `public/favicon.png` and `public/apple-touch-icon.png` are the drops on a navy circle. The `-sm` files, the symbol and the icons are generated from the originals (the site doesn't show the "~ CIC" text, so it is erased in those copies); the originals are kept untouched. Regenerate the copies if the originals change.

## Placeholders to replace

All in `src/data/site.ts` unless noted. `company.legalName` (footer, JSON-LD) and `company.nit` (JSON-LD, data policy; never the footer) are hidden while they hold a `[bracketed]` placeholder; see `isPlaceholder`.

- [ ] `testimonials`: add 2–3 approved quotes to show the section
- [ ] **SVG logo** (optional): the logos are PNG today. When SVGs arrive, swap the files listed under *Brand assets* and keep the same names.
