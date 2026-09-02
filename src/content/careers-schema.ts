/**
 * ─────────────────────────────────────────────────────────────
 *  branditbro — CAREERS content + role seeds
 * ─────────────────────────────────────────────────────────────
 *  Two things live here:
 *
 *   1. `defaultCareersContent` — the editable marketing copy for the
 *      /careers page. It is folded into the main CMS `Content` tree
 *      (content/schema.ts) so the owner edits it from /admin/content
 *      exactly like the rest of the site, and the live page deep-merges
 *      any published overrides over these defaults.
 *
 *   2. `DEFAULT_ROLES` / `REFERRAL_ROLE` — the seed for the `job_roles`
 *      table. Roles are DYNAMIC (managed at /admin/careers/roles and stored
 *      in Postgres); this array only seeds an empty table on first run and
 *      is the fallback the page renders when no database is configured.
 *
 *  Keeping copy and role data separate mirrors the leads/CMS split already
 *  in the codebase: structured records in the DB, prose in the CMS.
 * ───────────────────────────────────────────────────────────── */

/** A role as seeded / stored. `hints` feed the AI role-matcher (never shown). */
export interface RoleSeed {
  key: string;
  team: string;
  title: string;
  mode: string;
  /** Human pay summary shown on the card, e.g. "₹1,200–2,500 / hr or ₹45k–90k / mo". */
  pay: string;
  /** The single band the estimator suggests, e.g. "₹1,200–2,500 / hr". */
  band: string;
  blurb: string;
  tags: string[];
  skills: string[];
  hints: string[];
}

export const DEFAULT_ROLES: RoleSeed[] = [
  {
    key: "frontend", team: "Engineering", title: "Frontend developer",
    mode: "Per-task or full-time", pay: "₹1,200–2,500 / hr or ₹45k–90k / mo", band: "₹1,200–2,500 / hr",
    blurb: "React and Next.js client builds — marketing sites, dashboards, the occasional storefront. You'll own screens end to end, not tickets.",
    tags: ["React", "Next.js", "Tailwind", "GSAP a plus"],
    skills: ["React", "Next.js", "TypeScript", "Tailwind", "Framer Motion"],
    hints: ["react", "next", "frontend", "front-end", "ui", "web", "vercel", "netlify"],
  },
  {
    key: "design", team: "Design", title: "Brand & product designer",
    mode: "Per-task or full-time", pay: "₹1,000–2,200 / hr or ₹40k–80k / mo", band: "₹1,000–2,200 / hr",
    blurb: "Identities, landing pages, app screens. You'll go from a messy client call to a layout that survives a founder's opinions.",
    tags: ["Figma", "Type", "Identity", "Webflow a plus"],
    skills: ["Figma", "Brand identity", "Type", "Prototyping", "Webflow"],
    hints: ["design", "figma", "behance", "dribbble", "brand", "ux", "ui/ux"],
  },
  {
    key: "video", team: "Video", title: "Video editor — reels & shorts",
    mode: "Per-task", pay: "₹800–1,800 per edit", band: "₹800–1,800 per edit",
    blurb: "Cut vertical video that holds someone past three seconds. Captions, sound design, a sense of comedic timing.",
    tags: ["Premiere", "After Effects", "CapCut", "Captions"],
    skills: ["Premiere Pro", "After Effects", "CapCut", "Sound design", "Captions"],
    hints: ["video", "editor", "edit", "reels", "premiere", "vimeo", "youtube", "motion"],
  },
  {
    key: "growth", team: "Growth", title: "Performance marketer",
    mode: "Per-task or full-time", pay: "₹18k–45k / mo per account", band: "₹18k–45k / mo per account",
    blurb: "Meta and Google spend for small Indian businesses. You'll write the hooks, watch the numbers and say when to kill a set.",
    tags: ["Meta Ads", "Google Ads", "GA4", "Copy"],
    skills: ["Meta Ads", "Google Ads", "GA4", "Ad copy", "Retargeting"],
    hints: ["market", "ads", "growth", "seo", "performance", "media"],
  },
  {
    key: "fullstack", team: "Engineering", title: "Full-stack developer",
    mode: "Full-time preferred", pay: "₹60k–1.1L / mo", band: "₹60,000–1,10,000 / mo",
    blurb: "Node, Postgres, and the boring reliable parts — auth, payments, admin panels. You like things that don't page you at midnight.",
    tags: ["Node", "Postgres", "AWS", "APIs"],
    skills: ["Node.js", "Postgres", "REST APIs", "AWS", "Auth & payments"],
    hints: ["fullstack", "full-stack", "backend", "node", "postgres", "github", "api", "aws"],
  },
  {
    key: "words", team: "Words", title: "Copywriter / social",
    mode: "Per-task", pay: "₹700–1,500 / hr", band: "₹700–1,500 / hr",
    blurb: "Site copy, captions, scripts. Plain sentences that sound like a person and still sell the thing.",
    tags: ["Web copy", "Scripts", "Captions", "Hinglish welcome"],
    skills: ["Web copy", "Scripts", "Captions", "Editing", "Hinglish"],
    hints: ["writer", "copy", "content", "social", "substack", "medium", "notion"],
  },
];

