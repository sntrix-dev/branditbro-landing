import ServiceVisual from "@/components/ServiceVisual";
import PlayOnView from "@/components/PlayOnView";

/**
 * The five-service showcase, ported from the BrandItBro Services design.
 * Each row: number, heading, description, animated chips (the "lit" chip is
 * delay-matched to the visible scene), and the animated ServiceVisual panel.
 * Backgrounds alternate cream → sand → cream → ink → teal; the visual sits
 * right / left / right / left / right on desktop and always drops BELOW the
 * copy on mobile. Contrast-tuned: accent numbers and body text meet WCAG AA.
 */

type Row = {
  id: "website" | "app" | "brand" | "marketing" | "content";
  n: string;
  title: string;
  blurb: string;
  chips: string[];
  section: string; // bg + base text
  border: boolean;
  nColor: string;
  body: string;
  chipBase: string;
  chipLit: string;
  visualLeft: boolean; // desktop side of the visual
};

const ROWS: Row[] = [
  {
    id: "website", n: "01", title: "Websites that close.",
    blurb: "A shop, a clinic, or your own name — one page or fifty, built around the single thing you want a stranger to do next.",
    chips: ["Design", "Copywriting", "Build & hosting", "SEO groundwork"],
    section: "bg-cream text-ink", border: true, nColor: "text-[#C22A1A]", body: "text-brown-ink",
    chipBase: "bg-sand text-ink", chipLit: "bg-ink text-cream", visualLeft: false,
  },
  {
    id: "app", n: "02", title: "Apps, without the theatre.",
    blurb: "Idea to App Store with a scope you can read in one sitting. iOS, Android and the boring backend that keeps it alive.",
    chips: ["iOS & Android", "Backend", "Payments", "Store launch"],
    section: "bg-sand text-ink", border: true, nColor: "text-[#C22A1A]", body: "text-brown-ink",
    chipBase: "bg-cream text-ink", chipLit: "bg-ink text-cream", visualLeft: true,
  },
  {
    id: "brand", n: "03", title: "A brand that looks like it meant to.",
    blurb: "Logo, colours, type and the rules that hold them together — so every site, ad and reel we build after this already matches.",
    chips: ["Logo & identity", "Palette & type", "Social kit", "Brand rulebook"],
    section: "bg-cream text-ink", border: true, nColor: "text-[#C22A1A]", body: "text-brown-ink",
    chipBase: "bg-sand text-ink", chipLit: "bg-ink text-cream", visualLeft: false,
  },
  {
    id: "marketing", n: "04", title: "Get in front of people already searching.",
    blurb: "Demand you don’t have to create. We put you where the intent already is, then keep only what pays.",
    chips: ["Meta & Google ads", "Local SEO", "Landing pages", "WhatsApp funnels"],
    section: "bg-ink text-cream", border: false, nColor: "text-mango", body: "text-cream/70",
    chipBase: "bg-cream/10 text-cream", chipLit: "bg-mango text-ink", visualLeft: true,
  },
  {
    id: "content", n: "05", title: "Enough content to look unmissable.",
    blurb: "One shoot, a month of cuts. Hooks written, captions burned in, posted on a schedule you don’t have to think about.",
    chips: ["Reels & shorts", "Editing", "Thumbnails", "Scheduling"],
    section: "bg-teal text-cream", border: false, nColor: "text-[#FFD9B0]", body: "text-cream/90",
    chipBase: "bg-cream/15 text-cream", chipLit: "bg-mango text-ink", visualLeft: false,
  },
];

function Chips({ chips, base, lit }: { chips: string[]; base: string; lit: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((label, i) => (
        <span
          key={label}
          data-sv-chip
          className={`relative py-[9px] px-4 rounded-full text-[13px] sm:text-[13.5px] font-bold ${base}`}
        >
          {label}
          <span
            className={`absolute inset-0 flex items-center justify-center rounded-full ${lit}`}
            style={{ animation: "svL 13.6s linear infinite backwards", animationDelay: `${i * 3.4}s` }}
          >
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function ServicesShowcase() {
  return (
    <>
      {ROWS.map((r) => (
        <div
          key={r.id}
          className={`${r.section} ${r.border ? "border-t-[1.5px] border-ink/15" : ""} py-16 sm:py-[96px] px-6 sm:px-12`}
        >
          <PlayOnView
            className={`max-w-[1180px] mx-auto grid grid-cols-1 gap-10 lg:gap-14 items-center ${
              r.visualLeft ? "lg:grid-cols-[1fr_0.92fr]" : "lg:grid-cols-[0.92fr_1fr]"
            }`}
          >
            {/* copy — always first in DOM (so it leads on mobile) */}
            <div className={`flex flex-col gap-[18px] sm:gap-[22px] ${r.visualLeft ? "lg:order-2" : ""}`}>
              <span className={`font-display font-extrabold text-[15px] tracking-[0.06em] ${r.nColor}`}>{r.n}</span>
              <h3 className="font-display font-extrabold text-[clamp(32px,7.5vw,58px)] leading-[0.94] tracking-[-0.04em] m-0 balance">{r.title}</h3>
              <p className={`m-0 text-[16px] sm:text-[18px] leading-[1.5] max-w-[40ch] pretty ${r.body}`}>{r.blurb}</p>
              <Chips chips={r.chips} base={r.chipBase} lit={r.chipLit} />
            </div>

            {/* animated visual — auto-scales; drops below the copy on mobile */}
            <div data-reveal className={`reveal w-full ${r.visualLeft ? "lg:order-1" : ""}`}>
              <ServiceVisual id={r.id} />
            </div>
          </PlayOnView>
        </div>
      ))}
    </>
  );
}
