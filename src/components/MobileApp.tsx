"use client";

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import { type SizeKey } from "@/site.config";
import { useContent } from "@/components/ContentProvider";
import { money, band } from "@/lib/money";
import {
  HERO_QUERIES, HOME_CARDS, STEPS, OBJECTIONS, MOBILE_SERVICES,
  SERVICE_OPTIONS, SIZE_OPTIONS, WHEN_OPTIONS, OWN_LINES, CALC_LINES,
  HOW_STAGES, WHAT_WE_NEED, WHEN_WRONG,
  type HomeCard, type MobileService,
} from "@/lib/mobile-content";

type Tab = "home" | "services" | "how" | "pricing" | "contact";
const PATH_TAB: Record<string, Tab> = { "/": "home", "/services": "services", "/pricing": "pricing", "/contact": "contact", "/how-it-works": "how" };
const TAB_PATH: Record<Tab, string> = { home: "/", services: "/services", how: "/how-it-works", pricing: "/pricing", contact: "/contact" };

export default function MobileApp() {
  const { catalog, contact } = useContent();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>(() => PATH_TAB[pathname] || "home");
  const root = useRef<HTMLDivElement>(null);
  const scrollMem = useRef<Record<string, number>>({});
  const pendingScroll = useRef(0);
  const reduce = useRef(false);
  // State (not a ref) so the scroll-animation effect RE-RUNS when the mobile
  // breakpoint becomes active — e.g. loading at desktop width then narrowing.
  const [mobileOn, setMobileOn] = useState(true);

  // accordion
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // pricing
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [size, setSize] = useState<SizeKey | null>(null);
  const [when, setWhen] = useState<string | null>(null);
  const [phase, setPhase] = useState<"quiz" | "calc" | "result">("quiz");
  const [calcLine, setCalcLine] = useState(0);
  // contact
  const [chips, setChips] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [est, setEst] = useState("");
  const [estScope, setEstScope] = useState("");

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wa = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "";

  // Instant scroll — the site sets `html { scroll-behavior: smooth }` for
  // desktop anchors, which would animate (and fight) these in-app resets.
  const jump = (y = 0) => window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mq = window.matchMedia("(max-width: 767.98px)");
    setMobileOn(mq.matches);
    const onCh = () => setMobileOn(mq.matches);
    mq.addEventListener("change", onCh);
    return () => mq.removeEventListener("change", onCh);
  }, []);

  /* ── tab navigation with per-tab scroll memory ── */
  const go = useCallback((next: Tab) => {
    if (next === tab) { window.scrollTo({ top: 0, behavior: reduce.current ? "auto" : "smooth" }); return; }
    scrollMem.current[tab] = window.scrollY;
    pendingScroll.current = scrollMem.current[next] || 0;
    setTab(next);
    try { window.history.replaceState(null, "", TAB_PATH[next]); } catch { /* noop */ }
  }, [tab]);

  // restore scroll on tab change. Re-applied across a few ticks: when a tall
  // view is replaced by a shorter one the browser clamps scroll, so a single
  // scrollTo can be undone — this settles it (mirrors the design's settleView).
  useLayoutEffect(() => {
    const y = pendingScroll.current;
    jump(y);
    const raf = requestAnimationFrame(() => jump(y));
    const tm = setTimeout(() => jump(y), 90);
    return () => { cancelAnimationFrame(raf); clearTimeout(tm); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ── scroll storytelling, wired per tab ── */
  const estObj = useCallback(() => {
    const sz: SizeKey = size || "growing";
    const keys = Object.keys(picked).filter((k) => picked[k]);
    let oneLo = 0, oneHi = 0, monLo = 0, monHi = 0, dLo = 0, dHi = 0;
    keys.forEach((k) => {
      const it = catalog.find((c) => c.key === k);
      if (!it) return;
      if (it.one) { oneLo += it.one[sz][0]; oneHi += it.one[sz][1]; }
      if (it.per) { monLo += it.per[sz][0]; monHi += it.per[sz][1]; }
      dLo = Math.max(dLo, it.days[sz][0]); dHi = Math.max(dHi, it.days[sz][1]);
    });
    return { keys, oneLo, oneHi, monLo, monHi, dLo, dHi };
  }, [picked, size]);

  useEffect(() => {
    const el = root.current;
    if (!el || !mobileOn) return;

    // typed hero
    let typeTimer: ReturnType<typeof setInterval> | null = null;
    const typed = el.querySelector<HTMLElement>("[data-typed]");
    if (typed) {
      if (reduce.current) typed.textContent = HERO_QUERIES[0];
      else {
        let qi = 0, ci = 0, dir = 1, hold = 0;
        typed.textContent = "";
        typeTimer = setInterval(() => {
          const q = HERO_QUERIES[qi];
          if (hold > 0) { hold -= 1; return; }
          ci += dir;
          typed.textContent = q.slice(0, ci);
          if (dir === 1 && ci >= q.length) { dir = -1; hold = 24; }
          else if (dir === -1 && ci <= 0) { dir = 1; qi = (qi + 1) % HERO_QUERIES.length; hold = 4; }
        }, 64);
      }
    }

    // reveals
    const revealNodes = Array.from(el.querySelectorAll<HTMLElement>("[data-mr]"));
    let io: IntersectionObserver | null = null;
    if (reduce.current) {
      revealNodes.forEach((n) => { n.style.opacity = "1"; n.style.transform = "none"; });
    } else {
      revealNodes.forEach((n) => {
        n.style.opacity = "0";
        n.style.transform = "translateY(18px)";
        n.style.transition = "opacity 620ms cubic-bezier(.16,.84,.28,1), transform 620ms cubic-bezier(.16,.84,.28,1)";
        n.style.transitionDelay = (n.dataset.mrd || "0") + "ms";
      });
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).style.opacity = "1";
          (e.target as HTMLElement).style.transform = "none";
          io!.unobserve(e.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      revealNodes.forEach((n) => {
        if (n.getBoundingClientRect().top < window.innerHeight * 0.94) { n.style.transitionDelay = "0ms"; n.style.opacity = "1"; n.style.transform = "none"; }
        else io!.observe(n);
      });
    }

    // (swipe carousels + their dots are handled by Swiper — see HomeCarousel)

    /* ── scroll storytelling ──────────────────────────────────────────
       Refs and geometry are cached ONCE (and on resize). The per-frame
       loop reads only window.scrollY and writes transforms — no
       getBoundingClientRect / querySelector in the hot path, so there is
       no layout thrashing and scrolling stays smooth. */
    let raf = 0;
    const lightStep = (badge: HTMLElement, on: boolean) => {
      if (badge.dataset.lit === (on ? "1" : "0")) return;
      badge.dataset.lit = on ? "1" : "0";
      badge.style.background = on ? "#FF7A00" : "#16100D";
      badge.style.borderColor = on ? "#FF7A00" : "rgba(255,243,228,0.18)";
      badge.style.color = on ? "#16100D" : "rgba(255,243,228,0.55)";
    };

    const hero = el.querySelector<HTMLElement>("[data-hero]");
    const glow = el.querySelector<HTMLElement>("[data-hero-glow]");
    const mock = el.querySelector<HTMLElement>("[data-hero-mock]");
    const copy = el.querySelector<HTMLElement>("[data-hero-copy]");
    const cue = el.querySelector<HTMLElement>("[data-scrollcue]");
    const dark = el.querySelector<HTMLElement>('[data-scene="dark"]');
    const darkFrame = el.querySelector<HTMLElement>("[data-scene-frame]");
    const dot = el.querySelector<HTMLElement>("[data-dark-dot]");
    const da = el.querySelector<HTMLElement>("[data-dark-a]");
    const db = el.querySelector<HTMLElement>("[data-dark-b]");
    const stepsEl = el.querySelector<HTMLElement>("[data-steps]");
    const fill = el.querySelector<HTMLElement>("[data-step-fill]");
    const badges = stepsEl ? Array.from(stepsEl.querySelectorAll<HTMLElement>("[data-step-badge]")) : [];
    const hasScenes = !!(hero || dark || stepsEl);

    // cached geometry (document coordinates), recomputed only on resize
    let vh = window.innerHeight;
    let heroTop = 0, darkTop = 0, darkSpan = 1, darkNeed = 30;
    let runTop = 0, runSpan = 1, stepsBottom = 0;
    let badgeCenters: number[] = [];
    const docTop = (n: HTMLElement) => n.getBoundingClientRect().top + window.scrollY;
    const measure = () => {
      vh = window.innerHeight;
      if (hero) heroTop = docTop(hero);
      if (dark) { darkTop = docTop(dark); darkSpan = Math.max(1, dark.offsetHeight - vh); }
      if (darkFrame) { const r = darkFrame.getBoundingClientRect(); darkNeed = (Math.max(r.width, r.height) * 2.3) / 60; }
      if (badges.length) {
        badgeCenters = badges.map((bd) => docTop(bd) + bd.offsetHeight / 2);
        runTop = badgeCenters[0]; runSpan = Math.max(1, badgeCenters[badgeCenters.length - 1] - runTop);
        if (stepsEl) stepsBottom = docTop(stepsEl) + stepsEl.offsetHeight;
      }
    };
    const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const frame = () => {
      const y = window.scrollY;
      if (glow) {
        const p = clamp((y - heroTop) / vh);
        glow.style.transform = `translate3d(0,${(p * 120).toFixed(1)}px,0) scale(${(1 + p * 0.35).toFixed(3)})`;
        glow.style.opacity = (1 - p * 0.75).toFixed(3);
        if (mock) { mock.style.transform = `translate3d(0,${(-p * 46).toFixed(1)}px,0) scale(${(1 - p * 0.06).toFixed(3)})`; mock.style.opacity = Math.max(0, 1 - p * 1.1).toFixed(3); }
        if (copy) { copy.style.transform = `translate3d(0,${(-p * 18).toFixed(1)}px,0)`; copy.style.opacity = Math.max(0, 1 - p * 0.85).toFixed(3); }
        if (cue) cue.style.opacity = Math.max(0, 1 - p * 3).toFixed(3);
      }
      if (dot) {
        const p = clamp((y - darkTop) / darkSpan);
        const swell = clamp((p - 0.12) / 0.46);
        const eased = swell * swell * (3 - 2 * swell);
        dot.style.transform = `scale(${(0.15 + eased * darkNeed).toFixed(3)})`;
        if (da) { da.style.opacity = (1 - clamp((p - 0.1) / 0.22)).toFixed(3); da.style.transform = `scale(${(1 - eased * 0.07).toFixed(3)})`; }
        if (db) { const inB = clamp((p - 0.52) / 0.18); db.style.opacity = inB.toFixed(3); db.style.transform = `translate3d(0,${((1 - inB) * 26).toFixed(1)}px,0)`; }
      }
      if (fill && badges.length) {
        const markDoc = y + vh * 0.62;
        const tt = clamp((markDoc - runTop) / runSpan);
        fill.style.height = (tt * runSpan).toFixed(1) + "px";
        const visible = stepsBottom > y;
        for (let i = 0; i < badges.length; i++) lightStep(badges[i], visible && badgeCenters[i] <= markDoc);
      }
    };
    const onScroll = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; frame(); }); };
    const onResize = () => { measure(); onScroll(); };

    if (reduce.current) {
      if (db) db.style.opacity = "0";
      if (fill) fill.style.height = "100%";
      badges.forEach((s) => lightStep(s, true));
    } else if (hasScenes) {
      measure();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      // re-measure after fonts settle (heights can shift a little)
      const remeasure = setTimeout(onResize, 350);
      timers.current.push(remeasure);
      frame();
    }

    return () => {
      if (typeTimer) clearInterval(typeTimer);
      if (io) io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, phase, mobileOn]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* ── pricing flow ── */
  const t = estObj();
  const stepReady = step === 0 ? Object.keys(picked).filter(k=>picked[k]).length > 0 : step === 1 ? !!size : !!when;
  const runCalc = () => {
    setPhase("calc"); setCalcLine(0);
    if (reduce.current) { setPhase("result"); return; }
    const tick = setInterval(() => setCalcLine((c) => (c + 1) % 3), 520);
    const done = setTimeout(() => { clearInterval(tick); setPhase("result"); jump(0); }, 1700);
    timers.current.push(done as unknown as ReturnType<typeof setTimeout>);
  };
  const nextStep = () => { if (!stepReady) return; if (step < 2) setStep(step + 1); else runCalc(); };
  const restart = () => { setStep(0); setPicked({}); setSize(null); setWhen(null); setPhase("quiz"); jump(0); };
  const oneNow: [number, number] = [Math.round(t.oneLo * 0.7), Math.round(t.oneHi * 0.7)];
  const days = t.dHi ? (t.dHi > 42 ? `${Math.round(t.dLo / 7)}–${Math.round(t.dHi / 7)} weeks` : `${t.dLo}–${t.dHi} days`) : "—";
  const scopeText = t.keys.map((k) => catalog.find((c) => c.key === k)?.label).filter(Boolean).join(" + ") || "Scope to be confirmed";
  const takeToContact = () => {
    scrollMem.current[tab] = window.scrollY;
    setEst(t.oneHi ? band(oneNow[0], oneNow[1]) : (t.monHi ? band(t.monLo, t.monHi) + " / month" : ""));
    setEstScope(scopeText);
    setChips({ ...picked });
    pendingScroll.current = 0;
    setTab("contact");
    try { window.history.replaceState(null, "", TAB_PATH.contact); } catch { /* noop */ }
  };

  /* ── contact ── */
  const canSend = form.name.trim().length > 1 && (form.phone.trim().length > 5 || /@/.test(form.email));
  const submit = async () => {
    if (!canSend || busy) return;
    setBusy(true);
    const services = Object.keys(chips).filter((k) => chips[k]).map((k) => catalog.find((c) => c.key === k)?.label || k);
    try {
      const res = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, services, est, scope: estScope, pageUrl: location.href }) });
      const j = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !j.ok) throw new Error();
      setSent(true); jump(0);
    } catch {
      setSent(true); jump(0); // lead may still be saved server-side
    } finally { setBusy(false); }
  };

  const tabs: [Tab, string][] = [["home", "Home"], ["services", "Services"], ["how", "How"], ["pricing", "Pricing"], ["contact", "Talk"]];

  return (
    <div ref={root} className="relative min-h-[100svh] bg-ink text-cream font-sans overflow-x-clip max-w-[430px] mx-auto">
      {/* top bar */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 flex items-center justify-between gap-3 h-14 pl-5 pr-4 border-b border-cream/10" style={{ background: "rgba(22,16,13,0.86)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <span className="font-display font-extrabold text-[21px] tracking-[-0.05em] leading-none">brandit<span className="text-mango">bro</span><span className="text-chili">.</span></span>
        {wa && (
          <a href={wa} className="flex items-center gap-[7px] h-11 px-[14px] rounded-full border border-cream/20 text-[13px] font-bold text-cream active:scale-95 transition-transform">
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: "#4ADE80" }} />WhatsApp
          </a>
        )}
      </div>

      {tab === "home" && <HomeScreen open={open} setOpen={setOpen} go={go} wa={wa} />}
      {tab === "services" && <ServicesScreen go={go} />}
      {tab === "how" && <HowScreen go={go} wa={wa} />}
      {tab === "pricing" && (
        <PricingScreen
          phase={phase} step={step} picked={picked} size={size} when={when} calcLine={calcLine}
          setPicked={setPicked} setSize={setSize} setWhen={setWhen} stepReady={stepReady}
          next={nextStep} back={() => setStep(Math.max(0, step - 1))} restart={restart} takeToContact={takeToContact}
          t={t} oneNow={oneNow} days={days}
        />
      )}
      {tab === "contact" && (
        <ContactScreen
          sent={sent} busy={busy} form={form} setForm={setForm} chips={chips} setChips={setChips}
          est={est} estScope={estScope} canSend={canSend} submit={submit} wa={wa} goHome={() => go("home")}
        />
      )}

      {/* tab bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[60] flex items-stretch gap-[2px] px-[8px] pt-2 border-t border-cream/12"
        style={{ height: "calc(72px + env(safe-area-inset-bottom))", paddingBottom: "calc(8px + env(safe-area-inset-bottom))", background: "rgba(11,8,6,0.94)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}>
        {tabs.map(([key, label]) => {
          const on = tab === key;
          return (
            <button key={key} type="button" onClick={() => go(key)}
              className="flex-1 flex flex-col items-center justify-center gap-[5px] border-0 rounded-2xl text-[11px] font-bold transition-colors active:scale-95"
              style={{ background: on ? "rgba(255,122,0,0.16)" : "transparent", color: on ? "#FF7A00" : "rgba(255,243,228,0.55)" }}>
              <span className="w-[16px] h-[3px] rounded-full" style={{ background: on ? "#FF7A00" : "transparent" }} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════ HOME ══════════════ */
function HomeScreen({ open, setOpen, go, wa }: { open: Record<string, boolean>; setOpen: (f: (o: Record<string, boolean>) => Record<string, boolean>) => void; go: (t: Tab) => void; wa: string }) {
  const { proof } = useContent();
  const themeCls = (th: HomeCard["theme"]) => th === "white" ? "bg-white text-ink" : th === "ink" ? "bg-ink text-cream" : th === "teal" ? "text-cream" : "bg-sand text-ink";
  const themeStyle = (th: HomeCard["theme"]) => th === "teal" ? { background: "#0E6B5E" } : undefined;
  return (
    <div className="pb-[104px]">
      {/* hero — content is centered in a flex-1 region, the scroll cue always sits
          BELOW it in flow so it can never overlap the CTAs on any phone height */}
      <div data-hero className="relative min-h-[100svh] flex flex-col px-5 pt-[62px] overflow-hidden" style={{ paddingBottom: "calc(84px + env(safe-area-inset-bottom))" }}>
        <div data-hero-glow aria-hidden className="absolute pointer-events-none" style={{ top: "12%", right: "-140px", width: "420px", height: "420px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,122,0,0.26) 0%, rgba(226,62,44,0.12) 46%, rgba(22,16,13,0) 72%)", willChange: "transform, opacity" }} />
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-4">
          <div data-hero-copy className="relative flex flex-col gap-[14px]">
            <span className="inline-flex self-start items-center gap-2 py-2 px-[14px] rounded-full border border-cream/20 text-[12px] font-bold text-cream/80">
              <span className="w-[6px] h-[6px] rounded-full bg-mango" />4 project slots · August
            </span>
            <h1 className="m-hero-h1 font-display font-extrabold text-[46px] leading-[0.88] tracking-[-0.05em] m-0">Be the one<br />they <span className="text-mango">find</span>.</h1>
            <p className="m-0 text-[17px] leading-[1.45] text-cream/70">Website, app, ads, video. Price and launch date agreed before anything starts.</p>
          </div>
          <div data-hero-mock className="relative bg-cream rounded-[24px] p-[14px] shadow-[0_30px_60px_-34px_rgba(0,0,0,0.8)]" style={{ willChange: "transform, opacity" }}>
            <div className="flex items-center gap-[10px] bg-white border-[1.5px] border-line rounded-full py-[13px] px-4">
              <span className="w-[13px] h-[13px] border-2 border-brown-mid rounded-full shrink-0" />
              <span className="text-[15px] text-ink font-medium whitespace-nowrap overflow-hidden"><span data-typed>best cafe near me</span><span className="inline-block w-[2px] h-[15px] bg-mango align-[-3px] ml-[2px]" style={{ animation: "bibCaret 1.05s steps(1) infinite" }} /></span>
            </div>
            <div className="flex flex-col gap-2 pt-3 px-[2px] pb-[2px]">
              <div className="bg-ink rounded-[14px] py-[14px] px-4 flex flex-col gap-[5px]">
                <span className="self-start py-[3px] px-[9px] rounded-full bg-mango text-ink text-[9.5px] font-extrabold tracking-[0.14em] uppercase">Top result</span>
                <span className="font-display font-extrabold text-[19px] tracking-[-0.03em] text-cream">Your business</span>
                <span className="text-[12.5px] text-cream/60">Open now · Book in two taps · ★ 4.9</span>
              </div>
              <div className="m-hero-extra bg-ink/5 rounded-[12px] py-3 px-4 flex flex-col gap-[3px]">
                <span className="text-[14px] font-bold text-ink/40">Someone else</span>
                <span className="text-[12px] text-ink/30">2.1 km · No website</span>
              </div>
            </div>
          </div>
          <div className="relative flex flex-col gap-[10px]">
            <button type="button" onClick={() => go("pricing")} className="h-[54px] rounded-full bg-mango text-ink font-bold text-[16.5px] border-0 active:scale-[0.98] transition-transform">See what it costs</button>
            <button type="button" onClick={() => go("contact")} className="h-[54px] rounded-full bg-transparent border-[1.5px] border-cream/25 text-cream font-bold text-[16.5px] active:scale-[0.98] transition-transform">Talk to a human</button>
          </div>
        </div>
        <div data-scrollcue className="m-scrollcue flex flex-col items-center gap-[6px] pointer-events-none pt-5">
          <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-cream/40">Scroll</span>
          <span data-cue-dot className="w-[5px] h-[5px] rounded-full bg-mango block" style={{ animation: "bibDrift 1.7s ease-in-out infinite", willChange: "transform" }} />
        </div>
      </div>

      {/* dark scene */}
      <div data-scene="dark" className="relative h-[200svh] bg-ink">
        <div data-scene-frame className="sticky top-0 h-[100svh] overflow-hidden flex items-center justify-center px-5">
          <div data-dark-dot className="absolute w-[60px] h-[60px] rounded-full bg-mango" style={{ transform: "scale(0.15)", willChange: "transform" }} />
          <div data-dark-a className="relative flex flex-col gap-4 text-center">
            <span className="text-[11.5px] tracking-[0.24em] uppercase font-bold text-mango-soft">The honest part</span>
            <h2 className="font-display font-extrabold text-[38px] leading-[0.94] tracking-[-0.05em] m-0">It was never the plan.</h2>
            <p className="m-0 text-[16.5px] leading-[1.5] text-cream/[0.66]">You were busy being good at the actual work. Nobody had a spare month to figure out websites, ads and reels.</p>
          </div>
          <div data-dark-b className="absolute text-center opacity-0">
            <h2 className="font-display font-extrabold text-[46px] leading-[0.9] tracking-[-0.05em] m-0 text-ink">That part<br />is ours.</h2>
          </div>
        </div>
      </div>

      {/* services carousel */}
      <div className="bg-cream text-ink pt-14">
        <div data-mr className="px-5 flex flex-col gap-3">
          <span className="text-[11.5px] tracking-[0.24em] uppercase font-bold text-brown">Swipe · five things we do</span>
          <h2 className="font-display font-extrabold text-[30px] leading-[0.98] tracking-[-0.04em] m-0">Everything it takes to be found and booked.</h2>
        </div>
        <HomeCarousel topMargin="mt-[22px]" count={HOME_CARDS.length}>
          {HOME_CARDS.map((c) => (
            <SwiperSlide key={c.n}>
              <div className={`h-full rounded-[24px] p-[24px_22px] flex flex-col gap-3 min-h-[250px] ${themeCls(c.theme)}`} style={themeStyle(c.theme)}>
                <span className={`font-display font-extrabold text-[13px] tracking-[0.12em] ${c.numColor}`}>{c.n}</span>
                <span className="font-display font-extrabold text-[26px] leading-[0.96] tracking-[-0.04em]">{c.title}</span>
                <span className={`text-[15.5px] leading-[1.45] ${c.theme === "ink" ? "text-cream/70" : c.theme === "teal" ? "text-cream/[0.78]" : "text-brown-ink"}`}>{c.body}</span>
                <span className={`mt-auto text-[13.5px] font-bold ${c.priceColor}`}>{c.price}</span>
              </div>
            </SwiperSlide>
          ))}
        </HomeCarousel>
        <div className="px-5 pt-[22px] pb-[60px]">
          <button type="button" onClick={() => go("services")} className="w-full h-[54px] rounded-full bg-ink text-cream border-0 font-bold text-[16px] active:scale-[0.98] transition-transform">Open the full breakdown</button>
        </div>
      </div>

      {/* timeline */}
      <div className="px-5 py-[60px] bg-ink">
        <div data-mr className="flex flex-col gap-3">
          <span className="text-[11.5px] tracking-[0.24em] uppercase font-bold text-mango-soft">How it goes</span>
          <h2 className="font-display font-extrabold text-[30px] leading-[0.98] tracking-[-0.04em] m-0">Five stages, and a date we keep.</h2>
        </div>
        <div data-steps className="relative mt-[26px] flex flex-col">
          <span className="absolute left-4 top-[14px] bottom-[24px] w-[2px] bg-cream/15" />
          <span data-step-fill className="absolute left-4 top-[14px] w-[2px] bg-mango" style={{ height: 0 }} />
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative grid grid-cols-[34px_minmax(0,1fr)] gap-4">
              <div className="flex flex-col items-center">
                <span data-step-badge className="w-[34px] h-[34px] rounded-full font-display font-extrabold text-[13px] flex items-center justify-center" style={{ background: "#16100D", border: "2px solid rgba(255,243,228,0.18)", color: "rgba(255,243,228,0.55)", transition: "background 260ms ease, color 260ms ease, border-color 260ms ease" }}>{s.n}</span>
              </div>
              <div className={`flex flex-col gap-[6px] ${i < STEPS.length - 1 ? "pb-[26px]" : ""}`}>
                <span className="font-display font-extrabold text-[20px] tracking-[-0.03em]">{s.title} <span className="text-[14px] text-cream/45">{s.timing}</span></span>
                <span className="text-[15.5px] leading-[1.45] text-cream/[0.66]">{s.body}</span>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => go("how")} className="mt-7 w-full h-[54px] rounded-full bg-transparent border-[1.5px] border-cream/25 text-cream font-bold text-[16px] active:scale-[0.98] transition-transform">See how it works →</button>
      </div>

      {/* proof carousel */}
      <div className="pt-14 pb-[60px] bg-sand text-ink">
        <div data-mr className="px-5 flex flex-col gap-3">
          <span className="text-[11.5px] tracking-[0.24em] uppercase font-bold text-brown">Swipe · people your size</span>
          <h2 className="font-display font-extrabold text-[30px] leading-[0.98] tracking-[-0.04em] m-0">Numbers you can check.</h2>
        </div>
        <HomeCarousel topMargin="mt-5" count={proof.stats.length}>
          {proof.stats.map((s) => (
            <SwiperSlide key={s.tag}>
              <div className="h-full bg-ink text-cream rounded-[24px] p-[24px_22px] flex flex-col gap-3">
                <span className="text-[11px] tracking-[0.22em] uppercase font-bold text-mango-soft">{s.tag}</span>
                <span className="font-display font-extrabold text-[52px] leading-[0.85] tracking-[-0.05em] text-mango">{s.value}</span>
                <span className="text-[16px] leading-[1.4]">{s.body}</span>
                <span className="text-[13px] text-cream/60">{s.meta}</span>
              </div>
            </SwiperSlide>
          ))}
        </HomeCarousel>
        {proof.isSample && <span className="block px-5 pt-[18px] text-[13px] leading-[1.45] text-brown-mid">Sample figures — replaced with real client results before launch. Ask us for the owner&apos;s number; we&apos;ll give it to you.</span>}
      </div>

      {/* objections accordion */}
      <div className="px-5 pt-14 pb-16 bg-ink">
        <div data-mr className="flex flex-col gap-3">
          <span className="text-[11.5px] tracking-[0.24em] uppercase font-bold text-mango-soft">Tap to open</span>
          <h2 className="font-display font-extrabold text-[30px] leading-[0.98] tracking-[-0.04em] m-0">You&apos;ve been burned before.</h2>
        </div>
        <div className="mt-[22px] flex flex-col gap-[10px]">
          {OBJECTIONS.map((o, i) => {
            const k = "obj" + i;
            const isOpen = !!open[k];
            return (
              <div key={k} className="bg-cream/[0.06] border border-cream/12 rounded-[20px] overflow-hidden">
                <button type="button" onClick={() => setOpen((o2) => ({ ...o2, [k]: !o2[k] }))} className="w-full min-h-[60px] flex items-center justify-between gap-[14px] py-[18px] px-5 bg-transparent border-0 text-cream text-left text-[17px] font-bold active:scale-[0.99] transition-transform">
                  {o.q}
                  <span className="shrink-0 font-display text-[22px] font-extrabold text-mango">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <span className="block px-5 pb-5 text-[15.5px] leading-[1.5] text-cream/70" style={{ animation: "bibRise 300ms ease both" }}>{o.a}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* close CTA */}
      <div className="px-5 pt-16 pb-[72px] bg-mango text-ink">
        <h2 data-mr className="font-display font-extrabold text-[40px] leading-[0.92] tracking-[-0.05em] m-0">Let&apos;s put you online.</h2>
        <p data-mr data-mrd="80" className="mt-4 mb-6 text-[16.5px] leading-[1.5] text-ink/70">Send a two-minute brief. You get a fixed price, a date, and what we&apos;d cut to protect both — inside a day.</p>
        <div className="flex flex-col gap-[10px]">
          <button type="button" onClick={() => go("contact")} className="h-14 rounded-full bg-ink text-cream border-0 font-bold text-[16.5px] active:scale-[0.98] transition-transform">Send the brief</button>
          {wa && <a href={wa} className="h-14 rounded-full border-[1.5px] border-ink/30 text-ink font-bold text-[16.5px] flex items-center justify-center active:scale-[0.98] transition-transform">WhatsApp instead</a>}
        </div>
        <span className="block mt-[18px] text-[13.5px] text-ink/60">Answered by a person, within a working day. A no costs you nothing.</span>
      </div>
    </div>
  );
}

/* Swipe carousel (SwiperJS) — centered slides, synced pill dots, focus scale */
function HomeCarousel({ children, count, topMargin }: { children: React.ReactNode; count: number; topMargin: string }) {
  const [active, setActive] = useState(0);
  const focus = (sw: SwiperClass) => {
    sw.slides.forEach((slide) => {
      const p = Math.min(Math.abs((slide as unknown as { progress: number }).progress || 0), 1);
      (slide as HTMLElement).style.transform = `scale(${(1 - p * 0.05).toFixed(3)})`;
      (slide as HTMLElement).style.opacity = (1 - p * 0.35).toFixed(3);
    });
  };
  return (
    <>
      <Swiper
        className={`bib-swiper ${topMargin}`}
        slidesPerView="auto"
        spaceBetween={12}
        slidesOffsetBefore={20}
        slidesOffsetAfter={20}
        watchSlidesProgress
        onSlideChange={(sw) => setActive(sw.activeIndex)}
        onInit={focus}
        onSetTranslate={focus}
        onResize={focus}
      >
        {children}
      </Swiper>
      <div className="flex justify-center gap-[6px] pt-4 px-5">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className="w-[22px] h-1 rounded-full transition-colors duration-200" style={{ background: i === active ? "#16100D" : "rgba(22,16,13,0.18)" }} />
        ))}
      </div>
    </>
  );
}

