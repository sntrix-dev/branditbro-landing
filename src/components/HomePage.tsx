"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { registerGsap, gsap, ScrollTrigger } from "@/lib/gsap";
import { useContent } from "@/components/ContentProvider";
import HeroWorkbench from "@/components/HeroWorkbench";
import ServicesShowcase from "@/components/ServicesShowcase";
import { PRICING_ENABLED } from "@/lib/flags";

/** Audience marquee — who this is for, scrolling under the hero copy. */
const AUDIENCE = [
  "Local shops", "Clinics & studios", "Creators", "Coaches & consultants", "Solo founders", "Startups",
  "Cafés & restaurants", "Salons & spas", "Gyms & trainers", "Photographers", "Dentists & doctors",
  "Boutiques", "Tutors & academies", "Real estate", "Event planners", "D2C brands",
];

const STAGES = [
  { n: "01", title: "Brief", meta: "· day 1", body: "Forty minutes on a call. We leave with the scope, the price and a launch date sized to your actual job — not a template promise.", dark: true },
  { n: "02", title: "Direction", meta: "· 1–3 days", body: "One route, not six. You approve the look and the words before a single thing gets built.", dark: false },
  { n: "03", title: "Build", meta: "· 3 days to 8 weeks", body: "A live link from the first build day. You watch it fill in every evening instead of waiting for a reveal.", dark: true },
  { n: "04", title: "Review", meta: "· one round", body: "One round, everything at once, on the same page. No drip-feed of comments across three weeks.", dark: false },
  { n: "05", title: "Live", meta: "· on the agreed date", body: "Launched on the date we gave you, in your name, passwords handed over. If a date ever slips, you hear it from us first.", dark: true },
];

