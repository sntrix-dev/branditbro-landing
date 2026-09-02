# branditbro — landing site

The live marketing site for **branditbro**, built from the finished design set.
Next.js (App Router) + TypeScript + Tailwind CSS v4 + GSAP.

Fast, SEO-first, fully responsive, with smooth scroll-driven motion that adapts
to the device it runs on.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

Requires Node 18.18+ (built and tested on Node 22).

---

## ⚙️ The one file you edit — `src/site.config.ts`

Everything a human needs to go live lives in **`src/site.config.ts`**.
Change a value there and it updates across every page. Search for `REPLACE`:

| What | Field | Notes |
|------|-------|-------|
| Live domain | `site.url` | Used for canonical URLs, sitemap, OG tags |
| Enquiry email | `contact.email` | Where the forms email you |
| WhatsApp number | `contact.whatsapp` | Digits only, E.164 (e.g. `919000000000`). **Leave `""` to hide every WhatsApp button automatically.** |
| WhatsApp display | `contact.whatsappDisplay` | How the number reads on screen |
| Instagram | `social.instagram` | Handle only; `""` hides it |
| Client results | `proof.stats` + `proof.isSample` | Swap the **sample** figures for real ones, then set `isSample: false` to hide the "sample figures" badge |
| Pricing bands | `catalog`, `sizes`, `whens` | The estimator's real numbers — tune anytime |
| First-project discount | `offer.firstProjectDiscountPct` | Currently 30% |

No hunting through pages — it's all in that one file.

---

## 📬 Contact form (email + WhatsApp)

The contact **and** pricing forms post to `POST /api/enquiry`.

- **Email:** set `RESEND_API_KEY` (free at [resend.com](https://resend.com)) and
  optionally `ENQUIRY_FROM` in `.env.local` (see `.env.example`). Enquiries are
  emailed to `contact.email`. Without a key, enquiries are logged server-side so
  nothing breaks during setup.
- **WhatsApp:** if `contact.whatsapp` is set, submitting also opens a pre-filled
  WhatsApp chat to you in a new tab — so an enquiry reaches you both ways.

Want a different provider (SendGrid, Postmark, Nodemailer/SMTP)? It's one `fetch`
call in `src/app/api/enquiry/route.ts` — swap it there.

---

## 💼 Careers module (`/careers`)

A full hiring flow, built on the same stack (Next App Router + Postgres + SES),
with graceful degradation — every piece works with zero config and switches on
as you set each env group.

**Public page** — `/careers`: hero, the "how it works" cards, open roles (with
team filters), the 25% referral-partner track, the four-step process and FAQ.
All copy is CMS-editable at **/admin → Content → Careers**.

**Apply flow** — drop a résumé (PDF/DOC/DOCX) or paste a link (portfolio,
LinkedIn, GitHub, Behance…). The parser reads it and pre-fills the form; the
applicant fixes anything and submits. Referral partners get a shorter form. On
submit they get a reference id (`BB-####`), a confirmation email, and your team
gets an alert.

**AI extraction** — Google **Gemini** (`GEMINI_API_KEY`). PDFs are read natively
(no separate parser — it OCRs scanned résumés too); DOCX via `mammoth`; links
are fetched server-side and reduced to text. Structured JSON output maps
straight onto the form. Cheapest model, `gemini-2.5-flash-lite`, is a fraction
of a cent per résumé; a free tier exists (see the privacy note in
`.env.example`). Not configured? Applicants just fill the form by hand.

**Résumé storage** — private, encrypted **S3** (`CAREERS_S3_BUCKET`). The admin
downloads originals through short-lived signed URLs; the bucket stays private.
Unset → only the parsed fields are kept.

**Admin** — `/admin`:
- **Applications** — pipeline (new → reviewing → trial → hired / rejected /
  archived), stats, filters, search, résumé download, private notes.
- **Roles** — add / edit / open / close / delete roles and pay bands, no redeploy.

**Security** — SSRF-guarded link fetching (private-IP + redirect re-validation),
file-type sniffing by magic bytes (never trusts the client MIME), 8 MB cap,
per-IP rate limiting on the public endpoints, a submit honeypot, strict input
clamping, and admin routes behind the existing session middleware.

Relevant env (all optional — see `.env.example`): `GEMINI_API_KEY`,
`GEMINI_MODEL`, `CAREERS_S3_BUCKET`, `CAREERS_S3_PREFIX`, `AWS_S3_REGION`.
Applications are stored when `DATABASE_URL` is set; emails send when
`ENQUIRY_FROM` (SES) is set — the same groups the rest of the site uses.

---

## 🚀 Deploy (recommended: Vercel)

1. Push this folder to a Git repo (GitHub/GitLab).
2. Import it at [vercel.com/new](https://vercel.com/new) — it auto-detects Next.js.
3. Add environment variables (`RESEND_API_KEY`, `ENQUIRY_FROM`) in the Vercel
   project settings.
4. Point your domain at it and set `site.url` in `site.config.ts` to match.

Also deploys cleanly to Netlify, Cloudflare Pages, or any Node host (`npm run build && npm start`).

---

## Motion & responsiveness

Animations run through **GSAP + ScrollTrigger**, orchestrated in
`src/components/MotionRoot.tsx` and per-page effects. Behaviour adapts by device
via `gsap.matchMedia()`:

- **Desktop (≥1024px):** full experience — pinned horizontal scroll (“the 14
  days”, “the spine”), the swelling-dot flood scene, the cinematic letterbox
  cold-open, parallax image slots.
- **Touch / small screens:** those pinned scenes become natural swipe carousels
  and stacked sections — because pinned horizontal-scroll is meaningless (and
  janky) on a phone.
- **`prefers-reduced-motion`:** all motion is disabled and content shows
  immediately. No layout ever depends on JS to become visible.

Fonts (**Gabarito** + **DM Sans**) are self-hosted via Fontsource — zero external
Google Fonts requests, faster first paint, better privacy.

---

## SEO

- Per-page `<title>` / meta descriptions and canonical URLs
- Open Graph + Twitter cards, with an auto-generated branded OG image (`opengraph-image.tsx`)
- Generated favicon (`icon.tsx`)
- `sitemap.xml` and `robots.txt` generated from your routes
- Organization JSON-LD structured data
- Semantic HTML, static pre-rendering for every marketing page

---

## Structure

```
src/
  app/
    layout.tsx            root shell: fonts, metadata, JSON-LD, nav/footer
    page.tsx              Home
    services/             Services
    pricing/              Pricing (interactive estimator)
    how-it-works/         How it works (cinematic)
    contact/              Contact (form, prefilled from the estimator)
    api/enquiry/route.ts  form handler (email)
    sitemap.ts robots.ts icon.tsx opengraph-image.tsx globals.css
  components/              HomePage, ServicesPage, HowItWorksPage,
                          PricingPage, ContactPage, SiteNav, SiteFooter,
                          MotionRoot, Logo
  lib/                    gsap setup, money formatting, services data
  site.config.ts          ← EDIT THIS
```

---

Built for Surya · brandit**bro**.