/* ══════════════ SERVICES ══════════════ */
function ServicesScreen({ go }: { go: (t: Tab) => void }) {
  return (
    <div className="pt-[78px] pb-[104px] bg-cream text-ink min-h-[100svh]">
      <div className="px-5">
        <span className="text-[11.5px] tracking-[0.24em] uppercase font-bold text-brown">Services</span>
        <h1 className="font-display font-extrabold text-[36px] leading-[0.94] tracking-[-0.05em] mt-3 mb-[10px]">What you get, in plain words.</h1>
        <p className="m-0 text-[16.5px] leading-[1.5] text-brown-ink">Five things, and what each one really costs. Each one is its own section — scroll on.</p>
      </div>

      {/* full-bleed section per service, alternating light / dark */}
      <div className="mt-8 flex flex-col">
        {MOBILE_SERVICES.map((s) => {
          const sectionBg = s.dark ? "bg-ink text-cream" : s.key === "branding" ? "bg-sand text-ink" : "bg-white text-ink";
          const muted = s.dark ? "text-cream/60" : "text-brown-mid";
          return (
            <section key={s.key} className={`px-5 py-14 ${sectionBg}`}>
              <div data-mr className="h-[178px] rounded-[22px] flex items-center justify-center p-[18px] mb-7" style={{ background: s.artBg }}><ServiceArt kind={s.art} /></div>
              <div className="flex flex-col gap-[10px]">
                <span className={`inline-flex self-start items-center justify-center min-w-[30px] h-[22px] px-[9px] rounded-full font-display font-extrabold text-[12px] tracking-[0.06em] ${s.dark ? "text-mango-soft" : "text-brown"}`} style={{ background: s.dark ? "rgba(255,243,228,0.12)" : s.key === "branding" ? "#FFFFFF" : "#FFE0C2" }}>{s.num}</span>
                <h2 className="font-display font-extrabold text-[clamp(34px,10vw,44px)] leading-[0.96] tracking-[-0.045em] m-0">{s.title}</h2>
                <p className={`m-0 text-[16.5px] leading-[1.5] ${muted}`}>{s.blurb}</p>
              </div>
              <div className={`flex gap-[26px] py-[18px] my-5 border-y`} style={{ borderColor: s.dark ? "rgba(255,243,228,0.16)" : "rgba(22,16,13,0.12)" }}>
                <span className="flex flex-col gap-[3px]">
                  <span className="font-display font-extrabold text-[22px] tracking-[-0.04em]">{s.band}</span>
                  <span className={`text-[11px] tracking-[0.16em] uppercase font-bold ${muted}`}>typical</span>
                </span>
                <span className="flex flex-col gap-[3px]">
                  <span className="font-display font-extrabold text-[22px] tracking-[-0.04em]">{s.timing}</span>
                  <span className={`text-[11px] tracking-[0.16em] uppercase font-bold ${muted}`}>start to live</span>
                </span>
              </div>
              <div className="flex flex-col gap-[10px] mb-6">
                {s.items.map((it) => (
                  <div key={it} className="flex gap-[10px] items-start">
                    <span className="shrink-0 w-[6px] h-[6px] mt-[9px] rounded-full bg-mango" />
                    <span className="text-[15.5px] leading-[1.45]">{it}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => go("pricing")} className={`w-full h-[54px] rounded-full border-0 font-bold text-[16px] active:scale-[0.99] transition-transform ${s.cta === "mango" ? "bg-mango text-ink" : "bg-ink text-cream"}`}>Price this →</button>
            </section>
          );
        })}
      </div>

      <div className="px-5 pt-12 pb-4">
        <div className="bg-sand rounded-[24px] p-[24px_22px] flex flex-col gap-3">
          <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-brown-mid">The mistakes we fix</span>
          <span className="text-[15.5px] leading-[1.5] text-brown-ink">Sites that never ask for the booking. Ads pointed at a homepage. Reels with no hook in the first second. Logins held by someone who left.</span>
          <span className="text-[15.5px] leading-[1.5] text-ink font-bold">All four are cheap to fix before the build, expensive after.</span>
        </div>
      </div>
    </div>
  );
}

function ServiceArt({ kind }: { kind: MobileService["art"] }) {
  if (kind === "web") return (
    <div className="w-full max-w-[250px] bg-ink rounded-[16px] p-[9px]">
      <div className="flex items-center gap-[5px] pt-[2px] px-[3px] pb-2">
        <span className="w-[6px] h-[6px] rounded-full bg-chili" /><span className="w-[6px] h-[6px] rounded-full bg-mango" />
        <span className="flex-1 ml-[6px] h-3 rounded-full bg-cream/12" />
      </div>
      <div className="bg-cream rounded-[10px] p-[14px_13px] flex flex-col gap-[9px]">
        <span className="w-[78%] h-[11px] rounded-[3px] bg-ink" /><span className="w-[52%] h-[11px] rounded-[3px] bg-ink/25" />
        <span className="self-start py-[6px] px-[14px] rounded-full bg-mango text-ink text-[10px] font-extrabold">Book now</span>
      </div>
    </div>
  );
  if (kind === "app") return (
    <div className="flex items-end gap-3">
      <div className="w-24 rounded-[20px] bg-cream p-[7px]">
        <div className="rounded-[14px] h-[118px] p-[12px_10px] flex flex-col justify-between" style={{ background: "#0E6B5E" }}>
          <span className="text-[8px] tracking-[0.18em] uppercase font-bold text-cream/70">Today</span>
          <span className="font-display font-extrabold text-[17px] leading-[0.95] tracking-[-0.04em] text-cream">14 orders</span>
          <span className="h-[18px] rounded-full bg-mango" />
        </div>
      </div>
      <div className="w-24 rounded-[20px] bg-cream p-[7px] mb-[18px]">
        <div className="bg-sand rounded-[14px] h-24 p-[10px] flex flex-col gap-[7px]">
          <span className="h-4 rounded-[5px] bg-cream" /><span className="h-4 rounded-[5px] bg-mango" /><span className="h-4 rounded-[5px] bg-cream" />
        </div>
      </div>
    </div>
  );
  if (kind === "brand") return (
    <div className="flex items-center gap-[18px]">
      <span className="font-display font-extrabold text-[76px] leading-[0.8] tracking-[-0.06em] text-cream">b<span className="text-mango">.</span></span>
      <div className="flex flex-col gap-2">
        <div className="flex gap-[7px]">
          <span className="w-[26px] h-[26px] rounded-full bg-cream" /><span className="w-[26px] h-[26px] rounded-full bg-mango" /><span className="w-[26px] h-[26px] rounded-full bg-chili" /><span className="w-[26px] h-[26px] rounded-full" style={{ background: "#0E6B5E" }} />
        </div>
        <span className="font-display font-extrabold text-[26px] tracking-[-0.03em] text-cream/55">Aa</span>
      </div>
    </div>
  );
  if (kind === "chart") return (
    <div className="w-full max-w-[240px] flex flex-col gap-2">
      <div className="flex items-end gap-[9px] h-[92px]">
        <span className="flex-1 rounded-t-[6px] rounded-b-[2px]" style={{ height: "26%", background: "rgba(22,16,13,0.2)" }} />
        <span className="flex-1 rounded-t-[6px] rounded-b-[2px]" style={{ height: "40%", background: "rgba(22,16,13,0.3)" }} />
        <span className="flex-1 rounded-t-[6px] rounded-b-[2px] bg-chili" style={{ height: "56%" }} />
        <span className="flex-1 rounded-t-[6px] rounded-b-[2px] bg-cream" style={{ height: "74%" }} />
        <span className="flex-1 rounded-t-[6px] rounded-b-[2px] bg-ink" style={{ height: "100%" }} />
      </div>
      <div className="flex justify-between text-[10.5px] font-bold text-ink/55"><span>Week 1</span><span>Week 6</span></div>
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      <div className="w-[76px] h-[122px] rounded-[14px] bg-ink p-[11px_10px] flex flex-col justify-end gap-[6px]">
        <span className="w-full h-[7px] rounded-[3px] bg-cream/90" /><span className="w-[62%] h-[7px] rounded-[3px] bg-cream/40" /><span className="text-[9px] font-bold text-mango-soft">0:14</span>
      </div>
      <span className="w-10 h-10 rounded-full bg-mango text-ink text-[15px] flex items-center justify-center">▶</span>
      <div className="w-[76px] h-[122px] rounded-[14px] bg-cream border border-ink/10 p-[11px_10px] flex flex-col justify-between">
        <span className="text-[8.5px] tracking-[0.16em] uppercase font-bold text-brown">Reel 12</span>
        <span className="font-display font-extrabold text-[15px] leading-[0.95] tracking-[-0.03em] text-ink">Cut &amp; posted</span>
      </div>
    </div>
  );
}

/* ══════════════ HOW IT WORKS ══════════════ */
function HowScreen({ go, wa }: { go: (t: Tab) => void; wa: string }) {
  return (
    <div className="min-h-[100svh] pb-[104px]">
      {/* hero */}
      <section className="relative bg-ink text-cream px-5 pt-[92px] pb-12 overflow-hidden text-center">
        <div aria-hidden className="absolute pointer-events-none" style={{ top: "-10%", left: "50%", transform: "translateX(-50%)", width: "460px", height: "460px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,122,0,0.24) 0%, rgba(255,122,0,0) 66%)" }} />
        <span className="relative text-[11.5px] tracking-[0.32em] uppercase font-bold text-mango-soft">How it works</span>
        <h1 className="relative font-display font-extrabold text-[clamp(36px,10vw,46px)] leading-[0.92] tracking-[-0.05em] mt-3 mb-3">Six stages. Nothing hidden in between.</h1>
        <p className="relative m-0 text-[16px] leading-[1.5] text-cream/[0.66]">Most agencies go quiet after the deposit. This is the whole thing, start to finish — including the parts where you can walk away.</p>
      </section>

      {/* the six stages */}
      <section className="bg-ink text-cream px-5 pb-14 flex flex-col gap-3">
        {HOW_STAGES.map((s) => {
          const toneCls = s.tone === "mango" ? "bg-mango/10 border-mango/40" : s.tone === "teal" ? "border" : "bg-cream/5 border-cream/12";
          const tealStyle = s.tone === "teal" ? { background: "rgba(14,107,94,0.22)", borderColor: "rgba(14,107,94,0.6)" } : undefined;
          return (
            <div key={s.n} className={`rounded-[22px] p-6 flex flex-col gap-3 border ${toneCls}`} style={tealStyle}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display font-extrabold text-[15px] tracking-[0.14em] text-mango">{s.n}</span>
                <span className={`text-[12.5px] font-bold ${s.tone === "mango" ? "text-mango-soft" : "text-cream/45"}`}>{s.tag}</span>
              </div>
              <h3 className="font-display font-extrabold text-[26px] leading-none tracking-[-0.03em] m-0">{s.title}</h3>
              <p className="m-0 text-[15.5px] leading-[1.5] text-cream/[0.72]">{s.body}</p>
              <div className={`flex flex-col gap-[6px] border-t pt-3 mt-1 ${s.tone === "mango" ? "border-mango/30" : "border-cream/15"}`}>
                <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-mango-soft">You leave with</span>
                <span className="text-[15px] leading-[1.45] text-cream/[0.86]">{s.leave}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* interlude */}
      <section className="bg-cream text-ink px-5 py-16 text-center flex flex-col items-center gap-4">
        <span className="text-[11.5px] tracking-[0.32em] uppercase font-bold text-brown">Interlude</span>
        <h2 className="font-display font-extrabold text-[clamp(30px,8vw,40px)] leading-[0.96] tracking-[-0.045em] m-0">The stage everyone else skips is the one we build the whole process around.</h2>
        <p className="m-0 text-[16px] leading-[1.55] text-brown-ink">Stage three exists so you never have to sit through a project you already know is wrong. It costs us occasionally. It has never once cost a client.</p>
      </section>

      {/* what we need */}
      <section className="bg-white text-ink px-5 py-14">
        <h2 className="font-display font-extrabold text-[clamp(28px,7vw,36px)] leading-[0.96] tracking-[-0.045em] m-0 mb-6">What we need from you. All of it.</h2>
        <div className="flex flex-col gap-[14px]">
          {WHAT_WE_NEED.map(([n, h, b]) => (
            <div key={n} className="flex gap-[16px] items-start bg-cream rounded-[18px] p-5">
              <span className="shrink-0 font-display font-extrabold text-[20px] text-mango leading-none mt-[2px]">{n}</span>
              <div className="flex flex-col gap-[5px]">
                <span className="text-[16.5px] font-bold">{h}</span>
                <span className="text-[15px] leading-[1.5] text-brown-ink">{b}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* when it goes wrong */}
      <section className="bg-sand text-ink px-5 py-14">
        <span className="text-[11.5px] tracking-[0.3em] uppercase font-bold text-brown">The honest part</span>
        <h2 className="font-display font-extrabold text-[clamp(28px,7vw,36px)] leading-[0.96] tracking-[-0.045em] mt-3 mb-6">And when something goes wrong?</h2>
        <div className="flex flex-col gap-5">
          {WHEN_WRONG.map(([h, b]) => (
            <div key={h} className="flex flex-col gap-[7px] border-t-2 border-ink pt-4">
              <span className="text-[16.5px] font-bold">{h}</span>
              <span className="text-[15px] leading-[1.5] text-brown-ink">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* close */}
      <section className="relative bg-ink text-cream px-5 py-16 overflow-hidden text-center">
        <div aria-hidden className="absolute pointer-events-none" style={{ bottom: "-30%", left: "50%", transform: "translateX(-50%)", width: "500px", height: "500px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,122,0,0.28) 0%, rgba(255,122,0,0) 66%)" }} />
        <h2 className="relative font-display font-extrabold text-[clamp(32px,9vw,44px)] leading-[0.94] tracking-[-0.05em] m-0 mb-4">That&apos;s the whole film. No deleted scenes.</h2>
        <p className="relative m-0 text-[16px] leading-[1.55] text-cream/70 mb-7">If the process sounds like something you&apos;d want to be inside, the next step is a number — and you can get that without speaking to anyone.</p>
        <div className="relative flex flex-col gap-[10px]">
          <button type="button" onClick={() => go("pricing")} className="h-[54px] rounded-full bg-mango text-ink font-bold text-[16.5px] border-0 active:scale-[0.98] transition-transform">See my estimate →</button>
          {wa ? (
            <a href={wa} className="h-[54px] rounded-full border-[1.5px] border-cream/30 text-cream font-bold text-[16.5px] flex items-center justify-center active:scale-[0.98] transition-transform">Message us on WhatsApp</a>
          ) : (
            <button type="button" onClick={() => go("contact")} className="h-[54px] rounded-full border-[1.5px] border-cream/30 text-cream font-bold text-[16.5px] active:scale-[0.98] transition-transform">Talk to a human</button>
          )}
        </div>
      </section>
    </div>
  );
}

/* ══════════════ PRICING ══════════════ */
type EstT = { keys: string[]; oneLo: number; oneHi: number; monLo: number; monHi: number; dLo: number; dHi: number };
function PricingScreen(props: {
  phase: "quiz" | "calc" | "result"; step: number; picked: Record<string, boolean>; size: SizeKey | null; when: string | null; calcLine: number;
  setPicked: (f: (p: Record<string, boolean>) => Record<string, boolean>) => void; setSize: (s: SizeKey) => void; setWhen: (w: string) => void; stepReady: boolean;
  next: () => void; back: () => void; restart: () => void; takeToContact: () => void; t: EstT; oneNow: [number, number]; days: string;
}) {
  const { phase, step, picked, size, when, calcLine, setPicked, setSize, setWhen, stepReady, next, back, restart, takeToContact, t, oneNow, days } = props;
  const { offer } = useContent();

  const stepDefs = [
    { title: "What do you need?", help: "Pick everything that applies. You can change it later.", counter: "Question 1 of 3", assurance: "No email asked" },
    { title: "Who is this for?", help: "It changes the size of the build, so it changes the price.", counter: "Question 2 of 3", assurance: "Still no email" },
    { title: "When do you want it live?", help: "Honest answer, not the brave one.", counter: "Question 3 of 3", assurance: "Almost there" },
  ][Math.min(2, step)];

  const options = step === 0
    ? SERVICE_OPTIONS.map(([k, label, note]) => ({ k, label, note, on: !!picked[k], pick: () => setPicked((p) => { const n = { ...p }; if (n[k]) delete n[k]; else n[k] = true; return n; }) }))
    : step === 1
    ? SIZE_OPTIONS.map(([k, label, note]) => ({ k, label, note, on: size === k, pick: () => setSize(k as SizeKey) }))
    : WHEN_OPTIONS.map(([k, label, note]) => ({ k, label, note, on: when === k, pick: () => setWhen(k) }));

  const reaction = [
    Object.keys(picked).filter(k=>picked[k]).length > 1 ? "Good — bundled work is quoted as one job, not stacked invoices." : (picked.website ? "Most people start here. It is the cheapest thing that pays for itself." : (Object.keys(picked).filter(k=>picked[k]).length ? "Noted. We will scope it around what actually moves your numbers." : "")),
    size === "solo" ? "We keep solo builds lean — no line items you cannot use yet." : (size ? "Sized for a real team and real traffic." : ""),
    when === "exploring" ? "Then just take the number and go. Nobody will chase you." : (when ? "We will only give you a date we can hold." : ""),
  ][Math.min(2, step)];

  const progress = Math.round(((step + (stepReady ? 1 : 0.35)) / 3) * 100) + "%";
  const deliverables = t.keys.length ? t.keys.map((k) => OWN_LINES[k]).concat(["Every login, file and password, in your name"]) : ["Pick a service to see what you own"];

  /* ── the price-drop VFX: count up to the full band, then the full price
        lifts away and the discounted price lands with a flash + confetti ── */
  const cardRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLSpanElement>(null);
  const amountRef = useRef<HTMLSpanElement>(null);
  const wasRef = useRef<HTMLSpanElement>(null);
  const offerRef = useRef<HTMLSpanElement>(null);
  const teaserRef = useRef<HTMLSpanElement>(null);
  const savedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (phase !== "result") return;
    const amount = amountRef.current;
    if (!t.oneHi || !amount) return; // retainer-only: nothing to drop
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tm: ReturnType<typeof setTimeout>[] = [];
    const COLORS = ["#FF7A00", "#FFB169", "#0E6B5E", "#16100D", "#FFE0C2"];

    if (reduce) {
      amount.textContent = band(oneNow[0], oneNow[1]);
      if (wasRef.current) { wasRef.current.textContent = band(t.oneLo, t.oneHi); wasRef.current.style.opacity = "1"; }
      if (offerRef.current) offerRef.current.style.opacity = "1";
      if (savedRef.current) savedRef.current.textContent = money(Math.round(t.oneHi * 0.3));
      return;
    }

    const countTo = (el: HTMLElement, toLo: number, toHi: number, dur: number, cb?: () => void) => {
      const s0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - s0) / dur); const e = 1 - Math.pow(1 - p, 3);
        el.textContent = band(Math.round(toLo * e), Math.round(toHi * e));
        if (p < 1) requestAnimationFrame(tick); else cb?.();
      };
      requestAnimationFrame(tick);
    };
    const fxCharge = () => {
      if (cardRef.current) cardRef.current.style.animation = "bibCharge 1400ms cubic-bezier(.4,0,.3,1) both";
      const host = fxRef.current; if (!host) return;
      const sweep = document.createElement("span");
      sweep.setAttribute("style", "position:absolute;top:0;bottom:0;left:0;width:55%;background:linear-gradient(100deg, rgba(255,122,0,0) 0%, rgba(255,183,105,0.55) 45%, rgba(255,255,255,0.75) 55%, rgba(255,122,0,0) 100%);animation: bibSweep 1200ms cubic-bezier(.3,0,.2,1) both;");
      host.appendChild(sweep); tm.push(setTimeout(() => sweep.remove(), 1400));
    };
    const fxCelebrate = () => {
      const host = fxRef.current; if (!host) return;
      const flash = document.createElement("span");
      flash.setAttribute("style", "position:absolute;left:12%;top:30%;width:76%;padding-bottom:76%;margin:-38% 0 0 0;border-radius:999px;background:radial-gradient(circle, rgba(255,190,120,0.85) 0%, rgba(255,122,0,0.35) 42%, rgba(255,122,0,0) 72%);animation: bibFlash 900ms cubic-bezier(.16,.84,.28,1) both;");
      host.appendChild(flash);
      for (let i = 0; i < 42; i++) {
        const p = document.createElement("span");
        const size = 6 + Math.random() * 7, left = Math.random() * 100, dx = (Math.random() * 2 - 1) * 100, dy = 220 + Math.random() * 300, rot = (Math.random() * 900 - 450) + "deg", round = Math.random() > 0.6 ? "999px" : "2px";
        p.setAttribute("style", `position:absolute;top:-14px;left:${left.toFixed(1)}%;width:${size.toFixed(0)}px;height:${(size * (0.5 + Math.random())).toFixed(0)}px;border-radius:${round};background:${COLORS[i % COLORS.length]};--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--rot:${rot};animation: bibConfetti ${(1500 + Math.random() * 1000).toFixed(0)}ms cubic-bezier(.2,.6,.35,1) ${(Math.random() * 240).toFixed(0)}ms both;`);
        host.appendChild(p);
      }
      tm.push(setTimeout(() => { if (host) host.innerHTML = ""; }, 3200));
    };

    countTo(amount, t.oneLo, t.oneHi, 1050, () => {
      amount.style.animation = "bibSettle 460ms cubic-bezier(.16,.84,.28,1) both";
      tm.push(setTimeout(teaseOffer, 680));
    });
    function teaseOffer() {
      const tease = teaserRef.current;
      if (tease) { tease.textContent = "Hold on — first project with us?"; tease.style.animation = "bibSlideIn 420ms cubic-bezier(.16,.84,.28,1) both"; tease.style.opacity = "1"; }
      fxCharge();
      tm.push(setTimeout(swap, 1020));
    }
    function swap() {
      const el = amountRef.current, was = wasRef.current;
      const lo = oneNow[0], hi = oneNow[1];
      if (!el) return;
      el.style.animation = "bibNumOut 300ms cubic-bezier(.5,0,.75,0) both";
      tm.push(setTimeout(() => {
        if (was) { was.textContent = band(t.oneLo, t.oneHi); was.style.animation = "bibSlideIn 380ms cubic-bezier(.16,.84,.28,1) both"; was.style.opacity = "1"; }
        el.textContent = band(lo, hi);
        el.style.animation = "bibNumIn 640ms cubic-bezier(.16,.84,.28,1) both";
        fxCelebrate();
        tm.push(setTimeout(() => {
          if (offerRef.current) { offerRef.current.style.animation = "bibBadgeIn 620ms cubic-bezier(.16,.84,.28,1) both"; offerRef.current.style.opacity = "1"; }
          const tease = teaserRef.current;
          if (tease) {
            tease.style.transition = "opacity 240ms ease"; tease.style.opacity = "0";
            tm.push(setTimeout(() => { tease.textContent = `Yeah — ${offer.firstProjectDiscountPct}% comes straight off. Nothing to enter.`; tease.style.animation = "bibSlideIn 420ms cubic-bezier(.16,.84,.28,1) both"; tease.style.opacity = "1"; }, 260));
          }
          const saved = savedRef.current;
          if (saved) {
            const target = Math.round(t.oneHi * 0.3), s0 = performance.now();
            const tick = (now: number) => { const p = Math.min(1, (now - s0) / 700); const e = 1 - Math.pow(1 - p, 3); saved.textContent = money(Math.round(target * e)); if (p < 1) requestAnimationFrame(tick); else saved.textContent = money(target); };
            requestAnimationFrame(tick);
          }
        }, 340));
      }, 290));
    }
    return () => tm.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="min-h-[100svh] bg-cream text-ink pt-[70px]">
      {phase === "quiz" && (
        <>
          <div className="px-5 pb-[176px]">
            <div className="flex items-center justify-between gap-[14px] pt-3 pb-[10px]">
              <span className="text-[11.5px] tracking-[0.2em] uppercase font-bold text-brown-mid">{stepDefs.counter}</span>
              <span className="text-[12.5px] font-semibold text-[#8A6B5B]">{stepDefs.assurance}</span>
            </div>
            <div className="h-[5px] rounded-full bg-[#F1E4D4] overflow-hidden">
              <div className="h-full rounded-full bg-mango" style={{ width: progress, transition: "width 520ms cubic-bezier(.16,.84,.28,1)" }} />
            </div>
            <h1 className="font-display font-extrabold text-[32px] leading-none tracking-[-0.045em] mt-[26px] mb-2">{stepDefs.title}</h1>
            <p className="m-0 mb-5 text-[15.5px] leading-[1.5] text-brown-mid">{stepDefs.help}</p>
            <div className="flex flex-col gap-[10px]">
              {options.map((opt) => (
                <button key={opt.k} type="button" onClick={opt.pick}
                  className={`text-left flex items-center gap-[14px] min-h-[68px] py-[15px] px-[18px] rounded-[20px] border-[1.5px] active:scale-[0.985] transition-transform ${opt.on ? "bg-ink text-cream border-ink" : "bg-white text-ink"}`}
                  style={opt.on ? undefined : { borderColor: "rgba(22,16,13,0.14)" }}>
                  <span className={`shrink-0 w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center text-[13px] font-extrabold ${opt.on ? "border-mango bg-mango text-ink" : "text-transparent"}`} style={opt.on ? undefined : { borderColor: "rgba(22,16,13,0.2)" }}>{opt.on ? "✓" : ""}</span>
                  <span className="flex-1 flex flex-col gap-[2px]">
                    <span className="text-[16.5px] font-bold">{opt.label}</span>
                    <span className={`text-[13px] leading-[1.35] ${opt.on ? "text-cream/60" : "text-[#8A6B5B]"}`}>{opt.note}</span>
                  </span>
                </button>
              ))}
            </div>
            {reaction && (
              <div className="mt-4 flex gap-[10px] items-start bg-[#E9F3F0] rounded-2xl py-[15px] px-4" style={{ animation: "bibRise 340ms ease both" }}>
                <span className="shrink-0 w-5 h-5 rounded-full text-cream text-[12px] font-extrabold flex items-center justify-center" style={{ background: "#0E6B5E" }}>✓</span>
                <span className="text-[14.5px] leading-[1.4] text-[#123F38]">{reaction}</span>
              </div>
            )}
          </div>
          <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] bottom-[72px] z-[45] flex items-center gap-3 px-5 pt-3 pb-[14px]" style={{ background: "linear-gradient(to top, #FFF3E4 62%, rgba(255,243,228,0))" }}>
            {step > 0 && <button type="button" onClick={back} className="shrink-0 w-[54px] h-[54px] rounded-full border-[1.5px] bg-transparent text-ink text-[18px] font-bold active:scale-95 transition-transform" style={{ borderColor: "rgba(22,16,13,0.18)" }}>←</button>}
            <button type="button" onClick={next} disabled={!stepReady} className="flex-1 h-[54px] rounded-full border-0 font-bold text-[16.5px] active:scale-[0.99] transition-transform"
              style={{ background: stepReady ? "#16100D" : "rgba(22,16,13,0.1)", color: stepReady ? "#FFF3E4" : "rgba(22,16,13,0.42)" }}>
              {step < 2 ? (stepReady ? "Next" : "Pick one to continue") : "See my estimate"}
            </button>
          </div>
        </>
      )}

      {phase === "calc" && (
        <div className="min-h-[70svh] flex flex-col items-center justify-center gap-[22px] px-5 pt-10 pb-[120px] text-center">
          <div className="relative w-[84px] h-[84px] flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-[3px] border-[#F1E4D4] border-t-mango" style={{ animation: "bibSpin 900ms linear infinite" }} />
            <span className="font-display font-extrabold text-[26px] tracking-[-0.05em]">b<span className="text-mango">.</span></span>
          </div>
          <span className="font-display font-extrabold text-[24px] tracking-[-0.035em]">Crunching your estimate</span>
          <span key={calcLine} className="text-[15px] text-brown-mid" style={{ animation: "bibRise 320ms ease both" }}>{CALC_LINES[calcLine]}</span>
        </div>
      )}

      {phase === "result" && (
        <>
          <div className="px-5 pt-[10px] pb-[176px] flex flex-col gap-[18px]">
            <div ref={cardRef} className="relative overflow-hidden bg-ink text-cream rounded-[26px] p-[26px_22px]" style={{ animation: "bibRise 480ms cubic-bezier(.16,.84,.28,1) both" }}>
              <span ref={fxRef} aria-hidden className="absolute inset-0 overflow-hidden rounded-[26px] pointer-events-none z-[3]" />
              <div className="relative flex flex-col gap-[14px]">
                <div className="flex flex-wrap items-center gap-[10px]">
                  <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-mango-soft">Your estimate</span>
                  {t.oneHi > 0 && <span ref={offerRef} className="opacity-0 py-[6px] px-3 rounded-full bg-mango text-ink text-[11.5px] font-extrabold">First project · {offer.firstProjectDiscountPct}% off the build</span>}
                </div>
                {t.oneHi > 0 && <span ref={wasRef} className="opacity-0 text-[16px] font-semibold text-cream/45 line-through" />}
                <span ref={amountRef} className="inline-block font-display font-extrabold text-[44px] leading-[0.94] tracking-[-0.05em] text-mango" style={{ transformOrigin: "left center" }}>{t.oneHi ? band(t.oneLo, t.oneHi) : (t.monHi ? "No build fee" : "Pick a service")}</span>
                {t.oneHi > 0 && <span ref={teaserRef} className="opacity-0 text-[14px] font-bold text-mango-light">&nbsp;</span>}
                <span className="text-[14px] text-cream/60">{t.oneHi ? "one-time build, fixed at signing" : "ongoing work only"}</span>
                {t.monHi > 0 && (
                  <div className="flex flex-col gap-1 border-t border-cream/[0.16] pt-[14px]">
                    <span className="font-display font-extrabold text-[22px] tracking-[-0.035em]">{band(t.monLo, t.monHi)} / month</span>
                    <span className="text-[12.5px] text-cream/55">cancel with 30 days notice · ad budget never marked up</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-[14px_26px] border-t border-cream/[0.16] pt-[14px]">
                  <span className="flex flex-col gap-[2px]"><span className="font-display font-extrabold text-[20px] tracking-[-0.03em]">{days}</span><span className="text-[12px] text-cream/50">typical build</span></span>
                  <span className="flex flex-col gap-[2px]"><span ref={savedRef} className="font-display font-extrabold text-[20px] tracking-[-0.03em]">{t.oneHi ? "—" : "—"}</span><span className="text-[12px] text-cream/50">you keep</span></span>
                  <span className="flex flex-col gap-[2px]"><span className="font-display font-extrabold text-[20px] tracking-[-0.03em]">0</span><span className="text-[12px] text-cream/50">hidden fees</span></span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-[10px]">
              <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-brown-mid">What you end up owning</span>
              {deliverables.map((line) => (
                <div key={line} className="flex gap-[10px] items-start">
                  <span className="shrink-0 w-[18px] h-[18px] mt-[2px] rounded-full bg-[#E9F3F0] text-[#0E6B5E] text-[11px] font-extrabold flex items-center justify-center">✓</span>
                  <span className="text-[15px] leading-[1.45] text-brown-deep">{line}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-[10px] items-start bg-[#FFF6E9] border-[1.5px] border-[#F0DCC2] rounded-[18px] p-4">
              <span className="shrink-0 w-5 h-5 rounded-full bg-mango text-ink text-[12px] font-extrabold flex items-center justify-center">i</span>
              <span className="text-[14.5px] leading-[1.45] text-brown-ink">An estimate, not your final price. A real person checks what you actually need first — it can land lower.</span>
            </div>
          </div>
          <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] bottom-[72px] z-[45] flex items-center gap-[10px] px-5 pt-3 pb-[14px]" style={{ background: "linear-gradient(to top, #FFF3E4 62%, rgba(255,243,228,0))" }}>
            <button type="button" onClick={restart} className="shrink-0 w-[54px] h-[54px] rounded-full border-[1.5px] bg-cream text-ink text-[18px] font-bold active:scale-95 transition-transform" style={{ borderColor: "rgba(22,16,13,0.18)" }}>↺</button>
            <button type="button" onClick={takeToContact} className="flex-1 h-[54px] rounded-full border-0 bg-mango text-ink font-bold text-[16.5px] active:scale-[0.99] transition-transform">Get my final price →</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════ CONTACT ══════════════ */
function ContactScreen(props: {
  sent: boolean; busy: boolean; form: { name: string; phone: string; email: string; note: string }; setForm: (f: (p: { name: string; phone: string; email: string; note: string }) => { name: string; phone: string; email: string; note: string }) => void;
  chips: Record<string, boolean>; setChips: (f: (c: Record<string, boolean>) => Record<string, boolean>) => void; est: string; estScope: string; canSend: boolean; submit: () => void; wa: string; goHome: () => void;
}) {
  const { sent, busy, form, setForm, chips, setChips, est, estScope, canSend, submit, wa, goHome } = props;
  const { catalog } = useContent();
  const inputCls = "font-sans text-[16px] text-ink h-[54px] px-4 rounded-[16px] border-[1.5px] bg-white outline-none focus:border-mango transition-colors";
  const firstName = form.name.trim().split(" ")[0];

  if (sent) return (
    <div className="min-h-[100svh] bg-cream text-ink px-5 pt-[78px] pb-[104px]">
      <div className="min-h-[66svh] flex flex-col items-center justify-center text-center gap-5">
        <span className="w-[76px] h-[76px] rounded-full bg-[#E9F3F0] text-[#0E6B5E] text-[30px] font-extrabold flex items-center justify-center" style={{ animation: "bibPop 560ms cubic-bezier(.16,.84,.28,1) both" }}>✓</span>
        <h1 className="font-display font-extrabold text-[32px] leading-none tracking-[-0.045em] m-0">{form.name.trim() ? `Got it, ${firstName}.` : "Got it."}</h1>
        <p className="m-0 text-[16px] leading-[1.5] text-brown-ink">One of our team will reach you on WhatsApp within a working day, confirm what you need, and send the firm price in writing.</p>
        <p className="m-0 text-[14px] leading-[1.5] text-[#8A6B5B]">Nothing is booked and nothing is owed. If the quote doesn&apos;t work, just say so.</p>
        <div className="flex flex-col gap-[10px] w-full mt-[6px]">
          {wa && <a href={wa} className="h-[54px] rounded-full bg-ink text-cream font-bold text-[16px] flex items-center justify-center active:scale-[0.99] transition-transform">Message us now instead</a>}
          <button type="button" onClick={goHome} className="h-[54px] rounded-full border-[1.5px] bg-transparent text-ink font-bold text-[16px] active:scale-[0.99] transition-transform" style={{ borderColor: "rgba(22,16,13,0.2)" }}>Back to the start</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100svh] bg-cream text-ink px-5 pt-[78px] pb-[104px]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-[10px]">
          <span className="text-[11.5px] tracking-[0.24em] uppercase font-bold text-brown">Get in touch</span>
          <h1 className="font-display font-extrabold text-[34px] leading-[0.96] tracking-[-0.05em] m-0">Tell us what you&apos;re trying to fix.</h1>
          <p className="m-0 text-[16px] leading-[1.5] text-brown-ink">One person reads every message. No bot, no ticket queue, no sales sequence afterwards.</p>
        </div>

        {wa && (
          <a href={wa} className="flex items-center justify-between gap-3 bg-ink rounded-[22px] p-[18px_20px] active:scale-[0.99] transition-transform">
            <span className="flex flex-col gap-[3px]">
              <span className="font-display font-extrabold text-[18px] text-cream">Message us on WhatsApp</span>
              <span className="text-[13px] text-cream/55">Fastest route. Same person who&apos;d reply here.</span>
            </span>
            <span className="shrink-0 w-[38px] h-[38px] rounded-full bg-mango text-ink text-[17px] font-extrabold flex items-center justify-center">→</span>
          </a>
        )}

        {est && (
          <div className="bg-ink text-cream rounded-[22px] p-5 flex flex-col gap-2" style={{ animation: "bibRise 420ms ease both" }}>
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-mango-soft">Your estimate came with you</span>
            <span className="font-display font-extrabold text-[30px] tracking-[-0.045em] text-mango">{est}</span>
            <span className="text-[14.5px] leading-[1.45] text-cream/72">{estScope}</span>
            <span className="text-[12.5px] font-bold text-mango-soft">30% first-project discount held</span>
          </div>
        )}

        <div className="flex flex-col gap-[10px]">
          <span className="text-[13px] font-bold text-brown-mid">What do you need? <span className="font-medium text-[#A8907F]">Pick any</span></span>
          <div className="flex flex-wrap gap-2">
            {catalog.map((c) => {
              const on = !!chips[c.key];
              return (
                <button key={c.key} type="button" onClick={() => setChips((ch) => { const n = { ...ch }; if (n[c.key]) delete n[c.key]; else n[c.key] = true; return n; })}
                  className={`min-h-[46px] py-[11px] px-[17px] rounded-full text-[14.5px] font-bold border-[1.5px] active:scale-[0.97] transition-transform ${on ? "bg-ink text-cream border-ink" : "bg-transparent text-ink"}`}
                  style={on ? undefined : { borderColor: "rgba(22,16,13,0.22)" }}>{c.label}</button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-[6px]">
            <span className="text-[13px] font-bold text-brown-mid">Your name</span>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="What should we call you?" className={inputCls} style={{ borderColor: "rgba(22,16,13,0.16)" }} />
          </label>
          <label className="flex flex-col gap-[6px]">
            <span className="text-[13px] font-bold text-brown-mid">WhatsApp number <span className="font-medium text-[#A8907F]">or email below</span></span>
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} type="tel" inputMode="tel" placeholder="+91 …" className={inputCls} style={{ borderColor: "rgba(22,16,13,0.16)" }} />
          </label>
          <label className="flex flex-col gap-[6px]">
            <span className="text-[13px] font-bold text-brown-mid">Email <span className="font-medium text-[#A8907F]">Optional</span></span>
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} type="email" inputMode="email" placeholder="you@work.com" className={inputCls} style={{ borderColor: "rgba(22,16,13,0.16)" }} />
          </label>
          <label className="flex flex-col gap-[6px]">
            <span className="text-[13px] font-bold text-brown-mid">What&apos;s not working? <span className="font-medium text-[#A8907F]">Optional</span></span>
            <textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} rows={3} placeholder="A sentence is plenty. A link you like helps too." className={`${inputCls} h-auto py-[14px] leading-[1.45] resize-y`} style={{ borderColor: "rgba(22,16,13,0.16)" }} />
          </label>
        </div>

        <button type="button" onClick={submit} disabled={!canSend || busy} className="h-14 rounded-full border-0 font-bold text-[16.5px] active:scale-[0.99] transition-transform"
          style={{ background: canSend && !busy ? "#FF7A00" : "rgba(22,16,13,0.1)", color: canSend && !busy ? "#16100D" : "rgba(22,16,13,0.42)" }}>
          {busy ? "Sending…" : canSend ? "Send it" : "Name and one way to reach you"}
        </button>
        <span className="text-center text-[13px] text-[#8A6B5B]">Sending this books nothing and costs nothing.</span>
      </div>
    </div>
  );
}
