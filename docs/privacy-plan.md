# Privacy, data-protection and cookies plan

Status: **planning draft** (2026-10-17). It is a regulatory research summary plus an implementation plan for this repo. **It is not legal advice.** A Colombian habeas-data lawyer should review the final policy, the consent texts and the open questions before `cicdiagnostica.com` goes live.

## 0. Key conclusions

1. **The contact form is the main legal exposure, not the analytics.**
   - Ley 1581 requires prior, express and informed *autorización*, a published *política de tratamiento*, proof of the autorización, and a channel for consultas and reclamos.
   - The form's checkbox already points to a policy page that does not exist yet. That is the most urgent gap.
2. **Colombia has no cookie-specific law.**
   - Cookies matter only when they collect personal data. The SIC has applied Ley 1581 that way (Google 2020; Plural Comunicaciones / Canal 1 2022).
   - Putting cookieless analytics behind consent is **good practice, not a clear legal requirement**. The client chose to do it anyway.
   - The localStorage entry that stores the consent choice itself needs no consent.
   - The **Google Maps embed** does set Google cookies and sends the visitor's IP to Google, so it should only load after an explicit action. PR #11 already makes it click-to-load.
3. **The RNBD (Registro Nacional de Bases de Datos) applies only if the company has total assets above 100,000 UVT.**
   - That is about COP 5,237 million in 2026 (UVT COP 52,374).
   - Companies below the threshold don't register but must still meet every other duty.
4. **Vercel, Resend and Umami are *encargados* (processors) in the US.** This is an international *transmisión*.
   - It needs no extra consent if a processing contract (DPA) is in place.
   - The US is on the SIC adequate-country list (Circular Externa 005 de 2017).
   - **Vercel's DPA covers only the Pro and Enterprise plans**, and the Hobby plan is for non-commercial use only. A business site should run on Pro.
5. **No sensitive data by design.** The free-text "mensaje" field could still receive patient or health data, so add a hint asking people not to include it.

## 1. Implementation plan for this repo

### Phase A: can be built now, with placeholders for company facts

1. **`/politica-de-datos` page** (`src/pages/politica-de-datos.astro`), following the outline in §6.
   - Company facts come from `src/data/site.ts`.
   - Missing facts appear as `[DATO]`, and the page is flagged in the README as needing legal review before launch.
2. **Consent banner** (`src/components/ConsentBanner.astro`).
   - A bottom bar with **Aceptar** and **Rechazar** of equal weight, a link to `/politica-de-datos#cookies`, and no "X" that counts as acceptance.
   - The choice is stored in `localStorage` as `cic-consent`, e.g. `{ v: 1, analytics: 'granted' | 'denied', ts }`, with every read and write in try/catch. Increasing `v` asks visitors again.
3. **Gate analytics on consent:**
   - **Vercel:** remove `<Analytics />` from `Layout.astro` and call `inject()` from `@vercel/analytics` only after "Aceptar".
   - **Umami:** `Tracking.astro` stops rendering the script tag. It keeps the website ID in a `data-` attribute and appends the script after consent.
   - `track()` already does nothing while Umami is absent. Clicks made before consent are **not** queued and replayed.
   - On "Rechazar", or a later withdrawal, nothing loads; on withdrawal, reload the page so the scripts are gone.
4. **"Preferencias de cookies" link** in the footer and on the policy page, which reopens the banner.
5. **Form** (`ContactForm.astro`, `src/lib/contact.ts`, `src/pages/api/contact.ts`):
   - Link the consent text to `/politica-de-datos`. Its final wording comes from the lawyer; the elements it needs are in §7.
   - Add a hint under "Mensaje": no patient or health data.
   - Add a short notice under the submit button: responsable, purpose, rights, and the policy link.
   - Add a "Registro de autorización" block to the notification email: yes/no, text version, policy version, date and time (America/Bogota), and source. This is the proof required by Decreto 1377 Art. 8.
   - Remove personal data from the email subject line.
   - Confirm the function never logs the form body, and that no form data reaches Umami or Vercel events.
6. **Maps:** the click-to-load embed is in PR #11. Update its note to mention the IP sent to Google and link to the policy.
   - Optional: replace it with a static map image plus "Abrir en Google Maps", so Google never loads at all.

### Phase B: needs the client or a lawyer

- Razón social, NIT, legal form, the person or area that handles data requests, and a dedicated email for them (e.g. `datos@cicdiagnostica.com`).
- RNBD check against the asset threshold, with the accountant.
- Vercel plan: move to **Pro**, which is also a commercial-use requirement.
- Umami Cloud: hosting region and DPA, or self-host Umami, or drop it.
- Retention periods. Proposed: 24 months for leads that don't become clients; 10 years for commercial records once a relationship exists (Ley 962 de 2005, Art. 28).
- Marketing: will CIC send promotions? If yes, add a separate, optional checkbox, and follow Ley 2300 de 2023 on authorized channels and hours.
- Lawyer review of the policy, the consent text, and whether to keep analytics gated.

