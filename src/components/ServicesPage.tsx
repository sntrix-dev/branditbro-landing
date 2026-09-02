"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { registerGsap, gsap, ScrollTrigger } from "@/lib/gsap";
import { useContent } from "@/components/ContentProvider";
import { servicePages, type ServicePage } from "@/lib/services-data";
import ServiceVisual from "@/components/ServiceVisual";
import PlayOnView from "@/components/PlayOnView";
import { PRICING_ENABLED } from "@/lib/flags";

/* Map the services-page ids to the design's visual ids, and the background
   each animated visual was composed on — so the panel reads correctly on any
   section (e.g. the teal "video" visual stays legible on a light section). */
const VIS_ID: Record<string, string> = { website: "website", app: "app", branding: "brand", marketing: "marketing", video: "content" };
const VIS_BG: Record<string, string> = { website: "bg-cream", app: "bg-sand", branding: "bg-cream", marketing: "bg-ink", video: "bg-teal" };

const INDEX = [
  { href: "#website", n: "01", label: "Websites & web apps" },
  { href: "#app", n: "02", label: "Mobile applications" },
  { href: "#branding", n: "03", label: "Brand identity systems" },
  { href: "#marketing", n: "04", label: "Performance marketing" },
  { href: "#video", n: "05", label: "Video & short-form" },
];

