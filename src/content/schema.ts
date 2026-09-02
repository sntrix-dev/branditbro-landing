/**
 * ─────────────────────────────────────────────────────────────
 *  branditbro — EDITABLE CONTENT TREE (CMS source of truth)
 * ─────────────────────────────────────────────────────────────
 *  `defaultContent` is the built-in copy that ships with the code. It is:
 *    • the seed the CMS stores on first publish,
 *    • the fallback the site renders when the DB is empty/unreachable,
 *    • the base that any published edits are deep-merged over.
 *
 *  site.config.ts derives its exports from this object, so there is ONE
 *  source of truth. The admin Content editor edits a copy of this shape;
 *  publishing overlays the changes at runtime.
 *
 *  Adding a new editable block = add a field here (and read it where needed).
 *  The editor renders fields generically, so no editor code changes are
 *  required to expose a new string/number/list.
 * ───────────────────────────────────────────────────────────── */

import { defaultCareersContent, type CareersContent } from "@/content/careers-schema";

export type SizeKey = "solo" | "growing" | "funded";
export type Band = [number, number];
export type PriceByScale = { solo: number; growing: number; funded: number };

export interface ServiceContent {
  key: string;
  label: string;
  note: string;
  reaction: string;
  own: string;
  days: Record<SizeKey, Band>;
  one?: Record<SizeKey, Band>;
  per?: Record<SizeKey, Band>;
}

export interface Content {
  site: {
    name: string;
    tagline: string;
    descriptor: string;
    description: string;
    url: string;
    locale: string;
  };
  contact: {
    email: string;
    whatsapp: string;
    whatsappDisplay: string;
    dmKeyword: string;
  };
  social: { instagram: string; twitter: string; linkedin: string };
  offer: { firstProjectDiscountPct: number };
  nav: {
    links: { label: string; href: string }[];
    cta: { label: string; href: string };
  };
  catalog: ServiceContent[];
  sizes: { key: SizeKey; label: string; note: string; reaction: string }[];
  whens: { key: string; label: string; note: string; reaction: string }[];
  proof: {
    isSample: boolean;
    stats: { tag: string; value: string; body: string; meta: string }[];
  };
  careers: CareersContent;
  /** Editable pricing knobs for the /pricing builder. Price is SCOPE-based:
   *  the base comes from the site/app TYPE the buyer picks (which reflects real
   *  complexity), NOT from a self-declared company size. Commercial levers +
   *  the base prices per type. (Add-on feature prices live in the builder.) */
  pricing: {
    advancePct: number;      // deposit to start, % of final
    firstProjectPct: number; // first-project discount, % off
    rushPct: number;         // rush surcharge, % on the build
    bundle: { pairPct: number; triadPct: number; quadBonusPct: number; mixedTrioPct: number };
    website: { landing: number; business: number; store: number; booking: number; webapp: number }; // one-time base by type
    app: { consumer: number; marketplace: number; saas: number; ondemand: number };                 // one-time base by type
    branding: number; // one-time
    marketing: number; // per month
    video: number;     // per month (base volume)
  };
}