/** The referral partner is a fixed, special "role" — never stored in job_roles,
 *  never editable, no skills. Handled as its own application kind. */
export const REFERRAL_ROLE: RoleSeed = {
  key: "referral", team: "Referral partner", title: "Referral partner — 25% commission",
  mode: "No skills needed", pay: "25% of project value", band: "25% of project value",
  blurb: "", tags: [], skills: ["Intros", "Local network"], hints: [],
};

/* ── editable page copy ─────────────────────────────────────── */

export interface CareersStep { n: string; title: string; body: string }
export interface CareersProcessStep { n: string; dur: string; title: string; body: string }
export interface CareersStat { value: string; label: string }
export interface CareersFaq { question: string; answer: string }
export interface CareersEngagement { key: string; label: string; note: string }

export interface CareersContent {
  /** Master switch — hide the whole careers section (page 404s) when false. */
  enabled: boolean;
  /** Where applications are emailed. Falls back to contact.email when blank. */
  inboxEmail: string;
  /** Max working days quoted for a reply, used in copy + confirmation email. */
  replyDays: number;
  hero: {
    eyebrow: string;
    /** Newlines become separate display lines. */
    title: string;
    subtitle: string;
    note: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  stats: CareersStat[];
  statsNote: string;
  /** Single string; " · " separates ticker items. */
  marquee: string;
  how: { title: string; body: string; cards: CareersStep[] };
  roles: { eyebrow: string; title: string; body: string; openTitle: string; openBody: string; openCta: string };
  referral: {
    eyebrow: string; title: string; body: string; pct: number; payoutNote: string;
    steps: CareersStep[];
    mathTitle: string; mathBody: string;
    signupTitle: string; signupBody: string; cta: string;
  };
  process: { title: string; body: string; steps: CareersProcessStep[] };
  faq: { title: string; items: CareersFaq[] };
  finalCta: { title: string; body: string; button: string };
  form: {
    intakeTitle: string; intakeBody: string;
    sources: string[];
    hours: string[];
    engagements: CareersEngagement[];
  };
  done: { headlinePrefix: string; body: string; steps: CareersStep[]; footnote: string };
}

export const defaultCareersContent: CareersContent = {
  enabled: true,
  inboxEmail: "careers@branditbro.com",
  replyDays: 3,
  hero: {
    eyebrow: "Careers · remote-first · India",
    title: "Do the work.\nGet paid.\nGo touch grass.",
    subtitle:
      "No “we’re a family” speech. No unpaid “assignment” that quietly ships to production. Pick up work task by task like a freelancer, or go full-time if that’s more your speed — either way the scope and the number are agreed before you start.",
    note: "Applications take about two minutes. We reply either way.",
    ctaPrimary: "See what’s open",
    ctaSecondary: "Nothing fits — take my resume anyway",
  },
  stats: [
    { value: "3 days", label: "Max we take to reply. Working days." },
    { value: "100%", label: "Of trial tasks are paid at your rate." },
    { value: "0", label: "Unpaid “spec work”. Ever." },
    { value: "18", label: "People on the roster right now." },
  ],
  statsNote: "Not marketing numbers — the ones we hold ourselves to. Hold us to them too.",
  marquee:
    "paid per task · scope in writing · no 3-hour standups · remote by default · your name on the work · we reply in 3 days · no unpaid trials · invoices cleared weekly",
  how: {
    title: "How working here actually works.",
    body: "We’re a small remote studio that ships client work on fixed scopes. That shapes everything below — including how you get paid and how little we’ll bother you on a Sunday.",
    cards: [
      { n: "01", title: "Paid by task, like freelancing", body: "You see the task, the fee and the deadline before you accept it. Take it or pass — passing costs you nothing and isn’t held against you." },
      { n: "02", title: "Full-time, if you’d rather", body: "Plenty of people start per-task and move to a monthly retainer or a permanent role. Say which one you want in the form — both are open." },
      { n: "03", title: "Remote, genuinely", body: "No office to commute to and no camera-on culture. Two short syncs a week, everything else written down so you can work when your brain works." },
      { n: "04", title: "Credit where it’s due", body: "Your name goes on the case study and you can show the work in your portfolio once it’s live. We’re not hoarding your best pieces under an NDA." },
    ],
  },
  roles: {
    eyebrow: "Open roles",
    title: "Ways in. Pick yours.",
    body: "Every one of these can be per-task or full-time. If your thing isn’t listed, the open application at the bottom goes to the same inbox.",
    openTitle: "None of the above? Still send it.",
    openBody: "Motion designers, illustrators, copywriters, people who are weirdly good at spreadsheets — we’ve hired all of them off an open application.",
    openCta: "Send an open application",
  },
  referral: {
    eyebrow: "No skills? No problem",
    title: "Can’t design, can’t code, but you know people?",
    body: "Bring us a client that signs and you keep 25% of what they pay. That’s it — no course to buy, no “package” to unlock, no downline. Your cousin’s salon, your college senior’s startup, the gym you go to. Somebody has to build their website.",
    pct: 25,
    payoutNote: "of the project value, paid to you in the same weekly run we pay everyone else. On repeat work too, for the first year.",
    steps: [
      { n: "01", title: "You send the intro", body: "A name and a WhatsApp number is enough. Add them to a group chat with us if that’s easier." },
      { n: "02", title: "We do the selling", body: "The call, the scope, the price, the awkward budget conversation. You don’t have to pitch anything or know what a CMS is." },
      { n: "03", title: "They pay, you get 25%", body: "Your share goes out as each client instalment clears. You see the invoice, so you can do the maths yourself." },
    ],
    mathTitle: "One ₹80,000 website = ₹20,000 to you",
    mathBody: "Two of those a month and it’s a better side income than most part-time jobs you’ve been offered.",
    signupTitle: "Sign up as a referral partner",
    signupBody: "Same short form as everyone else — no resume, no portfolio, we skip straight to your details. We send the commission terms in writing before your first intro.",
    cta: "Get me the 25% deal",
  },
  process: {
    title: "Four steps. No ghosting.",
    body: "Start to finish it’s about two weeks. Every stage has a real timeline, and you hear from us at each one — including if it’s a no.",
    steps: [
      { n: "01", dur: "~2 min", title: "You apply", body: "Drop a resume or paste one link. Our parser fills the form in; you fix what it got wrong and hit send." },
      { n: "02", dur: "≤ 3 days", title: "A human replies", body: "By email, from a name you can reply to. Yes or no, you get an answer within three working days." },
      { n: "03", dur: "~1 week", title: "One paid trial task", body: "A real, small piece of client work at your quoted rate. A 30-minute call first so nothing’s ambiguous." },
      { n: "04", dur: "Same week", title: "Roster or offer", body: "You go on the roster and start getting task offers, or you get a full-time offer in writing. Your call." },
    ],
  },
  faq: {
    title: "The questions you were going to DM us anyway.",
    items: [
      { question: "Is this an internship where I work for “exposure”?", answer: "No. Every task has a fee attached, including the trial one. If you’re a student we’ll scope smaller tasks — not free ones." },
      { question: "I have zero years of experience.", answer: "Then show us three things you made — a college project, a fan edit, a landing page for your cousin’s bakery. We read the work, not the years." },
      { question: "Can I do this alongside a full-time job?", answer: "Yes, that’s most of the roster. Tell us your realistic hours in the form and we’ll only send tasks that fit inside them." },
      { question: "How do I get paid, and when?", answer: "Invoice on delivery, cleared in the next weekly run. Bank transfer or UPI. Late from our side means we owe you, not the other way round." },
      { question: "Will I hear back if it’s a no?", answer: "Yes, with one line on why. We keep strong applications on file and write back when something matching lands — that’s not a brush-off, it’s happened plenty." },
    ],
  },
  finalCta: {
    title: "You’ve read enough. Send the thing.",
    body: "One link or one file, thirty seconds of confirming, and a reply from a person within three working days. Worst case you get a no and one line explaining it.",
    button: "Start my application",
  },
  form: {
    intakeTitle: "Give us one thing.",
    intakeBody: "A resume or a link — portfolio, LinkedIn, GitHub, Behance, your Notion page, whatever exists. Our parser reads it and fills the rest of this form in for you.",
    sources: ["Instagram", "LinkedIn", "A friend told me", "Google", "Your client's site", "Somewhere else"],
    hours: ["Under 10 / week", "10–20", "20–35", "Full-time hours"],
    engagements: [
      { key: "task", label: "Per task", note: "Freelance-style. Pick up work when it fits." },
      { key: "retainer", label: "Monthly retainer", note: "A fixed slice of your week, every month." },
      { key: "fulltime", label: "Full-time", note: "Permanent, on the payroll." },
    ],
  },
  done: {
    headlinePrefix: "Sent",
    body: "is in. A confirmation is on its way to your inbox — if it isn’t there in ten minutes, check spam and then tell us.",
    steps: [
      { n: "NOW", title: "", body: "A receipt with everything you sent, so you know it arrived." },
      { n: "≤3d", title: "", body: "A real reply from a person on the team. Yes or no, you’ll know." },
      { n: "IF YES", title: "", body: "A 30-minute call slot and the brief for one small paid trial task." },
    ],
    footnote: "While you wait: don’t send a follow-up on day two. We said three days and we mean it — chasing doesn’t move you up, and not chasing doesn’t move you down.",
  },
};