export default function ServicesPage() {
  const { contact } = useContent();
  const root = useRef<HTMLDivElement>(null);
  const ask = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "/contact";

  useEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      // parallax drift on the image slots — desktop + motion only
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        el.querySelectorAll<HTMLElement>("[data-parallax] > *").forEach((inner) => {
          gsap.fromTo(
            inner,
            { yPercent: -8, scale: 1.08 },
            {
              yPercent: 8,
              ease: "none",
              scrollTrigger: { trigger: inner.parentElement!, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        });
      });
      ScrollTrigger.refresh();
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="font-sans bg-cream text-ink w-full overflow-x-clip">
      {/* HERO */}
      <section className="relative px-6 sm:px-12 pt-[168px] pb-24 overflow-hidden">
        <div aria-hidden className="absolute pointer-events-none" style={{ top: "-280px", right: "-180px", width: "760px", height: "760px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,122,0,0.22) 0%, rgba(255,122,0,0) 68%)" }} />
        <div className="relative max-w-[1180px] mx-auto grid gap-14 lg:gap-16 items-end lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <span data-reveal className="reveal text-[12.5px] tracking-[0.32em] uppercase font-bold text-brown">Capabilities</span>
            <h1 data-reveal data-delay="80" className="reveal font-display font-extrabold text-[clamp(40px,5.6vw,84px)] leading-[0.92] tracking-[-0.05em] m-0 balance">Five things we build. All of them properly.</h1>
            <p data-reveal data-delay="160" className="reveal m-0 text-[18px] leading-[1.55] text-brown-ink max-w-[52ch] pretty">Every engagement below ships with measurement wired in, source files in your name, and a written scope you can hold us to. What follows is the actual specification — deliverables, process, stack, and the failure modes we&apos;re hired to undo.</p>
          </div>
          <div data-reveal data-delay="220" className="reveal flex flex-col gap-[14px] bg-white rounded-[26px] p-7">
            <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-brown-mid">Standard on every project</span>
            <div className="flex flex-col gap-[10px]">
              {["Accounts, domains and repositories in your name", "Analytics and event tracking configured at launch", "Itemised scope, fixed on signature", "Source files and documentation at handover"].map((t) => (
                <span key={t} className="text-[15.5px] leading-[1.4] text-brown-deep">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INDEX */}
      <section id="capabilities" className="px-6 sm:px-12 pb-24">
        <div className="max-w-[1180px] mx-auto grid gap-[14px] grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {INDEX.map((c, i) => (
            <a key={c.href} href={c.href} data-reveal data-delay={String(i * 60)} className="reveal group flex flex-col gap-3 p-[22px] rounded-[20px] border-[1.5px] border-ink/15 text-ink transition-all duration-200 hover:-translate-y-1 hover:bg-ink hover:text-cream hover:border-ink">
              <span className="font-display font-extrabold text-[15px] tracking-[0.06em] text-mango">{c.n}</span>
              <span className="text-[17px] font-bold leading-[1.2]">{c.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* SERVICE SECTIONS */}
      {servicePages.map((s) => (
        <ServiceBlock key={s.id} s={s} ask={ask} />
      ))}

      {/* ENGAGEMENT TERMS */}
      <section className="text-cream px-6 sm:px-12 py-24" style={{ background: "#0E6B5E" }}>
        <div className="max-w-[1180px] mx-auto grid gap-14 items-start lg:grid-cols-[0.85fr_1.15fr]">
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(30px,3.4vw,50px)] leading-[0.96] tracking-[-0.045em] m-0 balance">The terms are the same whichever one you pick.</h2>
          <div className="grid gap-[26px] sm:grid-cols-2">
            {[["Ownership", "Domains, accounts, repositories, source files and passwords are created in your name from day one."], ["Scope", "Itemised before work starts, fixed on signature. Additions are quoted separately, never absorbed silently."], ["Payment", "Half at kickoff, half at launch. Retainers are monthly and stop with 30 days notice."], ["First direction", "If the first direction misses, you can walk away, keep the files and pay nothing. Written into the contract."]].map(([h, b], i) => (
              <div key={h} data-reveal data-delay={String(i * 60)} className="reveal flex flex-col gap-[7px]">
                <span className="text-[16.5px] font-bold">{h}</span>
                <span className="text-[15px] leading-[1.5] text-cream/80">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="relative bg-ink text-cream px-6 sm:px-12 pt-[120px] pb-24 overflow-hidden">
        <div aria-hidden className="absolute pointer-events-none" style={{ bottom: "-300px", left: "50%", transform: "translateX(-50%)", width: "780px", height: "780px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,122,0,0.3) 0%, rgba(255,122,0,0) 66%)" }} />
        <div className="relative max-w-[900px] mx-auto flex flex-col items-center text-center gap-[26px]">
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(34px,4.4vw,66px)] leading-[0.95] tracking-[-0.05em] m-0 balance">{PRICING_ENABLED ? "Know what you need? Get the number. Not sure? Ask a person." : "Tell us what you're building."}</h2>
          <p data-reveal data-delay="80" className="reveal m-0 text-[17px] leading-[1.55] text-cream/70 max-w-[54ch] pretty">{PRICING_ENABLED ? "The estimator gives you an honest band in under a minute without talking to anyone. If your situation is messier than three questions, message us and we'll work it out together." : "Send us the shape of it and we'll come back with a plan, a fixed price and a launch date — usually within a day. No obligation, no pressure."}</p>
          <div data-reveal data-delay="160" className="reveal flex flex-wrap gap-[14px] justify-center">
            {PRICING_ENABLED ? (
              <Link href="/pricing" className="text-[16px] font-bold py-[18px] px-8 rounded-full bg-mango text-ink transition-transform duration-200 hover:-translate-y-[2px]">See my estimate →</Link>
            ) : (
              <Link href="/contact" className="text-[16px] font-bold py-[18px] px-8 rounded-full bg-mango text-ink transition-transform duration-200 hover:-translate-y-[2px]">Get in touch →</Link>
            )}
            <a href={ask} className="text-[16px] font-bold py-[18px] px-8 rounded-full border-[1.5px] border-cream/30 text-cream transition-colors hover:border-cream">Message us{contact.whatsapp ? " on WhatsApp" : ""}</a>
          </div>
          <Link data-reveal data-delay="220" href="/" className="reveal text-[14.5px] font-bold text-cream/55 hover:text-cream transition-colors">← Back to the main page</Link>
        </div>
      </section>
    </div>
  );
}

function ServiceBlock({ s, ask }: { s: ServicePage; ask: string }) {
  const ink = s.theme === "ink";
  const sectionBg = ink ? "bg-ink text-cream" : "bg-cream text-ink";
  const border = s.id === "website" ? "border-t-[1.5px] border-ink/12" : ink ? "" : "";
  const cardBg = ink ? "bg-cream/6 border border-cream/12" : "bg-white";
  const panelBg = ink ? "bg-cream/6 border border-cream/12" : "bg-sand";
  const chipBg = ink ? "bg-cream/10" : "bg-cream";
  const label = ink ? "text-mango-soft" : "text-brown-mid";
  const bodyText = ink ? "text-cream/86" : "text-brown-deep";

  return (
    <section id={s.id} className={`${sectionBg} ${border} px-6 sm:px-12 py-24`}>
      <div className="max-w-[1180px] mx-auto grid gap-14 lg:gap-16 items-start lg:grid-cols-[0.78fr_1.22fr]">
        {/* sticky rail */}
        <div className="lg:sticky lg:top-[110px] flex flex-col gap-[22px]">
          <span className="font-display font-extrabold text-[15px] tracking-[0.14em] text-mango">{s.n}</span>
          <h2 data-reveal className="reveal font-display font-extrabold text-[clamp(32px,3.8vw,56px)] leading-[0.95] tracking-[-0.045em] m-0 balance">{s.title}</h2>
          <p data-reveal data-delay="80" className={`reveal m-0 text-[16.5px] leading-[1.55] max-w-[34ch] pretty ${ink ? "text-cream/70" : "text-brown-ink"}`}>{s.blurb}</p>
          <div className="flex flex-wrap gap-[10px]">
            <Link href={PRICING_ENABLED ? "/pricing" : "/contact"} className={`text-[14.5px] font-bold py-[13px] px-[22px] rounded-full ${ink ? "bg-mango text-ink" : "bg-ink text-cream"}`}>{PRICING_ENABLED ? "Price this build →" : "Start this build →"}</Link>
            <a href={ask} className={`text-[14.5px] font-bold py-[13px] px-[22px] rounded-full border-[1.5px] ${ink ? "border-cream/30 text-cream hover:border-cream" : "border-ink/20 text-ink hover:border-ink"} transition-colors`}>Ask a question</a>
          </div>
        </div>

        {/* content */}
        <div className="flex flex-col gap-10">
          <PlayOnView className={`mx-auto w-full max-w-[585px] rounded-[24px] p-4 sm:p-6 ${VIS_BG[s.id] ?? "bg-cream"}`}>
            <ServiceVisual id={VIS_ID[s.id] ?? s.id} />
          </PlayOnView>

          <div data-reveal className="reveal flex flex-col gap-4">
            <span className={`text-[12px] tracking-[0.2em] uppercase font-bold ${label}`}>What you actually get</span>
            <div className="grid gap-x-7 gap-y-3 sm:grid-cols-2">
              {s.deliverables.map((d) => (
                <span key={d} className={`text-[15.5px] leading-[1.45] ${bodyText}`}>{d}</span>
              ))}
            </div>
          </div>

          <div data-reveal className="reveal flex flex-col gap-[18px]">
            <span className={`text-[12px] tracking-[0.2em] uppercase font-bold ${label}`}>How it runs</span>
            <div className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
              {s.process.map(([step, body]) => (
                <div key={step} className={`flex flex-col gap-[7px] rounded-[18px] p-5 ${cardBg}`}>
                  <span className="text-[12.5px] font-extrabold text-mango">{step}</span>
                  <span className={`text-[15px] leading-[1.4] ${ink ? "text-cream/82" : "text-brown-deep"}`}>{body}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal className={`reveal grid gap-7 sm:grid-cols-2 rounded-[22px] p-7 ${panelBg}`}>
            <div className="flex flex-col gap-[14px]">
              <span className={`text-[12px] tracking-[0.2em] uppercase font-bold ${label}`}>What we&apos;re usually hired to undo</span>
              <div className="flex flex-col gap-[9px]">
                {s.undo.map((u) => (
                  <span key={u} className={`text-[15px] leading-[1.45] ${ink ? "text-cream/82" : "text-brown-deep"}`}>{u}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-[14px]">
              <span className={`text-[12px] tracking-[0.2em] uppercase font-bold ${label}`}>Stack</span>
              <div className="flex flex-wrap gap-2 content-start">
                {s.stack.map((t) => (
                  <span key={t} className={`py-2 px-[14px] rounded-full text-[13px] font-bold ${chipBg} ${ink ? "text-cream" : "text-ink"}`}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
