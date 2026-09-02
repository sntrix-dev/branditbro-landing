"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { registerGsap, gsap, ScrollTrigger } from "@/lib/gsap";
import { PRICING_ENABLED } from "@/lib/flags";

const SPINE = [
  { n: "01", tag: "30 minutes", title: "The conversation", body: "One call, no slide deck. What you sell, who's not buying it, what's already been tried. If we're the wrong people for it, you'll hear that on this call and not after an invoice.", leave: "A straight answer on whether this is worth doing at all", tone: "default" as const },
  { n: "02", tag: "2–3 days later", title: "Scope on paper", body: "Every deliverable listed as a line item with a price and a date beside it. What's explicitly not included is listed too — that page is usually longer, and it's the one that prevents arguments in week five.", leave: "A fixed number, a fixed date, and the exit terms in writing", tone: "default" as const },
  { n: "03", tag: "Your exit point", title: "The first direction", body: "You see real work, not a mood board. If it misses — genuinely misses, not “make the logo bigger” — you stop here, keep everything we've made, and pay nothing. We'd rather lose a project than build something you have to defend to your own team.", leave: "Either conviction, or your money and the files", tone: "mango" as const },
  { n: "04", tag: "The long middle", title: "Built in the open", body: "A live link from the first week, updated as we go. No mystery period, no “it's coming along nicely”. You watch it get built, and you can see exactly which day something slipped.", leave: "A weekly link and one short update — never a status meeting", tone: "default" as const },
  { n: "05", tag: "Launch day", title: "Going live", body: "Checked on real devices, tracking verified firing, forms tested end to end, speed measured and recorded. Then the keys: domains, accounts, repositories and passwords, transferred to you the same day.", leave: "Full ownership and a recorded walkthrough for your team", tone: "default" as const },
  { n: "06", tag: "The 30 days after", title: "After the launch", body: "A month of fixes with no invoice attached, because the first weeks are when real users find what we didn't. After that you either run it yourself — you have everything you need to — or we stay on monthly. Both are fine with us.", leave: "Something that works, that you own, that you can leave with", tone: "teal" as const },
];