## 2. Obligations

| # | Requirement | Legal source | Applies here? | What to implement |
|---|---|---|---|---|
| 1 | Prior, express, informed autorización; silence is never consent | Ley 1581 Arts. 3(a), 9; Decreto 1377 Arts. 5, 7 | **Yes** (form) | Required, unticked checkbox; specific purposes and rights; link to the policy |
| 2 | Duty to inform at collection: purpose, rights, responsable's identity and contact | Ley 1581 Art. 12 | **Yes** | Short notice by the form plus the policy link |
| 3 | Keep proof of the autorización | Ley 1581 Arts. 12 par., 17(b); Decreto 1377 Art. 8 | **Yes** | Consent record in the notification email; versioned texts |
| 4 | Política de tratamiento with the mandatory content | Decreto 1377 Art. 13 | **Yes** | `/politica-de-datos` (§6) |
| 5 | Aviso de privacidad (needed only when the policy isn't available) | Decreto 1377 Arts. 14–15 | Not strictly; recommended | 2–3 lines under the form |
| 6 | Keep a copy of the aviso or policy in use | Decreto 1377 Art. 16 | **Yes** | Version and date on the page; git history |
| 7 | Person or area that handles data requests | Decreto 1377 Art. 23 | **Yes** | Named in the policy [DATO] |
| 8 | Consultas answered in 10 business days (+5) | Ley 1581 Art. 14 | **Yes** | Policy procedure plus an internal process |
| 9 | Reclamos answered in 15 business days (+8), plus the related deadlines | Ley 1581 Art. 15 | **Yes** | Same as #8 |
| 10 | Internal manual of procedures | Ley 1581 Art. 17(k) | **Yes** (internal) | Short internal document |
| 11 | Security; report incidents to the SIC | Ley 1581 Art. 17(d), (n) | **Yes** | No form data in logs; 2FA on the mailbox; secrets only in env vars |
| 12 | Data minimisation | Decreto 1377 Art. 4; SIC 2019 e-commerce guide | **Yes** | Contract fields shown only for contracts (already done) |
| 13 | Keep data only as long as necessary | Decreto 1377 Art. 11 | **Yes** | Retention rule plus mailbox clean-up |
| 14 | Processing contract with each encargado | Decreto 1377 Arts. 24.2, 25 | **Yes** | DPAs: Vercel (Pro), Resend (in its Terms), Umami [check], email provider [check] |
| 15 | International transfers only to adequate countries | Ley 1581 Art. 26; Circular Externa 005/2017; CE 003/2025 (optional model clauses) | **Yes** (US) | Name the providers and the country in the policy |
| 16 | RNBD registration | Ley 1581 Art. 25; DUR 1074 Art. 2.2.2.26.1.2 (Decreto 090/2018) | Only above 100,000 UVT in assets | Accountant to check |
| 17 | Sensitive data (health) | Ley 1581 Arts. 5–6 | No, by design | Hint under "Mensaje" |
| 18 | Cookies or trackers that collect personal data | Ley 1581 applied by the SIC (Google 2020, Plural 2022) | Google Maps clearly; cookieless analytics arguably not | Maps click-to-load; banner (client decision) |
| 19 | Marketing only by authorized channels and hours | Ley 2300 de 2023 | Only if CIC sends promotions | Separate optional checkbox |

Penalties: up to 2,000 SMMLV, plus suspension of the data processing (Ley 1581 Art. 23).

## 3. Cookie and tracking inventory

| Item | Category | Cookies / identifiers | Personal data? | Consent legally needed? | Decision |
|---|---|---|---|---|---|
| `localStorage` consent choice (`cic-consent`) | Strictly necessary | localStorage key, no ID | No | No | Always on; disclosed in the policy |
| Vercel hosting (server logs: IP, user agent) | Strictly necessary | None | IP, briefly (encargado) | No | Always on; disclosed |
| `/api/contact` → Resend | Strictly necessary (only on submit) | None | Yes (form data) | Covered by the **form autorización** | Form checkbox |
| Vercel Web Analytics | Analytics | No cookies; a request hash kept 24 h | Probably not | Likely no (arguable) | **Gated behind "Aceptar"** |
| Umami Cloud + custom events | Analytics | No cookies; anonymous session ID | Probably not (events carry no PII) | Likely no (arguable) | **Gated behind "Aceptar"**; never put PII in events |
| Google Maps iframe | Third-party embed | **Google cookies (NID, AEC, SOCS); IP sent to Google** | Yes (Google is the responsable) | Effectively yes | **Click-to-load** (PR #11) |
| `wa.me` links | Outbound link | None until clicked | Only after the visitor goes to WhatsApp (Meta) | No | Mentioned in the policy |
| Web fonts or CDNs | n/a | n/a | n/a | n/a | **None.** The site uses system fonts and self-hosted assets (checked 2026-10-17) |

## 4. Consent UX

**Banner content** (the elements it needs; not final copy):
- The responsable.
- That we measure visits **only if you accept**, with no advertising or ad tracking.
- The tools named (Vercel Web Analytics, Umami) and that they process data in the US.
- That Google Maps loads only if you ask for it.
- A link to the policy's cookies section.
- How to change your choice later: the footer link.

**Before any choice, and after "Rechazar":** the site itself, the form, the WhatsApp links, the Maps placeholder, and the stored choice.

**After "Aceptar":** add Vercel Web Analytics and Umami. Maps still loads only on click.

**Re-opening the banner:** the "Preferencias de cookies" footer link. Re-ask when `v` changes; optionally also after 6–12 months.

## 5. Answers to the research questions (short)

- **Policy content** (Decreto 1377 Art. 13): the responsable's name and contact details; the treatment and its purposes; the data subject's rights; the person or area that handles requests; the procedure to know, update, correct or delete data and revoke the autorización; the effective date and how long the database is kept. Substantial changes must be announced before they take effect.
- **Aviso de privacidad** (Arts. 14–15): needed only when the policy itself can't be made available. It covers the responsable and contact details, purpose, rights, and how to find the policy.
- **Proof of autorización:** an unticked required checkbox plus a server-side record (the notification email) is acceptable as a "medio técnico" that can be checked later (Ley 1581 Art. 9; Decreto 1377 Arts. 7–8).
- **Deadlines:** consultas in 10 business days (+5); reclamos in 15 business days (+8); 5 days to ask for missing information; a reclamo is considered abandoned after 2 months; mark the record "reclamo en trámite" within 2 business days. The person must go through CIC's process before complaining to the SIC.
- **RNBD:** required for companies with assets above 100,000 UVT, and for public entities. Each database is registered separately, within 2 months of its creation, with yearly updates.
- **Cookies:** no specific law exists. The SIC's 2019 e-commerce guide doesn't mention cookies. Treat cookies as a way of collecting personal data.
- **International transfer:** a transmission to an encargado under a DPA needs no extra consent (Decreto 1377 Art. 24.2). The US is on the adequate list (CE 005/2017 §3.2). A draft update to that list is under study (June 2026), so recheck before publishing.
- **Sensitive data:** none is collected. The NIT of a natural person is personal (not sensitive) data.
- **Retention:** keep data only as long as reasonable. Commercial papers are kept 10 years (Ley 962/2005 Art. 28). Also check how long Resend keeps logs.

## 6. Outline of `/politica-de-datos`

"Política de Tratamiento de Datos Personales", with "Versión [DATO] – vigente desde [DATO]" at the top.

1. Identificación del responsable: razón social, NIT, domicilio (Buga), address, email, phone [DATO].
2. Marco legal: Ley 1581 de 2012, Decreto 1377 de 2013 (compiled in DUR 1074 de 2015).
3. Definiciones (Ley 1581 Art. 3; Decreto 1377 Art. 3).
4. Datos que recolectamos: the form fields; WhatsApp, email and phone contacts; visit data; a statement that no sensitive data is requested.
5. Finalidades: answer requests and quotations; contact by the channel given; evaluate contract requests; manage customers; meet legal and tax obligations; statistics (only with consent); marketing (only with a separate checkbox, [DATO]).
6. Tratamiento: collection, storage (email provider [DATO]), use, transmission, deletion.
7. Encargados y transmisión internacional: Vercel Inc. (USA), Resend (USA), Umami ([DATO]), email provider ([DATO]); the US is on the adequate list; no sale of data.
8. Cookies y tecnologías similares (`#cookies`): the inventory table, how to accept, reject or change the choice, and Maps click-to-load.
9. Derechos del titular (Ley 1581 Art. 8).
10. Área responsable de consultas y reclamos [DATO].
11. Procedimiento: who can file, channels, what a request must include, and the deadlines in §5.
12. Autorización: how it is obtained and kept; the exceptions in Ley 1581 Art. 10.
13. Seguridad de la información.
14. Conservación y supresión [DATO periods]; how long the database is kept.
15. Datos de niñas, niños y adolescentes: not collected.
16. RNBD [DATO].
17. Cambios a la política.
18. Vigencia.

## 7. Consent text and email changes

**Gaps in the current checkbox:**
- it names only "esta solicitud" as the purpose;
- it doesn't mention the person's rights or how to exercise them;
- there's no link to the policy;
- the providers abroad aren't disclosed;
- the responsable isn't fully identified.

**Elements to include** (the lawyer drafts the final wording):
- the responsable with razón social and NIT;
- the purposes: (i) respond to the request or quotation, (ii) contact by email, phone or WhatsApp, (iii) evaluate contract requests;
- that providers in the US are used;
- the person's rights and the email address for exercising them;
- the policy link.
- Optional separate checkbox for commercial messages.
- The server must reject a submission without consent. It already does.

**Notification email — "Registro de autorización" block:** consent given, text version, policy version and URL, date and time (America/Bogota), source. No personal data in the subject line.

## 8. Open questions for the client

1. Razón social, NIT, legal form (SAS or persona natural), registered address and phone.
2. Total assets compared with 100,000 UVT (RNBD). Are any databases already registered? Are there other databases (customers, suppliers, employees)?
3. The person or area that handles data requests, and their email.
4. The email hosting provider for cicdiagnostica.com, and its country.
5. The Vercel plan: Hobby or Pro?
6. Umami Cloud's region and DPA, or self-host or drop it.
7. Will CIC send marketing by WhatsApp or email?
8. Retention periods, and who cleans the mailbox and the Resend logs.
9. Are WhatsApp Business chats exported to a CRM?
10. Is there an existing company data policy to stay consistent with?

## 9. Sources

Official texts:
- Ley 1581 de 2012: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981
- Decreto 1377 de 2013: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646
- Decreto 090 de 2018: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=85039
- DUR 1074/2015, compiled chapters 25 and 26:
  - https://normativa.colpensiones.gov.co/colpens/docs/decreto_1074_2015_pr025.htm
  - https://normativa.colpensiones.gov.co/colpens/docs/decreto_1074_2015_pr026.htm
- Ley 962 de 2005: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=17004
- Ley 2300 de 2023: https://normograma.dian.gov.co/dian/compilacion/docs/ley_2300_2023.htm

SIC documents:
- SIC e-commerce guide (2019): https://www.sic.gov.co/sites/default/files/files/pdf/Guia%20SIC%20Tratamiento%20Datos%20Personales%20ComercioElectronico(1).pdf
- SIC Circular Externa 005 de 2017: https://operaciones.colombiacompra.gov.co/sites/cce_public/files/cce_informe_seguimiento/superindustria-circularexterna-2017-n0000005_20170810_1.pdf
- SIC Circular Externa 003 de 2025: https://sedeelectronica.sic.gov.co/sites/default/files/normativa/Circular%20Externa%20003%20de%202025.pdf

Analysis and news:
- Asuntos Legales: cookies in Colombia (2022); RNBD and Decreto 090 (2018); adequate-country draft (2026):
  - https://www.asuntoslegales.com.co/consumidor/conozca-los-aspectos-legales-que-debe-tener-en-cuenta-al-usar-cookies-en-sitios-web-3375211
  - https://www.asuntoslegales.com.co/analisis/catalina-herrera-von-norden-530696/cambios-en-el-registro-nacional-de-bases-de-datos-2596772
  - https://www.asuntoslegales.com.co/analisis/sofia-navas-vera-4325984/brasil-ecuador-kenia-panama-y-sudafrica-los-nuevos-candidatos-a-la-lista-de-paises-con-proteccion-adecuada-de-datos-personales-4417427
- Holland & Knight (2017): https://www.hklaw.com/publications/Cambios-en-la-Transferencia-de-Datos-Personales-a-Otros-Paises-08-25-2017/
- DLA Piper, Colombia: https://www.dlapiperdataprotection.com/index.html?t=electronic-marketing&c=CO
- SIC enforcement news:
  - https://dplnews.com/ordenan-a-google-cumplir-normas-colombianas-de-proteccion-de-datos/
  - https://www.elespectador.com/economia/superindustria-investigara-a-plural-comunicaciones-por-presunta-violacion-de-datos/
- UVT 2026: https://incp.org.co/agendatributariaincp/noticias/2025/12/dian-fijo-en-52-374-en-valor-de-la-uvt-para-el-ano-gravable-2026/ (taken from a search result; the page itself was not opened)

Vendor documentation:
- Vercel: https://vercel.com/docs/analytics/privacy-policy, https://vercel.com/legal/dpa, https://vercel.com/docs/plans/hobby
- Resend DPA: https://resend.com/legal/dpa
- Umami FAQ: https://docs.umami.is/docs/faq
- Google cookies: https://policies.google.com/technologies/cookies?hl=es
