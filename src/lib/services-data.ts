export interface ServicePage {
  id: string;
  n: string;
  title: string;
  blurb: string;
  imageCaption: string;
  deliverables: string[];
  process: [string, string][];
  undo: string[];
  stack: string[];
  theme: "light" | "ink";
}

export const servicePages: ServicePage[] = [
  {
    id: "website",
    n: "01",
    title: "Websites & web apps",
    blurb:
      "Marketing sites and product front-ends built to survive real traffic, real editors and Google's actual ranking signals — not a template with your logo dropped in.",
    imageCaption: "Recent site — desktop + mobile view",
    deliverables: [
      "Design system in Figma — components, states, tokens",
      "Responsive build, mobile-first, tested on real devices",
      "CMS your team can edit without calling us",
      "Lighthouse ≥ 90 on mobile performance and accessibility",
      "On-page SEO, sitemap, schema markup, OG images",
      "GA4 + event tracking on every conversion action",
      "Staging and production environments, both yours",
      "30 days of post-launch fixes, no invoice",
    ],
    process: [
      ["01 · Scope", "Sitemap, page inventory, success metric agreed in writing"],
      ["02 · Structure", "Wireframes and copy skeleton before a pixel is styled"],
      ["03 · Design", "Full comps, one structured review round, sign-off"],
      ["04 · Build", "Component build, CMS modelling, content load"],
      ["05 · QA", "Cross-device, Lighthouse, forms, tracking verification"],
      ["06 · Handover", "Launch, credentials transfer, walkthrough recording"],
    ],
    undo: [
      "A site scoring 30 on mobile because it ships 4MB of unused script",
      "No analytics, so nobody can say which page brings enquiries",
      "A CMS locked by the last agency — every text edit is a support ticket",
      "Templates with no semantic structure, invisible to search",
    ],
    stack: ["Next.js", "Astro", "Webflow", "Sanity", "Tailwind", "Vercel", "GA4", "Search Console"],
    theme: "light",
  },
  {
    id: "app",
    n: "02",
    title: "Mobile applications",
    blurb:
      "Cross-platform apps shipped to both stores under your developer accounts, instrumented from day one so you can see retention instead of guessing at it.",
    imageCaption: "App screens — three key states",
    deliverables: [
      "iOS and Android from one maintained codebase",
      "Store listings, screenshots and review submission handled",
      "Auth, database and storage on infrastructure you own",
      "Crash reporting and release-over-release stability tracking",
      "Product analytics: activation, retention, funnel events",
      "Push notifications and deep links wired at launch",
      "CI pipeline so future updates ship without us",
      "Repository, keys and certificates transferred at handover",
    ],
    process: [
      ["01 · Spec", "Feature list cut to a shippable v1, with what's explicitly out"],
      ["02 · Flows", "Screen map and edge cases before design begins"],
      ["03 · Prototype", "Clickable build you can put in front of real users"],
      ["04 · Sprints", "Two-week cycles, a working build at the end of each"],
      ["05 · Beta", "TestFlight and internal track, crash triage, fixes"],
      ["06 · Release", "Store review, staged rollout, post-launch monitoring"],
    ],
    undo: [
      "Apps published under the agency's developer account",
      "Zero analytics, so nobody knows where users drop off",
      "No crash reporting — bugs found only via store reviews",
      "A v1 so overloaded it never reached the store at all",
    ],
    stack: ["React Native", "Expo", "Supabase", "Firebase", "RevenueCat", "Sentry", "App Store Connect", "Play Console"],
    theme: "ink",
  },
  {
    id: "branding",
    n: "03",
    title: "Brand identity systems",
    blurb:
      "Not a logo file. A system with rules — sizes, contrast, spacing, tone — so everything your team makes after we leave still looks like the same company.",
    imageCaption: "Identity system — marks, palette, applications",
    deliverables: [
      "Primary mark plus responsive variants down to favicon size",
      "Type scale with licensed or open-source fonts named",
      "Colour system tested to WCAG AA on every pairing",
      "Usage rules: clear space, minimum sizes, what not to do",
      "Asset kit — SVG, PNG, PDF, light and dark, in one folder",
      "Social profile set and post templates your team can edit",
      "Voice guide: how you sound, with real before/after lines",
      "Editable source files, not flattened exports",
    ],
    process: [
      ["01 · Discovery", "Positioning, audience, competitive set, non-negotiables"],
      ["02 · Territories", "Two or three distinct directions, argued not decorated"],
      ["03 · Refinement", "One chosen route, taken to production quality"],
      ["04 · System", "Type, colour, layout and component rules documented"],
      ["05 · Applications", "Applied to the surfaces you actually use daily"],
      ["06 · Rollout", "Asset kit, guidelines and a walkthrough for your team"],
    ],
    undo: [
      "A logo that dissolves below 40px and has no dark version",
      "Palettes that fail contrast, so text is unreadable on mobile",
      "JPEGs only — no vector source, nothing anyone can extend",
      "A 60-page brand book nobody on the team has opened",
    ],
    stack: ["Figma", "Illustrator", "Variable fonts", "WCAG contrast audit", "Canva handoff kit"],
    theme: "light",
  },
  {
    id: "marketing",
    n: "04",
    title: "Performance marketing",
    blurb:
      "Paid acquisition run against cost per qualified lead, in ad accounts you own, with tracking we can prove is correct before a rupee is spent.",
    imageCaption: "Campaign dashboard or creative set",
    deliverables: [
      "Ad accounts, pixels and business manager in your name",
      "Conversion tracking verified end to end, server-side where needed",
      "Campaign structure built for testing, not for looking busy",
      "Creative produced and refreshed on a fixed cadence",
      "Landing pages built and iterated against the ads",
      "Lead routing into WhatsApp, CRM or your inbox",
      "Monthly report on spend, CPL, CAC and what changed",
      "Ad budget paid by you, direct to the platform, never marked up",
    ],
    process: [
      ["01 · Audit", "Account access, historical data, tracking integrity check"],
      ["02 · Offer", "The thing being sold, sharpened before spend starts"],
      ["03 · Launch", "Small budget, clean structure, one variable at a time"],
      ["04 · Test", "Weekly creative and audience cycles, documented"],
      ["05 · Scale", "Budget moves to what clears your cost target"],
      ["06 · Report", "One monthly call, plain numbers, next month's plan"],
    ],
    undo: [
      "Ad accounts owned by the last agency, history lost on exit",
      "Conversions firing on page load, so every number is fiction",
      "Boosted posts reported as a campaign strategy",
      "Reports full of reach and likes, silent on cost per lead",
    ],
    stack: ["Meta Ads", "Google Ads", "GA4", "Conversions API", "Tag Manager", "Looker Studio", "WhatsApp Business"],
    theme: "ink",
  },
  {
    id: "video",
    n: "05",
    title: "Video & short-form",
    blurb:
      "A production line, not one-off edits: raw footage in, captioned and scheduled verticals out, on a cadence the algorithm can actually reward.",
    imageCaption: "Frames from a recent edit",
    deliverables: [
      "A monthly content plan tied to what you're actually selling",
      "Shot lists so filming takes one session, not five",
      "Edited verticals for Reels, Shorts and TikTok",
      "Burned-in captions, correctly timed, in your brand type",
      "Hook variants for the first two seconds, tested",
      "Thumbnails and covers cut to platform specs",
      "Scheduling and publishing handled, or files delivered",
      "Project files and all raw footage returned to you",
    ],
    process: [
      ["01 · Plan", "Month of concepts approved in one sitting"],
      ["02 · Capture", "You film to the shot list, or we shoot on location"],
      ["03 · Edit", "Cut, colour, sound, motion titles, brand furniture"],
      ["04 · Caption", "Accurate subtitles — most of your audience watches muted"],
      ["05 · Review", "Timestamped comments, one round, fast turnaround"],
      ["06 · Publish", "Scheduled to a consistent slot, performance noted"],
    ],
    undo: [
      "Horizontal footage cropped to vertical with heads cut off",
      "No captions on a feed watched almost entirely on mute",
      "The point arriving at second nine, long after the scroll",
      "Three posts in one week, then nothing for two months",
    ],
    stack: ["Premiere Pro", "After Effects", "DaVinci Resolve", "Descript", "Frame.io", "Metricool"],
    theme: "light",
  },
];
