/** Content for the app-style mobile experience (phones).
 *  Pricing numbers come from site.config (single source of truth); the
 *  copy below is mobile-specific and mirrors the mobile design. */

export const HERO_QUERIES = [
  "best cafe near me",
  "wedding photographer in jaipur",
  "dentist open now",
  "gym membership price nearby",
  "interior designer for 2bhk",
];

/** Home tab — the 5-card swipe carousel */
export interface HomeCard {
  n: string;
  title: string;
  body: string;
  price: string;
  theme: "white" | "ink" | "teal" | "sand";
  numColor: string;
  priceColor: string;
}
export const HOME_CARDS: HomeCard[] = [
  { n: "01", title: "Websites that close.", body: "One page or fifty, built around the single thing you want a stranger to do next.", price: "₹35k–₹3L · 3–18 days", theme: "white", numColor: "text-chili", priceColor: "text-brown" },
  { n: "02", title: "Apps, without the theatre.", body: "Idea to App Store with a scope you can read in one sitting — and the backend that keeps it alive.", price: "₹1.2L–₹9L · 4–16 weeks", theme: "white", numColor: "text-chili", priceColor: "text-brown" },
  { n: "03", title: "Get in front of people already searching.", body: "Demand you don't have to create. Ad budget stays in your account, never marked up.", price: "₹15k–₹1.2L / month", theme: "ink", numColor: "text-mango", priceColor: "text-mango-soft" },
  { n: "04", title: "Enough content to look unmissable.", body: "One shoot, a month of cuts. Hooks written, captions burned in, posted on schedule.", price: "₹18k–₹1.2L / month", theme: "teal", numColor: "text-mango-soft", priceColor: "text-sand" },
  { n: "05", title: "A brand that looks its price.", body: "Logo, colours, type and a one-page rulebook you can hand to anyone.", price: "₹25k–₹2L · 5–28 days", theme: "sand", numColor: "text-chili", priceColor: "text-brown" },
];

/** Home tab — the self-drawing 5-stage timeline */
export const STEPS = [
  { n: "01", title: "Brief", timing: "day 1", body: "Forty minutes. You leave with the scope, the price and a real launch date." },
  { n: "02", title: "Direction", timing: "1–3 days", body: "One route, not six. You approve the look and the words before anything is built." },
  { n: "03", title: "Build", timing: "3 days–8 weeks", body: "A live link from day one. Watch it fill in every evening instead of waiting for a reveal." },
  { n: "04", title: "Review", timing: "one round", body: "Everything at once, on the same page. No drip-feed of comments across three weeks." },
  { n: "05", title: "Live", timing: "the agreed date", body: "In your name, passwords handed over. If a date ever slips, you hear it from us first." },
];

/** Home tab — objections accordion */
export const OBJECTIONS = [
  { q: "“Agencies ghost.”", a: "One owner, one thread, a build you can open any evening. If it slips, you hear it from us first." },
  { q: "“It'll cost a bomb.”", a: "Fixed price, agreed on day one, in writing. No hourly meter, no surprise line items at handover." },
  { q: "“I have no content.”", a: "Nobody does at the start. We shoot it and write it — you show up for an hour and answer questions." },
  { q: "“Can you promise page one?”", a: "No, and neither can anyone else. We can promise the groundwork that earns it, and show you the terms you're winning." },
];

/** Services tab — the 5 detailed cards */
export interface MobileService {
  key: string;
  num: string;
  title: string;
  band: string;
  timing: string;
  dark: boolean;
  blurb: string;
  items: string[];
  art: "web" | "app" | "brand" | "chart" | "reel";
  artBg: string;
  cta: "ink" | "mango";
}
export const MOBILE_SERVICES: MobileService[] = [
  {
    key: "website", num: "01", title: "Website", band: "₹35k–₹3L", timing: "3–18 days", dark: false, art: "web", artBg: "#FFE0C2", cta: "ink",
    blurb: "One page or fifty, built around the one thing you want a stranger to do next.",
    items: ["Yours to edit, on your own domain", "Words written for that one action", "Found locally on search"],
  },
  {
    key: "app", num: "02", title: "Mobile app", band: "₹1.2L–₹9L", timing: "4–16 weeks", dark: true, art: "app", artBg: "#0E6B5E", cta: "mango",
    blurb: "Idea to App Store, with a scope you can read in one sitting.",
    items: ["Published in your developer account", "Backend and payments wired up", "Handover any developer can pick up"],
  },
  {
    key: "branding", num: "03", title: "Branding", band: "₹25k–₹2L", timing: "5–28 days", dark: false, art: "brand", artBg: "#16100D", cta: "ink",
    blurb: "The look, the words and the rules — so everything you make later matches.",
    items: ["Logo in every format you will be asked for", "Colour and type with usage rules", "Editable source files, yours to keep"],
  },
  {
    key: "marketing", num: "04", title: "Marketing", band: "₹15k–₹1.2L", timing: "live in 3–14 days", dark: true, art: "chart", artBg: "#FF7A00", cta: "mango",
    blurb: "Demand you do not have to create. We go where the intent already is.",
    items: ["Campaigns live in your own ad accounts", "Budget paid direct, never marked up", "Reported in enquiries, not impressions"],
  },
  {
    key: "video", num: "05", title: "Video editing", band: "₹18k–₹1.2L", timing: "first cuts in a week", dark: false, art: "reel", artBg: "#FFE0C2", cta: "ink",
    blurb: "One shoot, a month of cuts. Hooks written, captions burned in, posted.",
    items: ["A month of edits, captioned and scheduled", "Hooks written for the first second", "Raw footage handed back to you"],
  },
];

