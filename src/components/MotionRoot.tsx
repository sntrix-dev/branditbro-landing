"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registerGsap, gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Global motion driver, mounted once in the layout.
 *  • flags <html> with `js` (enables the reveal system) and `reduced`
 *  • animates every [data-reveal] element in with a per-element delay
 *  • drives the fixed top scroll-progress bar
 *  • re-runs on route change so client-navigated pages animate too
 *
 * Device / accessibility policy lives here via gsap.matchMedia:
 *   – reduced motion  → nothing animates, everything visible
 *   – all other cases → reveals run (they are cheap and universally tasteful)
 * Heavy, device-specific effects (pinning, horizontal scroll, parallax)
 * are set up per-page, also behind matchMedia.
 */
export default function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    registerGsap();
    const root = document.documentElement;
    root.classList.add("js");

    const mm = gsap.matchMedia();

    // reduced-motion branch: reveal instantly, skip animation
    mm.add("(prefers-reduced-motion: reduce)", () => {
      root.classList.add("reduced");
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    });

    // motion-allowed branch — all widths (the site is now one responsive tree).
    // One batched observer reveals every [data-reveal] as it enters view.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const nodes = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.set(nodes, { autoAlpha: 0, y: 26 });
      const batch = ScrollTrigger.batch(nodes, {
        start: "top 88%",
        onEnter: (els) =>
          gsap.to(els, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.08,
            delay: (i, el) => (parseFloat((el as HTMLElement).dataset.delay || "0") || 0) / 1000,
            overwrite: true,
          }),
      });
      return () => batch.forEach((t) => t.kill());
    });

    // scroll-progress bar — only wire listeners when the bar actually exists
    // (it lives in the desktop chrome; phones never render it).
    const bar = document.getElementById("scroll-progress");
    let raf = 0;
    let onScroll: (() => void) | null = null;
    if (bar) {
      const update = () => {
        raf = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const p = max > 0 ? (window.scrollY / max) * 100 : 0;
        bar.style.width = p.toFixed(2) + "%";
      };
      onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      update();
    }

    // let layout settle, then recalc triggers (fonts/images shift positions)
    const settle = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      if (onScroll) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      mm.revert();
    };
  }, [pathname]);

  return null;
}