export default function HowItWorksPage() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        // COLD OPEN — letterbox opens, title recedes
        const bars = el.querySelectorAll<HTMLElement>("[data-bar]");
        const copy = el.querySelector<HTMLElement>("[data-open-copy]");
        const glow = el.querySelector<HTMLElement>("[data-open-glow]");
        const cue = el.querySelector<HTMLElement>("[data-cue]");
        const openTl = gsap.timeline({ scrollTrigger: { trigger: "[data-open]", start: "top top", end: "bottom bottom", scrub: 0.5 } });
        openTl.to(bars, { height: "0vh", ease: "power2.out", duration: 0.5 }, 0)
          .to(copy, { y: -70, scale: 0.92, ease: "none", duration: 1 }, 0)
          .to(copy, { autoAlpha: 0, ease: "none", duration: 0.4 }, 0.45)
          .to(glow, { scale: 1.35, ease: "none", duration: 1 }, 0)
          .to(cue, { autoAlpha: 0, duration: 0.25 }, 0);

        // SPINE — horizontal rail, counter + progress + active-card lift
        const rail = el.querySelector<HTMLElement>("[data-rail]");
        const pin = el.querySelector<HTMLElement>("[data-spine-pin]");
        const counter = el.querySelector<HTMLElement>("[data-counter]");
        const railBar = el.querySelector<HTMLElement>("[data-rail-bar]");
        // Scope to the DESKTOP rail only — the mobile carousel also renders
        // [data-stagecard]s (display:none here), and including them would give
        // the last card a zero offset and collapse the scroll distance.
        const cards = rail
          ? gsap.utils.toArray<HTMLElement>(rail.querySelectorAll<HTMLElement>("[data-stagecard]"))
          : [];
        if (rail && pin && cards.length) {
          const first = cards[0];
          const last = cards[cards.length - 1];
          // Translate the rail so card 1 is centred at progress 0 and card 6
          // is centred at progress 1 — measured from the real layout, so neither
          // end card is stranded at the edge and it survives a resize.
          const centreOf = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2;
          const xStart = () => window.innerWidth / 2 - centreOf(first);
          const xEnd = () => window.innerWidth / 2 - centreOf(last);
          // Progress across the whole 520vh section drives the translate — no pin,
          // just CSS sticky + scrub. Long section = slow scroll, per the design.
          gsap.fromTo(
            rail,
            { x: () => xStart() },
            {
            x: () => xEnd(),
            ease: "none",
            scrollTrigger: {
              trigger: "[data-spine]",
              start: "top top",
              end: "bottom bottom",
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const p = self.progress;
                if (railBar) railBar.style.width = (p * 100).toFixed(2) + "%";
                if (counter) {
                  const idx = Math.min(SPINE.length, Math.floor(p * SPINE.length * 0.999) + 1);
                  const label = ("0" + idx).slice(-2);
                  if (counter.textContent !== label) counter.textContent = label;
                }
                const mid = window.innerWidth / 2;
                const vw = window.innerWidth;
                // Read pass first (batched), then write pass — never interleave
                // getBoundingClientRect with style writes or every card forces
                // its own reflow.
                const nears = cards.map((card) => {
                  const r = card.getBoundingClientRect();
                  const d = Math.abs(r.left + r.width / 2 - mid) / vw;
                  return Math.max(0, 1 - d * 1.8);
                });
                for (let i = 0; i < cards.length; i++) {
                  const near = nears[i];
                  cards[i].style.transform = "translateY(" + (-near * 10).toFixed(1) + "px)";
                  cards[i].style.opacity = (0.45 + near * 0.55).toFixed(3);
                }
              },
            },
          });
        }

        // INTERLUDE — settles into place
        const inter = el.querySelector<HTMLElement>("[data-interlude]");
        if (inter) {
          gsap.fromTo(inter, { y: 40 }, {
            y: -40, ease: "none",
            scrollTrigger: { trigger: "[data-interlude-scene]", start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      });
      ScrollTrigger.refresh();
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="font-sans bg-ink text-cream w-full overflow-x-clip">
      {/* ══ COLD OPEN — desktop cinematic ══ */}
      <section data-open className="relative h-[190vh] hidden lg:block">
        <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
          <div data-bar aria-hidden className="absolute top-0 left-0 right-0 h-[18vh] z-[3]" style={{ background: "#0B0806" }} />
          <div data-bar aria-hidden className="absolute bottom-0 left-0 right-0 h-[18vh] z-[3]" style={{ background: "#0B0806" }} />
          <div data-open-glow aria-hidden className="absolute w-[900px] h-[900px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,122,0,0.3) 0%, rgba(255,122,0,0) 66%)" }} />
          <div data-open-copy className="relative z-[4] max-w-[1000px] px-12 text-center flex flex-col items-center gap-[26px]">
            <span className="text-[12.5px] tracking-[0.38em] uppercase font-bold text-mango-soft" style={{ animation: "bibFlicker 4s ease-in-out infinite" }}>How it works</span>
            <h1 className="font-display font-extrabold text-[clamp(42px,6.4vw,100px)] leading-[0.9] tracking-[-0.05em] m-0 balance">Six stages. Nothing hidden in between.</h1>
            <p className="m-0 text-[18px] leading-[1.55] text-cream/65 max-w-[50ch] pretty">Most agencies go quiet after the deposit. This is the whole thing, start to finish, including the parts where you can walk away.</p>
            <span data-cue className="mt-3 text-[13px] tracking-[0.24em] uppercase font-bold text-cream/50" style={{ animation: "bibCue 2.2s ease-in-out infinite" }}>Scroll ↓</span>
          </div>
        </div>
      </section>
      {/* COLD OPEN — mobile */}
      <section className="lg:hidden relative px-6 pt-[150px] pb-24 text-center flex flex-col items-center gap-6 overflow-hidden">
        <div aria-hidden className="absolute pointer-events-none" style={{ top: "10%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,122,0,0.25) 0%, rgba(255,122,0,0) 66%)" }} />
        <span className="relative text-[12px] tracking-[0.36em] uppercase font-bold text-mango-soft">How it works</span>
        <h1 className="relative font-display font-extrabold text-[clamp(42px,11vw,70px)] leading-[0.9] tracking-[-0.05em] m-0 balance">Six stages. Nothing hidden in between.</h1>
        <p className="relative m-0 text-[17px] leading-[1.55] text-cream/65 pretty">Most agencies go quiet after the deposit. This is the whole thing, start to finish — including the parts where you can walk away.</p>
      </section>

      {/* ══ SPINE — desktop, tall sticky section (matches the design's pacing) ══ */}
      {/* 520vh drives a long, slow horizontal scroll via CSS sticky + scrub —
          exactly the mechanism the design file used. */}
      <section data-spine className="relative h-[520vh] bg-ink hidden lg:block">
        <div data-spine-pin className="sticky top-0 h-screen min-h-[660px] overflow-hidden flex flex-col justify-center">
          <div className="px-12 pb-[30px] max-w-[1240px] w-full mx-auto flex items-end justify-between gap-6">
            <div className="flex flex-col gap-[10px]">
              <span className="text-[12px] tracking-[0.3em] uppercase font-bold text-mango-soft">The spine</span>
              <h2 className="font-display font-extrabold text-[clamp(26px,3vw,44px)] leading-[0.98] tracking-[-0.04em] m-0">Every project runs on the same rails.</h2>
            </div>
            <div className="flex items-baseline gap-2">
              <span data-counter className="font-display font-extrabold text-[42px] tracking-[-0.04em] text-mango leading-none">01</span>
              <span className="text-[14px] font-bold text-cream/45">/ 06</span>
            </div>
          </div>
          <div className="overflow-hidden py-[10px]">
            <div data-rail className="flex gap-[26px] px-12 will-change-transform">
              {SPINE.map((s) => (
                <SpineCard key={s.n} s={s} />
              ))}
            </div>
          </div>
          <div className="pt-[26px] px-12 max-w-[1240px] w-full mx-auto">
            <div className="h-[3px] bg-cream/15 rounded-full overflow-hidden">
              <div data-rail-bar className="h-full w-0 bg-mango" />
            </div>
          </div>
        </div>
      </section>
      {/* SPINE — mobile carousel */}
      <section className="lg:hidden bg-ink px-6 py-20">
        <span className="text-[12px] tracking-[0.3em] uppercase font-bold text-mango-soft">The spine</span>
        <h2 className="font-display font-extrabold text-[clamp(26px,7vw,44px)] leading-[0.98] tracking-[-0.04em] mt-3 mb-8">Every project runs on the same rails.</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 pb-2">
          {SPINE.map((s) => (
            <div key={s.n} className="snap-start"><SpineCard s={s} mobile /></div>
          ))}
        </div>
      </section>

      {/* ══ INTERLUDE ══ */}
      <section data-interlude-scene className="relative h-[150vh] bg-cream text-ink hidden lg:block">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden px-12">
          <div data-interlude className="max-w-[900px] text-center flex flex-col gap-[22px]">
            <span className="text-[12.5px] tracking-[0.36em] uppercase font-bold text-brown">Interlude</span>
            <h2 className="font-display font-extrabold text-[clamp(34px,5vw,76px)] leading-[0.94] tracking-[-0.05em] m-0 balance">The stage everyone else skips is the one we build the whole process around.</h2>
            <p className="m-0 text-[17.5px] leading-[1.55] text-brown-ink pretty">Stage three exists so you never have to sit through a project you already know is wrong. It costs us occasionally. It has never once cost a client.</p>
          </div>
        </div>
      </section>
      <section className="lg:hidden bg-cream text-ink px-6 py-24 text-center flex flex-col items-center gap-5">
        <span className="text-[12.5px] tracking-[0.36em] uppercase font-bold text-brown">Interlude</span>
        <h2 className="font-display font-extrabold text-[clamp(32px,8vw,56px)] leading-[0.94] tracking-[-0.05em] m-0 balance">The stage everyone else skips is the one we build the whole process around.</h2>
        <p className="m-0 text-[16.5px] leading-[1.55] text-brown-ink pretty">Stage three exists so you never sit through a project you already know is wrong. It costs us occasionally. It has never once cost a client.</p>
      </section>

      {/* ══ WHAT WE NEED ══ */}
      <section className="bg-cream text-ink px-6 sm:px-12 py-[100px]">
        <div className="max-w-[1180px] mx-auto grid gap-14 items-start lg:grid-cols-[0.8fr_1.2fr]">
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(30px,3.6vw,52px)] leading-[0.96] tracking-[-0.045em] m-0 balance">What we need from you. All of it.</h2>
          <div className="flex flex-col gap-[18px]">
            {[["01", "One person who can say yes", "Not a committee. Projects die in the gap between four opinions and no decision."], ["02", "Your material, once, at the start", "Photos, product details, whatever you already have. We'll tell you exactly what's missing and write the rest."], ["03", "Feedback in one pass, not five", "Collect everything, send it together. Drip-fed changes are what turn a three-week build into three months."]].map(([n, h, b], i) => (
              <div key={n} data-reveal data-delay={String(i * 80)} className="reveal flex gap-[18px] items-start bg-white rounded-[20px] p-6">
                <span className="font-display font-extrabold text-[22px] text-mango leading-none">{n}</span>
                <div className="flex flex-col gap-[5px]">
                  <span className="text-[17px] font-bold">{h}</span>
                  <span className="text-[15.5px] leading-[1.5] text-brown-ink">{b}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHEN IT GOES WRONG ══ */}
      <section className="bg-sand text-ink px-6 sm:px-12 py-24">
        <div className="max-w-[1180px] mx-auto flex flex-col gap-10">
          <div data-reveal className="reveal flex flex-col gap-[14px] max-w-[46ch]">
            <span className="text-[12.5px] tracking-[0.3em] uppercase font-bold text-brown">The honest part</span>
            <h2 className="font-display font-extrabold text-[clamp(30px,3.6vw,52px)] leading-[0.96] tracking-[-0.045em] m-0 balance">And when something goes wrong?</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[["We're running late", "You hear it the day we know, not on the deadline. New date, reason, what we're cutting to protect it."], ["You want something new mid-build", "Quoted separately with its own date, before anyone starts. Nothing gets absorbed quietly and billed later."], ["It just isn't working out", "You pay for what's finished, take every file and login, and go. No lock-in clause, no hostage accounts."]].map(([h, b], i) => (
              <div key={h} data-reveal data-delay={String(i * 80)} className="reveal flex flex-col gap-[9px] border-t-2 border-ink pt-[18px]">
                <span className="text-[17px] font-bold">{h}</span>
                <span className="text-[15.5px] leading-[1.5] text-brown-ink">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CLOSE ══ */}
      <section className="relative bg-ink text-cream px-6 sm:px-12 pt-[130px] pb-24 overflow-hidden">
        <div aria-hidden className="absolute pointer-events-none" style={{ bottom: "-320px", left: "50%", transform: "translateX(-50%)", width: "820px", height: "820px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,122,0,0.3) 0%, rgba(255,122,0,0) 66%)" }} />
        <div className="relative max-w-[900px] mx-auto flex flex-col items-center text-center gap-[26px]">
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(34px,4.6vw,70px)] leading-[0.94] tracking-[-0.05em] m-0 balance">That&apos;s the whole film. No deleted scenes.</h2>
          <p data-reveal data-delay="80" className="reveal m-0 text-[17px] leading-[1.55] text-cream/70 max-w-[52ch] pretty">{PRICING_ENABLED ? "If the process sounds like something you'd want to be inside, the next step is a number — and you can get that without speaking to anyone." : "If the process sounds like something you'd want to be inside, tell us what you're building — we'll reply within a day with a plan, a price and a date."}</p>
          <div data-reveal data-delay="160" className="reveal flex flex-wrap gap-[14px] justify-center">
            <Link href={PRICING_ENABLED ? "/pricing" : "/contact"} className="text-[16px] font-bold py-[18px] px-8 rounded-full bg-mango text-ink transition-transform duration-200 hover:-translate-y-[2px]">{PRICING_ENABLED ? "See my estimate →" : "Get in touch →"}</Link>
            <Link href="/services" className="text-[16px] font-bold py-[18px] px-8 rounded-full border-[1.5px] border-cream/30 text-cream transition-colors hover:border-cream">What we build</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SpineCard({ s, mobile }: { s: (typeof SPINE)[number]; mobile?: boolean }) {
  const base = mobile ? "w-[80vw] max-w-[420px]" : "w-[460px]";
  const bg =
    s.tone === "mango"
      ? "bg-mango/10 border border-mango/40"
      : s.tone === "teal"
      ? "border"
      : "bg-cream/5 border border-cream/13";
  const tealStyle = s.tone === "teal" ? { background: "rgba(14,107,94,0.22)", borderColor: "rgba(14,107,94,0.6)" } : undefined;
  const tagColor = s.tone === "mango" ? "text-mango-soft" : s.tone === "teal" ? "text-cream/50" : "text-cream/42";
  const bodyColor = s.tone === "default" ? "text-cream/72" : s.tone === "mango" ? "text-cream/78" : "text-cream/78";
  const leaveColor = s.tone === "default" ? "text-cream/80" : "text-cream/86";
  const rule = s.tone === "mango" ? "border-mango/30" : s.tone === "teal" ? "border-cream/20" : "border-cream/15";

  return (
    <div
      data-stagecard
      className={`shrink-0 ${base} flex flex-col gap-[18px] rounded-[26px] p-8 ${bg}`}
      style={tealStyle}
    >
      <div className="flex items-baseline justify-between gap-[14px]">
        <span className="font-display font-extrabold text-[15px] tracking-[0.14em] text-mango">{s.n}</span>
        <span className={`text-[12.5px] font-bold ${tagColor}`}>{s.tag}</span>
      </div>
      <h3 className="font-display font-extrabold text-[32px] leading-none tracking-[-0.04em] m-0">{s.title}</h3>
      <p className={`m-0 text-[16px] leading-[1.5] ${bodyColor}`}>{s.body}</p>
      <div className={`flex flex-col gap-2 border-t ${rule} pt-4`}>
        <span className="text-[12px] tracking-[0.18em] uppercase font-bold text-mango-soft">You leave with</span>
        <span className={`text-[15px] leading-[1.45] ${leaveColor}`}>{s.leave}</span>
      </div>
    </div>
  );
}