/** Pricing quiz option copy */
export const SERVICE_OPTIONS: [string, string, string][] = [
  ["website", "A website", "Found, trusted, booked"],
  ["app", "A mobile app", "iOS, Android, backend"],
  ["branding", "Branding", "Logo, colours, rules"],
  ["marketing", "Marketing", "Ads and local search"],
  ["video", "Video editing", "Reels, shorts, captions"],
];
export const SIZE_OPTIONS: [string, string, string][] = [
  ["solo", "Just me", "Creator, coach or one-person brand"],
  ["growing", "A small business", "Shop, clinic, studio, agency"],
  ["funded", "A funded company", "Startup or scale-up with a team"],
];
export const WHEN_OPTIONS: [string, string, string][] = [
  ["asap", "As soon as possible", "We will tell you the real date"],
  ["quarter", "Within a few months", "The calm, cheaper way"],
  ["exploring", "Just checking the price", "Completely fine — no call follows"],
];

export const OWN_LINES: Record<string, string> = {
  website: "A site you can update yourself, on your own domain",
  app: "A published app on both stores, in your developer account",
  branding: "Logo, colours, type and a one-page rulebook",
  marketing: "Live campaigns in your ad accounts, reported monthly",
  video: "A month of edited, captioned, scheduled video",
};

export const CALC_LINES = ["Sizing the build…", "Checking who does the work…", "Applying your first-project discount…"];

/* How It Works tab — the 6-stage spine */
export interface HowStage { n: string; tag: string; title: string; body: string; leave: string; tone: "default" | "mango" | "teal"; }
export const HOW_STAGES: HowStage[] = [
  { n: "01", tag: "30 minutes", title: "The conversation", body: "One call, no slide deck. What you sell, who's not buying it, what's already been tried. If we're the wrong people for it, you'll hear that on this call and not after an invoice.", leave: "A straight answer on whether this is worth doing at all", tone: "default" },
  { n: "02", tag: "2–3 days later", title: "Scope on paper", body: "Every deliverable listed as a line item with a price and a date beside it. What's explicitly not included is listed too — the page that prevents arguments in week five.", leave: "A fixed number, a fixed date, and the exit terms in writing", tone: "default" },
  { n: "03", tag: "Your exit point", title: "The first direction", body: "You see real work, not a mood board. If it misses — genuinely misses — you stop here, keep everything we've made, and pay nothing.", leave: "Either conviction, or your money and the files", tone: "mango" },
  { n: "04", tag: "The long middle", title: "Built in the open", body: "A live link from the first week, updated as we go. No mystery period. You watch it get built, and can see exactly which day something slipped.", leave: "A weekly link and one short update — never a status meeting", tone: "default" },
  { n: "05", tag: "Launch day", title: "Going live", body: "Checked on real devices, tracking verified firing, forms tested end to end, speed measured. Then the keys: domains, accounts and passwords, transferred the same day.", leave: "Full ownership and a recorded walkthrough for your team", tone: "default" },
  { n: "06", tag: "The 30 days after", title: "After the launch", body: "A month of fixes with no invoice, because the first weeks are when real users find what we didn't. After that you run it yourself, or we stay on monthly. Both are fine.", leave: "Something that works, that you own, that you can leave with", tone: "teal" },
];

export const WHAT_WE_NEED: [string, string, string][] = [
  ["01", "One person who can say yes", "Not a committee. Projects die in the gap between four opinions and no decision."],
  ["02", "Your material, once, at the start", "Photos, product details, whatever you already have. We'll tell you what's missing and write the rest."],
  ["03", "Feedback in one pass, not five", "Collect everything, send it together. Drip-fed changes turn a three-week build into three months."],
];

export const WHEN_WRONG: [string, string][] = [
  ["We're running late", "You hear it the day we know, not on the deadline. New date, reason, and what we're cutting to protect it."],
  ["You want something new mid-build", "Quoted separately with its own date, before anyone starts. Nothing gets absorbed quietly and billed later."],
  ["It just isn't working out", "You pay for what's finished, take every file and login, and go. No lock-in clause, no hostage accounts."],
];