export default function HomePage() {
  const { proof } = useContent();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* Hero right column (the workbench) is a self-contained CSS animation
         with its own interactivity — see HeroWorkbench. Nothing to wire here. */

      /* ── ACT I · dot-flood transition: EVERY screen size (mobile + desktop),
            motion users only. Pure CSS-sticky pinning, so it scrubs smoothly on
            phones too. Reduced-motion falls back via globals.css. ── */
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const darkDot = el.querySelector<HTMLElement>("[data-dark-dot]");
        const darkA = el.querySelector<HTMLElement>("[data-dark-a]");
        const darkB = el.querySelector<HTMLElement>("[data-dark-b]");
        if (darkDot && darkA && darkB) {
          const need = (Math.max(window.innerWidth, window.innerHeight) * 2.4) / 60;
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: "[data-dark-scene]",
              start: "top top",
              end: "bottom bottom",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
          tl.fromTo(darkA, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.94, duration: 0.3, ease: "none" }, 0.05)
            .fromTo(darkDot, { scale: 0.12 }, { scale: need, duration: 0.62, ease: "power2.in" }, 0.18)
            .fromTo(darkB, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out" }, 0.64);
        }
        return () => {};
      });

      /* ── the rich, device-specific scenes: desktop only ── */
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        // hero glow drifts up on scroll
        const glow = el.querySelector<HTMLElement>("[data-hero-glow]");
        if (glow) {
          gsap.to(glow, {
            yPercent: 18, scale: 1.4, opacity: 0.3, ease: "none",
            scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
          });
        }

        // scroll dot: gentle bob
        const dot = el.querySelector<HTMLElement>("[data-scroll-dot]");
        if (dot) gsap.to(dot, { y: 6, duration: 0.9, ease: "sine.inOut", repeat: -1, yoyo: true });

        // ACT III · vertical scroll drives the horizontal 14-days track (pinned)
        const track = el.querySelector<HTMLElement>("[data-track]");
        const pin = el.querySelector<HTMLElement>("[data-track-pin]");
        if (track && pin) {
          const overflow = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);
          gsap.to(track, {
            x: () => -overflow(),
            ease: "none",
            scrollTrigger: {
              trigger: "[data-track-scene]",
              start: "top top",
              end: () => "+=" + overflow(),
              scrub: 0.5,
              pin: pin,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
        }
        return () => {};
      });

      ScrollTrigger.refresh();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="font-sans bg-ink text-cream w-full overflow-x-clip">
      {/* mobile-only: availability as a recurring bottom-right notification toast */}
      <div className="sm:hidden fixed bottom-[18px] right-[14px] z-[45] pointer-events-none">
        <span
          className="inline-flex items-center gap-[10px] py-[10px] pr-[16px] pl-3 rounded-full border border-cream/20 text-[12.5px] font-bold tracking-[0.02em] text-cream"
          style={{
            background: "rgba(22,16,13,0.9)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 18px 42px -16px rgba(0,0,0,0.9)",
            opacity: 0,
            animation: "bibToast 9s ease-in-out infinite",
          }}
        >
          <span className="w-[7px] h-[7px] rounded-full bg-mango" />
          Taking 4 projects for August
        </span>
      </div>
      {/* ══════════ HERO ══════════ */}
      <section
        id="top"
        data-hero
        className="relative min-h-[100svh] flex items-center px-5 sm:px-12 pt-[100px] sm:pt-[132px] pb-16 sm:pb-[92px] overflow-hidden"
      >
        <div
          data-hero-glow
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "46%", right: "-180px", width: "940px", height: "940px", margin: "-470px 0 0 0", borderRadius: "999px",
            background: "radial-gradient(circle, rgba(255,122,0,0.3) 0%, rgba(226,62,44,0.14) 44%, rgba(22,16,13,0) 70%)",
          }}
        />
        {/* Mobile: one centred column — big title, centred description, then the
            animation, then the actions. Desktop: two columns (copy left, animation
            right) via explicit grid placement. */}
        <div className="relative max-w-[1240px] mx-auto w-full grid grid-cols-1 gap-y-7 items-center lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-x-[72px] lg:gap-y-[34px] lg:content-center">

          {/* COPY — title + description */}
          <div className="flex flex-col items-center text-center gap-5 lg:items-start lg:text-left lg:gap-[34px] lg:col-start-1 lg:row-start-1">
            {/* desktop static badge; on mobile it's the floating bottom-right toast */}
            <span data-reveal className="reveal hidden sm:inline-flex self-start items-center gap-[10px] py-[9px] pr-4 pl-3 rounded-full border border-cream/20 text-[12.5px] font-bold tracking-[0.02em] text-cream/80">
              <span className="w-[7px] h-[7px] rounded-full bg-mango" />
              Taking 4 projects for August
            </span>
            <h1 className="font-display font-extrabold text-[clamp(44px,13.5vw,54px)] leading-[0.92] sm:text-[clamp(46px,6.6vw,104px)] sm:leading-[0.86] tracking-[-0.05em] m-0 max-w-[13ch] balance">
              <span data-reveal className="reveal block">Be the one</span>
              <span data-reveal data-delay="120" className="reveal block">they <span className="text-mango">find</span>.</span>
            </h1>
            <p data-reveal data-delay="240" className="reveal m-0 text-[13.5px] leading-[1.4] max-w-[32ch] sm:text-[clamp(17px,1.55vw,22px)] sm:leading-[1.45] sm:max-w-[40ch] text-cream/70 sm:text-cream/75 pretty">
              Site, app, brand, ads, video — everything a stranger judges you by, built properly by one team. So the people already looking for you actually choose you.
            </p>
          </div>

          {/* ANIMATION — below the description on mobile; right column on desktop */}
          <div className="w-full lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
            <HeroWorkbench />
          </div>

          {/* ACTIONS — CTAs, audience marquee, guarantees */}
          <div className="w-full flex flex-col items-center lg:items-start gap-[22px] lg:gap-[34px] lg:col-start-1 lg:row-start-2">
            <div data-reveal data-delay="360" className="reveal w-full flex flex-col sm:flex-row gap-3">
              <a href="/contact" className="h-[54px] px-8 rounded-full bg-mango text-ink font-bold text-[16.5px] flex items-center justify-center transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_-12px_rgba(255,122,0,0.7)]">Chat now — free</a>
              <a href="#how" className="h-[54px] px-8 rounded-full border-[1.5px] border-cream/30 text-cream font-bold text-[16.5px] flex items-center justify-center transition-all duration-200 hover:border-cream hover:-translate-y-[2px]">See how it works</a>
            </div>
            <div
              data-reveal data-delay="420"
              className="reveal hv-marq w-full overflow-hidden"
              style={{
                WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 26px, #000 calc(100% - 26px), transparent 100%)",
                maskImage: "linear-gradient(90deg, transparent 0, #000 26px, #000 calc(100% - 26px), transparent 100%)",
              }}
            >
              <div className="hv-track flex w-max" style={{ animation: "hvMarquee 46s linear infinite" }}>
                {[0, 1].map((dup) => (
                  <div key={dup} aria-hidden={dup === 1} className="flex gap-2 pr-2 flex-none">
                    {AUDIENCE.map((a) => (
                      <span key={a} className="flex-none whitespace-nowrap py-2 px-[14px] rounded-full bg-cream/8 text-[13px] font-bold text-cream/75">{a}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div data-reveal data-delay="480" className="reveal w-full flex flex-col items-center sm:items-start sm:flex-row sm:flex-wrap gap-y-[11px] gap-x-7 border-t border-cream/12 pt-5 sm:pt-[26px]">
              {["Fixed price up front", "A launch date, agreed and kept", "You own every account"].map((t) => (
                <span key={t} className="flex items-center gap-[9px] text-[14px] sm:text-[14.5px] font-bold text-cream/80">
                  <span className="w-[5px] h-[5px] rounded-full bg-mango shrink-0 sm:hidden" />{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-[26px] left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-[9px] pointer-events-none">
          <span className="text-[11px] tracking-[0.34em] uppercase font-bold text-cream/50">Scroll</span>
          <span data-scroll-dot className="block text-mango">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </section>

      {/* ══════════ ACT I · "That part is ours" ══════════
          Scroll-scrubbed on ALL screens now: "It was never the plan." fades as a
          mango dot swells to flood the viewport, then "That part is ours." lands
          on the orange. Pure CSS-sticky pinning (mobile-safe). Reduced-motion /
          no-JS gets a stacked static fallback with the orange card — see
          globals.css so the message is never lost. */}
      <section data-dark-scene className="relative h-[220vh]">
        <div data-dark-inner className="sticky top-0 h-[100svh] flex items-center justify-center overflow-hidden px-6 sm:px-12">
          <div data-dark-dot aria-hidden className="absolute w-[60px] h-[60px] rounded-full bg-mango" style={{ transform: "scale(0.12)" }} />
          <div data-dark-a className="relative text-center max-w-[20ch]">
            <h2 className="font-display font-extrabold text-[clamp(40px,7vw,92px)] leading-[0.92] tracking-[-0.045em] m-0 balance">It was never the plan.</h2>
            <p className="mt-6 sm:mt-[26px] mx-auto text-[clamp(16px,4.6vw,21px)] leading-[1.45] text-cream/70 max-w-[32ch] sm:max-w-[34ch] pretty">You were busy being good at the actual work. Nobody had a spare month to figure out websites, ads and reels.</p>
          </div>
          <div data-dark-b className="absolute text-center opacity-0 w-full max-w-[24ch]">
            <div data-dark-b-card>
              <h2 className="font-display font-extrabold text-[clamp(44px,9vw,116px)] leading-[0.9] tracking-[-0.05em] m-0 text-ink balance">That part<br />is ours.</h2>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ACT II · SERVICES ══════════ */}
      <section id="services" className="relative bg-cream text-ink">
        <div className="px-6 sm:px-12 pt-[120px] pb-10 max-w-[1180px] mx-auto">
          <span data-reveal className="reveal text-[12.5px] tracking-[0.32em] uppercase font-bold text-[#9C5230]">For businesses, creators and one-person brands</span>
          <h2 data-reveal data-delay="120" className="reveal font-display font-extrabold text-[clamp(40px,6vw,88px)] leading-[0.92] tracking-[-0.045em] mt-[26px] mb-0 max-w-[18ch] balance">Everything it takes to be found, trusted and booked.</h2>
        </div>

        <ServicesShowcase />
      </section>

      {/* ══════════ ACT II.5 · PROOF ══════════ */}
      <section id="proof" className="bg-ink text-cream px-6 sm:px-12 py-[76px] sm:py-[120px]">
        <div className="max-w-[1180px] mx-auto flex flex-col gap-14">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(34px,4.6vw,72px)] leading-[0.94] tracking-[-0.045em] m-0 max-w-[20ch] balance">People your size. Numbers you can check.</h2>
            <p data-reveal data-delay="120" className="reveal m-0 text-[16.5px] leading-[1.5] text-cream/60 max-w-[34ch] pretty">Not enterprise logos you&apos;ll never relate to. Ask us for the owner&apos;s number — we&apos;ll give it to you.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {proof.stats.map((s, i) => (
              <div key={s.tag} data-reveal data-delay={String(60 + i * 120)} className="reveal bg-cream/6 border border-cream/12 rounded-[24px] py-9 px-[34px] flex flex-col gap-5">
                <span className="text-[11.5px] tracking-[0.24em] uppercase font-bold text-mango-soft">{s.tag}</span>
                <span className="font-display font-extrabold text-[58px] leading-[0.85] tracking-[-0.05em] text-mango">{s.value}</span>
                <span className="text-[17px] leading-[1.45] text-cream">{s.body}</span>
                <span className="mt-auto text-[13.5px] text-cream/60">{s.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ACT III · THE 14 DAYS (desktop pinned horizontal) ══════════ */}
      <section id="how" data-track-scene className="relative bg-mango text-ink hidden lg:block">
        <div data-track-pin className="h-screen min-h-[660px] overflow-hidden flex flex-col justify-center">
          <div className="px-12 pb-9 max-w-[1180px] w-full mx-auto">
            <span className="text-[12.5px] tracking-[0.32em] uppercase font-bold text-ink/80">How it actually goes</span>
            <h2 className="font-display font-extrabold text-[clamp(34px,4.6vw,72px)] leading-[0.92] tracking-[-0.045em] mt-[22px] mb-0 max-w-[20ch] balance">Five stages, and a date we keep.</h2>
            <p className="mt-5 mb-0 text-[17px] leading-[1.5] max-w-[54ch] text-ink/80 pretty">A one-page site can go live in three days. A full store takes two to three weeks. An app takes months. We won&apos;t pretend otherwise — you get the real date at stage one, in writing, and that&apos;s the one we hold ourselves to.</p>
          </div>
          <div data-track className="flex gap-6 px-12 will-change-transform">
            {STAGES.map((s) => (
              <StageCard key={s.n} {...s} />
            ))}
            <div className="shrink-0 w-[300px] flex items-center">
              <a href="#start" className="font-display font-extrabold text-[34px] tracking-[-0.04em] text-ink leading-none">Get your<br />date →</a>
            </div>
          </div>
        </div>
      </section>
      {/* mobile 14-days — swipe carousel */}
      <section id="how-mobile" className="lg:hidden bg-mango text-ink px-6 py-20">
        <span className="text-[12.5px] tracking-[0.32em] uppercase font-bold text-ink/80">How it actually goes</span>
        <h2 className="font-display font-extrabold text-[clamp(34px,9vw,56px)] leading-[0.92] tracking-[-0.045em] mt-4 mb-4 balance">Five stages, and a date we keep.</h2>
        <p className="text-[16px] leading-[1.5] text-ink/80 mb-8 pretty">You get the real date at stage one, in writing — and that&apos;s the one we hold ourselves to.</p>
        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 pb-2">
          {STAGES.map((s) => (
            <div key={s.n} className="snap-start"><StageCard {...s} mobile /></div>
          ))}
        </div>
        <a href="#start" className="mt-8 inline-block font-display font-extrabold text-[28px] tracking-[-0.04em] text-ink">Get your date →</a>
      </section>

      {/* ══════════ ACT II.75 · PRICE, ELSEWHERE ══════════ */}
      {/* v1: pricing is off — this whole "typical bands" section is hidden. */}
      {PRICING_ENABLED && (
      <section id="scope" className="bg-sand text-ink px-6 sm:px-12 py-[76px] sm:py-[120px]">
        <div className="max-w-[1180px] mx-auto grid gap-14 items-center lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-[22px]">
            <span data-reveal className="reveal text-[12.5px] tracking-[0.32em] uppercase font-bold text-[#8F4A2A]">The price, before the call</span>
            <h2 data-reveal data-delay="100" className="reveal font-display font-extrabold text-[clamp(34px,4.6vw,72px)] leading-[0.94] tracking-[-0.045em] m-0 balance">One quote asks ₹8,000. The next asks ₹80,000.</h2>
            <p data-reveal data-delay="180" className="reveal m-0 text-[17px] leading-[1.55] text-brown-ink max-w-[42ch] pretty">Same words, wildly different work, and no way for you to tell which one you actually need. So ours is in the open — pick what you want, read the number, and only then decide whether to talk to us.</p>
            <Link data-reveal data-delay="240" href="/pricing" className="reveal self-start py-[17px] px-[30px] rounded-full bg-ink text-cream font-bold text-[16px] transition-transform duration-200 hover:-translate-y-[2px]">Price your project →</Link>
          </div>
          <Link data-reveal data-delay="200" href="/pricing" className="reveal flex flex-col gap-6 bg-cream rounded-[30px] p-[38px] text-ink transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_26px_50px_-26px_rgba(22,16,13,0.45)]">
            <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-brown-mid">Typical bands</span>
            <div className="flex flex-col gap-4">
              {[["Website", "₹35k–₹3L"], ["Branding", "₹25k–₹2L"], ["Marketing", "₹15k–₹1.2L / mo"], ["Mobile app", "₹1.2L–₹9L"]].map(([k, v], i) => (
                <div key={k} className={`flex items-baseline justify-between gap-[18px] ${i < 3 ? "border-b border-line pb-[14px]" : ""}`}>
                  <span className="text-[16px] font-bold">{k}</span>
                  <span className="font-display font-extrabold text-[26px] tracking-[-0.035em] text-brown">{v}</span>
                </div>
              ))}
            </div>
            <span className="text-[14px] leading-[1.5] text-brown-mid">Build your exact scope and see your own band on the pricing page — no form, no call.</span>
          </Link>
        </div>
      </section>
      )}

      {/* ══════════ ACT III.5 · COMPARISON ══════════ */}
      <section className="bg-cream text-ink px-6 sm:px-12 pt-[76px] sm:pt-[120px] pb-10">
        <div className="max-w-[1180px] mx-auto flex flex-col gap-11">
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(34px,4.6vw,72px)] leading-[0.94] tracking-[-0.045em] m-0 max-w-[22ch] balance">Your three options, honestly.</h2>
          {/* desktop: full 4-column table */}
          <div data-reveal data-delay="120" className="reveal hidden lg:block overflow-x-auto no-scrollbar">
            <div className="grid grid-cols-[1.1fr_1fr_1fr_1.15fr] min-w-[720px] rounded-[24px] overflow-hidden border-[1.5px] border-ink/12">
              {["", "Freelancer", "Big agency", "branditbro"].map((h, i) => (
                <div key={i} className={`py-[26px] px-6 text-[12px] tracking-[0.18em] uppercase font-bold ${i === 3 ? "bg-ink text-mango font-extrabold" : "bg-white text-brown-mid"}`}>{h || " "}</div>
              ))}
              {COMPARISON.map((row, ri) =>
                row.map((cell, ci) => {
                  const alt = ri % 2 === 1;
                  const brand = ci === 3;
                  const label = ci === 0;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`py-[22px] px-6 text-[15px] ${
                        brand ? "bg-ink text-cream font-bold" : alt ? "bg-white" : "bg-cream"
                      } ${label ? "font-bold" : brand ? "" : "text-brown-ink"}`}
                    >
                      {cell}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {/* mobile: one card per dimension — all three options stacked, ours highlighted */}
          <div data-reveal data-delay="120" className="reveal lg:hidden flex flex-col gap-4">
            {COMPARISON.map((row) => (
              <div key={row[0]} className="rounded-[22px] overflow-hidden border-[1.5px] border-ink/12 bg-white">
                <div className="px-5 py-[13px] bg-cream text-[15px] font-bold border-b border-ink/10">{row[0]}</div>
                <div className="px-5 py-[12px] border-b border-ink/8 flex flex-col gap-[3px]">
                  <span className="text-[10.5px] tracking-[0.16em] uppercase font-bold text-brown-mid">Freelancer</span>
                  <span className="text-[14.5px] leading-[1.4] text-brown-ink">{row[1]}</span>
                </div>
                <div className="px-5 py-[12px] border-b border-ink/8 flex flex-col gap-[3px]">
                  <span className="text-[10.5px] tracking-[0.16em] uppercase font-bold text-brown-mid">Big agency</span>
                  <span className="text-[14.5px] leading-[1.4] text-brown-ink">{row[2]}</span>
                </div>
                <div className="px-5 py-[13px] bg-ink flex flex-col gap-[3px]">
                  <span className="text-[10.5px] tracking-[0.16em] uppercase font-extrabold text-mango">branditbro</span>
                  <span className="text-[14.5px] leading-[1.4] font-bold text-cream">{row[3]}</span>
                </div>
              </div>
            ))}
          </div>
          <span data-reveal className="reveal text-[13.5px] text-brown-mid max-w-[60ch] leading-[1.5]">Nobody can guarantee a Google ranking — the algorithm isn&apos;t ours to promise. Anyone who does is selling you the wrong thing.</span>
        </div>
      </section>

      {/* ══════════ ACT IV · OBJECTIONS ══════════ */}
      <section className="bg-cream text-ink px-6 sm:px-12 py-[76px] sm:py-[120px]">
        <div className="max-w-[1180px] mx-auto flex flex-col gap-14">
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(34px,4.6vw,72px)] leading-[0.94] tracking-[-0.045em] m-0 max-w-[22ch] balance">You&apos;ve been burned before. Say it out loud.</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {OBJECTIONS.map((o, i) => (
              <div key={o.q} data-reveal data-delay={String(80 + i * 120)} className="reveal bg-white rounded-[24px] py-9 px-[34px] flex flex-col gap-[18px]">
                <span className="font-display font-extrabold text-[25px] leading-[1.05] tracking-[-0.03em] text-brown">{o.q}</span>
                <span className="h-px bg-line" />
                <p className="m-0 text-[17px] leading-[1.5] text-ink">{o.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ACT IV.5 · PROMISES + FAQ ══════════ */}
      <section className="text-cream px-6 sm:px-12 py-[76px] sm:py-[120px]" style={{ background: "#0E6B5E" }}>
        <div className="max-w-[1180px] mx-auto flex flex-col gap-16">
          <div className="grid gap-14 items-start lg:grid-cols-[0.9fr_1.1fr]">
            <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(34px,4.6vw,72px)] leading-[0.94] tracking-[-0.045em] m-0 balance">Five things we put in writing.</h2>
            <div data-reveal data-delay="120" className="reveal flex flex-col">
              {PROMISES.map((p, i) => (
                <div key={i} className={`flex gap-5 py-5 border-t border-cream/20 ${i === PROMISES.length - 1 ? "border-b" : ""}`}>
                  <span className="font-display font-extrabold text-[15px] text-[#FFD9B0] shrink-0 w-7">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[17px] leading-[1.45]">{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {FAQ.map((f, i) => (
              <div key={f.q} data-reveal data-delay={String(i * 100)} className="reveal bg-ink/20 rounded-[20px] py-[30px] px-8 flex flex-col gap-3">
                <span className="font-display font-extrabold text-[20px] tracking-[-0.02em]">{f.q}</span>
                <span className="text-[16px] leading-[1.5] text-cream/80">{f.a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ACT IV.75 · NOT FOR EVERYONE ══════════ */}
      <section className="bg-sand text-ink px-6 sm:px-12 py-24">
        <div className="max-w-[1180px] mx-auto grid gap-14 items-start lg:grid-cols-[0.8fr_1.2fr]">
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(32px,4vw,58px)] leading-[0.94] tracking-[-0.045em] m-0 balance">When you should not hire us.</h2>
          <div data-reveal data-delay="120" className="reveal flex flex-col gap-[18px]">
            {NOT_FOR.map((n) => (
              <span key={n.h} className="text-[17px] leading-[1.5] text-brown-ink">
                <strong className="text-ink">{n.h}</strong> {n.b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ACT V · CLOSE ══════════ */}
      <section id="start" className="relative bg-ink px-6 sm:px-12 pt-[104px] sm:pt-[150px] pb-24 overflow-hidden">
        <div aria-hidden className="absolute pointer-events-none" style={{ bottom: "-320px", left: "50%", transform: "translateX(-50%)", width: "820px", height: "820px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,122,0,0.3) 0%, rgba(22,16,13,0) 68%)" }} />
        <div className="relative max-w-[1180px] mx-auto flex flex-col" style={{ gap: "52px" }}>
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(48px,8vw,124px)] leading-[0.88] tracking-[-0.05em] m-0 max-w-[14ch] balance">Let&apos;s put you <span className="text-mango">online</span>.</h2>
          <div data-reveal data-delay="120" className="reveal grid gap-5 md:grid-cols-3 max-w-[940px]">
            {[["1 · You send the brief", "A form or a voice note. Two minutes, no meeting yet."], ["2 · We reply in a day", "With a fixed price, a date, and what we'd cut to protect both."], ["3 · You decide, calmly", "No follow-up calls, no pressure. A no costs you nothing."]].map(([h, b]) => (
              <div key={h} className="flex flex-col gap-2">
                <span className="font-display font-extrabold text-[17px] tracking-[-0.02em] text-mango">{h}</span>
                <span className="text-[15px] leading-[1.45] text-cream/65">{b}</span>
              </div>
            ))}
          </div>
          <div data-reveal data-delay="200" className="reveal flex flex-wrap items-center gap-[14px]">
            <Link href="/contact" className="py-5 px-9 rounded-full bg-mango text-ink font-bold text-[17px] transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-[0_14px_30px_-12px_rgba(255,122,0,0.7)]">Get in touch</Link>
            {PRICING_ENABLED && (
            <Link href="/pricing" className="py-5 px-9 rounded-full border-[1.5px] border-cream/30 text-cream font-bold text-[17px] transition-colors hover:border-cream">Get estimate →</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── stage card used by both desktop track and mobile carousel ── */
function StageCard({ n, title, meta, body, dark, mobile }: { n: string; title: string; meta: string; body: string; dark: boolean; mobile?: boolean }) {
  return (
    <div
      className={`shrink-0 ${mobile ? "w-[80vw] max-w-[340px]" : "w-[380px]"} min-h-[300px] rounded-[26px] py-[38px] px-[34px] flex flex-col gap-4 ${
        dark ? "bg-ink text-cream" : "bg-cream text-ink"
      }`}
    >
      <span className={`font-display font-extrabold text-[62px] leading-[0.85] tracking-[-0.05em] ${dark ? "text-mango" : "text-chili"}`}>{n}</span>
      <span className="font-display font-extrabold text-[26px] tracking-[-0.03em]">
        {title}<span className={`font-bold ${dark ? "text-cream/55" : "text-ink/55"}`}> {meta}</span>
      </span>
      <p className={`m-0 text-[16px] leading-[1.5] ${dark ? "text-cream/70" : "text-brown-ink"}`}>{body}</p>
    </div>
  );
}

/* ── static content data ── */
const COMPARISON: string[][] = [
  ["Price", "Cheap, then scope creep", "Quoted after three meetings", "On this page, before we talk"],
  ["Who does the work", "One person, one bad week away from silence", "A junior you never met", "A named owner and a small team"],
  ["Ad budget", "Often through their account", "Bundled into the fee", "Yours, paid direct to Google or Meta"],
  ["Who owns it after", "Depends on the mood", "Them, until you pay to leave", "You. Files, logins, everything"],
  ["Promises", "“Rank #1 in a week”", "Dashboards full of impressions", "Enquiries, and the method written down"],
];

const OBJECTIONS = [
  { q: "“Agencies ghost.”", a: "One owner, one thread, a build you can open any evening. If it slips, you hear it from us first." },
  { q: "“It'll cost a bomb.”", a: "Fixed price, agreed on day one, in writing. No hourly meter, no surprise line items at handover." },
  { q: "“I have no content.”", a: "Nobody does at the start. We shoot it and write it — you show up for an hour and answer questions." },
];

const PROMISES = [
  "The price is fixed at signing. If we misjudged the work, that's our problem, not your invoice.",
  "Every account — domain, hosting, ads, analytics — is created in your name on day one.",
  "You see the method. What we'll do, in what order, in language you can repeat to someone else.",
  "We report enquiries and revenue. Impressions are not a result and we won't pad a deck with them.",
  "Leave whenever you like. Thirty days' notice, no exit fee, we hand over and help the next team.",
];

const FAQ = [
  { q: "Can you guarantee page one on Google?", a: "No, and neither can anyone else. We can guarantee the groundwork that earns it, and show you the search terms you're actually winning." },
  { q: "Is the ad spend inside your fee?", a: "Never. You pay Google and Meta directly from your own card. Bundling it hides the margin and we'd rather you saw every rupee." },
  { q: "What if I hate the design?", a: "You approve the direction at stage two, before anything is built. If it's wrong at that point, we redraw it — that is exactly what stage two is for." },
  { q: "Who fixes it in six months?", a: "Us, on a small care plan — or anyone you like, because it's built on standard tools and you hold the keys. No hostage code." },
];

const NOT_FOR = [
  { h: "You want the cheapest quote in the city.", b: "Someone will always go lower. We'd rather you took their number than felt cheated by ours." },
  { h: "You need it live this weekend.", b: "We'll say no to a date we can't hold, even when it costs us the job." },
  { h: "You want us to hold the accounts.", b: "Some clients prefer that. We won't do it — the keys stay with you, always." },
];