export const defaultContent: Content = {
  site: {
    name: "branditbro",
    tagline: "We put any business online — websites, apps, marketing, video. Sorted.",
    descriptor: "Digital service agency · India",
    description:
      "branditbro is a digital services agency that puts businesses, creators and one-person brands online — website, app, ads, video — with a fixed price and a launch date agreed before anything starts. You own every account.",
    url: "https://branditbro.com",
    locale: "en_IN",
  },
  contact: {
    email: "support@branditbro.com",
    whatsapp: "919000000000",
    whatsappDisplay: "+91 90000 00000",
    dmKeyword: "BRO",
  },
  social: { instagram: "branditbro", twitter: "branditbro", linkedin: "branditbro" },
  offer: { firstProjectDiscountPct: 30 },
  nav: {
    links: [
      { label: "Services", href: "/services" },
      { label: "Pricing", href: "/pricing" },
    ],
    cta: { label: "Get in touch", href: "/contact" },
  },
  catalog: [
    {
      key: "website", label: "A website", note: "Somewhere people land and actually believe you",
      reaction: "Good call — fastest thing we build.", own: "A site you can update yourself, on your own domain",
      days: { solo: [3, 8], growing: [10, 18], funded: [21, 35] },
      one: { solo: [35000, 60000], growing: [75000, 150000], funded: [150000, 300000] },
    },
    {
      key: "app", label: "A mobile app", note: "Live on the App Store and Play Store",
      reaction: "Bigger build. We'll be straight with you about the timeline.", own: "A published app on both stores, in your developer account",
      days: { solo: [30, 50], growing: [45, 75], funded: [70, 120] },
      one: { solo: [120000, 200000], growing: [250000, 450000], funded: [500000, 900000] },
    },
    {
      key: "branding", label: "Branding", note: "Logo, colours, type — how you look everywhere",
      reaction: "Smart place to start. Everything else gets easier after it.", own: "Logo, colours, type and a one-page rulebook",
      days: { solo: [5, 9], growing: [10, 16], funded: [18, 28] },
      one: { solo: [25000, 45000], growing: [50000, 90000], funded: [100000, 200000] },
    },
    {
      key: "marketing", label: "Marketing", note: "Ads and posts that actually bring people in",
      reaction: "Worth it — once there's somewhere good to send people.", own: "Live campaigns in your ad accounts, reported monthly",
      days: { solo: [3, 6], growing: [5, 9], funded: [7, 14] },
      per: { solo: [15000, 25000], growing: [30000, 50000], funded: [60000, 120000] },
    },
    {
      key: "video", label: "Video editing", note: "Reels and shorts, cut and scheduled for you",
      reaction: "Cheapest attention you can buy right now.", own: "A month of edited, captioned, scheduled video",
      days: { solo: [3, 6], growing: [5, 9], funded: [7, 12] },
      per: { solo: [18000, 30000], growing: [35000, 60000], funded: [70000, 120000] },
    },
  ],
  sizes: [
    { key: "solo", label: "Just me", note: "Creator, freelancer, one-person operation", reaction: "Most of our work is for people exactly your size." },
    { key: "growing", label: "A small business", note: "Shop, clinic, studio or agency with a team", reaction: "Home ground. Half our clients look exactly like you." },
    { key: "funded", label: "A funded company", note: "Startup or scale-up with investors watching", reaction: "We've shipped at that pace before. No drama." },
  ],
  whens: [
    { key: "soon", label: "Yesterday, ideally", note: "Something's blocked until this exists", reaction: "Noted — we keep one fast slot open every month." },
    { key: "quarter", label: "Next month or two", note: "Planned, not panicked", reaction: "Perfect. Enough runway to do it properly." },
    { key: "later", label: "Just window shopping", note: "Zero pressure, genuinely", reaction: "All good. Look at the number, sit with it, come back whenever." },
  ],
  proof: {
    isSample: true,
    stats: [
      { tag: "Dental clinic · Indore", value: "31", body: "online appointments in the first month, from a site that replaced a phone number on a hoarding.", meta: "Website + local SEO · 12 days" },
      { tag: "Sweet shop · 2 outlets", value: "₹1.4L", body: "in festival pre-orders taken through a page that didn't exist eight weeks earlier.", meta: "Store + WhatsApp ordering + reels · 21 days" },
      { tag: "Fitness coach · Solo", value: "4×", body: "enquiries per week after 30 reels and one landing page that actually asks for the booking.", meta: "Landing page + video · ongoing" },
    ],
  },
  careers: defaultCareersContent,
  pricing: {
    advancePct: 25,
    firstProjectPct: 30,
    rushPct: 18,
    bundle: { pairPct: 8, triadPct: 14, quadBonusPct: 4, mixedTrioPct: 8 },
    website: { landing: 45000, business: 80000, store: 130000, booking: 95000, webapp: 190000 },
    app: { consumer: 260000, marketplace: 480000, saas: 360000, ondemand: 520000 },
    branding: 55000,
    marketing: 35000,
    video: 22000,
  },
};

/** Shape client components + the footer consume — mirrors the old site.config
 *  exports plus the derived social.instagramUrl. */
export interface ResolvedContent {
  site: Content["site"];
  contact: Content["contact"];
  social: {
    instagram: string; instagramUrl: string;
    twitter: string; twitterUrl: string;
    linkedin: string; linkedinUrl: string;
  };
  offer: Content["offer"];
  nav: Content["nav"];
  catalog: Content["catalog"];
  sizes: Content["sizes"];
  whens: Content["whens"];
  proof: Content["proof"];
  careers: Content["careers"];
  pricing: Content["pricing"];
}

export function resolveContent(c: Content): ResolvedContent {
  return {
    site: c.site,
    contact: c.contact,
    social: {
      instagram: c.social.instagram, instagramUrl: c.social.instagram ? `https://instagram.com/${c.social.instagram}` : "",
      twitter: c.social.twitter, twitterUrl: c.social.twitter ? `https://x.com/${c.social.twitter}` : "",
      linkedin: c.social.linkedin, linkedinUrl: c.social.linkedin ? `https://linkedin.com/company/${c.social.linkedin}` : "",
    },
    offer: c.offer,
    nav: c.nav,
    catalog: c.catalog,
    sizes: c.sizes,
    whens: c.whens,
    proof: c.proof,
    careers: c.careers,
    pricing: c.pricing,
  };
}

/** Deep-merge published/draft overrides over the defaults. Arrays are replaced
 *  wholesale (they're ordered lists), objects merged key-by-key. Anything
 *  missing in the override falls back to the default — so a partial or stale
 *  document can never blank out the site. */
export function mergeContent(base: Content, override: unknown): Content {
  if (!override || typeof override !== "object") return base;
  return deepMerge(base, override as Record<string, unknown>) as Content;
}

function deepMerge(base: unknown, over: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === "object") {
    if (!over || typeof over !== "object" || Array.isArray(over)) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of Object.keys(base as Record<string, unknown>)) {
      if (k in (over as Record<string, unknown>)) {
        out[k] = deepMerge((base as Record<string, unknown>)[k], (over as Record<string, unknown>)[k]);
      }
    }
    return out;
  }
  // primitive: take override if it's a compatible primitive
  return over === undefined || over === null ? base : over;
}
