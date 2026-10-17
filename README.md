# CIC Diagnostica – landing page

One-page site for CIC Diagnostica, a medical and laboratory supplies distributor in Valle del Cauca. Its job is to turn visitors into WhatsApp conversations or contact-form emails.

- **Astro 7** static page + one serverless API route (`/api/contact`) on **Vercel** via `@astrojs/vercel`.
- **Resend** sends form submissions to the sales inbox. The API key only lives on the server.
- No UI framework, no client framework. Two tiny scripts: mobile menu and the contact form.

## Project structure

```
├── astro.config.mjs        # Vercel adapter, env var schema (astro:env)
├── .env.example            # RESEND_API_KEY, CONTACT_TO, CONTACT_FROM
├── public/                 # favicon.svg, og-image.png (1200×630 social preview)
└── src/
    ├── data/site.ts        # ← ALL editable content: contact, WhatsApp, products, municipalities, FAQ
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
npm run dev               # http://localhost:4321 (Astro picks the next free port if busy)
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
| Prefilled WhatsApp messages | `whatsappMessages` |
| Email, address, hours, NIT, legal name | `company` |
| Product categories and example items | `productCategories` (icons: `flask droplet test box beaker shield`) |
| Delivery municipalities | `municipalities` (the heading count updates automatically) |
| FAQ | `faqs` |
| Client-type and "me interesa" options of the form | `clientTypeOptions`, `interestOptions` |

Icons live in `src/components/Icon.astro`. To add one, add an SVG path to the `paths` map.

## Contact form

`src/pages/api/contact.ts`:

- Accepts JSON (what the page sends) or a regular form post.
- Validates required fields, email format and phone length, and caps text lengths (message ≤ 3000 chars). It uses the same rules as the browser (`src/lib/contact.ts`).
- Hidden honeypot field `website`: if it's filled, the endpoint answers `ok` and sends nothing.
- HTML-escapes every value into a table email. The subject is `[Web] Contrato de suministro: Nombre (Institución)` and `reply_to` is the client's email, so you can just hit "Responder".
- Returns `200 {ok:true}`, `400 {ok:false, errors:{field: message}}`, or `5xx`. On 5xx or a network error the page tells the visitor to use WhatsApp or email, and keeps what they typed.

### Environment variables

| Variable | Required | Example |
| --- | --- | --- |
| `RESEND_API_KEY` | yes (production) | `re_xxxxxxxx` |
| `CONTACT_TO` | yes (production) | `ventas@cicdiagnostica.com` (comma-separate several) |
| `CONTACT_FROM` | no | `CIC Diagnostica <web@cicdiagnostica.com>`. Default: `CIC Diagnostica <onboarding@resend.dev>` |

These are declared in `astro.config.mjs` as `context: 'server', access: 'secret'`, so Astro refuses to import them into client code.

> **Testing before the domain is verified:** `onboarding@resend.dev` works as `CONTACT_FROM` without any DNS setup, but Resend only delivers it to the email address of your own Resend account. Set `CONTACT_TO` to that address until the domain is verified.

## Deploy (step by step)

1. **Resend account**: sign up at <https://resend.com> using the inbox that should receive leads. Go to **API Keys → Create API key** (permission: *Sending access*) and copy the `re_…` key.
2. **Push to GitHub**: the repo is `github.com/juanjosec5/cic-diagnostica`.
   ```bash
   git push -u origin main
   ```
3. **Vercel account**: sign up at <https://vercel.com> with your GitHub account (Hobby/free plan).
4. **Import**: **Add New… → Project → Import** `cic-diagnostica`. Vercel detects Astro, so keep the defaults (build `npm run build`).
5. **Environment variables**: before clicking Deploy (or later in **Settings → Environment Variables**), add `RESEND_API_KEY`, `CONTACT_TO` and `CONTACT_FROM` for *Production* and *Preview*. Then **Deploy**.
6. **Test**: open the `*.vercel.app` URL, submit the form, and check the inbox. Function logs are in **Vercel → Project → Logs**.
7. **Custom domain** (optional): **Vercel → Settings → Domains → Add** `cicdiagnostica.com` and `www.cicdiagnostica.com`, then create the DNS records Vercel shows at your registrar. Update `site` in `astro.config.mjs` and `company.url` in `src/data/site.ts`.
8. **Verify your domain in Resend**: **Resend → Domains → Add domain** (`cicdiagnostica.com`, or a subdomain like `mail.cicdiagnostica.com`). Add the DNS records Resend lists (SPF/MX `TXT`+`MX` on `send.`, DKIM `TXT` on `resend._domainkey`, optional DMARC) at your registrar and click **Verify**. Once it shows *Verified*:
   - set `CONTACT_FROM` to e.g. `CIC Diagnostica <web@cicdiagnostica.com>`
   - set `CONTACT_TO` to the real sales inbox(es)
   - **Deployments → … → Redeploy** so the new values take effect.

Every push to `main` deploys to production. Other branches get preview URLs.

## Placeholders to replace

All in `src/data/site.ts` unless noted. Values in `[brackets]` show up on the page as-is until you replace them.

- [ ] `company.whatsapp`: real number, digits only (currently `570000000000`)
- [ ] `company.whatsappDisplay`: `+57 [300 000 0000]`
- [ ] `company.email`: `[ventas@cicdiagnostica.com]`
- [ ] `company.address`: `[Calle 00 # 00-00, Cali, Valle del Cauca]` (also check `company.city`)
- [ ] `company.hours`: `[7:00 a.m. – 5:00 p.m.]`, `[8:00 a.m. – 12:00 m.]`
- [ ] `company.nit`: `[NIT 000.000.000-0]`
- [ ] `company.legalName`: `CIC Diagnostica S.A.S. [RAZÓN SOCIAL]`
- [ ] `company.url` **and** `site` in `astro.config.mjs`: `https://www.cicdiagnostica.com`
- [ ] `municipalities`: the real 16 municipalities (current list is an example)
- [ ] `productCategories`: real categories and example items
- [ ] `faqs`: minimum order `[Definir pedido mínimo]` and delivery time `[1 a 3 días hábiles]`
- [ ] Consent text in `src/components/ContactForm.astro` mentions a "política de tratamiento de datos". Publish that policy (required by Ley 1581) and link it there.
- [ ] `public/og-image.png`: social preview image; replace with a branded one if you have a logo
- [ ] `public/favicon.svg`: replace with the real logo
