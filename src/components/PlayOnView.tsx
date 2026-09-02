"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Holds every CSS animation inside it paused until the wrapper scrolls into
 * view, then lets them play — from the very start — via the paired rule in
 * globals.css ([data-play-scope]:not([data-playing]) … { paused }). Wrapping a
 * whole service row keeps its chips and visual in sync, because they share one
 * trigger. Plays once, then leaves the animations looping.
 */
export default function PlayOnView({
  children,
  className,
  threshold = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (playing) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setPlaying(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlaying(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playing, threshold]);

  return (
    <div ref={ref} data-play-scope {...(playing ? { "data-playing": "" } : {})} className={className}>
      {children}
    </div>
  );
}
