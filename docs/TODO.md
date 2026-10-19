# CIC Diagnóstica: project to-do list

Updated 2026-10-18. Live site: https://cic-diagnostica.vercel.app. Owners: **CIC** (company), **Dev**, **Lawyer**, **Accountant**.

## 1. Open pull requests

- [ ] **#12 Privacy:** the policy page `/politica-de-datos`, the consent banner, analytics and map gated behind consent, the email field removed from the form, and a consent record in each notification email. Ready for review. *(CIC: merge)*
- [ ] **#16 Code review:** simplification plus security hardening (CSP and security headers, API body cap, timeouts). Merge after #12 and #14. *(CIC: merge)*
- [ ] **#14 Open answers:** coverage beyond Valle del Cauca, "Despachos diarios", the "Llamar" link, and coverage towns as plain text. *(CIC: merge)*

## 2. Pending values

| Value | Where in the code | Owner | Notes |
|---|---|---|---|
| Razón social | `company.legalName` in `src/data/site.ts` | CIC | Hidden on the home page until set; shown as a placeholder in the policy |
| NIT (with check digit) | `company.nit` | CIC | Same as above |
| RNBD status | `privacy.rnbd` | Accountant | Registration is required only if total assets exceed 100,000 UVT (≈ COP 5,237 million in 2026) |
| Umami hosting region | `privacy.analyticsRegion` | CIC / Dev | Not needed if Umami is replaced by Vercel Analytics (see §5) |
| Google Maps business link | `Contact.astro` (map + "Cómo llegar") | CIC | Confirm the pin matches Carrera 13 # 4-51, Buga; otherwise send the Maps link |
| Testimonials (2–3, approved, with name, role and institution) | `testimonials` | CIC | The section stays hidden until there is at least one |

## 3. Open questions

- [ ] **WhatsApp catalog screenshot:** may we publish one on the page, and is the catalog kept up to date? *(CIC)*
- [ ] **Tracking provider:** after the move to Vercel Pro, replace Umami with Vercel Analytics custom events? Recommended: one fewer provider and one fewer policy entry. *(CIC → Dev)*
- [ ] **Email subject:** it includes the requester's name and institution (from the original brief). The privacy plan suggests removing personal data from subjects. *(Lawyer)*
- [ ] **Analytics behind consent:** legally optional for cookieless analytics in Colombia; kept by client decision. *(Lawyer to confirm)*
- [ ] **Questionnaire items still unanswered:** *(CIC)*
  - **3.8** Droguerías: anything to add besides rapid tests and biosafety?
  - **4.1** Reactivos de laboratorio: are the example lines right?
  - **4.7** Any product category missing?
  - **5.8** The real steps from the first contact to the first delivery.

## 4. Accounts, infrastructure and legal

- [ ] **Vercel environment variables** (Production): `RESEND_API_KEY`, `CONTACT_TO=supervisor@cicdiagnostica.com`, `CONTACT_FROM`. Then **send a real test from the production form.** *(CIC)*
- [ ] **Rate limit for the contact form** in Vercel → Project → Firewall: a rule for `POST /api/contact` allowing 5 requests per 60 s per IP, then deny. Also set a Resend usage alert. *(CIC)*
- [ ] **Upgrade Vercel to Pro.** The Hobby plan is for non-commercial use only, and the DPA covers only Pro and Enterprise. *(CIC)*
- [ ] **Umami account** and `PUBLIC_UMAMI_WEBSITE_ID` (Production only). Skip this if switching to Vercel custom events. *(CIC)*
- [ ] **Domain move** (DNS at VivaWebHost cPanel): *(CIC, with Dev support)*
  - [ ] Add `www.cicdiagnostica.com` in Vercel → create the `www` CNAME in the cPanel Zone Editor.
  - [ ] **Do not touch** the apex A record, MX, `mail` or SPF; email depends on them.
  - [ ] Set up a cPanel redirect `cicdiagnostica.com` → `https://www.cicdiagnostica.com` (301).
  - [ ] Set `SITE_URL=https://www.cicdiagnostica.com` in Vercel and redeploy.
  - [ ] **Resend:** add the domain, create its records (`send.`, `resend._domainkey`), verify, switch `CONTACT_FROM` to e.g. `web@cicdiagnostica.com`, and redeploy.
  - [ ] Test that supervisor@ still receives email, that the form works, and that the WhatsApp link preview appears.
- [ ] **RNBD check** (see §2). If registration is required, register each database on the SIC portal and update it every year before March 31. *(Accountant / CIC)*
- [ ] **Lawyer review** of `/politica-de-datos`, the consent checkbox text, and the email subject. *(Lawyer)*
- [ ] **Internal duties under Ley 1581:** *(CIC)*
  - a short internal procedure for consultas (10 business days) and reclamos (15 business days);
  - 2FA on the supervisor@ mailbox;
  - a periodic clean-up of old requests;
  - who in Gerencia answers data requests.

## 5. Images and assets (from the content audit)

Real photos only (no stock photos of people, labs or vans). Shoot by phone in daylight, landscape, with the logo and uniforms visible and no patients or client documents in frame. **Signed image consent from everyone shown (Ley 1581).** *(CIC)*

- [ ] **Hero:** a CIC Diagnóstica van with the logo, staff loading at the Buga office.
- [ ] **Productos:** 5 photos, one per category (reagents; tubes, needles and syringes; rapid tests; consumables; biosafety).
- [ ] **Contacto:** the office front with the sign visible.
- [ ] **Contratos:** a sales rep portrait, plus their name and role.
- [ ] **"Quiénes somos" strip:** team at the office, warehouse shelves, and a delivery at a client's door (with the client's permission).
- [ ] **Optional:** an SVG version of the logo (the PNG files work today).

## 6. Development backlog

- [ ] **Photo slots:** build them once the §5 assets arrive. Use `src/assets/` with Astro `<Picture>` (AVIF/WebP); hero ≤ 120 KB, others ≤ 60 KB. *(Dev)*
- [ ] **Coverage map:** an SVG map of Valle del Cauca with the route towns coloured by weekday; needs open-licence geodata. *(Dev)*
- [ ] **Contact form:** make it collapsible ("Prefiero enviar un formulario") to shorten the Contacto section. *(Dev)*
- [ ] **Tracking:** switch to Vercel Analytics custom events if approved (§3); `track()` in `src/lib/analytics.ts` is the only call site. *(Dev)*
- [ ] **After the domain move:** a sitemap and Google Search Console. *(Dev)*
- [ ] **Google Business Profile** with the same name, address, phone and hours as the site. *(CIC)*
- [ ] **Performance:** a Lighthouse pass on production after the photos are in (target LCP < 2.5 s on 4G). *(Dev)*
- [ ] **Re-run the content audit** (`.claude/agents/content-cro-auditor.md`) after the photos and the map. *(Dev)*

## 7. Known minor issues

- [ ] Lazy section rendering (`content-visibility`): a menu link tapped before scrolling can land up to ~80 px lower than usual the first time; the section heading stays visible. *(Dev; low priority)*

## Done recently (for reference)

- Questionnaire answers and the copy polish; official logos; brand palette; contact details (WhatsApp, email, address in Buga, hours including Saturday).
- Content audit quick wins: one button per section, shorter text, icon cards, a swipe row on phones, lazy-loaded map, a single plans button.
- **Decisions:**
  - deliveries also outside Valle del Cauca;
  - daily dispatches;
  - the WhatsApp number takes calls;
  - no email field in the form;
  - data is used for commercial purposes only;
  - requests are kept in Gerencia's mailbox, with no fixed retention period and deletion on request.
