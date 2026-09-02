"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContent } from "@/components/ContentProvider";
import { PRICING_ENABLED } from "@/lib/flags";

/** Fixed floating pill nav + scroll-progress bar.
 *  Dark translucent pill on every page; active link is mango.
 *  On small screens the links collapse into an accessible menu. */
export default function SiteNav() {
  const { nav } = useContent();
  // v1: hide the Pricing entry until PRICING_ENABLED is switched back on.
  const links = nav.links.filter((l) => PRICING_ENABLED || l.href !== "/pricing");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // close the menu on route change
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[3px] z-[60]"
        style={{ background: "rgba(22,16,13,0.14)" }}
      >
        <div id="scroll-progress" className="h-full w-0 bg-mango" />
      </div>

      <header className="fixed top-[18px] left-0 right-0 z-[55] flex flex-col items-center px-6 pointer-events-none">
        <nav
          aria-label="Primary"
          className="pointer-events-auto flex items-center gap-4 sm:gap-[22px] py-3 pl-4 sm:pl-[22px] pr-3 sm:pr-[14px] rounded-full border border-cream/15"
          style={{
            background: "rgba(22,16,13,0.94)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "0 18px 40px -24px rgba(22,16,13,0.8)",
          }}
        >
          <Link
            href="/"
            aria-label="branditbro — home"
            className="font-display font-extrabold text-[22px] tracking-[-0.05em] leading-none text-cream shrink-0"
          >
            b<span className="text-mango">.</span>
          </Link>

          <div className="hidden sm:flex items-center gap-[18px]">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`text-[13.5px] font-bold transition-colors hover:text-cream ${
                  isActive(l.href) ? "text-mango" : "text-cream/80"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <Link
            href={nav.cta.href}
            className="text-[13px] sm:text-[13.5px] font-bold py-[10px] px-4 sm:px-[18px] rounded-full bg-mango text-ink transition-transform duration-200 hover:-translate-y-[1px]"
          >
            {nav.cta.label}
          </Link>

          {/* mobile menu toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="sm:hidden flex flex-col justify-center items-center w-9 h-9 rounded-full gap-[5px]"
          >
            <span className={`block w-[18px] h-[2px] bg-cream transition-transform duration-200 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block w-[18px] h-[2px] bg-cream transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`block w-[18px] h-[2px] bg-cream transition-transform duration-200 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </nav>

        {/* mobile dropdown panel */}
        {open && (
          <div
            className="sm:hidden pointer-events-auto mt-3 w-[calc(100%-8px)] max-w-[420px] flex flex-col rounded-[22px] border border-cream/15 p-2"
            style={{ background: "rgba(22,16,13,0.97)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`py-[14px] px-4 rounded-2xl text-[15px] font-bold transition-colors ${
                  isActive(l.href) ? "text-mango" : "text-cream/85 hover:bg-cream/8"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
