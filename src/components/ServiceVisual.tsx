"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { SERVICE_VISUALS } from "./servicesVisualsMarkup";

/**
 * One service's animated "visual" — the four-scene showcase panel ported
 * verbatim from the BrandItBro Services design. Each panel runs a pure-CSS
 * 13.6s timeline (four scenes × 3.4s via the `svS` keyframe); a parent
 * <PlayOnView> holds it paused until it scrolls into view.
 *
 * JS only fits the fixed 585px design panel into whatever column it lands in.
 * The outer box reserves its final height up-front via CSS aspect-ratio, and
 * the inner panel stays hidden until it has been scaled — so it never flashes
 * at full size before snapping down (no layout jump on mobile).
 */

const DESIGN_W = 585; // width the panels were composed at
// natural heights of each panel at DESIGN_W (measured) — used to reserve space
const DESIGN_H: Record<string, number> = { website: 399, app: 412, brand: 348, marketing: 300, content: 348 };

// useLayoutEffect on the client (scales before paint → no flash); useEffect on
// the server to avoid the SSR warning.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ServiceVisual({ id, className }: { id: keyof typeof SERVICE_VISUALS | string; className?: string }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const html = SERVICE_VISUALS[id];
  const h = DESIGN_H[id] ?? 400;

  useIsoLayoutEffect(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    const fit = () => {
      const scale = Math.min(1, outer.clientWidth / DESIGN_W);
      inner.style.transform = `scale(${scale})`;
      inner.style.visibility = "visible"; // reveal only once correctly scaled
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    const t = setTimeout(fit, 400); // re-fit after fonts settle
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);

  if (!html) return null;

  return (
    <div
      ref={outerRef}
      className={"w-full overflow-hidden " + (className ?? "")}
      style={{ aspectRatio: `${DESIGN_W} / ${h}` }}
    >
      <div
        ref={innerRef}
        data-sv-visual
        style={{ width: DESIGN_W, transformOrigin: "top left", visibility: "hidden" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
