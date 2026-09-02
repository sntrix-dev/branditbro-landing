"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { WORKBENCH_HTML } from "./heroWorkbenchMarkup";

/**
 * Hero "workbench" — ported from the BrandItBro Hero design. Fifteen scenes
 * (three per craft) auto-cycle on a pure-CSS 48s timeline, so the panel paints
 * instantly and never depends on JS.
 *
 * JS adds three things:
 *   • fit-to-container scaling (full size on desktop, scaled on phones),
 *   • clickable craft tabs — clicking one seeks the shared timeline to that
 *     craft's first scene and lets it keep playing forward (no lock/loop),
 *   • a floating pause/play control at the stage's bottom-right.
 */

const SCENE = 3.2; // seconds per scene (15 scenes × 3.2s = one 48s loop)
const PANEL_W = 530; // design width of the panel; scaled to fit its column
const PANEL_H = 549; // natural height at PANEL_W (measured) — reserves space up-front

// useLayoutEffect on the client (scale before paint → no flash); useEffect on
// the server to avoid the SSR warning.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function HeroWorkbench() {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Fit the fixed-width design panel into whatever column it lands in — full
  // size on desktop, cleanly scaled down (never clipped) on phones. The outer
  // box reserves its final height via CSS aspect-ratio and the inner panel
  // stays hidden until it has been scaled, so it never flashes at full 530px
  // width before snapping down on mobile.
  useIsoLayoutEffect(() => {
    const outer = ref.current, inner = innerRef.current;
    if (!outer || !inner) return;
    const fit = () => {
      const scale = Math.min(1, outer.clientWidth / PANEL_W);
      inner.style.transform = `scale(${scale})`;
      outer.style.height = inner.offsetHeight * scale + "px"; // exact height (overrides the aspect-ratio reservation)
      inner.style.visibility = "visible";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    const t = setTimeout(fit, 400); // re-fit after fonts settle
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const panel = root.querySelector<HTMLElement>("[data-panel]");
    const stage = root.querySelector<HTMLElement>("[data-hv-stage]");
    const tabs = Array.from(root.querySelectorAll<HTMLElement>("[data-pick]"));
    if (!panel) return;

    // The scene stage, tick rail and rank decorations all run on ONE shared
    // 48s CSS timeline. We drive that timeline through the Web Animations API
    // rather than rewriting animation-delay: the browser exposes each CSS
    // animation as an Animation whose `currentTime` we set directly, which is
    // deterministic (no reflow-restart quirks, no wall-clock drift).
    const SYNC = /^hv(Slot15|Lit5|RankUp|RankShift|Grow|Pill)$/;

    // Cache the stable *element* refs — NOT the Animation objects, which the
    // browser can silently recreate (leaving stale handles whose currentTime
    // writes do nothing). We pull fresh Animation objects on every call.
    let els: HTMLElement[] = [];
    const collect = () => {
      els = Array.from(
        panel.querySelectorAll<HTMLElement>('[style*="animation"]'),
      ).filter((el) => SYNC.test(el.style.animationName || ""));
    };
    collect();
    const syncedAnims = (): Animation[] => {
      if (!els.length) collect();
      const out: Animation[] = [];
      els.forEach((el) =>
        el.getAnimations().forEach((a) => {
          const n = (a as CSSAnimation).animationName;
          if (n && SYNC.test(n)) out.push(a);
        }),
      );
      return out;
    };

    let paused = false;

    // Seek: jump the shared timeline so `scene` sits at the very start of its
    // keyframe (currentTime === its offset → progress 0 → fade-in → full 3.2s
    // window), then let it keep playing forward through the rest.
    const seek = (scene: number) => {
      const t = Math.round(scene * SCENE * 1000); // ms into the 48s loop
      syncedAnims().forEach((a) => {
        try {
          a.currentTime = t;
          if (!paused) a.play();
        } catch {}
      });
    };

    // ── floating pause / play control, bottom-right inside the stage ──
    const setPlayState = (s: "paused" | "running") =>
      syncedAnims().forEach((a) => { try { s === "paused" ? a.pause() : a.play(); } catch {} });
    const PAUSE_ICON = "display:inline-block;width:8px;height:11px;border-left:2.5px solid currentColor;border-right:2.5px solid currentColor;box-sizing:border-box;";
    const PLAY_ICON = "display:inline-block;width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:11px solid currentColor;margin-left:2px;";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Pause the showcase");
    btn.style.cssText =
      "position:absolute;bottom:12px;right:12px;z-index:6;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:999px;border:1px solid rgba(22,16,13,0.12);background:rgba(255,243,228,0.94);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);box-shadow:0 8px 18px -8px rgba(0,0,0,0.55);cursor:pointer;color:#16100D;padding:0;";
    const icon = document.createElement("span");
    icon.style.cssText = PAUSE_ICON;
    btn.appendChild(icon);
    (stage ?? panel).appendChild(btn);
    const resume = () => { paused = false; setPlayState("running"); icon.style.cssText = PAUSE_ICON; btn.setAttribute("aria-label", "Pause the showcase"); };
    const pause = () => { paused = true; setPlayState("paused"); icon.style.cssText = PLAY_ICON; btn.setAttribute("aria-label", "Play the showcase"); };
    btn.addEventListener("click", () => (paused ? resume() : pause()));

    // Clicking a craft just jumps to it and keeps playing (no lock, no loop).
    const pick = (g: number) => { if (paused) resume(); seek(g * 3); };
    const handlers = tabs.map((tab) => {
      const i = Number(tab.getAttribute("data-pick"));
      const h = () => pick(i);
      tab.addEventListener("click", h);
      return h;
    });

    return () => {
      tabs.forEach((tab, idx) => tab.removeEventListener("click", handlers[idx]));
      btn.remove();
    };
  }, []);

  return (
    <div ref={ref} className="w-full overflow-hidden" style={{ aspectRatio: `${PANEL_W} / ${PANEL_H}` }}>
      <div ref={innerRef} style={{ width: PANEL_W, transformOrigin: "top left", visibility: "hidden" }} dangerouslySetInnerHTML={{ __html: WORKBENCH_HTML }} />
    </div>
  );
}
