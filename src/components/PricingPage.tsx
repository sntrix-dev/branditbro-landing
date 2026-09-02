"use client";
import React from "react";
import { useContent } from "@/components/ContentProvider";

/* ──────────────────────────────────────────────────────────────────────────
   Icon system — simple, consistent LINE icons. Every icon shares the same
   viewBox/stroke setup and inherits `currentColor`, so the parent decides the
   colour (cream/mango on unselected cards, ink on mango-filled selected ones).
   ────────────────────────────────────────────────────────────────────────── */
const ICON_PATHS: Record<string, React.ReactNode> = {
  target: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.6" /></>),
  pages: (<><rect x="8" y="3" width="12" height="15" rx="1.5" /><path d="M16 21H5.5A1.5 1.5 0 0 1 4 19.5V6" /></>),
  cart: (<><circle cx="9.5" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /><path d="M3 4h2l2.4 11.4a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.78L20.5 8H6" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 3v4M16 3v4" /></>),
  grid: (<><rect x="4" y="4" width="7" height="7" rx="1.2" /><rect x="13" y="4" width="7" height="7" rx="1.2" /><rect x="4" y="13" width="7" height="7" rx="1.2" /><rect x="13" y="13" width="7" height="7" rx="1.2" /></>),
  phone: (<><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M10.5 18.5h3" /></>),
  shop: (<><path d="M4 9.5V20h16V9.5" /><path d="M3 9.5 4.6 4h14.8L21 9.5" /><path d="M3 9.5a2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0 2.25 2.25 0 0 0 4.5 0" /><path d="M10 20v-5h4v5" /></>),
  chart: (<><path d="M4 4v16h16" /><path d="M8 16v-4M12 16v-7M16 16v-9" /></>),
  map: (<><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></>),
  split: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 5v14" /></>),
  doc: (<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h4" /></>),
  star: (<><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8 6.8 19.5l1-5.8-4.2-4.1 5.8-.8z" /></>),
  users: (<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M16.5 14.2a5.5 5.5 0 0 1 4 5.8" /></>),
  box: (<><path d="M3 7.2 12 3l9 4.2v9.6L12 21l-9-4.2z" /><path d="M3 7.2 12 11.4l9-4.2M12 11.4V21" /></>),
  tag: (<><path d="M3 3h8l10 10-8 8L3 11z" /><circle cx="7.5" cy="7.5" r="1.3" /></>),
  refresh: (<><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" /><path d="M20 3.5V8h-4.5" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" /><path d="M4 20.5V16h4.5" /></>),
  bell: (<><path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.8 5.8 1.8 5.8H4.2S6 13.5 6 9z" /><path d="M10 19a2 2 0 0 0 4 0" /></>),
  card: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>),
  lock: (<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  code: (<><path d="M9 8l-4 4 4 4M15 8l4 4-4 4" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M16.2 16.2 21 21" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></>),
  sparkle: (<><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M18.5 15l.7 2L21 17.7l-1.8.7-.7 2-.7-2-1.8-.7 1.8-.7z" /></>),
  megaphone: (<><path d="M3 10v4h3l9 5V5L6 10z" /><path d="M18 9a4 4 0 0 1 0 6" /></>),
  wallet: (<><path d="M3 7a2 2 0 0 1 2-2h11v4" /><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16.5 13H21v-3h-4.5a1.5 1.5 0 0 0 0 3z" /></>),
  chat: (<><path d="M4 5h16v11H9l-4 4v-4H4z" /><path d="M8 9.5h8M8 12.5h5" /></>),
  image: (<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.6" /><path d="M21 15.5 16 10.5 8 18.5" /></>),
  camera: (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l2-3h4l2 3" /><circle cx="12" cy="13" r="3.5" /></>),
  play: (<><path d="M7 5l12 7-12 7z" /></>),
  palette: (<><path d="M12 3a9 9 0 0 0 0 18c1.4 0 1.9-1 1.9-2 0-1.4 1-2 2.4-2H18a3 3 0 0 0 3-3c0-5-4-9-9-9z" /><circle cx="7.5" cy="11" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16.5" cy="11" r="1" /></>),
  check: (<><path d="M5 12.5l4.5 4.5L20 6.5" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.4 2" /></>),
  bolt: (<><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></>),
  blank: (<><circle cx="12" cy="12" r="8.5" strokeDasharray="3 3.5" /></>),
  rocket: (<><path d="M12 3c3 2.2 4.8 6 4.8 9.8L14 16h-4l-2.8-3.2C7.2 9 9 5.2 12 3z" /><circle cx="12" cy="10" r="1.6" /><path d="M10 16l-3 3M14 16l3 3M12 17.5V21" /></>),
  user: (<><circle cx="12" cy="8" r="3.6" /><path d="M5 21a7 7 0 0 1 14 0" /></>),
  scooter: (<><circle cx="6" cy="17.5" r="2.5" /><circle cx="18" cy="17.5" r="2.5" /><path d="M8.5 17.5H15l-2.5-9.5H10" /><path d="M12.5 8h3.5l2 6.5" /></>),
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const path = ICON_PATHS[name] || ICON_PATHS.blank;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      {path}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Brand palette — the same language as the step-01 service mocks. Dark inner
   panels, cream/sand blocks, mango + teal accents, small radii.
   ────────────────────────────────────────────────────────────────────────── */
const PAL = { ink: "#16100D", panel: "#0B0806", cream: "#FFF3E4", sand: "#FFE0C2", mango: "#FF7A00", mango2: "#FF9C5B", teal: "#0E6B5E", red: "#E23E2C" };

/* ──────────────────────────────────────────────────────────────────────────
   Scene — small PURPOSE-DRAWN 2-tone graphics for the feature cards. Each one
   depicts the actual thing (a search result, a calendar, a card with ₹, chat
   bubbles…) rather than a generic line icon. `fg` is the structural tone, `ac`
   the accent; on a selected (mango) card both flip to ink/teal so it stays
   legible. Drawn at 24×24, rendered inside a ~38px tile.
   ────────────────────────────────────────────────────────────────────────── */
function Scene({ name, on }: { name: string; on?: boolean }) {
  const fg = on ? "#16100D" : "#FFE7CF";
  const ac = on ? "#0E6B5E" : "#FF7A00";
  const pop = on ? "#FFF3E4" : "#16100D"; // knock-out colour on top of an `ac` fill
  const wrap = (children: React.ReactNode) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>{children}</svg>
  );
  const star = (cx: number, y: number, fill: boolean) => (
    <path d={`M${cx} ${y}l1.25 2.55 2.8.4-2.05 1.95.5 2.8L${cx} ${y + 6.3}l-2.5 1.35.5-2.8-2.05-1.95 2.8-.4z`} fill={fill ? ac : "none"} stroke={fill ? "none" : fg} strokeWidth="1.2" />
  );
  switch (name) {
    case "search": return wrap(<>
      <rect x="2.5" y="3.2" width="19" height="5" rx="2.5" />
      <circle cx="6" cy="5.7" r="1.2" fill={ac} stroke="none" />
      <rect x="2.5" y="11" width="12.5" height="4" rx="1.5" fill={ac} stroke="none" />
      <rect x="2.5" y="17.5" width="9" height="3" rx="1.5" fill={fg} stroke="none" opacity="0.55" />
      <path d="M19.2 12.4c1.3 0 2.3 1 2.3 2.3 0 1.7-2.3 3.8-2.3 3.8s-2.3-2.1-2.3-3.8c0-1.3 1-2.3 2.3-2.3z" fill={fg} stroke="none" />
      <circle cx="19.2" cy="14.7" r="0.8" fill={ac} stroke="none" />
    </>);
    case "chart": return wrap(<>
      <line x1="3" y1="20.5" x2="21.5" y2="20.5" />
      <rect x="3.5" y="13" width="3.2" height="7.5" rx="1" fill={fg} stroke="none" opacity="0.5" />
      <rect x="8.4" y="10" width="3.2" height="10.5" rx="1" fill={fg} stroke="none" opacity="0.5" />
      <rect x="13.3" y="7.5" width="3.2" height="13" rx="1" fill={ac} stroke="none" />
      <rect x="18.2" y="4.5" width="3.2" height="16" rx="1" fill={ac} stroke="none" />
    </>);
    case "calendar": return wrap(<>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="7.5" y1="2.5" x2="7.5" y2="6" />
      <line x1="16.5" y1="2.5" x2="16.5" y2="6" />
      <rect x="6" y="11.5" width="4" height="3.6" rx="1" fill={ac} stroke="none" />
      <rect x="11.5" y="11.5" width="4" height="3.6" rx="1" fill={fg} stroke="none" opacity="0.35" />
      <rect x="6" y="16.2" width="4" height="3.2" rx="1" fill={fg} stroke="none" opacity="0.35" />
      <rect x="11.5" y="16.2" width="4" height="3.2" rx="1" fill={fg} stroke="none" opacity="0.35" />
    </>);
    case "schedule": return wrap(<>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="7.5" y1="2.5" x2="7.5" y2="6" />
      <line x1="16.5" y1="2.5" x2="16.5" y2="6" />
      <path d="M8 14.5l2.5 2.5 5-5" stroke={ac} strokeWidth="2" />
    </>);
    case "payment": return wrap(<>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <line x1="2.5" y1="9.6" x2="21.5" y2="9.6" stroke={fg} strokeWidth="2.4" opacity="0.5" />
      <text x="5" y="16.2" fontSize="6.5" fontWeight="800" fill={fg} stroke="none" fontFamily="'Gabarito',sans-serif">₹</text>
      <circle cx="16.6" cy="14.6" r="3.2" fill={ac} stroke="none" />
      <path d="M15.1 14.7l1.1 1.1 2-2.2" stroke={pop} strokeWidth="1.4" />
    </>);
    case "wallet": return wrap(<>
      <rect x="2.5" y="7.5" width="14.5" height="11" rx="2.5" />
      <path d="M13 11.5h3a1.5 1.5 0 0 1 0 3h-3z" fill={fg} stroke="none" opacity="0.5" />
      <circle cx="18.5" cy="8.5" r="3.5" fill={ac} stroke="none" />
      <text x="16.8" y="10.5" fontSize="4.6" fontWeight="800" fill={pop} stroke="none" fontFamily="'Gabarito',sans-serif">₹</text>
    </>);
    case "chat": return wrap(<>
      <path d="M3 5.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2H8l-3 2.4V11H5a2 2 0 0 1-2-2z" fill={fg} stroke="none" />
      <path d="M11.5 13a2 2 0 0 1 2-2h5.5a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1.2v2.1L16 18h-2.5a2 2 0 0 1-2-2z" fill={ac} stroke="none" />
    </>);
    case "stars": return wrap(<g transform="translate(0,1.5)">{star(5.5, 4, false)}{star(12, 4, true)}{star(18.5, 4, false)}</g>);
    case "pages": return wrap(<>
      <path d="M6.5 3h7l4 4v14h-11z" />
      <path d="M13.5 3v4h4" />
      <line x1="9" y1="12" x2="15" y2="12" stroke={ac} strokeWidth="1.6" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="18" x2="12.5" y2="18" />
    </>);
    case "blog": return wrap(<>
      <path d="M5.5 3.5h6l3.5 3.5v9h-9.5z" />
      <line x1="7.5" y1="9" x2="12" y2="9" />
      <line x1="7.5" y1="12" x2="10.5" y2="12" />
      <path d="M13.8 17.2l4.8-4.8 2.2 2.2-4.8 4.8-2.9.7z" fill={ac} stroke={ac} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M17.4 8.9l2.2 2.2" stroke={ac} strokeWidth="1.4" />
    </>);
    case "casestudy": return wrap(<>
      <path d="M6.5 3h7l4 4v14h-11z" />
      <path d="M13.5 3v4h4" />
      <line x1="9" y1="11" x2="14.5" y2="11" />
      <line x1="9" y1="14" x2="13" y2="14" />
      {star(12, 15.3, true)}
    </>);
    case "careers": return wrap(<>
      <path d="M5.5 3.5h6l3.5 3.5v11h-9.5z" />
      <line x1="7.5" y1="9" x2="11" y2="9" />
      <line x1="7.5" y1="12" x2="10" y2="12" />
      <circle cx="16" cy="13" r="2.3" fill={ac} stroke="none" />
      <path d="M12.5 20.5a3.5 3.5 0 0 1 7 0z" fill={ac} stroke="none" />
    </>);
    case "map": return wrap(<>
      <circle cx="5" cy="18.5" r="1.8" fill={fg} stroke="none" />
      <path d="M5 18.5c5.5 0 2.5-9 9-9" strokeDasharray="2.5 2.5" />
      <path d="M15.5 3.5c2.2 0 4 1.8 4 4 0 3-4 6.6-4 6.6s-4-3.6-4-6.6c0-2.2 1.8-4 4-4z" fill={ac} stroke="none" />
      <circle cx="15.5" cy="7.5" r="1.5" fill={pop} stroke="none" />
    </>);
    case "boxes": return wrap(<>
      <rect x="3" y="12" width="8" height="8" rx="1" />
      <line x1="3" y1="15" x2="11" y2="15" />
      <rect x="13" y="12" width="8" height="8" rx="1" />
      <line x1="13" y1="15" x2="21" y2="15" />
      <rect x="8" y="3.5" width="8" height="8" rx="1" fill={ac} stroke="none" />
      <line x1="12" y1="3.5" x2="12" y2="7" stroke={pop} />
    </>);
    case "discount": return wrap(<>
      <path d="M11.5 3H4v7.5l9.5 9.5 7.5-7.5L11.5 3z" />
      <circle cx="7.3" cy="7.3" r="1.3" fill={fg} stroke="none" />
      <line x1="9" y1="14.5" x2="14.5" y2="9" stroke={ac} strokeWidth="1.5" />
      <circle cx="9.4" cy="9.6" r="1" fill={ac} stroke="none" />
      <circle cx="14.1" cy="14.3" r="1" fill={ac} stroke="none" />
    </>);
    case "subscription": return wrap(<>
      <path d="M5 12a7 7 0 0 1 11.5-5.4" />
      <path d="M17 3v3.5h-3.5" />
      <path d="M19 12a7 7 0 0 1-11.5 5.4" />
      <path d="M7 21v-3.5h3.5" />
      <circle cx="12" cy="12" r="2.2" fill={ac} stroke="none" />
    </>);
    case "bell": return wrap(<>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.6 5.2 1.6 5.2H4.9S6.5 14 6.5 10z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
      <circle cx="17.8" cy="6" r="2.6" fill={ac} stroke="none" />
    </>);
    case "roles": return wrap(<>
      <path d="M12 3l7 2.5v5.5c0 4.6-3 7.7-7 9.5-4-1.8-7-4.9-7-9.5V5.5z" />
      <circle cx="12" cy="10" r="2.2" fill={ac} stroke="none" />
      <path d="M8.3 16.7a3.7 3.7 0 0 1 7.4 0z" fill={ac} stroke="none" />
    </>);
    case "integration": return wrap(<>
      <rect x="2.5" y="9" width="8.5" height="6" rx="2" fill={fg} stroke="none" />
      <line x1="11" y1="11" x2="14" y2="11" stroke={fg} strokeWidth="1.8" />
      <line x1="11" y1="13" x2="14" y2="13" stroke={fg} strokeWidth="1.8" />
      <path d="M14 6.5h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-5z" fill={ac} stroke="none" />
    </>);
    case "language": return wrap(<>
      <circle cx="10" cy="10.5" r="7" />
      <path d="M3 10.5h14M10 3.5c3 3 3 11 0 14M10 3.5c-3 3-3 11 0 14" strokeWidth="1.3" />
      <rect x="14" y="14" width="8" height="8" rx="2" fill={ac} stroke="none" />
      <text x="15.7" y="20.4" fontSize="6.4" fontWeight="800" fill={pop} stroke="none" fontFamily="sans-serif">文</text>
    </>);
    case "motion": return wrap(<>
      <path d="M6 5l9 4-3.7 1.4L15 15l-2 1-3.3-4.4L6 15z" fill={fg} stroke={fg} strokeWidth="0.8" />
      <path d="M17.2 5.2l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" fill={ac} stroke="none" />
      <path d="M19.5 12l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4z" fill={ac} stroke="none" />
    </>);
    case "dashboard": return wrap(<>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <line x1="8" y1="4.5" x2="8" y2="19.5" />
      <line x1="5" y1="8.5" x2="6.5" y2="8.5" stroke={ac} strokeWidth="1.6" />
      <line x1="5" y1="11" x2="6.5" y2="11" />
      <line x1="5" y1="13.5" x2="6.5" y2="13.5" />
      <rect x="10" y="7.5" width="4.5" height="4" rx="1" fill={ac} stroke="none" />
      <rect x="15.5" y="7.5" width="3.5" height="4" rx="1" fill={fg} stroke="none" opacity="0.4" />
      <rect x="10" y="13" width="9" height="3.5" rx="1" fill={fg} stroke="none" opacity="0.4" />
    </>);
    case "selleradd": return wrap(<>
      <path d="M4.5 8a2 2 0 0 0 3.7 0 2 2 0 0 0 3.6 0 2 2 0 0 0 3.6 0" />
      <path d="M5 5h11l1.5 3H3.5z" fill={fg} stroke="none" opacity="0.5" />
      <path d="M5 9.5V20h11V9.5" />
      <rect x="8.5" y="13.5" width="4" height="6.5" fill={fg} stroke="none" opacity="0.35" />
      <circle cx="18" cy="6.5" r="3.3" fill={ac} stroke="none" />
      <path d="M18 5v3M16.5 6.5h3" stroke={pop} strokeWidth="1.4" />
    </>);
    case "scooter": return wrap(<>
      <circle cx="6" cy="17.5" r="2.6" />
      <circle cx="17.5" cy="17.5" r="2.6" />
      <path d="M8.5 17.5H14l-2.5-8H9" />
      <path d="M11.5 9.5h3.4l2.3 6" stroke={ac} />
      <circle cx="6" cy="17.5" r="0.5" fill={fg} stroke="none" />
    </>);
    case "teams": return wrap(<>
      <circle cx="6.5" cy="9.5" r="2.6" fill={fg} stroke="none" opacity="0.5" />
      <path d="M2.5 18a4 4 0 0 1 8 0z" fill={fg} stroke="none" opacity="0.5" />
      <circle cx="17.5" cy="9.5" r="2.6" fill={fg} stroke="none" opacity="0.5" />
      <path d="M13.5 18a4 4 0 0 1 8 0z" fill={fg} stroke="none" opacity="0.5" />
      <circle cx="12" cy="8.2" r="3" fill={ac} stroke="none" />
      <path d="M7 18.8a5 5 0 0 1 10 0z" fill={ac} stroke="none" />
    </>);
    case "wordmark": return wrap(<>
      <text x="4.5" y="18.5" fontSize="16" fontWeight="800" fill={fg} stroke="none" fontFamily="'Gabarito',sans-serif">b</text>
      <circle cx="14" cy="16.5" r="1.7" fill={ac} stroke="none" />
      <path d="M17.5 3.5l.75 2.1 2.1.75-2.1.75-.75 2.1-.75-2.1-2.1-.75 2.1-.75z" fill={ac} stroke="none" />
    </>);
    case "socialkit": return wrap(<>
      <rect x="3" y="3.5" width="8" height="8" rx="1.6" fill={fg} stroke="none" opacity="0.45" />
      <rect x="13" y="3.5" width="8" height="8" rx="1.6" fill={ac} stroke="none" />
      <rect x="3" y="13.5" width="8" height="8" rx="1.6" fill={ac} stroke="none" opacity="0.75" />
      <rect x="13" y="13.5" width="8" height="8" rx="1.6" fill={fg} stroke="none" opacity="0.45" />
      <path d="M17 18.4c.9-1 2.4-.1 1.5 1l-1.5 1.5-1.5-1.5c-.9-1.1.6-2 1.5-1z" fill={pop} stroke="none" />
    </>);
    case "print": return wrap(<>
      <g transform="rotate(-8 11 11)"><rect x="3.5" y="7" width="13" height="8.5" rx="1.5" fill={fg} stroke="none" opacity="0.4" /></g>
      <rect x="6.5" y="9" width="14" height="9" rx="1.5" fill={ac} stroke="none" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" stroke={pop} strokeWidth="1.4" />
      <line x1="8.5" y1="15" x2="12.5" y2="15" stroke={pop} strokeWidth="1.2" opacity="0.7" />
    </>);
    case "parcel": return wrap(<>
      <path d="M12 3l8 4v10l-8 4-8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10" strokeWidth="1.4" />
      <rect x="10.2" y="9.2" width="3.6" height="3.2" rx="0.6" fill={ac} stroke="none" />
    </>);
    case "book": return wrap(<>
      <path d="M5 4.5h9a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H5z" />
      <path d="M5 4.5a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2" />
      <line x1="7.5" y1="8.5" x2="12.5" y2="8.5" stroke={ac} strokeWidth="1.5" />
      <line x1="7.5" y1="11.5" x2="11" y2="11.5" />
      <path d="M18.5 4.5v8l-2-1.6-2 1.6v-8z" fill={ac} stroke="none" />
    </>);
    case "camera": return wrap(<>
      <rect x="3" y="7" width="18" height="12" rx="2.5" />
      <path d="M8 7l1.5-2.5h5L16 7" />
      <circle cx="12" cy="13" r="3.2" fill={ac} stroke="none" />
      <circle cx="12" cy="13" r="1.2" fill={pop} stroke="none" />
      <rect x="16.8" y="9" width="2" height="1.6" rx="0.5" fill={fg} stroke="none" />
    </>);
    case "ads": return wrap(<>
      <path d="M4 10v4l9 4V6z" fill={ac} stroke="none" />
      <path d="M13 6l4-2v16l-4-2" />
      <path d="M18.5 9a3.5 3.5 0 0 1 0 6" />
      <path d="M6 14v3.4a1.5 1.5 0 0 0 3 0V15.5" />
    </>);
    case "landing": return wrap(<>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <circle cx="5.5" cy="6.2" r="0.7" fill={fg} stroke="none" />
      <circle cx="7.7" cy="6.2" r="0.7" fill={fg} stroke="none" />
      <rect x="6.5" y="10.3" width="11" height="2.4" rx="1" fill={fg} stroke="none" />
      <rect x="6.5" y="13.7" width="7" height="1.8" rx="0.9" fill={fg} stroke="none" opacity="0.5" />
      <rect x="6.5" y="16.3" width="5" height="2.2" rx="1.1" fill={ac} stroke="none" />
    </>);
    case "creator": return wrap(<>
      <circle cx="9.5" cy="8" r="3" fill={fg} stroke="none" opacity="0.5" />
      <path d="M4 19a5.5 5.5 0 0 1 11 0z" fill={fg} stroke="none" opacity="0.5" />
      <circle cx="17" cy="15.5" r="4" fill={ac} stroke="none" />
      <path d="M15.8 13.6l3 1.9-3 1.9z" fill={pop} stroke="none" />
    </>);
    case "reels8": case "reels16": case "reels30": {
      const num = name.replace("reels", "");
      return wrap(<>
        <g transform="rotate(-8 9 12)"><rect x="4" y="6" width="10" height="13" rx="2" fill={fg} stroke="none" opacity="0.35" /></g>
        <rect x="7" y="4.5" width="11" height="14" rx="2" fill={ac} stroke="none" />
        <path d="M11 8.4l4 2.8-4 2.8z" fill={pop} stroke="none" />
        <circle cx="18" cy="17.5" r="4.6" fill={fg} stroke="none" />
        <text x="18" y="19.7" fontSize={num.length > 1 ? "5" : "6.4"} fontWeight="800" fill={pop} stroke="none" textAnchor="middle" fontFamily="'Gabarito',sans-serif">{num}</text>
      </>);
    }
    case "shoot": return wrap(<>
      <rect x="3.5" y="5" width="12" height="8" rx="2" />
      <circle cx="9.5" cy="9" r="2.3" fill={ac} stroke="none" />
      <path d="M15.5 7.5l4-1.6v6l-4-1.6" />
      <path d="M9.5 13v3M9.5 16l-4 5M9.5 16l4 5" />
    </>);
    case "thumbnail": return wrap(<>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8" cy="9" r="1.7" fill={fg} stroke="none" />
      <path d="M4 15l4.5-4.5 3.5 3.5 3-2.5 5 4" strokeWidth="1.3" />
      <rect x="6" y="14.8" width="12" height="3.4" rx="1" fill={ac} stroke="none" />
    </>);
    case "abtest": return wrap(<>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <line x1="12" y1="4.5" x2="12" y2="19.5" strokeDasharray="2 2" />
      <text x="5" y="12.3" fontSize="6" fontWeight="800" fill={fg} stroke="none" fontFamily="'Gabarito',sans-serif">A</text>
      <text x="14.3" y="12.3" fontSize="6" fontWeight="800" fill={ac} stroke="none" fontFamily="'Gabarito',sans-serif">B</text>
      <rect x="5" y="14.3" width="5" height="2" rx="1" fill={fg} stroke="none" opacity="0.5" />
      <rect x="14" y="14.3" width="5" height="2" rx="1" fill={ac} stroke="none" />
    </>);
    default: return wrap(<circle cx="12" cy="12" r="8.5" strokeDasharray="3 3.5" />);
  }
}

/* Maps a feature-chip key → the scene that best depicts it. Keys that share a
   concept (SEO on the site and in ads) intentionally point at the same scene. */
const FEATURE_SCENE: Record<string, string> = {
  // website
  ab: "abtest", pixels: "chart", bookingwidget: "calendar",
  services: "pages", blog: "blog", cases: "casestudy", careers: "careers", locations: "map",
  inventory: "boxes", discounts: "discount", subs: "subscription",
  reminders: "bell", stafflogin: "roles", deposits: "payment",
  roles: "roles", dashboards: "dashboard", api: "integration", payments: "payment",
  seo: "search", multilang: "language", motion: "motion",
  // app
  push: "bell", admin: "dashboard", pay: "payment",
  sellers: "selleradd", ratings: "stars", wallet: "wallet", chat: "chat",
  tracking: "map", maps: "map", partner: "scooter",
  teams: "teams", analytics: "chart", integrations: "integration",
  // branding
  naming: "wordmark", social: "socialkit", print: "print", packaging: "parcel", book: "book", photo: "camera",
  // marketing
  google: "ads", wa: "chat", lp: "landing", influencer: "creator",
  // video
  v8: "reels8", v16: "reels16", v30: "reels30", shoot: "shoot", thumbs: "thumbnail", sched: "schedule",
};
function sceneFor(key: string): string { return FEATURE_SCENE[key] || "pages"; }

/* ──────────────────────────────────────────────────────────────────────────
   TypeMock — a small illustrated preview (~112px) for each site/app TYPE card,
   built in the exact language of the step-01 service mocks: a dark inner panel
   with a browser frame or a phone, cream/sand blocks and mango accents. The
   inner panel stays dark on purpose so it reads on the mango-tinted selected
   card too. Pure divs + a little SVG (map/route) — no images.
   ────────────────────────────────────────────────────────────────────────── */
function TypeMock({ k }: { k: string }) {
  const P = PAL;
  const cx = (s: string) => css(s);
  const dot = (c: string, key?: string | number) => <span key={key} style={cx("width:6px; height:6px; border-radius:999px; background:" + c)} />;
  const panel = (inner: React.ReactNode) => (
    <span style={cx("display:flex; flex-direction:column; width:100%; height:112px; border-radius:12px; background:" + P.panel + "; border:1px solid rgba(255,243,228,0.09); padding:10px; box-sizing:border-box; overflow:hidden")}>{inner}</span>
  );
  const chrome = (right?: React.ReactNode) => (
    <span style={cx("display:flex; align-items:center; gap:5px; margin-bottom:8px; flex-shrink:0")}>
      {dot(P.red)}{dot(P.mango)}{dot("rgba(255,243,228,0.3)")}
      <span style={cx("margin-left:5px; flex:1; height:8px; border-radius:999px; background:rgba(255,243,228,0.1)")} />
      {right}
    </span>
  );
  const page = (inner: React.ReactNode, extra = "") => (
    <span style={cx("flex:1; display:flex; flex-direction:column; gap:6px; background:" + P.cream + "; border-radius:8px; padding:8px; box-sizing:border-box; overflow:hidden; " + extra)}>{inner}</span>
  );
  const phone = (screen: React.ReactNode, bg: string) => panel(
    <span style={cx("flex:1; display:flex; align-items:center; justify-content:center")}>
      <span style={cx("display:flex; flex-direction:column; gap:4px; width:64px; height:92px; border-radius:14px; background:" + bg + "; border:2px solid rgba(255,243,228,0.18); padding:6px; box-sizing:border-box; overflow:hidden")}>
        <span style={cx("width:16px; height:3px; border-radius:999px; background:rgba(255,243,228,0.25); align-self:center; flex-shrink:0")} />
        {screen}
      </span>
    </span>
  );
  switch (k) {
    case "landing": return panel(<>{chrome()}{page(<>
      <span style={cx("width:80%; height:9px; border-radius:3px; background:" + P.ink)} />
      <span style={cx("width:58%; height:9px; border-radius:3px; background:" + P.ink)} />
      <span style={cx("width:40px; height:10px; border-radius:999px; background:" + P.mango + "; margin-top:2px")} />
      <span style={cx("display:flex; gap:5px; margin-top:auto")}>
        <span style={cx("flex:1; height:15px; border-radius:4px; background:" + P.sand)} />
        <span style={cx("flex:1; height:15px; border-radius:4px; background:" + P.sand)} />
        <span style={cx("flex:1; height:15px; border-radius:4px; background:" + P.sand)} />
      </span>
    </>)}</>);
    case "business": return panel(<>{chrome()}{page(<>
      <span style={cx("display:flex; align-items:center; gap:5px")}>
        <span style={cx("width:10px; height:10px; border-radius:3px; background:" + P.ink)} />
        <span style={cx("width:13px; height:3px; border-radius:2px; background:" + P.ink + "; opacity:0.4")} />
        <span style={cx("width:13px; height:3px; border-radius:2px; background:" + P.ink + "; opacity:0.4")} />
        <span style={cx("width:13px; height:3px; border-radius:2px; background:" + P.ink + "; opacity:0.4")} />
        <span style={cx("margin-left:auto; width:15px; height:6px; border-radius:999px; background:" + P.mango)} />
      </span>
      <span style={cx("width:48%; height:5px; border-radius:2px; background:" + P.ink + "; margin-top:2px")} />
      <span style={cx("display:flex; gap:5px")}>
        <span style={cx("flex:1; height:14px; border-radius:3px; background:" + P.sand)} />
        <span style={cx("flex:1; height:14px; border-radius:3px; background:" + P.sand)} />
      </span>
      <span style={cx("width:40%; height:5px; border-radius:2px; background:" + P.ink)} />
      <span style={cx("display:flex; gap:5px")}>
        <span style={cx("flex:1; height:14px; border-radius:3px; background:" + P.sand)} />
        <span style={cx("flex:1; height:14px; border-radius:3px; background:" + P.sand)} />
      </span>
    </>)}</>);
    case "store": return panel(<>{chrome(
      <span style={cx("margin-left:4px; display:flex; align-items:center; justify-content:center; min-width:15px; height:15px; padding:0 3px; border-radius:999px; background:" + P.mango)}><span style={cx("font-family:'Gabarito',sans-serif; font-size:9px; font-weight:800; color:" + P.ink)}>3</span></span>
    )}{page(
      <span style={cx("flex:1; display:grid; grid-template-columns:repeat(3,1fr); gap:5px; align-content:start")}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={cx("display:flex; flex-direction:column; gap:3px")}>
            <span style={cx("height:20px; border-radius:4px; background:" + P.sand)} />
            <span style={cx("width:65%; height:4px; border-radius:2px; background:" + P.mango)} />
          </span>
        ))}
      </span>
    )}</>);
    case "booking": return panel(<>{chrome()}{page(<>
      <span style={cx("display:grid; grid-template-columns:repeat(4,1fr); gap:4px")}>
        {["S", "M", "T", "W"].map((d, i) => (<span key={i} style={cx("font-family:'Gabarito',sans-serif; font-size:7px; font-weight:800; text-align:center; color:" + P.ink + "; opacity:0.55")}>{d}</span>))}
      </span>
      <span style={cx("display:grid; grid-template-columns:repeat(4,1fr); gap:4px")}>
        {Array.from({ length: 12 }).map((_, i) => (<span key={i} style={cx("height:9px; border-radius:2px; background:" + (i === 5 ? P.mango : "rgba(22,16,13,0.12)"))} />))}
      </span>
      <span style={cx("margin-top:auto; align-self:flex-start; padding:3px 11px; border-radius:999px; background:" + P.mango)}><span style={cx("font-family:'Gabarito',sans-serif; font-size:8px; font-weight:800; color:" + P.ink)}>Book</span></span>
    </>)}</>);
    case "webapp": return panel(<>{chrome()}
      <span style={cx("flex:1; display:flex; gap:6px; background:rgba(255,243,228,0.04); border-radius:8px; padding:7px; box-sizing:border-box")}>
        <span style={cx("display:flex; flex-direction:column; gap:4px; width:18px; flex-shrink:0")}>
          <span style={cx("height:4px; border-radius:2px; background:" + P.mango)} />
          <span style={cx("height:4px; border-radius:2px; background:rgba(255,243,228,0.3)")} />
          <span style={cx("height:4px; border-radius:2px; background:rgba(255,243,228,0.3)")} />
        </span>
        <span style={cx("flex:1; display:flex; flex-direction:column; gap:5px; min-width:0")}>
          <span style={cx("display:flex; gap:5px")}>
            {[0, 1].map((i) => (<span key={i} style={cx("flex:1; display:flex; flex-direction:column; gap:3px; background:rgba(255,243,228,0.06); border-radius:5px; padding:5px")}>
              <span style={cx("width:70%; height:6px; border-radius:2px; background:" + P.cream)} />
              <span style={cx("width:45%; height:3px; border-radius:2px; background:" + P.mango)} />
            </span>))}
          </span>
          <span style={cx("flex:1; display:flex; align-items:flex-end; gap:3px")}>
            {[35, 60, 45, 80, 95].map((h, i) => (<span key={i} style={cx("flex:1; height:" + h + "%; border-radius:2px 2px 1px 1px; background:" + (i >= 3 ? P.mango : "rgba(255,243,228,0.25)"))} />))}
          </span>
        </span>
      </span>
    </>);
    case "consumer": return phone(<>
      {[P.sand, P.teal].map((img, idx) => (<span key={idx} style={cx("display:flex; flex-direction:column; gap:2px")}>
        <span style={cx("height:15px; border-radius:4px; background:" + img)} />
        <span style={cx("width:85%; height:3px; border-radius:2px; background:rgba(255,243,228,0.7)")} />
        <span style={cx("width:55%; height:3px; border-radius:2px; background:rgba(255,243,228,0.35)")} />
      </span>))}
      <span style={cx("margin-top:auto; display:flex; justify-content:space-between; padding:0 3px")}>
        {[P.mango, "rgba(255,243,228,0.35)", "rgba(255,243,228,0.35)", "rgba(255,243,228,0.35)"].map((c, i) => (<span key={i} style={cx("width:5px; height:5px; border-radius:999px; background:" + c)} />))}
      </span>
    </>, P.ink);
    case "marketplace": return phone(<>
      {[0, 1, 2].map((i) => (<span key={i} style={cx("display:flex; align-items:center; gap:4px")}>
        <span style={cx("width:13px; height:13px; border-radius:3px; background:" + P.sand + "; flex-shrink:0")} />
        <span style={cx("flex:1; display:flex; flex-direction:column; gap:2px; min-width:0")}>
          <span style={cx("width:90%; height:3px; border-radius:2px; background:rgba(255,243,228,0.7)")} />
          <span style={cx("width:50%; height:3px; border-radius:2px; background:" + P.mango)} />
        </span>
      </span>))}
      <span style={cx("margin-top:auto; align-self:center; padding:3px 12px; border-radius:999px; background:" + P.mango)}><span style={cx("font-family:'Gabarito',sans-serif; font-size:7px; font-weight:800; color:" + P.ink)}>Sell</span></span>
    </>, P.ink);
    case "saas": return phone(<>
      <span style={cx("width:65%; height:4px; border-radius:2px; background:rgba(255,243,228,0.7)")} />
      <span style={cx("display:flex; align-items:flex-end; gap:2.5px; height:30px")}>
        {[40, 65, 50, 85, 70].map((h, i) => (<span key={i} style={cx("flex:1; height:" + h + "%; border-radius:1.5px; background:" + (i === 3 ? P.mango : "rgba(255,243,228,0.3)"))} />))}
      </span>
      <span style={cx("display:flex; gap:3px; margin-top:auto")}>
        {[0, 1].map((i) => (<span key={i} style={cx("flex:1; height:12px; border-radius:3px; background:rgba(255,243,228,0.08)")} />))}
      </span>
    </>, P.ink);
    case "ondemand": return phone(<>
      <span style={cx("flex:1; position:relative; border-radius:6px; overflow:hidden; background:rgba(255,243,228,0.06)")}>
        <svg viewBox="0 0 52 60" width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }} aria-hidden="true">
          <line x1="17" y1="0" x2="17" y2="60" stroke="rgba(255,243,228,0.14)" strokeWidth="1" />
          <line x1="34" y1="0" x2="34" y2="60" stroke="rgba(255,243,228,0.14)" strokeWidth="1" />
          <line x1="0" y1="22" x2="52" y2="22" stroke="rgba(255,243,228,0.14)" strokeWidth="1" />
          <line x1="0" y1="42" x2="52" y2="42" stroke="rgba(255,243,228,0.14)" strokeWidth="1" />
          <path d="M6 52 C 18 44, 14 26, 32 20 S 44 12, 44 11" fill="none" stroke={P.mango} strokeWidth="2.4" strokeDasharray="4 4" strokeLinecap="round" />
          <circle cx="6" cy="52" r="3" fill={P.cream} />
          <path d="M44 4c3.6 0 6.5 2.9 6.5 6.5 0 4.8-6.5 10-6.5 10s-6.5-5.2-6.5-10C37.5 6.9 40.4 4 44 4z" fill={P.mango} />
          <circle cx="44" cy="10.5" r="2.4" fill={P.ink} />
        </svg>
      </span>
      <span style={cx("display:flex; align-items:center; gap:4px; background:" + P.cream + "; border-radius:5px; padding:4px 5px; flex-shrink:0")}>
        <span style={cx("width:6px; height:6px; border-radius:999px; background:" + P.mango + "; flex-shrink:0")} />
        <span style={cx("flex:1; height:3px; border-radius:2px; background:rgba(22,16,13,0.5)")} />
      </span>
    </>, P.ink);
    default: return panel(<span style={cx("flex:1; border-radius:8px; background:rgba(255,243,228,0.05)")} />);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Props from the CMS (see content/schema.ts → pricing)
   ────────────────────────────────────────────────────────────────────────── */
type WebsiteType = "landing" | "business" | "store" | "booking" | "webapp";
type AppType = "consumer" | "marketplace" | "saas" | "ondemand";
type Pricing = {
  advancePct: number; firstProjectPct: number; rushPct: number;
  bundle: { pairPct: number; triadPct: number; quadBonusPct: number; mixedTrioPct: number };
  website: Record<WebsiteType, number>; // one-time base BY TYPE
  app: Record<AppType, number>;         // one-time base BY TYPE
  branding: number;   // one-time base
  marketing: number;  // per-month base
  video: number;      // per-month base (covers the 8/month volume)
};

type ScaleKey = "solo" | "growing" | "funded";
type ServiceKey = "website" | "app" | "branding" | "marketing" | "video";

/* Built-in fallback — mirrors content/schema.ts `pricing` defaults. Used when
   the CMS content hasn't loaded the pricing block yet (e.g. a cached publish
   from before it existed), so the builder never crashes on a missing prop.
   The price now comes from the site/app TYPE the buyer picks plus the features
   they add — the self-declared company size no longer affects it at all. */
const DEFAULT_PRICING: Pricing = {
  advancePct: 25, firstProjectPct: 30, rushPct: 18,
  bundle: { pairPct: 8, triadPct: 14, quadBonusPct: 4, mixedTrioPct: 8 },
  website: { landing: 45000, business: 80000, store: 130000, booking: 95000, webapp: 190000 },
  app: { consumer: 260000, marketplace: 480000, saas: 360000, ondemand: 520000 },
  branding: 55000,
  marketing: 35000,
  video: 22000,
};

/* ──────────────────────────────────────────────────────────────────────────
   CSS-string → React style helpers. The design builds inline style strings
   dynamically; we keep those strings verbatim and parse them at render.
   ────────────────────────────────────────────────────────────────────────── */
function parseDecls(str: string): [string, string][] {
  const out: [string, string][] = [];
  for (const part of str.split(";")) {
    const seg = part.trim();
    if (!seg) continue;
    const i = seg.indexOf(":");
    if (i < 0) continue;
    const prop = seg.slice(0, i).trim();
    const val = seg.slice(i + 1).trim();
    if (prop) out.push([prop, val]);
  }
  return out;
}
function camel(prop: string): string {
  const vendor = prop.startsWith("-");
  const base = vendor ? prop.slice(1) : prop;
  const parts = base.split("-");
  let out = parts[0];
  for (let i = 1; i < parts.length; i++) out += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
  return vendor ? out.charAt(0).toUpperCase() + out.slice(1) : out;
}
function css(str: string): React.CSSProperties {
  const o: Record<string, string> = {};
  for (const [p, val] of parseDecls(str)) o[camel(p)] = val;
  return o as unknown as React.CSSProperties;
}
/* style-hover: apply the given declarations on enter, restore prior inline
   values on leave (cheap, no state). */
function hoverFrom(str: string) {
  const decls = parseDecls(str);
  const prev: Record<string, string> = {};
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      for (const [p, val] of decls) { prev[p] = el.style.getPropertyValue(p); el.style.setProperty(p, val); }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      for (const [p] of decls) el.style.setProperty(p, prev[p] || "");
    },
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Data — ported verbatim from the design. Base service PRICES are NOT stored
   here; they come from props.pricing at compute time. `mo` marks the two
   monthly services (marketing, video).
   ────────────────────────────────────────────────────────────────────────── */
type SvcDef = {
  key: ServiceKey; label: string; mo: boolean;
  own: string; tease: string;
};
const SVC: SvcDef[] = [
  { key: "website", label: "Website", mo: false, own: "A site you can edit yourself, on your own domain", tease: "somewhere people land and actually believe you" },
  { key: "app", label: "Mobile app", mo: false, own: "A published app on both stores, in your developer account", tease: "live on the App Store and Play Store" },
  { key: "branding", label: "Branding", mo: false, own: "Logo system, colours, type and a rulebook your team can follow", tease: "how you look everywhere, decided once" },
  { key: "marketing", label: "Marketing", mo: true, own: "Live campaigns in your ad accounts, reported monthly", tease: "ads that bring people in" },
  { key: "video", label: "Video", mo: true, own: "A month of edited, captioned, scheduled video and all raw files", tease: "reels and shorts, cut and scheduled" },
];

/* Timeline is now driven by the site/app TYPE (not the self-declared size).
   website/app read the picked type's range; the rest are flat per-service. */
const WEB_DAYS: Record<WebsiteType, [number, number]> = { landing: [8, 14], business: [14, 24], store: [20, 32], booking: [16, 26], webapp: [30, 48] };
const APP_DAYS: Record<AppType, [number, number]> = { consumer: [45, 75], marketplace: [70, 110], saas: [55, 90], ondemand: [80, 130] };
const SVC_DAYS: Record<ServiceKey, [number, number]> = { website: [8, 14], app: [45, 75], branding: [12, 20], marketing: [7, 12], video: [7, 12] };

type KitDef = { key: string; label: string; note: string; services: ServiceKey[]; save: string; icon: string };
const KITS: KitDef[] = [
  { key: "launch", label: "The Launch Kit", note: "Brand + website. Nothing exists yet.", services: ["branding", "website"], save: "−8%", icon: "rocket" },
  { key: "growth", label: "The Growth Kit", note: "Website + ads + reels. You need customers.", services: ["website", "marketing", "video"], save: "−12%", icon: "chart" },
  { key: "all", label: "The Lot", note: "Everything, one team, one invoice.", services: ["website", "branding", "marketing", "video"], save: "−18%", icon: "grid" },
];

type ScaleDef = { key: ScaleKey; label: string; note: string; reaction: string; icon: string };
const SCALE: ScaleDef[] = [
  { key: "solo", label: "Just me", note: "Creator, freelancer, one-person operation", reaction: "Most of our work is for people exactly your size.", icon: "user" },
  { key: "growing", label: "A small business", note: "Shop, clinic, studio or agency with a team", reaction: "Home ground. Half our clients look exactly like you.", icon: "shop" },
  { key: "funded", label: "A funded company", note: "Startup or scale-up with investors watching", reaction: "We've shipped at that pace before. No drama.", icon: "rocket" },
];

type IndDef = { key: string; label: string };
const IND: IndDef[] = [
  { key: "ecom", label: "E-commerce / D2C" }, { key: "clinic", label: "Clinic & healthcare" }, { key: "food", label: "Restaurant & café" },
  { key: "realestate", label: "Real estate" }, { key: "edu", label: "Education & coaching" }, { key: "fitness", label: "Fitness & wellness" },
  { key: "pro", label: "Professional services" }, { key: "saas", label: "SaaS & tech" }, { key: "events", label: "Events" }, { key: "other", label: "Something else" },
];

/* A recommendation = a sensible TYPE (for services that ask one) plus a couple
   of chips within the groups that type reveals. */
type SvcRec = { type?: string; chips: string[] };
const REC_WEB: Record<string, SvcRec> = {
  ecom: { type: "store", chips: ["inventory", "discounts", "seo"] },
  clinic: { type: "booking", chips: ["reminders", "deposits", "seo"] },
  food: { type: "booking", chips: ["reminders", "deposits", "seo"] },
  realestate: { type: "business", chips: ["services", "locations", "seo"] },
  edu: { type: "business", chips: ["services", "blog", "seo"] },
  fitness: { type: "booking", chips: ["reminders", "stafflogin"] },
  pro: { type: "business", chips: ["services", "cases", "seo"] },
  saas: { type: "webapp", chips: ["roles", "dashboards", "api"] },
  events: { type: "booking", chips: ["reminders", "seo", "locations"] },
  other: { type: "business", chips: ["services", "seo"] },
};
const REC_APP: SvcRec = { type: "consumer", chips: ["push", "pay", "admin"] };
const REC: Record<string, string[]> = { branding: ["social", "print"], marketing: ["google", "wa"], video: ["thumbs", "sched"] };

type BrandStatusDef = { key: string; label: string; note: string; price: number; icon: string };
const BRAND_STATUS: BrandStatusDef[] = [
  { key: "full", label: "Yes — the whole system", note: "Logo, colours, type, rules and source files. We use it as-is and charge nothing extra.", price: 0, icon: "check" },
  { key: "logo", label: "Just a logo", note: "We'll extend it into a working system as we build — enough to stop the site looking improvised.", price: 12000, icon: "sparkle" },
  { key: "messy", label: "Bits and pieces", note: "Three shades of blue and two fonts nobody agreed on. We'll standardise what exists.", price: 18000, icon: "palette" },
  { key: "none", label: "Nothing yet", note: "Starting completely fresh. Worth doing properly, and we'll tell you why.", price: 0, icon: "blank" },
];

type SpeedDef = { key: string; label: string; note: string; price: string; icon: string };
const SPEED: SpeedDef[] = [
  { key: "standard", label: "Standard", note: "Our real pace. The date on your quote is the date it goes live.", price: "no change", icon: "clock" },
  { key: "planned", label: "Next quarter", note: "No rush. Same price, calmer for everyone involved.", price: "no change", icon: "calendar" },
  { key: "rush", label: "Rush it", note: "Priority slot, extra hands, queue jumped. Costs us more, so it costs you more.", price: "+18% on the build", icon: "bolt" },
];

type SpecChip = { key: string; label: string; price: number; mo?: boolean; desc: string; icon: string };
type SpecType = { key: string; label: string; note: string; icon: string };
/* forTypes: if present, the group only renders when the selected type is one of
   these. A group with no forTypes always renders. */
type SpecGroup = { title: string; help: string; single?: boolean; forTypes?: string[]; chips: SpecChip[] };
type SpecDef = { kicker: string; title: string; help: string; custom: string; typePrompt?: string; types?: SpecType[]; groups: SpecGroup[] };
const SPEC: Record<string, SpecDef> = {
  website: {
    kicker: "03 · THE WEBSITE", title: "Now build the website.", help: "Home, About, Contact and a lead form to WhatsApp are already in. Add what your business actually uses.",
    custom: "e.g. a dealer locator",
    typePrompt: "What kind of site?",
    types: [
      { key: "landing", label: "Landing page", note: "One page, one action.", icon: "target" },
      { key: "business", label: "Business site", note: "A few pages that explain and convert.", icon: "pages" },
      { key: "store", label: "Online store", note: "Sell products, take payments.", icon: "cart" },
      { key: "booking", label: "Bookings site", note: "Appointments, classes or tables.", icon: "calendar" },
      { key: "webapp", label: "Web app / portal", note: "Logins, dashboards, tools.", icon: "grid" },
    ],
    groups: [
      { title: "Make it convert", help: "", forTypes: ["landing"], chips: [
        { key: "ab", label: "A/B headline test", price: 9000, desc: "We try two versions and keep the one more people click.", icon: "split" },
        { key: "pixels", label: "Analytics & pixels", price: 6000, desc: "See where visitors come from and what they do.", icon: "chart" },
        { key: "bookingwidget", label: "Booking widget", price: 24000, desc: "Let people book a slot right on the page.", icon: "calendar" },
      ] },
      { title: "Pages", help: "", forTypes: ["business", "store", "booking"], chips: [
        { key: "services", label: "Services / product pages", price: 9000, desc: "A page for each thing you offer or sell.", icon: "pages" },
        { key: "blog", label: "Blog with a CMS", price: 14000, desc: "Post articles yourself, no developer needed.", icon: "doc" },
        { key: "cases", label: "Case studies", price: 11000, desc: "Show past work that proves you deliver.", icon: "star" },
        { key: "careers", label: "Careers & jobs", price: 12000, desc: "List openings and take applications.", icon: "users" },
        { key: "locations", label: "Multiple locations", price: 13000, desc: "A page for each branch or city.", icon: "map" },
      ] },
      { title: "Your store", help: "", forTypes: ["store"], chips: [
        { key: "inventory", label: "Inventory & stock", price: 16000, desc: "Track stock so you never oversell.", icon: "box" },
        { key: "discounts", label: "Discount codes", price: 8000, desc: "Run coupons and sale prices.", icon: "tag" },
        { key: "subs", label: "Subscriptions", price: 22000, desc: "Charge customers every month automatically.", icon: "refresh" },
      ] },
      { title: "Bookings", help: "", forTypes: ["booking"], chips: [
        { key: "reminders", label: "Reminders (WhatsApp/SMS)", price: 9000, desc: "Auto texts so people don't miss their slot.", icon: "bell" },
        { key: "stafflogin", label: "Staff logins", price: 20000, desc: "Your team manages bookings from their own login.", icon: "users" },
        { key: "deposits", label: "Take deposits", price: 14000, desc: "Collect part-payment to lock the booking.", icon: "card" },
      ] },
      { title: "The app", help: "", forTypes: ["webapp"], chips: [
        { key: "roles", label: "Roles & permissions", price: 22000, desc: "Different access levels for different users.", icon: "lock" },
        { key: "dashboards", label: "Dashboards & reports", price: 28000, desc: "Your numbers and charts, at a glance.", icon: "chart" },
        { key: "api", label: "Integrations / API", price: 26000, desc: "Connect the tools you already use.", icon: "code" },
        { key: "payments", label: "Payments", price: 18000, desc: "Take money on the site, safely.", icon: "card" },
      ] },
      { title: "Reach", help: "", forTypes: ["landing", "business", "store", "booking", "webapp"], chips: [
        { key: "seo", label: "SEO & local search", price: 15000, desc: "Show up on Google and Maps when people search.", icon: "search" },
        { key: "multilang", label: "Second language", price: 18000, desc: "Run the whole site in another language too.", icon: "globe" },
        { key: "motion", label: "Custom motion & scroll", price: 26000, desc: "Animation and scroll effects that feel premium.", icon: "sparkle" },
      ] },
    ],
  },
  app: {
    kicker: "03 · THE APP", title: "What ships in version one?", help: "iOS and Android from one codebase is always both. Anything you leave out is a later phase, not a lost idea.",
    custom: "e.g. Bluetooth device pairing",
    typePrompt: "What kind of app?",
    types: [
      { key: "consumer", label: "Consumer app", note: "For your customers.", icon: "phone" },
      { key: "marketplace", label: "Marketplace", note: "Buyers and sellers.", icon: "shop" },
      { key: "saas", label: "Business / SaaS tool", note: "Internal or paid tool.", icon: "chart" },
      { key: "ondemand", label: "On-demand / delivery", note: "Orders and tracking.", icon: "map" },
    ],
    groups: [
      { title: "Core", help: "", forTypes: ["consumer", "marketplace", "saas", "ondemand"], chips: [
        { key: "push", label: "Push notifications", price: 12000, desc: "Ping users on their phone to bring them back.", icon: "bell" },
        { key: "admin", label: "Admin dashboard", price: 30000, desc: "A control panel to run the app from.", icon: "grid" },
      ] },
      { title: "Money", help: "", forTypes: ["consumer", "saas", "ondemand", "marketplace"], chips: [
        { key: "pay", label: "Payments / subscriptions", price: 52000, desc: "Take one-off or recurring payments.", icon: "card" },
      ] },
      { title: "Marketplace", help: "", forTypes: ["marketplace"], chips: [
        { key: "sellers", label: "Seller onboarding", price: 34000, desc: "Let sellers sign up and list their own products.", icon: "shop" },
        { key: "ratings", label: "Ratings & reviews", price: 16000, desc: "Buyers rate and review — it builds trust.", icon: "star" },
        { key: "wallet", label: "Wallet & payouts", price: 36000, desc: "Hold balances and pay sellers out.", icon: "wallet" },
        { key: "chat", label: "Chat between users", price: 58000, desc: "In-app messaging between people.", icon: "chat" },
      ] },
      { title: "On-demand", help: "", forTypes: ["ondemand"], chips: [
        { key: "tracking", label: "Live order tracking", price: 40000, desc: "Watch the order move on a live map.", icon: "map" },
        { key: "maps", label: "Maps & routing", price: 30000, desc: "Directions and best routes for drivers.", icon: "map" },
        { key: "partner", label: "Delivery-partner app", price: 60000, desc: "A second app for your delivery riders.", icon: "scooter" },
      ] },
      { title: "SaaS", help: "", forTypes: ["saas"], chips: [
        { key: "teams", label: "Teams & roles", price: 26000, desc: "Invite teammates with the right access.", icon: "users" },
        { key: "analytics", label: "Analytics dashboards", price: 28000, desc: "See usage and revenue in one place.", icon: "chart" },
        { key: "integrations", label: "Third-party integrations", price: 26000, desc: "Plug into the tools your business runs on.", icon: "code" },
      ] },
    ],
  },
  branding: {
    kicker: "03 · THE BRAND", title: "How far does the identity go?", help: "Logo system, colour, type and the rules that hold them together are the core — always in. The rest depends on where your brand actually shows up.",
    custom: "e.g. vehicle branding",
    groups: [
      { title: "Add to the system", help: "", chips: [
        { key: "naming", label: "Naming & tagline", price: 26000, desc: "A name and a line that stick.", icon: "sparkle" },
        { key: "social", label: "Social kit & templates", price: 16000, desc: "Ready-made post templates in your style.", icon: "image" },
        { key: "print", label: "Stationery & print", price: 14000, desc: "Cards, letterheads, the printed basics.", icon: "doc" },
        { key: "packaging", label: "Packaging", price: 38000, desc: "How your product looks on the shelf.", icon: "box" },
        { key: "book", label: "Full brand book", price: 22000, desc: "The rulebook that keeps everything consistent.", icon: "doc" },
        { key: "photo", label: "Art direction for photos", price: 20000, desc: "A look and shot-list for your photos.", icon: "camera" },
      ] },
    ],
  },
  marketing: {
    kicker: "04 · THE ADS", title: "Where should the money go?", help: "Meta is in the base retainer. Your ad budget is paid by you, straight to the platform, never marked up.",
    custom: "e.g. LinkedIn ads for B2B",
    groups: [
      { title: "Channels", help: "monthly", chips: [
        { key: "google", label: "Google Search & PMax", price: 12000, mo: true, desc: "Ads that catch people already searching.", icon: "megaphone" },
        { key: "seo", label: "Organic SEO & content", price: 16000, mo: true, desc: "Rank on Google over time, no pay-per-click.", icon: "search" },
        { key: "wa", label: "WhatsApp follow-up", price: 9000, mo: true, desc: "Auto-reply and follow up leads on WhatsApp.", icon: "chat" },
        { key: "lp", label: "Fresh landing pages", price: 11000, mo: true, desc: "Pages built to turn ad clicks into enquiries.", icon: "pages" },
        { key: "influencer", label: "Creator collabs", price: 18000, mo: true, desc: "We line up creators to post about you.", icon: "star" },
      ] },
    ],
  },
  video: {
    kicker: "05 · THE CONTENT", title: "How much video, every month?", help: "Consistency beats production value. We'd rather you did eight good ones than thirty you resent.",
    custom: "e.g. a monthly podcast edit",
    groups: [
      { title: "Volume", help: "pick one", single: true, chips: [
        { key: "v8", label: "8 a month", price: 0, mo: true, desc: "Eight edited videos every month.", icon: "play" },
        { key: "v16", label: "16 a month", price: 20000, mo: true, desc: "Sixteen a month — enough to stay top-of-feed.", icon: "play" },
        { key: "v30", label: "30 a month", price: 44000, mo: true, desc: "One a day. Maximum presence.", icon: "play" },
      ] },
      { title: "Extras", help: "", chips: [
        { key: "shoot", label: "We come and shoot", price: 26000, mo: true, desc: "We show up and film the footage.", icon: "camera" },
        { key: "thumbs", label: "Thumbnails & covers", price: 7000, mo: true, desc: "Scroll-stopping cover images.", icon: "image" },
        { key: "sched", label: "We post it for you", price: 6000, mo: true, desc: "We schedule and publish — you don't touch it.", icon: "calendar" },
      ] },
    ],
  },
};

type ExampleDef = {
  key: string; label: string; note: string; scale: ScaleKey;
  services: ServiceKey[]; types?: Record<string, string>; spec: Record<string, number | string>; price: string; days: string;
};
const EXAMPLES: ExampleDef[] = [
  { key: "solo", label: "One-page site for a solo coach", note: "Home, about, booking form. Live in under two weeks.", scale: "solo", services: ["website"], types: { website: "landing" }, spec: {}, price: "₹31,500", days: "8–14 days" },
  { key: "clinic", label: "Clinic site with online appointments", note: "Service pages, bookings, local SEO so you show up on Maps.", scale: "growing", services: ["website"], types: { website: "booking" }, spec: { "website:services": 1, "website:seo": 1 }, price: "₹83,300", days: "16–26 days" },
  { key: "store", label: "D2C store with payments", note: "Catalogue, cart, UPI checkout and the SEO groundwork.", scale: "growing", services: ["website"], types: { website: "store" }, spec: { "website:inventory": 1, "website:discounts": 1, "website:seo": 1 }, price: "₹1,18,300", days: "20–32 days" },
  { key: "launch", label: "Brand + website launch kit", note: "Identity, social kit, and a site built on top of it. Bundled.", scale: "growing", services: ["branding", "website"], types: { website: "business" }, spec: { "branding:social": 1, "website:services": 1, "website:seo": 1 }, price: "₹1,12,700", days: "14–24 days" },
  { key: "content", label: "Ads + reels, running monthly", note: "Meta and Google, 16 reels a month, posted for you.", scale: "growing", services: ["marketing", "video"], spec: { "marketing:google": 1, "video:Volume": "v16", "video:sched": 1 }, price: "₹95,000 / mo", days: "live in 7–12 days" },
];

const CALC = ["Reading your scope, line by line…", "Checking it against what we actually charged last quarter…", "Seeing what we can knock off the bill…"];
/* Non-price version used while the price UI is switched off for v1. */
const CALC_BRIEF = ["Reading your scope, line by line…", "Laying out exactly what we'll build…", "Getting your brief ready…"];

/* ── v1 FEATURE FLAG ──────────────────────────────────────────────────────
   Pricing is fully built (price(), the quote endpoint, the learned model — all
   still live in the code) but HIDDEN from the UI for the v1 release. Flip this
   to `true` to bring the whole price experience back — the running total, the
   per-option prices, and the final bill reveal. Nothing else needs changing. */
const SHOW_PRICING = false;

/* ──────────────────────────────────────────────────────────────────────────
   State
   ────────────────────────────────────────────────────────────────────────── */
type Sel = {
  services: Record<string, boolean>;
  scale?: ScaleKey;
  industry?: string;
  industryOther?: string;
  brandStatus?: string;
  speed?: string;
};
type Phase = "idle" | "count" | "tease" | "swap" | "final";
type State = {
  step: number;
  sel: Sel;
  spec: Record<string, boolean | string>;
  specType: Record<string, string>;
  brandFromPitch: boolean;
  customs: Record<string, string[]>;
  draft: string;
  tailoring: boolean;
  /** industry-signature we last auto-tailored each service's spec for, so the
   *  resolve runs once per answer and never clobbers the user's manual edits. */
  tailoredSig: Record<string, string>;
  /** the live AI-interview per service, when the industry is custom. */
  interview: Record<string, IvState>;
  /** the final analysed quote (custom builds), fetched at the reveal. */
  quote: QuoteState | null;
  calcing: boolean;
  calcLine: string;
  phase: Phase;
  count: number;
  bar: number;
  dismissed: Record<string, boolean>;
  browseOpen: boolean;
  chatOpen: boolean;
  chatSent: boolean;
  chatDay: string | null;
  chatTime: string | null;
  chatName: string;
  chatPhone: string;
};

/* ── AI-interview client state (custom-industry path) ── */
type IvOption = { key: string; label: string; hint: string; amount: number };
type IvNode = { question: string; help: string; options: IvOption[]; allowCustom: boolean; customPrompt: string };
type IvPick = { q: string; a: string; label: string; amount: number };
type IvState = {
  sig: string;                                   // industry signature this run is for
  loading: boolean;
  done: boolean;
  base: { label: string; amount: number } | null;
  node: IvNode | null;                           // current question, or null when done
  picks: IvPick[];                               // answered path (with prices)
  closing: string;
  error: string;
};

type QuoteState = {
  svc: string;
  total: number;
  lineItems: { label: string; amount: number }[];
  rationale: string;
  confidence: number;
  source: string;     // "ai" | "blend" | "model"
  neighbours: number;
  dealId: number | null;
};

type QuoteLine = { label: string; detail: string; amount: number; mo?: boolean; svcKey?: ServiceKey };
type PriceResult = {
  lines: QuoteLine[]; sub: number; bundle: number; bundlePct: number; rush: number;
  one: number; offer: number; offerPct: number; final: number; mon: number;
};
type Nudge = { key: ServiceKey; title: string; body: string; cta: string };

/* ──────────────────────────────────────────────────────────────────────────
   Interview panel (custom-industry adaptive Q&A)
   ────────────────────────────────────────────────────────────────────────── */
interface IvView {
  ivLoading: boolean;
  ivError: string;
  ivDone: boolean;
  ivClosing: string;
  ivIndustry: string;
  ivBaseLabel: string;
  ivBaseAmountLabel: string;
  ivQuestion: string;
  ivHelp: string;
  ivCustomPrompt: string;
  ivAllowCustom: boolean;
  ivStep: number;
  ivOptions: { key: string; label: string; hint: string; amount: number; amountLabel: string; pick: () => void }[];
  ivPicks: { q: string; a: string; amountLabel: string }[];
  ivCanUndo: boolean;
  ivUndo: () => void;
  ivSubmitCustom: (val: string) => void;
  ivRetry: () => void;
}

function InterviewPanel({ v }: { v: IvView }) {
  const [draft, setDraft] = React.useState("");
  const submit = () => { const t = draft.trim(); if (t) { v.ivSubmitCustom(t); setDraft(""); } };
  const optStyle = "cursor:pointer; font-family:'DM Sans',sans-serif; display:flex; flex-direction:column; gap:7px; text-align:left; padding:18px 20px; border-radius:18px; background:rgba(255,243,228,0.05); border:1.5px solid rgba(255,243,228,0.14); color:#FFF3E4; transition:transform 200ms ease, border-color 200ms ease, background 200ms ease";

  return (
    <div style={css("display:flex; flex-direction:column; gap:18px; border-top:1px solid rgba(255,243,228,0.12); padding-top:24px")}>
      {/* answered-so-far recap (no prices — we analyse at the end) */}
      {v.ivPicks.length > 0 && (
        <div style={css("display:flex; flex-direction:column; gap:8px")}>
          {v.ivPicks.map((p, i) => (
            <div key={i} style={css("display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:13px; background:rgba(255,243,228,0.04); border:1px solid rgba(255,243,228,0.1)")}>
              <span aria-hidden="true" style={css("color:#0E9E86; font-weight:900; flex-shrink:0")}>✓</span>
              <span style={css("display:flex; flex-direction:column; gap:1px; min-width:0")}>
                <span style={css("font-size:12px; color:rgba(255,243,228,0.45); overflow:hidden; text-overflow:ellipsis; white-space:nowrap")}>{p.q}</span>
                <span style={css("font-size:14.5px; font-weight:700; color:#FFF3E4")}>{p.a}</span>
              </span>
            </div>
          ))}
          {v.ivCanUndo && (
            <button type="button" onClick={v.ivUndo} style={css("align-self:flex-start; cursor:pointer; font-size:13px; font-weight:700; padding:8px 14px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.2); background:transparent; color:rgba(255,243,228,0.7)")}>← change last answer</button>
          )}
        </div>
      )}

      {/* loading */}
      {v.ivLoading && (
        <div style={css("display:flex; align-items:center; gap:12px; padding:22px 4px")}>
          <span aria-hidden="true" style={css("display:inline-block; width:20px; height:20px; border-radius:999px; border:2.5px solid rgba(255,156,91,0.3); border-top-color:#FF9C5B; animation:bibSpin 900ms linear infinite")}></span>
          <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:19px; letter-spacing:-0.03em; color:#FF9C5B")}>Working out the next question…</span>
        </div>
      )}

      {/* error */}
      {!v.ivLoading && v.ivError && (
        <div style={css("display:flex; flex-wrap:wrap; align-items:center; gap:14px; padding:20px; border-radius:18px; background:rgba(226,62,44,0.1); border:1.5px solid rgba(226,62,44,0.4)")}>
          <span style={css("font-size:15px; color:#FFF3E4")}>{v.ivError}</span>
          <button type="button" onClick={v.ivRetry} style={css("cursor:pointer; font-size:14px; font-weight:700; padding:11px 20px; border-radius:999px; border:0; background:#FF7A00; color:#16100D")}>Try again</button>
        </div>
      )}

      {/* current question */}
      {!v.ivLoading && !v.ivError && !v.ivDone && v.ivQuestion && (
        <div style={css("display:flex; flex-direction:column; gap:16px")}>
          <div style={css("display:flex; flex-direction:column; gap:6px")}>
            <span style={css("font-size:12px; letter-spacing:0.2em; text-transform:uppercase; font-weight:800; color:#FF7A00")}>Question {v.ivStep}</span>
            <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(24px,3vw,32px); line-height:1.02; letter-spacing:-0.04em")}>{v.ivQuestion}</span>
            {v.ivHelp && <span style={css("font-size:15px; line-height:1.45; color:rgba(255,243,228,0.55)")}>{v.ivHelp}</span>}
          </div>
          <div className="pb-col" style={css("display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px")}>
            {v.ivOptions.map((o) => (
              <button type="button" key={o.key} onClick={o.pick} style={css(optStyle)} {...hoverFrom("transform:translateY(-3px); border-color:#FF7A00")}>
                <span style={css("font-size:16px; font-weight:800; line-height:1.2")}>{o.label}</span>
                {o.hint && <span style={css("font-size:13.5px; line-height:1.4; color:rgba(255,243,228,0.55)")}>{o.hint}</span>}
              </button>
            ))}
          </div>
          {v.ivAllowCustom && (
            <div style={css("display:flex; flex-wrap:wrap; gap:10px; max-width:640px")}>
              <input
                type="text"
                placeholder={v.ivCustomPrompt}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
                style={css("flex:1; min-width:220px; font-size:15px; padding:15px 20px; border-radius:999px; border:1.5px dashed rgba(255,122,0,0.5); background:rgba(255,122,0,0.08); color:#FFF3E4; outline:none")}
              />
              <button type="button" onClick={submit} style={css("cursor:pointer; font-size:14.5px; font-weight:700; padding:15px 24px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.25); background:transparent; color:#FFF3E4; white-space:nowrap")}>Add mine →</button>
            </div>
          )}
        </div>
      )}

      {/* done */}
      {!v.ivLoading && !v.ivError && v.ivDone && (
        <div style={css("display:flex; flex-direction:column; gap:8px; padding:22px; border-radius:20px; background:rgba(14,107,94,0.14); border:1.5px solid rgba(14,107,94,0.5)")}>
          <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(20px,2.4vw,26px); letter-spacing:-0.035em; color:#FFF3E4")}>✓ Got what we need.</span>
          <span style={css("font-size:15px; line-height:1.5; color:rgba(255,243,228,0.72)")}>{v.ivClosing || "That's enough to price it — hit Continue to see your estimate."}</span>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   The builder
   ────────────────────────────────────────────────────────────────────────── */
class PricingBuilder extends React.Component<{ pricing: Pricing }, State> {
  fxRef = React.createRef<HTMLSpanElement>();
  timers: ReturnType<typeof setTimeout>[] = [];
  private barTarget = 0;
  private barRaf = 0;

  state: State = {
    step: 0, sel: { services: {} }, spec: {}, specType: {}, brandFromPitch: false, customs: {}, draft: "",
    tailoring: false, tailoredSig: {}, interview: {}, quote: null,
    calcing: false, calcLine: "", phase: "idle", count: 0, bar: 0,
    dismissed: {}, browseOpen: false,
    chatOpen: false, chatSent: false, chatDay: null, chatTime: null, chatName: "", chatPhone: "",
  };

  componentDidMount() { this.barTarget = 0; }
  componentDidUpdate() { this.syncBar(); }
  componentWillUnmount() { this.timers.forEach(clearTimeout); cancelAnimationFrame(this.barRaf); }

  /* the running estimate eases to its new value instead of snapping */
  syncBar() {
    const t = this.price().one;
    if (t === this.barTarget) return;
    this.barTarget = t;
    cancelAnimationFrame(this.barRaf);
    const from = this.state.bar, start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 520);
      const e = 1 - Math.pow(1 - p, 3);
      this.setState({ bar: Math.round(from + (t - from) * e) });
      if (p < 1) this.barRaf = requestAnimationFrame(tick);
    };
    this.barRaf = requestAnimationFrame(tick);
  }

  money(n: number): string {
    const s = Math.max(0, Math.round(n)).toString();
    const l = s.slice(-3), r = s.slice(0, -3);
    return "₹" + (r ? r.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + l;
  }
  on(k: string): boolean { return !!this.state.sel.services[k]; }

  /* One-time / monthly base for a service. The number is driven ONLY by the
     TYPE the buyer picked (website/app) or the flat base (branding/marketing/
     video) — never by the self-declared company size. A typed service with no
     type yet contributes 0 (the default-type rule below makes that rare). */
  baseAmount(key: ServiceKey): number {
    const P = this.props.pricing;
    if (key === "website") { const t = this.state.specType.website as WebsiteType | undefined; return t ? (P.website[t] ?? 0) : 0; }
    if (key === "app") { const t = this.state.specType.app as AppType | undefined; return t ? (P.app[t] ?? 0) : 0; }
    if (key === "branding") return P.branding;
    if (key === "marketing") return P.marketing;
    return P.video;
  }
  /* The base a service will show the instant it's toggled on — i.e. with its
     default type already applied — so the bar matches the card's "from ₹X". */
  baseWithDefaultType(key: ServiceKey): number {
    const P = this.props.pricing;
    if (key === "website") return P.website.landing;
    if (key === "app") return P.app.consumer;
    return this.baseAmount(key);
  }
  /* Keep specType in sync with the selected services: default website → landing
     and app → consumer when they're on and untyped, and drop types for services
     that have left the build (so re-adding always resets to the default). */
  typesFor(services: Record<string, boolean>, prev: Record<string, string>): Record<string, string> {
    const st: Record<string, string> = {};
    Object.keys(prev).forEach((k) => { if (services[k]) st[k] = prev[k]; });
    if (services.website && !st.website) st.website = "landing";
    if (services.app && !st.app) st.app = "consumer";
    return st;
  }

  steps(): string[] {
    const s = ["services", "who"];
    (["website", "app", "branding", "marketing", "video"] as const).forEach((k) => { if (this.on(k)) s.push("spec:" + k); });
    /* brandcheck stays when there's a build and branding isn't a service — or
       when branding was just added from the brandcheck pitch, so that step never
       vanishes out from under the user and they can always undo it. */
    if ((!this.on("branding") || this.state.brandFromPitch) && (this.on("website") || this.on("app"))) s.push("brandcheck");
    s.push("speed", "bill");
    return s;
  }
  cur(): string { const s = this.steps(); return s[Math.min(this.state.step, s.length - 1)]; }

  /* ── pricing ──
     subtotal → bundle discount (shown live, as good news) → rush →
     first-project offer (applied at the reveal). Base prices + levers come
     from props.pricing; add-on / brand-tidy prices are hardcoded constants. */
  price(): PriceResult {
    const P = this.props.pricing;
    const lines: QuoteLine[] = [];
    let one = 0, mon = 0;
    SVC.forEach((s) => {
      if (!this.on(s.key)) return;
      /* CUSTOM industry → this service's lines come from the AI interview:
         a base line item + one line per priced answer. */
      if (this.interviewActive(s.key)) {
        const q = this.state.quote;
        if (q && q.svc === s.key && q.lineItems.length) {
          // analysed quote (AI + learned model) drives the price for this build
          q.lineItems.forEach((li) => { one += li.amount; lines.push({ label: li.label, detail: s.label, amount: li.amount }); });
          return;
        }
        // pre-analysis running value (hidden during the flow): base + priced picks
        const iv = this.state.interview[s.key];
        const b = iv?.base?.amount || 0;
        one += b;
        lines.push({ label: s.label, detail: iv?.base?.label || "Core build", amount: b, svcKey: s.key });
        (iv?.picks || []).forEach((p) => { if (p.amount > 0) { one += p.amount; lines.push({ label: p.label || p.a, detail: s.label, amount: p.amount }); } });
        return;
      }
      const amt = this.baseAmount(s.key);
      const t = (s.key === "website" || s.key === "app") ? this.state.specType[s.key] : undefined;
      const tLabel = t && SPEC[s.key] && SPEC[s.key].types ? (SPEC[s.key].types!.find((x) => x.key === t)?.label || "") : "";
      if (!s.mo) { one += amt; lines.push({ label: s.label, detail: tLabel ? "Base build · " + tLabel : "Base build", amount: amt, svcKey: s.key }); }
      else { mon += amt; lines.push({ label: s.label, detail: "Monthly retainer", amount: amt, mo: true, svcKey: s.key }); }
    });
    Object.keys(SPEC).forEach((svc) => {
      if (!this.on(svc)) return;
      if (this.interviewActive(svc)) return; // interview supplies this service's lines
      const def = SPEC[svc];
      const type = this.state.specType[svc];
      /* Services that ask a type contribute no add-ons until a type is chosen. */
      if (def.types && !type) return;
      def.groups.forEach((g) => {
        /* Skip chips in groups the current type hides, so price() never counts a
           hidden add-on (belt-and-suspenders with the on-change clearing). */
        if (g.forTypes && (!type || g.forTypes.indexOf(type) < 0)) return;
        g.chips.forEach((c) => {
        const picked = g.single ? this.state.spec[svc + ":" + g.title] === c.key : !!this.state.spec[svc + ":" + c.key];
        if (!picked || !c.price) return;
        const svcLabel = SVC.find((x) => x.key === svc)!.label;
        if (c.mo) { mon += c.price; lines.push({ label: c.label, detail: svcLabel + " · monthly", amount: c.price, mo: true }); }
        else { one += c.price; lines.push({ label: c.label, detail: svcLabel, amount: c.price }); }
        });
      });
    });
    const bs = BRAND_STATUS.find((b) => b.key === this.state.sel.brandStatus);
    if (bs && bs.price && !this.on("branding")) { one += bs.price; lines.push({ label: "Brand tidy-up", detail: bs.label, amount: bs.price }); }

    const builds = ["website", "app", "branding"].filter((k) => this.on(k)).length;
    const all = builds + ["marketing", "video"].filter((k) => this.on(k)).length;
    const B = P.bundle;
    let pct = builds >= 3 ? B.triadPct : builds === 2 ? B.pairPct : 0;
    if (pct && all >= 4) pct += B.quadBonusPct;
    if (!pct && all >= 3) pct = B.mixedTrioPct;

    const sub = one;
    const bundle = Math.round((sub * pct) / 100);
    let afterBundle = sub - bundle;
    const rush = this.state.sel.speed === "rush" ? Math.round(afterBundle * (P.rushPct / 100)) : 0;
    afterBundle += rush;
    const offerPct = P.firstProjectPct;
    const offer = Math.round((afterBundle * offerPct) / 100);
    return { lines, sub, bundle, bundlePct: pct, rush, one: afterBundle, offer, offerPct, final: afterBundle - offer, mon };
  }

  timelineLabel(): string {
    let lo = 0, hi = 0;
    SVC.forEach((s) => {
      if (!this.on(s.key)) return;
      let d: [number, number];
      if (s.key === "website") { const t = this.state.specType.website as WebsiteType | undefined; d = (t && WEB_DAYS[t]) || WEB_DAYS.landing; }
      else if (s.key === "app") { const t = this.state.specType.app as AppType | undefined; d = (t && APP_DAYS[t]) || APP_DAYS.consumer; }
      else d = SVC_DAYS[s.key];
      lo = Math.max(lo, d[0]); hi = Math.max(hi, d[1]);
    });
    if (!hi) return "—";
    if (this.state.sel.speed === "rush") { lo = Math.round(lo * 0.7); hi = Math.round(hi * 0.7); }
    return hi > 42 ? Math.round(lo / 7) + "–" + Math.round(hi / 7) + " weeks" : lo + "–" + hi + " days";
  }

  /* ── feedback fx ── */
  fly(e: React.MouseEvent<HTMLElement> | null, text: string, up: boolean) {
    const host = this.fxRef.current;
    if (!host || !e || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const s = document.createElement("span");
    s.textContent = text;
    s.setAttribute("style", "position:absolute;left:" + (r.left + r.width / 2) + "px;top:" + (r.top - 6) + "px;font-family:'Gabarito',sans-serif;font-weight:800;font-size:19px;letter-spacing:-0.03em;color:" + (up ? "#FF7A00" : "#0E6B5E") + ";text-shadow:0 4px 18px rgba(0,0,0,0.6);animation:bibFly 900ms cubic-bezier(.16,.84,.28,1) both;");
    host.appendChild(s);
    this.timers.push(setTimeout(() => s.remove(), 1000));
  }

  confetti() {
    const host = this.fxRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cols = ["#FF7A00", "#FFB169", "#0E6B5E", "#FFF3E4", "#FFE0C2", "#E23E2C"];
    const flash = document.createElement("span");
    flash.setAttribute("style", "position:absolute;left:18%;top:18%;width:64%;padding-bottom:64%;margin-top:-32%;border-radius:999px;background:radial-gradient(circle, rgba(255,190,120,0.45) 0%, rgba(255,122,0,0) 68%);animation:bibFlash 900ms cubic-bezier(.16,.84,.28,1) both;");
    host.appendChild(flash);
    for (let i = 0; i < 64; i++) {
      const p = document.createElement("span");
      const sz = 6 + Math.random() * 9;
      p.setAttribute("style", "position:absolute;top:-20px;left:" + (Math.random() * 100).toFixed(1) + "%;width:" + sz.toFixed(0) + "px;height:" + (sz * (0.5 + Math.random())).toFixed(0) + "px;border-radius:" + (Math.random() > 0.6 ? "999px" : "2px") + ";background:" + cols[i % cols.length] + ";--dx:" + ((Math.random() * 2 - 1) * 170).toFixed(0) + "px;--dy:" + (440 + Math.random() * 480).toFixed(0) + "px;--rot:" + (Math.random() * 900 - 450).toFixed(0) + "deg;animation:bibConfetti " + (1600 + Math.random() * 1200).toFixed(0) + "ms cubic-bezier(.2,.6,.35,1) " + (Math.random() * 320).toFixed(0) + "ms both;");
      host.appendChild(p);
    }
    this.timers.push(setTimeout(() => { if (host) host.innerHTML = ""; }, 3600));
  }

  /* ── navigation ── */
  go(n: number) {
    const steps = this.steps();
    const t = Math.max(0, Math.min(n, steps.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    if (steps[t] === "bill" && !this.state.calcing) return this.runReveal(t);
    this.setState({ step: t, draft: "" }, () => {
      const key = steps[t];
      if (key && key.indexOf("spec:") === 0) this.autoTailor(key.slice(5));
    });
  }

  runReveal(t: number) {
    const script = SHOW_PRICING ? CALC : CALC_BRIEF;
    this.setState({ step: t, calcing: true, calcLine: script[0], draft: "", count: 0, phase: "idle" });
    let i = 0;
    const iv = setInterval(() => { i += 1; if (i < script.length) this.setState({ calcLine: script[i] }); }, 720);
    let done = false;
    const finish = () => { if (done) return; done = true; clearInterval(iv); this.revealNow(); };

    // Custom builds: fetch the analysed quote before the reveal (only while the
    // price UI is on). Keep the calc animation on screen at least its usual
    // beat; never hang past a safety timeout.
    const cqs = SHOW_PRICING ? this.customQuoteSvc() : null;
    if (cqs && !(this.state.quote && this.state.quote.svc === cqs)) {
      const started = performance.now();
      this.fetchQuote(cqs).finally(() => {
        this.timers.push(setTimeout(finish, Math.max(0, 2200 - (performance.now() - started))));
      });
      this.timers.push(setTimeout(finish, 16_000)); // safety net if the fetch hangs
    } else {
      this.timers.push(setTimeout(finish, 2200));
    }
  }

  /** The count-up + first-project-offer reveal, run once pricing is settled.
   *  With the price UI off (v1), skip the number animation and just land on the
   *  finished-brief screen. */
  revealNow() {
    if (!SHOW_PRICING) { this.setState({ calcing: false, phase: "final" }); this.confetti(); return; }
    const p = this.price();
    this.setState({ calcing: false, phase: "count" });
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { this.setState({ count: p.final, phase: "final" }); return; }
    this.tween(0, p.one, 1150, () => {
      this.timers.push(setTimeout(() => {
        this.setState({ phase: "tease" });
        this.timers.push(setTimeout(() => {
          this.setState({ phase: "swap" });
          this.timers.push(setTimeout(() => {
            this.setState({ phase: "final" });
            this.tween(p.one, p.final, 760);
            this.confetti();
          }, 300));
        }, 1150));
      }, 620));
    });
  }

  tween(from: number, to: number, dur: number, cb?: () => void) {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      this.setState({ count: Math.round(from + (to - from) * e) });
      if (p < 1) requestAnimationFrame(tick); else if (cb) cb();
    };
    requestAnimationFrame(tick);
  }

  toggleSvc(k: ServiceKey, e?: React.MouseEvent<HTMLElement>) {
    const was = this.on(k);
    this.setState((st) => {
      const s = { ...st.sel.services };
      let spec = st.spec;
      if (s[k]) {
        delete s[k];
        /* leaving the build clears this service's picked chips, so re-adding
           always starts from the default type with nothing selected */
        spec = { ...st.spec };
        Object.keys(spec).forEach((id) => { if (id.indexOf(k + ":") === 0) delete spec[id]; });
      } else {
        s[k] = true;
      }
      /* default the type on select (website → landing, app → consumer) so the
         bar shows the "from ₹X" base immediately; drop types for removed svcs */
      const specType = this.typesFor(s, st.specType);
      /* if branding leaves the build, forget the "added from pitch" flag */
      const brandFromPitch = k === "branding" && was ? false : st.brandFromPitch;
      return { sel: { ...st.sel, services: s }, spec, specType, brandFromPitch };
    });
    this.fly(e ?? null, was ? "Removed" : "Added", !was);
  }
  setSel<K extends keyof Sel>(k: K, val: Sel[K]) { this.setState((st) => ({ sel: { ...st.sel, [k]: val } })); }
  setSpecSingle(id: string, val: string) { this.setState((st) => ({ spec: { ...st.spec, [id]: val } })); }

  /* Pick a type for a service. Clears any picked chips (and single-select "pick
     one" state) that live in groups the new type doesn't show, so price() can
     never count a stale, now-hidden add-on. */
  setSpecType(svc: string, typeKey: string) {
    this.setState((st) => {
      const specType = { ...st.specType, [svc]: typeKey };
      const spec = { ...st.spec };
      SPEC[svc].groups.forEach((g) => {
        const shown = !g.forTypes || g.forTypes.indexOf(typeKey) >= 0;
        if (shown) return;
        if (g.single) delete spec[svc + ":" + g.title];
        else g.chips.forEach((c) => { delete spec[svc + ":" + c.key]; });
      });
      return { specType, spec };
    });
  }

  /* Remove a service from the final bill and re-settle the number in place. */
  removeSvcFromBill(k: ServiceKey) {
    this.setState((st) => { const s = { ...st.sel.services }; delete s[k]; return { sel: { ...st.sel, services: s }, specType: this.typesFor(s, st.specType) }; }, () => {
      const p = this.price();
      const steps = this.steps();
      this.setState({ step: Math.min(this.state.step, steps.length - 1), count: this.state.phase === "final" ? p.final : p.one });
    });
  }

  /* The brand pitch on the brandcheck step is a reversible toggle. Adding keeps
     the user on brandcheck (via brandFromPitch) instead of letting the step
     vanish; removing puts them back to the brand-status question. */
  toggleBrandPitch(e: React.MouseEvent<HTMLElement>) {
    const wasOn = this.on("branding");
    if (wasOn) {
      this.setState(
        (st) => { const s = { ...st.sel.services }; delete s.branding; return { sel: { ...st.sel, services: s }, brandFromPitch: false }; },
        () => { const steps = this.steps(); const i = steps.indexOf("brandcheck"); const t = i >= 0 ? i : Math.min(this.state.step, steps.length - 1); if (this.state.step !== t) this.setState({ step: t }); }
      );
      this.fly(e, "Removed", false);
    } else {
      this.setState(
        (st) => ({ sel: { ...st.sel, services: { ...st.sel.services, branding: true }, brandStatus: "full" }, brandFromPitch: true }),
        () => { const steps = this.steps(); const i = steps.indexOf("brandcheck"); if (i >= 0 && this.state.step !== i) this.setState({ step: i }); }
      );
      this.fly(e, "Added", true);
    }
  }

  loadExample(ex: ExampleDef) {
    const services: Record<string, boolean> = {};
    ex.services.forEach((s) => { services[s] = true; });
    const spec: Record<string, boolean | string> = {};
    Object.keys(ex.spec).forEach((k) => { const val = ex.spec[k]; spec[k] = val === 1 ? true : (val as string); });
    const specType = this.typesFor(services, ex.types || {});
    this.setState({ sel: { services, scale: ex.scale, speed: "standard" }, spec, specType, browseOpen: false, dismissed: {} });
    this.timers.push(setTimeout(() => { const steps = this.steps(); this.runReveal(steps.length - 1); }, 60));
  }

  addCustomNow(id: string) {
    const t = this.state.draft.trim();
    if (!t) return;
    this.setState((st) => { const c = { ...st.customs }; c[id] = (c[id] || []).concat([t]); return { customs: c, draft: "" }; });
  }

  /* ── Adaptive spec, driven by the WHO answer ──
     There's no "describe it" box on the spec step. Instead, the industry the
     buyer picked (or typed) on the WHO step decides the spec: the right TYPE is
     pre-selected — which alone filters the questions to the relevant ones — and
     the options that fit are pre-ticked. Everything stays editable. */

  /** A stable fingerprint of the current WHO answer. autoTailor runs once per
   *  fingerprint per service, so revisiting the step won't re-run (and clobber
   *  edits), but changing the answer will. */
  industrySig(): string {
    const ind = this.state.sel.industry || "";
    const other = ind === "other" ? (this.state.sel.industryOther || "").trim().toLowerCase() : "";
    return ind + "|" + other;
  }

  /** Human label for the current industry — the typed text for "other", else
   *  the picked chip's label. Used in the confirmation line + as the AI ask. */
  industryText(): string {
    const ind = this.state.sel.industry;
    if (!ind) return "";
    if (ind === "other") return (this.state.sel.industryOther || "").trim();
    return (IND.find((i) => i.key === ind) || ({} as IndDef)).label || "";
  }

  /** Fired when the buyer lands on a service's spec step. Two worlds:
   *   • KNOWN industry → our curated fixed spec, pre-set instantly (no AI).
   *   • CUSTOM industry → the adaptive AI interview takes over the step. */
  autoTailor(svc: string) {
    const def = SPEC[svc];
    if (!def || !def.types) return;            // only typed services (website/app)
    if (!this.state.sel.industry) return;      // no answer yet → leave the defaults
    const sig = this.industrySig();

    // CUSTOM ("Something else" + free text) → hand the step to the AI interview.
    if (this.state.sel.industry === "other") {
      if (!(this.state.sel.industryOther || "").trim()) return;
      const iv = this.state.interview[svc];
      if (!iv || iv.sig !== sig) this.startInterview(svc, sig);
      return;
    }

    // KNOWN industry → curated mapping. Instant, deterministic, free.
    if (this.state.tailoredSig[svc] === sig) return;
    this.applySpec(svc, { type: this.recType(svc) ?? null, features: this.recFor(svc), custom: [] }, sig);
  }

  /* ── the adaptive interview (custom industry) ──
     One question at a time. Each answer extends the path; the server returns the
     next node (from its DB cache, or freshly AI-generated) until it has enough
     to price. Prices are AI-decided and accumulate into the bill. */

  interviewActive(svc: string): boolean {
    if (svc !== "website" && svc !== "app") return false;
    return this.state.sel.industry === "other" && !!(this.state.sel.industryOther || "").trim();
  }
  interviewFor(svc: string): IvState | undefined { return this.state.interview[svc]; }
  /** base + every priced pick = this service's contribution to the one-time bill. */
  interviewSubtotal(svc: string): number {
    const iv = this.state.interview[svc];
    if (!iv) return 0;
    return (iv.base?.amount || 0) + iv.picks.reduce((s, p) => s + (p.amount || 0), 0);
  }
  private priceCtx() {
    const P = this.props.pricing;
    return { website: P.website, app: P.app, branding: P.branding, marketing: P.marketing, video: P.video };
  }
  /** The custom-industry service whose final price the analysed quote covers
   *  (website takes priority if both were somehow custom). */
  customQuoteSvc(): string | null {
    if (this.interviewActive("website")) return "website";
    if (this.interviewActive("app")) return "app";
    return null;
  }

  /** Fetch the analysed quote for a custom build (AI + learned model blend).
   *  Resolves once state.quote is set (or on failure, left null → the running
   *  interview subtotal stands in). */
  fetchQuote(svc: string): Promise<void> {
    const iv = this.state.interview[svc];
    const industry = (this.state.sel.industryOther || "").trim();
    const scale = (SCALE.find((s) => s.key === this.state.sel.scale) || ({} as ScaleDef)).label || "";
    const path = (iv?.picks || []).map((p) => ({ q: p.q, a: p.a }));
    const estimate = this.interviewSubtotal(svc);
    return fetch("/api/pricing/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: svc, scale, industry, path, price: this.priceCtx(), estimate }),
    })
      .then((r) => r.json())
      .then((q: { total: number; lineItems: { label: string; amount: number }[]; rationale?: string; confidence?: number; source?: string; neighbours?: number; dealId?: number | null }) => {
        if (!q || typeof q.total !== "number") return;
        this.setState({ quote: { svc, total: q.total, lineItems: Array.isArray(q.lineItems) ? q.lineItems : [], rationale: q.rationale || "", confidence: q.confidence || 0, source: q.source || "ai", neighbours: q.neighbours || 0, dealId: q.dealId ?? null } });
      })
      .catch(() => { /* leave quote null — the interview subtotal covers it */ });
  }

  startInterview(svc: string, sig: string) {
    this.setState((st) => ({
      interview: { ...st.interview, [svc]: { sig, loading: true, done: false, base: null, node: null, picks: [], closing: "", error: "" } },
      quote: null, // scope is changing — any prior quote is stale
    }), () => this.fetchNode(svc, sig));
  }

  /** POST the current path and install whatever node comes back. */
  fetchNode(svc: string, sig: string) {
    const industry = (this.state.sel.industryOther || "").trim();
    const scale = (SCALE.find((s) => s.key === this.state.sel.scale) || ({} as ScaleDef)).label || "";
    const iv = this.state.interview[svc];
    const path = (iv?.picks || []).map((p) => ({ q: p.q, a: p.a }));
    fetch("/api/pricing/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: svc, scale, industry, path, price: this.priceCtx() }),
    })
      .then((r) => r.json())
      .then((n: { done?: boolean; base?: { label: string; amount: number }; question?: string; help?: string; options?: IvOption[]; allowCustom?: boolean; customPrompt?: string; closing?: string }) => {
        if (this.industrySig() !== sig) return; // answer changed mid-flight — drop it
        this.setState((st) => {
          const cur = st.interview[svc];
          if (!cur || cur.sig !== sig) return null;
          const base = cur.base || (n.base ? { label: n.base.label, amount: n.base.amount } : null);
          const done = !!n.done || !n.question || !(n.options && n.options.length);
          const node: IvNode | null = done
            ? null
            : { question: n.question || "", help: n.help || "", options: n.options || [], allowCustom: n.allowCustom !== false, customPrompt: n.customPrompt || "Something else — tell us" };
          return { interview: { ...st.interview, [svc]: { ...cur, loading: false, done, base, node, closing: n.closing || cur.closing } } };
        });
      })
      .catch(() => {
        if (this.industrySig() !== sig) return;
        this.setState((st) => {
          const cur = st.interview[svc];
          if (!cur) return null;
          return { interview: { ...st.interview, [svc]: { ...cur, loading: false, error: "Couldn't reach the assistant — try again." } } };
        });
      });
  }

  /** Record an answer (option or typed custom) and fetch the next question. */
  answerInterview(svc: string, pick: { a: string; label: string; amount: number }) {
    const iv = this.state.interview[svc];
    if (!iv || !iv.node || iv.loading) return;
    const q = iv.node.question;
    const sig = iv.sig;
    this.setState((st) => {
      const cur = st.interview[svc];
      if (!cur) return null;
      return { interview: { ...st.interview, [svc]: { ...cur, loading: true, error: "", picks: [...cur.picks, { q, a: pick.a, label: pick.label, amount: pick.amount }] } }, quote: null };
    }, () => this.fetchNode(svc, sig));
  }

  /** Step back one question (drops the last answer) and re-ask it. */
  undoInterview(svc: string) {
    const iv = this.state.interview[svc];
    if (!iv || iv.loading || !iv.picks.length) return;
    const sig = iv.sig;
    this.setState((st) => {
      const cur = st.interview[svc];
      if (!cur) return null;
      return { interview: { ...st.interview, [svc]: { ...cur, loading: true, done: false, node: null, closing: "", picks: cur.picks.slice(0, -1) } }, quote: null };
    }, () => this.fetchNode(svc, sig));
  }

  /** Apply a resolved {type, features, custom} to a service's spec — clearing
   *  the service's prior picks first so switching industries never leaves stale
   *  add-ons behind — and record the signature we tailored for. */
  applySpec(
    svc: string,
    data: { type: string | null; features: string[]; custom: string[] },
    sig: string
  ) {
    const def = SPEC[svc];
    const validType = data.type && def.types && def.types.some((t) => t.key === data.type) ? data.type : null;
    this.setState((st) => {
      const spec = { ...st.spec };
      // wipe this service's existing picks (chips + single-select state)
      Object.keys(spec).forEach((k) => { if (k.indexOf(svc + ":") === 0) delete spec[k]; });
      const chosenType = validType || st.specType[svc];
      const specType = validType ? { ...st.specType, [svc]: validType } : st.specType;
      const keys = Array.isArray(data.features) ? data.features : [];
      keys.forEach((fk) => {
        for (const g of def.groups) {
          const chip = g.chips.find((c) => c.key === fk);
          if (!chip) continue;
          const visible = !g.forTypes || (chosenType ? g.forTypes.indexOf(chosenType) >= 0 : false);
          if (visible) {
            if (g.single) spec[svc + ":" + g.title] = chip.key;
            else spec[svc + ":" + chip.key] = true;
          }
          break; // a key lives in exactly one group
        }
      });
      if (svc === "video" && !spec["video:Volume"]) spec["video:Volume"] = "v16";
      const customs = { ...st.customs };
      const extra = (Array.isArray(data.custom) ? data.custom : [])
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
        .slice(0, 3);
      if (extra.length) customs[svc] = (customs[svc] || []).concat(extra);
      return { spec, specType, customs, tailoring: false, tailoredSig: { ...st.tailoredSig, [svc]: sig } };
    });
  }

  recFor(svc: string): string[] {
    if (svc === "website") return (REC_WEB[this.state.sel.industry || "other"] || REC_WEB.other).chips;
    if (svc === "app") return REC_APP.chips;
    if (svc === "video") return REC.video;
    return REC[svc] || [];
  }
  recType(svc: string): string | undefined {
    if (svc === "website") return (REC_WEB[this.state.sel.industry || "other"] || REC_WEB.other).type;
    if (svc === "app") return REC_APP.type;
    return undefined;
  }

  /* The nudge target no longer depends on the target being off, so the card can
     render as a reversible toggle (Add ↔ Remove) instead of disappearing. */
  nudge(svc: string): Nudge | null {
    if (svc === "website") return { key: "branding", title: "Your site will only ever look as good as the brand under it.", body: "Half the sites we're asked to rebuild were fine — the logo and colours underneath them weren't. Do both now, together, and 8% comes off the whole bill.", cta: "Add the brand" };
    if (svc === "branding") return { key: "website", title: "A brand nobody sees is a folder of files.", body: "The most common thing that happens after an identity project: no surface to put it on. Bundle the site and both get designed by the same team, in one go.", cta: "Add the website" };
    if (svc === "app") return { key: "marketing", title: "Store listings don't bring downloads.", body: "Apps live or die on the first thousand users. We run paid acquisition into it from launch week — in your ad accounts, not ours.", cta: "Add marketing" };
    if (svc === "marketing") return { key: "video", title: "Ads without fresh creative burn out in three weeks.", body: "The single biggest lever on cost per lead is new creative. Short-form gives the campaigns something new to test every week.", cta: "Add video" };
    if (svc === "video") return { key: "marketing", title: "Great reels, seen by 200 people.", body: "Organic gets you started; paid decides how far it goes. Put a small budget behind the ones that already work and the maths changes fast.", cta: "Add marketing" };
    return null;
  }

  finalNudge(): Nudge | null {
    if (this.state.dismissed.final) return null;
    const missing = (["website", "app", "branding", "marketing", "video"] as ServiceKey[]).filter((k) => !this.on(k));
    if (!missing.length) return null;
    if (missing.length <= 2) return { key: "all" as unknown as ServiceKey, title: "You're one step from the full set.", body: "Everything under one team, one timeline, one invoice — and the bundle discount hits its maximum 18%. Most people who get this far take it.", cta: "Show me the whole thing" };
    const s = SVC.find((x) => x.key === missing[0])!;
    return { key: s.key, title: "One thing worth reconsidering.", body: s.label + " — " + s.tease + ". Added now it rides the same bundle and the same timeline. Added in six months it's a separate project at full price.", cta: "Add " + s.label.toLowerCase() };
  }

  /* ── the big derive/render props object ── */
  renderVals() {
    const cur = this.cur(), steps = this.steps(), p = this.price();
    const P = this.props.pricing;
    const advPct = P.advancePct;
    const isBill = cur === "bill" && !this.state.calcing;
    const isCalc = this.state.calcing;
    const isSpec = cur.indexOf("spec:") === 0 && !isCalc;
    const svc = isSpec ? cur.slice(5) : null;
    const picked = Object.keys(this.state.sel.services);
    const ph = this.state.phase;

    const CARD = "cursor:pointer; font-family:'DM Sans',sans-serif; text-align:left; display:flex; flex-direction:column; gap:13px; padding:18px; border-radius:22px; min-height:340px; transition:transform 220ms cubic-bezier(.16,.84,.28,1), border-color 200ms ease, background 200ms ease; ";
    const cardStyle = (on: boolean) => CARD + (on ? "background:rgba(255,122,0,0.14); border:2px solid #FF7A00; color:#FFF3E4" : "background:rgba(255,243,228,0.05); border:2px solid rgba(255,243,228,0.12); color:#FFF3E4");
    const tickStyle = (on: boolean) => "width:26px; height:26px; border-radius:999px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; transition:transform 240ms cubic-bezier(.16,.84,.28,1), background 200ms ease; " + (on ? "background:#FF7A00; color:#16100D; transform:scale(1)" : "background:transparent; color:transparent; border:1.5px solid rgba(255,243,228,0.2); transform:scale(.86)");
    const CHIP = "cursor:pointer; font-family:'DM Sans',sans-serif; display:inline-flex; align-items:center; gap:10px; padding:12px 18px; border-radius:999px; transition:transform 200ms cubic-bezier(.16,.84,.28,1), background 180ms ease, border-color 180ms ease; ";
    const chipStyle = (on: boolean) => CHIP + (on ? "background:#FF7A00; color:#16100D; border:1.5px solid #FF7A00; transform:scale(1.02)" : "background:rgba(255,243,228,0.07); color:#FFF3E4; border:1.5px solid rgba(255,243,228,0.16)");
    /* feature options are now explanatory mini-cards: icon + label + one-line
       plain-English description + price. Selected keeps the same meaning as the
       old pill (mango fill, ink text). */
    const FCARD = "cursor:pointer; font-family:'DM Sans',sans-serif; text-align:left; display:flex; flex-direction:column; gap:6px; padding:14px; border-radius:16px; transition:transform 200ms cubic-bezier(.16,.84,.28,1), background 180ms ease, border-color 180ms ease; ";
    const featCardStyle = (on: boolean) => FCARD + (on ? "background:#FF7A00; color:#16100D; border:1.5px solid #FF7A00" : "background:rgba(255,243,228,0.07); color:#FFF3E4; border:1.5px solid rgba(255,243,228,0.16)");
    const featIconStyle = (on: boolean) => "display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:12px; " + (on ? "background:rgba(22,16,13,0.14)" : "background:rgba(255,122,0,0.14)");
    const featDesc = (on: boolean) => "font-size:12.5px; line-height:1.4; " + (on ? "color:rgba(22,16,13,0.72)" : "color:rgba(255,243,228,0.55)");
    const featPrice = (on: boolean) => "margin-top:auto; padding-top:2px; font-size:13px; font-weight:700; " + (on ? "color:rgba(22,16,13,0.65)" : "color:rgba(255,243,228,0.5)");
    const BIG = "cursor:pointer; font-family:'DM Sans',sans-serif; text-align:left; display:flex; flex-direction:column; gap:10px; padding:26px; border-radius:24px; min-height:200px; transition:transform 220ms cubic-bezier(.16,.84,.28,1), border-color 200ms ease, background 200ms ease; ";
    const bigStyle = (on: boolean) => BIG + (on ? "background:rgba(255,122,0,0.14); border:2px solid #FF7A00; color:#FFF3E4" : "background:rgba(255,243,228,0.05); border:2px solid rgba(255,243,228,0.12); color:#FFF3E4");

    let nextLabel = "Continue →", canNext = true;
    if (cur === "services") { canNext = picked.length > 0; nextLabel = canNext ? "Continue →" : "Pick at least one"; }
    /* "who" is recommendation-only now — it never changes the price, so it's
       optional. No gate: the buyer can move on without answering. */
    if (cur === "brandcheck") { canNext = !!this.state.sel.brandStatus; nextLabel = canNext ? "Continue →" : "Pick one"; }
    if (cur === "speed") nextLabel = SHOW_PRICING ? "Show me the price →" : "See my brief →";
    if (cur === "bill") nextLabel = "Start over";

    const specData = svc ? SPEC[svc] : null;
    const curType = svc ? this.state.specType[svc] : undefined;
    const ivActive = isSpec && !!svc && this.interviewActive(svc);
    const iv = ivActive && svc ? this.state.interview[svc] : undefined;
    /* The whole builder keeps price out of sight until the final reveal — no
       running total, no per-option prices, on any path. We analyse at the end. */
    const hideEstimate = !isBill;
    if (ivActive) {
      // Interview owns the step: only continue once it has enough to price.
      if (!iv || !iv.done) { canNext = false; nextLabel = iv && iv.loading ? "One sec…" : "Answer to continue"; }
      else nextLabel = "Continue →";
    } else if (isSpec && specData && specData.types && !curType) { canNext = false; nextLabel = "Pick a type"; }
    const rec = svc ? this.recFor(svc) : [];
    const rawIndLabel = (IND.find((i) => i.key === this.state.sel.industry) || ({} as IndDef)).label;
    const industryLabel = (this.state.sel.industry === "other" && (this.state.sel.industryOther || "").trim())
      ? (this.state.sel.industryOther || "").trim()
      : rawIndLabel;
    /* Groups only render once a type is chosen (for services that ask one), and
       then only those the type allows. Services without types show every group. */
    const showGroups = !!specData && (!specData.types || !!curType);
    const visibleGroups = showGroups ? specData!.groups.filter((g) => !g.forTypes || (curType ? g.forTypes.indexOf(curType) >= 0 : true)) : [];
    const specGroups = visibleGroups.map((g) => ({
      title: g.title, help: g.help,
      chips: g.chips.map((c) => {
        const id = g.single ? svc + ":" + g.title : svc + ":" + c.key;
        const on = g.single ? this.state.spec[id] === c.key : !!this.state.spec[id];
        const isRec = rec.indexOf(c.key) >= 0;
        return {
          key: c.key, label: c.label, desc: c.desc, scene: sceneFor(c.key), on,
          // No per-option price during the flow — the price is analysed at the end.
          price: hideEstimate ? "" : (c.price ? "+" + this.money(c.price) + (c.mo ? "/mo" : "") : "included"),
          style: featCardStyle(on), iconStyle: featIconStyle(on), descStyle: featDesc(on), priceStyle: featPrice(on),
          recStyle: isRec && !on ? "font-size:11px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; padding:3px 8px; border-radius:999px; background:rgba(255,122,0,0.22); color:#FF9C5B" : "display:none",
          pick: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (g.single) { this.setSpecSingle(id, c.key); this.fly(e, "Added", true); return; }
            const wasOn = !!this.state.spec[id];
            this.setState((st) => { const s = { ...st.spec }; if (s[id]) delete s[id]; else s[id] = true; return { spec: s }; });
            this.fly(e, wasOn ? "Removed" : "Added", !wasOn);
          },
        };
      }),
    }));
    const specTypes = specData && specData.types ? specData.types.map((t) => ({
      key: t.key, label: t.label, note: t.note, on: curType === t.key,
      style: bigStyle(curType === t.key).replace("min-height:200px", "min-height:234px").replace("padding:26px", "padding:14px"),
      pick: () => svc && this.setSpecType(svc, t.key),
    })) : [];

    const n = svc ? this.nudge(svc) : null;
    const nOn = n ? this.on(n.key) : false;
    const nLabel = n ? SVC.find((x) => x.key === n.key)!.label : "";
    const fn = this.finalNudge();
    const customId = svc || "x";
    const bstat = this.state.sel.brandStatus;
    const brandOn = this.on("branding");
    /* Show the pitch when branding isn't a service yet (and the status warrants
       it) OR when it was just added from here — in an added, removable state. */
    const showBrandPitch = brandOn ? this.state.brandFromPitch : (bstat === "none" || bstat === "messy" || bstat === "logo");

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const DAY = "cursor:pointer; font-family:'DM Sans',sans-serif; display:flex; flex-direction:column; gap:2px; align-items:center; padding:12px 16px; border-radius:16px; min-width:64px; transition:transform 180ms ease; ";
    const TM = "cursor:pointer; font-family:'DM Sans',sans-serif; font-size:14.5px; font-weight:700; padding:13px 18px; border-radius:16px; transition:transform 180ms ease; ";
    const chatDays = [1, 2, 3, 4, 5].map((k) => {
      const dt = new Date(Date.now() + k * 86400000), key = "d" + k, on = this.state.chatDay === key;
      return { key, dow: dayNames[dt.getDay()], num: String(dt.getDate()), style: DAY + (on ? "background:#16100D; color:#FFF3E4; border:1.5px solid #16100D" : "background:#fff; color:#16100D; border:1.5px solid rgba(22,16,13,0.15)"), pick: () => this.setState({ chatDay: key }) };
    });
    const chatTimes = ["10:30 am", "12:00 pm", "3:00 pm", "5:30 pm", "7:00 pm"].map((t) => {
      const on = this.state.chatTime === t;
      return { key: t, label: t, style: TM + (on ? "background:#16100D; color:#FFF3E4; border:1.5px solid #16100D" : "background:#fff; color:#16100D; border:1.5px solid rgba(22,16,13,0.15)"), pick: () => this.setState({ chatTime: t }) };
    });
    const chatReady = !!(this.state.chatDay && this.state.chatTime && this.state.chatName.trim() && this.state.chatPhone.trim());
    const cd = chatDays.find((d) => d.key === this.state.chatDay);
    const scopeNames = SVC.filter((s) => this.on(s.key)).map((s) => s.label);

    const discountLines: { label: string; amount: string }[] = [];
    if (p.bundle) discountLines.push({ label: "Bundle discount · " + p.bundlePct + "%", amount: "− " + this.money(p.bundle) });
    if (p.rush) discountLines.push({ label: "Rush slot · priority hands", amount: "+ " + this.money(p.rush) });
    if (ph === "final") discountLines.push({ label: "First project with us · " + p.offerPct + "%", amount: "− " + this.money(p.offer) });

    const sendChat = () => {
      if (!chatReady) return;
      // v1 has no price, so leads carry the scope only — no estimate figure.
      const est = SHOW_PRICING ? this.money(p.final) + (p.mon > 0 ? " + " + this.money(p.mon) + "/mo" : "") : "";
      const scaleLabel = (SCALE.find((x) => x.key === this.state.sel.scale) || ({} as ScaleDef)).label || "—";
      const speedLabel = (SPEED.find((x) => x.key === this.state.sel.speed) || ({} as SpeedDef)).label || "—";
      const brandLabel = (BRAND_STATUS.find((b) => b.key === this.state.sel.brandStatus) || ({} as BrandStatusDef)).label || "—";
      const addonCount = Object.keys(this.state.spec).filter((k) => !!this.state.spec[k]).length;
      const scope = (scopeNames.length ? scopeNames.join(" + ") : "—") + " · " + scaleLabel + " · " + speedLabel + " · brand: " + brandLabel + " · " + addonCount + " add-ons";
      const dayLabel = cd ? cd.dow + " " + cd.num : "";
      const q = this.state.quote;
      const note = "Requested a 15-min call — " + dayLabel + " " + (this.state.chatTime || "") + " IST. Industry: " + (industryLabel || "—") + (q ? " · quoted " + this.money(q.total) + " (" + q.source + ")" : "");
      const body = { name: this.state.chatName, phone: this.state.chatPhone, services: scopeNames, est, scope, note, source: "pricing-builder", dealId: q?.dealId ?? undefined };
      (async () => {
        try { await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); } catch { /* best-effort */ }
        this.setState({ chatSent: true });
      })();
    };

    return {
      sectionStyle: "display:flex; flex-direction:column; gap:34px; animation:bibRise" + (this.state.step % 2 ? "A" : "B") + " 520ms cubic-bezier(.16,.84,.28,1) both",
      isServices: cur === "services", isWho: cur === "who", isSpec, isBrandCheck: cur === "brandcheck" && !isCalc, isSpeed: cur === "speed" && !isCalc, isCalc, isBill,
      calcLine: this.state.calcLine,

      pickWebsite: (e: React.MouseEvent<HTMLButtonElement>) => this.toggleSvc("website", e), pickApp: (e: React.MouseEvent<HTMLButtonElement>) => this.toggleSvc("app", e), pickBranding: (e: React.MouseEvent<HTMLButtonElement>) => this.toggleSvc("branding", e), pickMarketing: (e: React.MouseEvent<HTMLButtonElement>) => this.toggleSvc("marketing", e), pickVideo: (e: React.MouseEvent<HTMLButtonElement>) => this.toggleSvc("video", e),
      cardWebsite: cardStyle(this.on("website")), cardApp: cardStyle(this.on("app")), cardBranding: cardStyle(this.on("branding")), cardMarketing: cardStyle(this.on("marketing")), cardVideo: cardStyle(this.on("video")),
      tickWebsite: tickStyle(this.on("website")), tickApp: tickStyle(this.on("app")), tickBranding: tickStyle(this.on("branding")), tickMarketing: tickStyle(this.on("marketing")), tickVideo: tickStyle(this.on("video")),
      chipTone: "padding:6px 11px; border-radius:999px; background:rgba(255,243,228,0.1); font-size:11.5px; font-weight:700; color:rgba(255,243,228,0.75)",

      /* Service cards no longer advertise a "from ₹X" — the price is only ever
         shown at the end, after the build is scoped. */
      fromWebsite: "", fromApp: "", fromBranding: "", fromMarketing: "", fromVideo: "",

      kits: KITS.map((k) => {
        const on = k.services.every((s) => this.on(s)) && picked.length === k.services.length;
        return { key: k.key, label: k.label, note: k.note, save: k.save, icon: k.icon, iconStyle: "display:flex; align-items:center; justify-content:center; flex-shrink:0; width:34px; height:34px; border-radius:11px; " + (on ? "background:rgba(255,122,0,0.22); color:#FF7A00" : "background:rgba(255,243,228,0.08); color:#FF9C5B"), style: "cursor:pointer; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-radius:16px; text-align:left; transition:border-color 200ms ease, background 200ms ease; " + (on ? "background:rgba(255,122,0,0.16); border:1.5px solid #FF7A00; color:#FFF3E4" : "background:rgba(255,243,228,0.05); border:1.5px solid rgba(255,243,228,0.14); color:#FFF3E4"), pick: () => { const s: Record<string, boolean> = {}; k.services.forEach((x) => { s[x] = true; }); this.setState((st) => ({ sel: { ...st.sel, services: s }, specType: this.typesFor(s, st.specType) })); } };
      }),

      scales: SCALE.map((s) => ({ key: s.key, label: s.label, note: s.note, icon: s.icon, iconStyle: "display:flex; color:" + (this.state.sel.scale === s.key ? "#FF7A00" : "rgba(255,243,228,0.85)"), reaction: this.state.sel.scale === s.key ? s.reaction : "", style: bigStyle(this.state.sel.scale === s.key), pick: () => this.setSel("scale", s.key) })),
      industries: IND.map((i) => ({ key: i.key, label: i.label, style: chipStyle(this.state.sel.industry === i.key), pick: () => this.setSel("industry", i.key) })),
      showIndustryOther: this.state.sel.industry === "other",
      industryOther: this.state.sel.industryOther || "",
      onIndustryOther: (e: React.ChangeEvent<HTMLInputElement>) => this.setSel("industryOther", e.target.value),

      specKicker: specData ? specData.kicker : "", specTitle: specData ? specData.title : "", specHelp: specData ? specData.help : "",
      hasTypes: !!(specData && specData.types), typePrompt: specData && specData.typePrompt ? specData.typePrompt : "First — which kind?",
      specTypes,
      specGroups,
      recLabel: industryLabel ? "What " + industryLabel.toLowerCase() + " clients pick" : "Pick the usual set",
      applyRec: (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!svc) return;
        const t = this.recType(svc);
        const chips = this.recFor(svc);
        this.setState((st) => {
          const spec = { ...st.spec };
          Object.keys(spec).forEach((k) => { if (k.indexOf(svc + ":") === 0) delete spec[k]; });
          chips.forEach((k) => { spec[svc + ":" + k] = true; });
          if (svc === "video") spec["video:Volume"] = "v16";
          const specType = t ? { ...st.specType, [svc]: t } : st.specType;
          return { spec, specType };
        });
        this.fly(e, "recommended set", true);
      },
      clearSpec: () => { if (!svc) return; this.setState((st) => { const s = { ...st.spec }; Object.keys(s).forEach((k) => { if (k.indexOf(svc + ":") === 0) delete s[k]; }); return { spec: s }; }); },

      /* ── Adaptive-spec status (no box; driven by the WHO answer) ── */
      tailoring: isSpec && this.state.tailoring,
      tailorNote:
        !ivActive && isSpec && svc && !!this.state.sel.industry && this.state.tailoredSig[svc] === this.industrySig()
          ? "Set up for " + this.industryText() + " — tweak anything below."
          : "",

      /* ── AI interview (custom industry) ── */
      ivActive,
      ivLoading: !!iv?.loading,
      ivError: iv?.error || "",
      ivDone: !!iv?.done,
      ivClosing: iv?.closing || "",
      ivIndustry: this.industryText(),
      ivBaseLabel: iv?.base?.label || "",
      ivBaseAmount: iv?.base?.amount || 0,
      ivBaseAmountLabel: iv && iv.base ? this.money(iv.base.amount) : "",
      ivQuestion: iv?.node?.question || "",
      ivHelp: iv?.node?.help || "",
      ivCustomPrompt: iv?.node?.customPrompt || "Something else — tell us",
      ivAllowCustom: iv?.node?.allowCustom !== false,
      ivStep: iv ? iv.picks.length + 1 : 1,
      ivOptions: (iv?.node?.options || []).map((o) => ({
        key: o.key, label: o.label, hint: o.hint, amount: o.amount,
        amountLabel: o.amount > 0 ? "+" + this.money(o.amount) : "included",
        pick: () => svc && this.answerInterview(svc, { a: o.label, label: o.label, amount: o.amount }),
      })),
      ivPicks: (iv?.picks || []).map((p) => ({ q: p.q, a: p.a, amountLabel: p.amount > 0 ? "+" + this.money(p.amount) : "included" })),
      ivCanUndo: !!iv && !iv.loading && iv.picks.length > 0,
      ivUndo: () => svc && this.undoInterview(svc),
      ivSubmitCustom: (val: string) => { const t = val.trim(); if (t && svc) this.answerInterview(svc, { a: t, label: t, amount: 0 }); },
      ivRetry: () => { if (svc && iv) this.fetchNode(svc, iv.sig); },

      customPlaceholder: specData ? specData.custom : "",
      customs: (this.state.customs[customId] || []).map((t, i) => ({ text: t, remove: () => this.setState((st) => { const c = { ...st.customs }; c[customId] = c[customId].filter((_, j) => j !== i); return { customs: c }; }) })),
      draft: this.state.draft,
      onDraft: (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ draft: e.target.value }),
      onDraftKey: (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { e.preventDefault(); this.addCustomNow(customId); } },
      addCustom: () => this.addCustomNow(customId),

      hasNudge: !!n,
      nudgeOn: nOn,
      nudgeTitle: nOn ? "✓ " + nLabel + " added" : (n ? n.title : ""),
      nudgeBody: nOn ? "It's in your build and riding the bundle. Remove it any time — nothing's locked." : (n ? n.body : ""),
      nudgeCta: nOn ? "Remove" : (n ? n.cta : ""),
      toggleNudge: (e: React.MouseEvent<HTMLButtonElement>) => { if (n) this.toggleSvc(n.key, e); },

      showBrandCards: !brandOn,
      brandStatus: BRAND_STATUS.map((b) => {
        const on = bstat === b.key;
        return { key: b.key, label: b.label, note: b.note, icon: b.icon, iconStyle: "display:flex; color:" + (on ? "#FF7A00" : "rgba(255,243,228,0.85)"), price: hideEstimate ? "" : (b.price ? "+" + this.money(b.price) : "no change"), style: bigStyle(on).replace("min-height:200px", "min-height:150px"), priceStyle: "font-size:14px; font-weight:700; white-space:nowrap; color:" + (on ? "#FFB169" : "rgba(255,243,228,0.45)"), pick: () => this.setSel("brandStatus", b.key) };
      }),
      hasBrandPitch: showBrandPitch,
      brandPitchOn: brandOn,
      brandPitchTitle: brandOn ? "✓ Branding added" : (bstat === "none" ? "Then let's not invent one by accident." : "We can patch it — or fix it properly."),
      brandPitchBody: brandOn
        ? "Designed alongside the build by the same team, with 8% off the whole bill. Changed your mind? Remove it — you'll go back to the question above."
        : bstat === "none"
        ? "Without an identity, every colour and every headline gets decided on the fly, page by page. It works until you print something, run an ad, or hire someone. Doing the brand alongside the build costs less than redoing the build later — and bundling knocks 8% off the whole thing."
        : "A tidy-up gets you consistent. A proper identity gets you a system your team can use without asking us — and it costs less now, bundled, than as a separate project in six months.",
      brandPitchCta: brandOn ? "Remove" : "Add the brand — save 8%",
      toggleBrandPitch: (e: React.MouseEvent<HTMLButtonElement>) => this.toggleBrandPitch(e),

      speeds: SPEED.map((s) => ({ key: s.key, label: s.label, note: s.note, icon: s.icon, iconStyle: "display:flex; color:" + (this.state.sel.speed === s.key ? "#FF7A00" : "rgba(255,243,228,0.85)"), price: hideEstimate ? "" : s.price, style: bigStyle(this.state.sel.speed === s.key), pick: () => this.setSel("speed", s.key) })),

      /* ── the reveal ── */
      countText: this.money(this.state.count),
      bigNumStyle: "position:relative; display:inline-block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(52px,8vw,104px); line-height:0.86; letter-spacing:-0.055em; font-variant-numeric:tabular-nums; "
        + (ph === "swap" ? "animation:bibNumOut 300ms cubic-bezier(.5,0,.75,0) both" : ph === "final" ? "animation:bibNumIn 640ms cubic-bezier(.16,.84,.28,1) both" : "animation:bibSettle 460ms cubic-bezier(.16,.84,.28,1) both"),
      bigNumNote: ph === "final" ? "your fixed price · this exact number goes on the invoice" : "before the first-project offer",
      wasStyle: "font-size:18px; font-weight:700; color:rgba(22,16,13,0.45); text-decoration:line-through; font-variant-numeric:tabular-nums; transition:opacity 300ms ease; opacity:" + (ph === "final" ? "1" : "0"),
      wasText: this.money(p.one),
      teaseStyle: "font-size:16.5px; font-weight:700; color:#16100D; min-height:24px; transition:opacity 260ms ease; opacity:" + (ph === "tease" || ph === "swap" || ph === "final" ? "1" : "0"),
      teaseText: ph === "final" ? "First project with us — so " + p.offerPct + "% comes straight off. Nothing to enter, nothing to claim." : (ph === "tease" || ph === "swap") ? "Hold on — first project with us?" : " ",
      offerBadgeStyle: "padding:8px 16px; border-radius:999px; background:#16100D; color:#FFF3E4; font-size:13px; font-weight:800; transition:opacity 200ms ease; " + (ph === "final" ? "opacity:1; animation:bibPop 620ms cubic-bezier(.16,.84,.28,1) both" : "opacity:0"),
      offerPctLabel: p.offerPct + "%",
      burstStyle: "position:absolute; left:-40px; top:-40px; width:220px; height:220px; border-radius:999px; pointer-events:none; background:radial-gradient(circle, rgba(255,243,228,0.6) 0%, rgba(255,243,228,0) 70%); opacity:0; " + (ph === "final" ? "animation:bibBurst 900ms cubic-bezier(.16,.84,.28,1) both" : ""),
      sweepStyle: "position:absolute; top:0; bottom:0; left:0; width:55%; pointer-events:none; background:linear-gradient(100deg, rgba(255,243,228,0) 0%, rgba(255,243,228,0.35) 45%, rgba(255,255,255,0.55) 55%, rgba(255,243,228,0) 100%); opacity:0; " + (ph === "swap" || ph === "tease" ? "animation:bibSweep 1200ms cubic-bezier(.3,0,.2,1) both" : ""),

      monthlyTotal: this.money(p.mon), hasMonthly: SHOW_PRICING && p.mon > 0 && !hideEstimate,
      railTotal: !SHOW_PRICING ? "" : hideEstimate ? "—" : isBill ? this.money(ph === "final" ? p.final : p.one) : picked.length ? this.money(this.state.bar) : "—",
      hideEstimate,
      savingChipStyle: SHOW_PRICING && p.bundle && !isBill && !hideEstimate ? "padding:8px 14px; border-radius:999px; background:rgba(14,107,94,0.9); color:#FFF3E4; font-size:12.5px; font-weight:800; white-space:nowrap; animation:bibPop 420ms cubic-bezier(.16,.84,.28,1) both" : "display:none",
      savingText: !SHOW_PRICING || hideEstimate ? "" : this.money(p.bundle),
      billLabel: !SHOW_PRICING ? (picked.length ? "Your build" : "Nothing picked yet") : hideEstimate ? "We'll price it at the end" : isBill ? (ph === "final" ? "You pay · fixed" : "Your price") : picked.length ? "Running estimate" : "Nothing picked yet",
      billScope: scopeNames.length ? scopeNames.join(" + ") : "Tap a card to start",
      scopeLabel: scopeNames.length ? scopeNames.length + (scopeNames.length === 1 ? " service" : " services") : "—",
      timelineLabel: this.timelineLabel(),
      quoteLines: p.lines.map((l) => ({ label: l.label, detail: l.detail, amount: this.money(l.amount) + (l.mo ? " /mo" : ""), removable: !!l.svcKey, remove: l.svcKey ? () => this.removeSvcFromBill(l.svcKey as ServiceKey) : undefined })),
      discountLines,
      finalTotal: this.money(ph === "final" ? p.final : p.one),
      quoteMethod: isBill && this.state.quote
        ? (this.state.quote.source === "model"
            ? "Priced by our model from " + this.state.quote.neighbours + " similar past project" + (this.state.quote.neighbours === 1 ? "" : "s") + "."
            : this.state.quote.source === "blend"
              ? "AI estimate, tuned by " + this.state.quote.neighbours + " similar past project" + (this.state.quote.neighbours === 1 ? "" : "s") + "."
              : "Analysed from your answers.")
        : "",
      quoteRationale: isBill && this.state.quote ? this.state.quote.rationale : "",
      deliverables: SVC.filter((s) => this.on(s.key)).map((s) => ({ text: s.own })).concat([{ text: "Every login, file, repo and password in your name from day one" }, { text: "A written fixed-price contract before a single rupee moves" }]),
      advanceAmount: this.money(((ph === "final" ? p.final : p.one) * advPct) / 100),
      balanceAmount: this.money((ph === "final" ? p.final : p.one) * (1 - advPct / 100)),
      advancePctLabel: advPct + "%",

      hasFinalNudge: !!fn, finalNudgeTitle: fn ? fn.title : "", finalNudgeBody: fn ? fn.body : "", finalNudgeCta: fn ? fn.cta : "",
      acceptFinalNudge: () => {
        if (!fn) return;
        if ((fn.key as string) === "all") this.setState((st) => { const s = { website: true, branding: true, marketing: true, video: true, app: st.sel.services.app }; return { sel: { ...st.sel, services: s }, specType: this.typesFor(s, st.specType), dismissed: { ...st.dismissed, final: true }, step: 0, phase: "idle" }; });
        else { this.toggleSvc(fn.key); this.setState((st) => ({ dismissed: { ...st.dismissed, final: true }, step: 0, phase: "idle" })); }
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      },
      restart: () => { this.setState({ step: 0, calcing: false, count: 0, phase: "idle" }); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); },
      approve: () => this.setState({ chatOpen: true, chatSent: false }),

      browseOpen: this.state.browseOpen,
      openBrowse: () => this.setState({ browseOpen: true }),
      closeBrowse: () => this.setState({ browseOpen: false }),
      examples: EXAMPLES.map((e) => ({ key: e.key, label: e.label, note: e.note, price: e.price, days: e.days, pick: () => this.loadExample(e) })),

      backStyle: "cursor:pointer; width:46px; height:46px; border-radius:999px; font-size:17px; border:1.5px solid rgba(255,243,228,0.22); background:transparent; color:#FFF3E4; transition:background 200ms ease; visibility:" + (this.state.step > 0 && !isCalc ? "visible" : "hidden"),
      back: () => this.go(this.state.step - 1),
      next: () => { if (isBill) { this.setState({ step: 0, count: 0, phase: "idle" }); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); } else if (canNext) this.go(this.state.step + 1); },
      nextLabel,
      nextStyle: "font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; padding:15px 26px; border-radius:999px; border:0; transition:transform 200ms ease, background 200ms ease; " + (canNext ? "background:#FF7A00; color:#16100D; cursor:pointer" : "background:rgba(255,243,228,0.1); color:rgba(255,243,228,0.35); cursor:not-allowed"),

      chatOpen: this.state.chatOpen, chatSent: this.state.chatSent, chatForm: !this.state.chatSent,
      chatDays, chatTimes, chatName: this.state.chatName, chatPhone: this.state.chatPhone,
      onChatName: (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ chatName: e.target.value }),
      onChatPhone: (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ chatPhone: e.target.value }),
      openChat: () => this.setState({ chatOpen: true, chatSent: false }),
      closeChat: () => this.setState({ chatOpen: false }),
      sendChat,
      chatSubmitLabel: chatReady ? "Request this slot" : "Pick a day, a time, leave a number",
      chatSubmitStyle: "font-family:'DM Sans',sans-serif; border:0; padding:18px 28px; border-radius:999px; font-size:16px; font-weight:700; " + (chatReady ? "background:#FF7A00; color:#16100D; cursor:pointer" : "background:#F1E4D4; color:#A8907F; cursor:not-allowed"),
      chatConfirmLine: cd && this.state.chatTime ? "You asked for " + cd.dow + " " + cd.num + " at " + this.state.chatTime + " IST." : "",
    };
  }

  render() {
    const v = this.renderVals();
    return (
      <div style={css("font-family:'DM Sans', system-ui, sans-serif; background:#16100D; color:#FFF3E4; min-height:100vh; overflow-x:clip")}>

        <span ref={this.fxRef} aria-hidden="true" style={css("position:fixed; inset:0; overflow:hidden; pointer-events:none; z-index:70")}></span>

        <main id="top" style={css("max-width:1180px; margin:0 auto; padding:132px 24px 210px; min-height:70vh")}>

          {/* ══ 01 · SERVICES ══ */}
          {v.isServices && (
            <section style={css(v.sectionStyle)}>
              <div style={css("display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:24px")}>
                <div style={css("display:flex; flex-direction:column; gap:14px; max-width:22ch")}>
                  <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:15px; letter-spacing:0.06em; color:#FF7A00")}>01 · THE BRIEF</span>
                  <h1 style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(42px,6vw,78px); line-height:0.9; letter-spacing:-0.045em; margin:0; text-wrap:balance")}>What are we building?</h1>
                  <p style={css("margin:0; font-size:17px; line-height:1.5; color:rgba(255,243,228,0.6); max-width:36ch")}>Tap what you want. No email, no call, no &quot;let&apos;s hop on a quick chat&quot; — just a real number at the end, the kind you can actually plan around.</p>
                </div>
                <div style={css("display:flex; flex-direction:column; gap:10px; align-items:flex-start")}>
                  <span style={css("font-size:12px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:rgba(255,243,228,0.4)")}>Rather not answer anything?</span>
                  <div style={css("display:flex; flex-wrap:wrap; gap:9px")}>
                    <a href="#top" style={css("font-size:13.5px; font-weight:700; padding:11px 18px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.25); color:#FFF3E4")}>Just enquire →</a>
                    <button type="button" onClick={v.openChat} style={css("cursor:pointer; font-size:13.5px; font-weight:700; padding:11px 18px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.25); background:transparent; color:#FFF3E4")}>Book 15 min</button>
                  </div>
                </div>
              </div>

              <div className="pb-col" style={css("display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:16px")}>

                <button type="button" onClick={v.pickWebsite} style={css(v.cardWebsite)} {...hoverFrom("transform:translateY(-4px)")}>
                  <span style={css("display:flex; align-items:center; justify-content:space-between; gap:12px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:14px; letter-spacing:0.06em; color:#FF7A00")}>01</span>
                    <span style={css(v.tickWebsite)}>✓</span>
                  </span>
                  <span style={css("display:block; height:132px; border-radius:14px; background:#0B0806; padding:12px; box-sizing:border-box; overflow:hidden; border:1px solid rgba(255,243,228,0.08)")}>
                    <span style={css("display:flex; align-items:center; gap:6px; padding-bottom:10px")}>
                      <span style={css("width:7px; height:7px; border-radius:999px; background:#E23E2C")}></span>
                      <span style={css("width:7px; height:7px; border-radius:999px; background:#FF7A00")}></span>
                      <span style={css("width:7px; height:7px; border-radius:999px; background:rgba(255,243,228,0.3)")}></span>
                      <span style={css("margin-left:8px; flex:1; padding:4px 10px; border-radius:999px; background:rgba(255,243,228,0.08); font-size:10px; color:rgba(255,243,228,0.5)")}>yourbusiness.com</span>
                    </span>
                    <span style={css("display:block; background:#FFF3E4; border-radius:9px; padding:11px; box-sizing:border-box; height:82px; overflow:hidden")}>
                      <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:17px; line-height:0.95; letter-spacing:-0.04em; color:#16100D")}>Be the one they find.</span>
                      <span style={css("display:inline-block; margin-top:8px; padding:5px 12px; border-radius:999px; background:#FF7A00; color:#16100D; font-size:10px; font-weight:700")}>Book now</span>
                      <span style={css("display:flex; gap:5px; margin-top:9px")}><span style={css("flex:1; height:14px; border-radius:4px; background:#FFE0C2")}></span><span style={css("flex:1; height:14px; border-radius:4px; background:#FFE0C2")}></span><span style={css("flex:1; height:14px; border-radius:4px; background:#FFE0C2")}></span></span>
                    </span>
                  </span>
                  <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:26px; line-height:0.96; letter-spacing:-0.04em")}>Website</span>
                  <span style={css("display:flex; flex-wrap:wrap; gap:6px")}>
                    <span style={css(v.chipTone)}>Design</span><span style={css(v.chipTone)}>Copywriting</span><span style={css(v.chipTone)}>Build &amp; hosting</span><span style={css(v.chipTone)}>SEO groundwork</span>
                  </span>
                  <span style={css("display:block; margin-top:auto; font-size:13.5px; font-weight:700; color:rgba(255,243,228,0.55)")}>{v.fromWebsite}</span>
                </button>

                <button type="button" onClick={v.pickApp} style={css(v.cardApp)} {...hoverFrom("transform:translateY(-4px)")}>
                  <span style={css("display:flex; align-items:center; justify-content:space-between; gap:12px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:14px; letter-spacing:0.06em; color:#FF7A00")}>02</span>
                    <span style={css(v.tickApp)}>✓</span>
                  </span>
                  <span style={css("display:flex; height:132px; border-radius:14px; background:#0B0806; padding:12px; box-sizing:border-box; overflow:hidden; gap:10px; justify-content:center; border:1px solid rgba(255,243,228,0.08)")}>
                    <span style={css("display:flex; flex-direction:column; width:82px; height:100px; border-radius:16px; background:#0E6B5E; padding:10px; box-sizing:border-box")}>
                      <span style={css("font-size:8px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:rgba(255,243,228,0.65)")}>Today</span>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:13px; line-height:0.96; letter-spacing:-0.04em; color:#FFF3E4; margin:auto 0")}>14 orders while you slept.</span>
                      <span style={css("padding:5px; border-radius:999px; background:#FF7A00; color:#16100D; font-weight:700; font-size:9px; text-align:center")}>Open shop</span>
                    </span>
                    <span style={css("display:flex; flex-direction:column; gap:5px; width:82px; height:100px; border-radius:16px; background:#FFF3E4; padding:10px; box-sizing:border-box; transform:translateY(8px)")}>
                      <span style={css("height:14px; border-radius:5px; background:#FFE0C2")}></span>
                      <span style={css("height:14px; border-radius:5px; background:#FF7A00")}></span>
                      <span style={css("height:14px; border-radius:5px; background:#FFE0C2")}></span>
                      <span style={css("margin-top:auto; font-size:8.5px; font-weight:700; color:#6B4A3A")}>Both stores</span>
                    </span>
                  </span>
                  <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:26px; line-height:0.96; letter-spacing:-0.04em")}>Mobile app</span>
                  <span style={css("display:flex; flex-wrap:wrap; gap:6px")}>
                    <span style={css(v.chipTone)}>iOS &amp; Android</span><span style={css(v.chipTone)}>Backend</span><span style={css(v.chipTone)}>Payments</span><span style={css(v.chipTone)}>Store launch</span>
                  </span>
                  <span style={css("display:block; margin-top:auto; font-size:13.5px; font-weight:700; color:rgba(255,243,228,0.55)")}>{v.fromApp}</span>
                </button>

                <button type="button" onClick={v.pickBranding} style={css(v.cardBranding)} {...hoverFrom("transform:translateY(-4px)")}>
                  <span style={css("display:flex; align-items:center; justify-content:space-between; gap:12px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:14px; letter-spacing:0.06em; color:#FF7A00")}>03</span>
                    <span style={css(v.tickBranding)}>✓</span>
                  </span>
                  <span style={css("display:flex; flex-direction:column; gap:8px; height:132px; border-radius:14px; background:#FFF3E4; padding:12px; box-sizing:border-box; overflow:hidden")}>
                    <span style={css("flex:1; border-radius:10px; background:#16100D; display:flex; align-items:center; justify-content:center")}>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:24px; letter-spacing:-0.045em; color:#FFF3E4; animation:bibBreathe 2800ms ease-in-out infinite")}>brandit<span style={css("color:#FF7A00")}>bro</span><span style={css("color:#E23E2C")}>.</span></span>
                    </span>
                    <span style={css("display:flex; gap:5px")}>
                      <span style={css("flex:1; height:24px; border-radius:6px; background:#16100D")}></span>
                      <span style={css("flex:1; height:24px; border-radius:6px; background:#FF7A00")}></span>
                      <span style={css("flex:1; height:24px; border-radius:6px; background:#E23E2C")}></span>
                      <span style={css("flex:1; height:24px; border-radius:6px; background:#FFE0C2")}></span>
                      <span style={css("flex:1; height:24px; border-radius:6px; background:#0E6B5E")}></span>
                    </span>
                  </span>
                  <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:26px; line-height:0.96; letter-spacing:-0.04em")}>Branding</span>
                  <span style={css("display:flex; flex-wrap:wrap; gap:6px")}>
                    <span style={css(v.chipTone)}>Logo &amp; identity</span><span style={css(v.chipTone)}>Palette &amp; type</span><span style={css(v.chipTone)}>Social kit</span><span style={css(v.chipTone)}>Rulebook</span>
                  </span>
                  <span style={css("display:block; margin-top:auto; font-size:13.5px; font-weight:700; color:rgba(255,243,228,0.55)")}>{v.fromBranding}</span>
                </button>

                <button type="button" onClick={v.pickMarketing} style={css(v.cardMarketing)} {...hoverFrom("transform:translateY(-4px)")}>
                  <span style={css("display:flex; align-items:center; justify-content:space-between; gap:12px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:14px; letter-spacing:0.06em; color:#FF7A00")}>04</span>
                    <span style={css(v.tickMarketing)}>✓</span>
                  </span>
                  <span style={css("display:flex; flex-direction:column; gap:8px; height:132px; border-radius:14px; background:#0B0806; padding:14px; box-sizing:border-box; overflow:hidden; border:1px solid rgba(255,243,228,0.08)")}>
                    <span style={css("display:flex; align-items:flex-end; gap:7px; flex:1")}>
                      <span style={css("flex:1; height:24%; border-radius:5px 5px 2px 2px; background:rgba(255,243,228,0.15)")}></span>
                      <span style={css("flex:1; height:38%; border-radius:5px 5px 2px 2px; background:rgba(255,243,228,0.15)")}></span>
                      <span style={css("flex:1; height:52%; border-radius:5px 5px 2px 2px; background:#E23E2C")}></span>
                      <span style={css("flex:1; height:70%; border-radius:5px 5px 2px 2px; background:#FF7A00")}></span>
                      <span style={css("flex:1; height:88%; border-radius:5px 5px 2px 2px; background:#FF7A00")}></span>
                      <span style={css("flex:1; height:100%; border-radius:5px 5px 2px 2px; background:#FFF3E4")}></span>
                    </span>
                    <span style={css("display:flex; justify-content:space-between; font-size:9.5px; font-weight:700; color:rgba(255,243,228,0.45)")}><span>Week 1</span><span>Week 6</span></span>
                  </span>
                  <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:26px; line-height:0.96; letter-spacing:-0.04em")}>Marketing</span>
                  <span style={css("display:flex; flex-wrap:wrap; gap:6px")}>
                    <span style={css(v.chipTone)}>Meta &amp; Google</span><span style={css(v.chipTone)}>Local SEO</span><span style={css(v.chipTone)}>Landing pages</span><span style={css(v.chipTone)}>WhatsApp funnels</span>
                  </span>
                  <span style={css("display:block; margin-top:auto; font-size:13.5px; font-weight:700; color:rgba(255,243,228,0.55)")}>{v.fromMarketing}</span>
                </button>

                <button type="button" onClick={v.pickVideo} style={css(v.cardVideo)} {...hoverFrom("transform:translateY(-4px)")}>
                  <span style={css("display:flex; align-items:center; justify-content:space-between; gap:12px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:14px; letter-spacing:0.06em; color:#FF7A00")}>05</span>
                    <span style={css(v.tickVideo)}>✓</span>
                  </span>
                  <span style={css("display:flex; height:132px; border-radius:14px; background:#0E6B5E; padding:12px; box-sizing:border-box; overflow:hidden; gap:9px; justify-content:center")}>
                    <span style={css("display:flex; flex-direction:column; width:74px; height:100px; border-radius:12px; background:#16100D; padding:10px; box-sizing:border-box")}>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:12.5px; line-height:0.96; letter-spacing:-0.04em; color:#FFF3E4; margin-top:auto")}>POV: your feed finally looks alive</span>
                      <span style={css("font-size:9px; font-weight:700; color:#FF9C5B; margin-top:6px")}>0:14</span>
                    </span>
                    <span style={css("display:flex; flex-direction:column; width:74px; height:100px; border-radius:12px; background:#FFE0C2; padding:10px; box-sizing:border-box; transform:translateY(8px)")}>
                      <span style={css("font-size:8px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:#B4643C")}>Reel 12</span>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:12.5px; line-height:0.96; letter-spacing:-0.04em; color:#16100D; margin-top:auto")}>Captioned, cut, posted.</span>
                    </span>
                  </span>
                  <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:26px; line-height:0.96; letter-spacing:-0.04em")}>Video</span>
                  <span style={css("display:flex; flex-wrap:wrap; gap:6px")}>
                    <span style={css(v.chipTone)}>Reels &amp; shorts</span><span style={css(v.chipTone)}>Editing</span><span style={css(v.chipTone)}>Thumbnails</span><span style={css(v.chipTone)}>Scheduling</span>
                  </span>
                  <span style={css("display:block; margin-top:auto; font-size:13.5px; font-weight:700; color:rgba(255,243,228,0.55)")}>{v.fromVideo}</span>
                </button>

                <div style={css("display:flex; flex-direction:column; gap:12px; border-radius:22px; border:1.5px dashed rgba(255,243,228,0.22); padding:20px")}>
                  <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:22px; line-height:0.98; letter-spacing:-0.04em")}>Or take a kit.</span>
                  <span style={css("font-size:13.5px; line-height:1.45; color:rgba(255,243,228,0.55)")}>The combinations we ship most. Same work, one bill, bigger discount.</span>
                  {v.kits.map((k) => (
                    <button type="button" key={k.key} onClick={k.pick} style={css(k.style)}>
                      <span style={css("display:flex; align-items:center; gap:12px; text-align:left")}>
                        <span style={css(k.iconStyle)}><Icon name={k.icon} size={20} /></span>
                        <span style={css("display:flex; flex-direction:column; gap:3px")}>
                          <span style={css("font-size:15px; font-weight:700; line-height:1.2")}>{k.label}</span>
                          <span style={css("font-size:12.5px; line-height:1.35; color:rgba(255,243,228,0.5)")}>{k.note}</span>
                        </span>
                      </span>
                      <span style={css("font-size:12.5px; font-weight:800; color:#FF7A00; white-space:nowrap")}>{k.save}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ══ 02 · WHO ══ */}
          {v.isWho && (
            <section style={css(v.sectionStyle)}>
              <div style={css("display:flex; flex-direction:column; gap:14px; max-width:24ch")}>
                <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:15px; letter-spacing:0.06em; color:#FF7A00")}>02 · WHO IT&apos;S FOR</span>
                <h1 style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(42px,6vw,78px); line-height:0.9; letter-spacing:-0.045em; margin:0; text-wrap:balance")}>Who&apos;s this for?</h1>
                <p style={css("margin:0; font-size:17px; line-height:1.5; color:rgba(255,243,228,0.6); max-width:40ch")}>This only shapes what we suggest next — it doesn&apos;t change your price.</p>
              </div>
              <div className="pb-col" style={css("display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:16px")}>
                {v.scales.map((s) => (
                  <button type="button" key={s.key} onClick={s.pick} style={css(s.style)} {...hoverFrom("transform:translateY(-4px)")}>
                    <span style={css(s.iconStyle)}><Icon name={s.icon} size={24} /></span>
                    <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(26px,2.6vw,34px); line-height:0.96; letter-spacing:-0.04em")}>{s.label}</span>
                    <span style={css("display:block; font-size:15px; line-height:1.45; color:rgba(255,243,228,0.55)")}>{s.note}</span>
                    <span style={css("display:block; margin-top:auto; font-size:13.5px; line-height:1.4; font-weight:700; color:#FF9C5B")}>{s.reaction}</span>
                  </button>
                ))}
              </div>
              <div style={css("display:flex; flex-direction:column; gap:14px; border-top:1px solid rgba(255,243,228,0.12); padding-top:28px")}>
                <div style={css("display:flex; flex-wrap:wrap; align-items:baseline; gap:12px")}>
                  <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:26px; letter-spacing:-0.04em")}>And you&apos;re in…</span>
                  <span style={css("font-size:14px; color:rgba(255,243,228,0.45)")}>Pick the closest — it just tailors the questions.</span>
                </div>
                <div style={css("display:flex; flex-wrap:wrap; gap:9px")}>
                  {v.industries.map((i) => (
                    <button type="button" key={i.key} onClick={i.pick} style={css(i.style)}>{i.label}</button>
                  ))}
                </div>
                {v.showIndustryOther && (
                  <div style={css("display:flex; gap:10px; max-width:620px")}>
                    <input type="text" placeholder="Type your industry" value={v.industryOther} onChange={v.onIndustryOther} style={css("flex:1; font-size:15px; padding:15px 20px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.2); background:rgba(255,243,228,0.06); color:#FFF3E4; outline:none")} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ══ 03 · SPEC ══ */}
          {v.isSpec && (
            <section style={css(v.sectionStyle)}>
              <div style={css("display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:24px")}>
                <div style={css("display:flex; flex-direction:column; gap:14px; max-width:26ch")}>
                  <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:15px; letter-spacing:0.06em; color:#FF7A00")}>{v.specKicker}</span>
                  <h1 style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(38px,5.2vw,66px); line-height:0.92; letter-spacing:-0.045em; margin:0; text-wrap:balance")}>{v.ivActive ? "Let's scope it." : v.specTitle}</h1>
                  <p style={css("margin:0; font-size:17px; line-height:1.5; color:rgba(255,243,228,0.6); max-width:40ch")}>{v.ivActive ? "A few quick questions — only what actually changes the price. We're building for " + v.ivIndustry + "." : v.specHelp}</p>
                  {!v.ivActive && v.tailoring && (
                    <span style={css("display:inline-flex; align-items:center; gap:9px; font-size:14px; font-weight:700; color:#FF9C5B")}>
                      <span aria-hidden="true" style={css("display:inline-block; width:14px; height:14px; border-radius:999px; border:2px solid rgba(255,156,91,0.35); border-top-color:#FF9C5B; animation:bibSpin 900ms linear infinite")}></span>
                      Reading your answer…
                    </span>
                  )}
                  {!v.ivActive && !v.tailoring && !!v.tailorNote && (
                    <span style={css("display:inline-flex; align-items:center; gap:7px; font-size:14px; font-weight:700; line-height:1.4; color:#FF9C5B")}>✨ {v.tailorNote}</span>
                  )}
                </div>
                {!v.ivActive && (
                <div style={css("display:flex; flex-direction:column; gap:9px; align-items:flex-start")}>
                  <span style={css("font-size:12px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:rgba(255,243,228,0.4)")}>Not sure what you need?</span>
                  <div style={css("display:flex; flex-wrap:wrap; gap:9px")}>
                    <button type="button" onClick={v.applyRec} style={css("cursor:pointer; font-size:14px; font-weight:700; padding:13px 20px; border-radius:999px; border:1.5px solid #FF7A00; background:rgba(255,122,0,0.16); color:#FFF3E4")} {...hoverFrom("background:#FF7A00; color:#16100D")}>✨ {v.recLabel}</button>
                    <button type="button" onClick={v.clearSpec} style={css("cursor:pointer; font-size:14px; font-weight:700; padding:13px 18px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.22); background:transparent; color:rgba(255,243,228,0.75)")}>Keep it basic</button>
                  </div>
                </div>
                )}
              </div>

              {v.ivActive && <InterviewPanel v={v} />}

              {!v.ivActive && v.hasTypes && (
                <div style={css("display:flex; flex-direction:column; gap:13px; border-top:1px solid rgba(255,243,228,0.12); padding-top:22px")}>
                  <div style={css("display:flex; flex-wrap:wrap; align-items:baseline; gap:12px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:24px; letter-spacing:-0.04em")}>{v.typePrompt}</span>
                    <span style={css("font-size:14px; color:rgba(255,243,228,0.45)")}>Pick one — it sets the questions below.</span>
                  </div>
                  <div className="pb-col" style={css("display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px")}>
                    {v.specTypes.map((t) => (
                      <button type="button" key={t.key} onClick={t.pick} style={css(t.style)} {...hoverFrom("transform:translateY(-4px)")}>
                        <TypeMock k={t.key} />
                        <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(22px,2.2vw,28px); line-height:0.98; letter-spacing:-0.04em; margin-top:2px")}>{t.label}</span>
                        <span style={css("display:block; font-size:14.5px; line-height:1.4; color:rgba(255,243,228,0.55)")}>{t.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!v.ivActive && v.specGroups.map((g) => (
                <div key={g.title} style={css("display:flex; flex-direction:column; gap:13px; border-top:1px solid rgba(255,243,228,0.12); padding-top:22px")}>
                  <div style={css("display:flex; flex-wrap:wrap; align-items:baseline; gap:12px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:24px; letter-spacing:-0.04em")}>{g.title}</span>
                    <span style={css("font-size:14px; color:rgba(255,243,228,0.45)")}>{g.help}</span>
                  </div>
                  <div className="pb-col" style={css("display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px")}>
                    {g.chips.map((c) => (
                      <button type="button" key={c.key} onClick={c.pick} style={css(c.style)} {...hoverFrom("transform:translateY(-3px)")}>
                        <span style={css("display:flex; align-items:center; justify-content:space-between; gap:10px")}>
                          <span style={css(c.iconStyle)}><Scene name={c.scene} on={c.on} /></span>
                          <span style={css(c.recStyle)}>picked most</span>
                        </span>
                        <span style={css("font-size:15px; font-weight:700; line-height:1.25")}>{c.label}</span>
                        <span style={css(c.descStyle)}>{c.desc}</span>
                        <span style={css(c.priceStyle)}>{c.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!v.ivActive && (
              <div style={css("display:flex; flex-direction:column; gap:12px; border-top:1px solid rgba(255,243,228,0.12); padding-top:22px")}>
                <div style={css("display:flex; flex-wrap:wrap; align-items:baseline; gap:12px")}>
                  <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:24px; letter-spacing:-0.04em")}>Something we haven&apos;t listed?</span>
                  <span style={css("font-size:14px; color:rgba(255,243,228,0.45)")}>Type it in your own words. It stays a separate line and gets priced in your brief — never slipped into the total quietly.</span>
                </div>
                {v.customs.map((c, ci) => (
                  <div key={ci} style={css("display:flex; align-items:center; gap:12px; padding:13px 18px; border-radius:999px; background:rgba(255,122,0,0.12); border:1.5px dashed rgba(255,122,0,0.5); align-self:flex-start; animation:bibPop 420ms cubic-bezier(.16,.84,.28,1) both")}>
                    <span style={css("font-size:15px; color:#FFF3E4")}>{c.text}</span>
                    <span style={css("font-size:12px; font-weight:700; color:#FF9C5B")}>priced in your brief</span>
                    <button type="button" onClick={c.remove} aria-label="Remove" style={css("cursor:pointer; background:transparent; border:0; font-size:18px; line-height:1; color:rgba(255,243,228,0.5); padding:0 2px")}>×</button>
                  </div>
                ))}
                <div style={css("display:flex; gap:10px; max-width:620px")}>
                  <input type="text" placeholder={v.customPlaceholder} value={v.draft} onChange={v.onDraft} onKeyDown={v.onDraftKey} style={css("flex:1; font-size:15px; padding:15px 20px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.2); background:rgba(255,243,228,0.06); color:#FFF3E4; outline:none")} />
                  <button type="button" onClick={v.addCustom} style={css("cursor:pointer; font-size:14.5px; font-weight:700; padding:15px 24px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.25); background:transparent; color:#FFF3E4")}>Add it</button>
                </div>
              </div>
              )}

              {!v.ivActive && v.hasNudge && (
                <div style={css("background:#FF7A00; color:#16100D; border-radius:26px; padding:28px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:20px; animation:bibSlideIn 460ms cubic-bezier(.16,.84,.28,1) both")}>
                  <span style={css("display:flex; flex-direction:column; gap:8px; max-width:46ch")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(24px,2.6vw,32px); line-height:0.98; letter-spacing:-0.04em")}>{v.nudgeTitle}</span>
                    <span style={css("font-size:15.5px; line-height:1.5; color:rgba(22,16,13,0.75)")}>{v.nudgeBody}</span>
                  </span>
                  <span style={css("display:flex; gap:10px; align-items:center")}>
                    <button type="button" onClick={v.toggleNudge} style={css("cursor:pointer; font-size:15px; font-weight:700; padding:15px 24px; border-radius:999px; border:0; " + (v.nudgeOn ? "background:rgba(22,16,13,0.12); color:#16100D" : "background:#16100D; color:#FFF3E4"))}>{v.nudgeCta}</button>
                  </span>
                </div>
              )}
            </section>
          )}

          {/* ══ 04 · BRAND CHECK ══ */}
          {v.isBrandCheck && (
            <section style={css(v.sectionStyle)}>
              <div style={css("display:flex; flex-direction:column; gap:14px; max-width:26ch")}>
                <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:15px; letter-spacing:0.06em; color:#FF7A00")}>04 · THE BRAND</span>
                <h1 style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(42px,6vw,78px); line-height:0.9; letter-spacing:-0.045em; margin:0; text-wrap:balance")}>What are we designing on top of?</h1>
                <p style={css("margin:0; font-size:17px; line-height:1.5; color:rgba(255,243,228,0.6); max-width:42ch")}>If there&apos;s a proper identity already, we use it and charge nothing extra. If there isn&apos;t, we have to invent one as we go — and that&apos;s the bit that goes wrong eight months later.</p>
              </div>
              {v.showBrandCards && (
                <div className="pb-col" style={css("display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:14px")}>
                  {v.brandStatus.map((b) => (
                    <button type="button" key={b.key} onClick={b.pick} style={css(b.style)} {...hoverFrom("transform:translateY(-3px)")}>
                      <span style={css("display:flex; align-items:center; justify-content:space-between; gap:14px")}>
                        <span style={css(b.iconStyle)}><Icon name={b.icon} size={24} /></span>
                        <span style={css(b.priceStyle)}>{b.price}</span>
                      </span>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:23px; letter-spacing:-0.035em; line-height:1.05")}>{b.label}</span>
                      <span style={css("display:block; font-size:14.5px; line-height:1.45; color:rgba(255,243,228,0.55)")}>{b.note}</span>
                    </button>
                  ))}
                </div>
              )}
              {v.hasBrandPitch && (
                <div style={css("background:#FF7A00; color:#16100D; border-radius:26px; padding:28px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:20px; animation:bibSlideIn 460ms cubic-bezier(.16,.84,.28,1) both")}>
                  <span style={css("display:flex; flex-direction:column; gap:8px; max-width:48ch")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(24px,2.6vw,32px); line-height:0.98; letter-spacing:-0.04em")}>{v.brandPitchTitle}</span>
                    <span style={css("font-size:15.5px; line-height:1.5; color:rgba(22,16,13,0.75)")}>{v.brandPitchBody}</span>
                  </span>
                  <button type="button" onClick={v.toggleBrandPitch} style={css("cursor:pointer; font-size:15px; font-weight:700; padding:16px 26px; border-radius:999px; border:0; " + (v.brandPitchOn ? "background:rgba(22,16,13,0.12); color:#16100D" : "background:#16100D; color:#FFF3E4"))}>{v.brandPitchCta}</button>
                </div>
              )}
            </section>
          )}

          {/* ══ 05 · SPEED ══ */}
          {v.isSpeed && (
            <section style={css(v.sectionStyle)}>
              <div style={css("display:flex; flex-direction:column; gap:14px; max-width:24ch")}>
                <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:15px; letter-spacing:0.06em; color:#FF7A00")}>05 · THE DATE</span>
                <h1 style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(42px,6vw,78px); line-height:0.9; letter-spacing:-0.045em; margin:0; text-wrap:balance")}>When do you need it live?</h1>
                <p style={css("margin:0; font-size:17px; line-height:1.5; color:rgba(255,243,228,0.6); max-width:38ch")}>Standard is our real pace, not a padded one. Two of these cost exactly the same — we&apos;re only charging more when it actually costs us more.</p>
              </div>
              <div className="pb-col" style={css("display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:16px")}>
                {v.speeds.map((s) => (
                  <button type="button" key={s.key} onClick={s.pick} style={css(s.style)} {...hoverFrom("transform:translateY(-4px)")}>
                    <span style={css(s.iconStyle)}><Icon name={s.icon} size={24} /></span>
                    <span style={css("display:block; font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(26px,2.6vw,34px); line-height:0.96; letter-spacing:-0.04em")}>{s.label}</span>
                    <span style={css("display:block; font-size:15px; line-height:1.45; color:rgba(255,243,228,0.55)")}>{s.note}</span>
                    <span style={css("display:block; margin-top:auto; font-size:13.5px; font-weight:700; color:#FF9C5B")}>{s.price}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ══ CALC ══ */}
          {v.isCalc && (
            <section style={css("min-height:52vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:30px; text-align:center")}>
              <div style={css("position:relative; width:110px; height:110px; display:flex; align-items:center; justify-content:center")}>
                <span style={css("position:absolute; inset:0; border-radius:999px; border:2px solid #FF7A00; animation:bibRing 1800ms ease-out infinite")}></span>
                <span style={css("position:absolute; inset:0; border-radius:999px; border:3px solid rgba(255,243,228,0.12); border-top-color:#FF7A00; animation:bibSpin 900ms linear infinite")}></span>
                <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:36px; letter-spacing:-0.05em; animation:bibBreathe 1800ms ease-in-out infinite")}>b<span style={css("color:#FF7A00")}>.</span></span>
              </div>
              <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(30px,4vw,48px); letter-spacing:-0.045em; line-height:1")}>{SHOW_PRICING ? "Doing the maths." : "Putting your brief together."}</span>
              <span style={css("font-size:17px; color:rgba(255,243,228,0.6); animation:bibSlideIn 400ms ease both")}>{v.calcLine}</span>
            </section>
          )}

          {/* ══ 06 · THE BILL ══ */}
          {v.isBill && (
            <section style={css("display:flex; flex-direction:column; gap:22px; animation:bibRiseA 620ms cubic-bezier(.16,.84,.28,1) both")}>
              {SHOW_PRICING ? (<>
              <div style={css("position:relative; overflow:hidden; border-radius:32px; background:#FF7A00; color:#16100D; padding:44px")}>
                <span aria-hidden="true" style={css("position:absolute; top:-160px; right:-90px; width:420px; height:420px; border-radius:999px; background:radial-gradient(circle, rgba(255,243,228,0.5) 0%, rgba(255,243,228,0) 66%)")}></span>
                <span aria-hidden="true" style={css(v.sweepStyle)}></span>
                <div style={css("position:relative; display:flex; flex-direction:column; gap:20px")}>
                  <div style={css("display:flex; flex-wrap:wrap; align-items:center; gap:12px; min-height:36px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:15px; letter-spacing:0.06em")}>06 · YOUR PRICE</span>
                    <span style={css(v.offerBadgeStyle)}>🎉 First project · {v.offerPctLabel} off</span>
                  </div>
                  <div style={css("display:flex; flex-wrap:wrap; align-items:flex-end; gap:26px")}>
                    <div style={css("position:relative; display:flex; flex-direction:column; gap:6px")}>
                      <span aria-hidden="true" style={css(v.burstStyle)}></span>
                      <span style={css(v.wasStyle)}>{v.wasText}</span>
                      <span style={css(v.bigNumStyle)}>{v.countText}</span>
                      <span style={css("font-size:16px; font-weight:700; color:rgba(22,16,13,0.7); min-height:24px")}>{v.bigNumNote}</span>
                    </div>
                    {v.hasMonthly && (
                      <div style={css("display:flex; flex-direction:column; gap:4px; padding-left:26px; border-left:2px solid rgba(22,16,13,0.2)")}>
                        <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(28px,3.4vw,44px); line-height:1; letter-spacing:-0.045em; font-variant-numeric:tabular-nums")}>{v.monthlyTotal}</span>
                        <span style={css("font-size:14.5px; font-weight:700; color:rgba(22,16,13,0.7)")}>per month, starts after launch</span>
                      </div>
                    )}
                  </div>
                  <span style={css(v.teaseStyle)}>{v.teaseText}</span>
                  <div style={css("display:flex; flex-wrap:wrap; gap:10px; padding-top:2px")}>
                    <span style={css("padding:10px 16px; border-radius:999px; background:rgba(22,16,13,0.12); font-size:13.5px; font-weight:700")}>{v.timelineLabel} to launch</span>
                    <span style={css("padding:10px 16px; border-radius:999px; background:rgba(22,16,13,0.12); font-size:13.5px; font-weight:700")}>{v.scopeLabel}</span>
                    <span style={css("padding:10px 16px; border-radius:999px; background:rgba(22,16,13,0.12); font-size:13.5px; font-weight:700")}>0 surprise line items</span>
                  </div>
                </div>
              </div>

              <div className="pb-col" style={css("display:grid; grid-template-columns:1.15fr 0.85fr; gap:18px; align-items:start")}>
                <div style={css("background:#FFF3E4; color:#16100D; border-radius:28px; overflow:hidden")}>
                  <div style={css("padding:22px 26px; display:flex; align-items:center; justify-content:space-between; gap:14px; border-bottom:1.5px solid #EADFD0")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:24px; letter-spacing:-0.04em")}>Itemised, like a decent restaurant.</span>
                    <button type="button" onClick={v.restart} style={css("cursor:pointer; background:transparent; border:0; font-size:14px; font-weight:700; color:#B4643C")}>Change it</button>
                  </div>
                  {v.quoteLines.map((l, li) => (
                    <div key={li} style={css("display:flex; align-items:flex-start; justify-content:space-between; gap:18px; padding:15px 26px; border-bottom:1px solid #F1E4D4")}>
                      <span style={css("display:flex; flex-direction:column; gap:2px")}>
                        <span style={css("font-size:15.5px; font-weight:700; line-height:1.3")}>{l.label}</span>
                        <span style={css("font-size:13px; line-height:1.4; color:#8A6B5B")}>{l.detail}</span>
                      </span>
                      <span style={css("display:flex; align-items:center; gap:12px")}>
                        <span style={css("font-size:15.5px; font-weight:700; white-space:nowrap; font-variant-numeric:tabular-nums")}>{l.amount}</span>
                        {l.removable && (
                          <button type="button" onClick={l.remove} aria-label={"Remove " + l.label} style={css("cursor:pointer; flex-shrink:0; width:24px; height:24px; border-radius:999px; border:1.5px solid #E4CDB6; background:transparent; color:#B4643C; font-size:15px; line-height:1; display:flex; align-items:center; justify-content:center")} {...hoverFrom("background:#E23E2C; border-color:#E23E2C; color:#FFF3E4")}>×</button>
                        )}
                      </span>
                    </div>
                  ))}
                  {v.discountLines.map((d, di) => (
                    <div key={di} style={css("display:flex; align-items:center; justify-content:space-between; gap:18px; padding:15px 26px; border-bottom:1px solid #F1E4D4; background:#E9F3F0")}>
                      <span style={css("font-size:15.5px; font-weight:700; line-height:1.3; color:#0E6B5E")}>{d.label}</span>
                      <span style={css("font-size:15.5px; font-weight:800; white-space:nowrap; color:#0E6B5E; font-variant-numeric:tabular-nums")}>{d.amount}</span>
                    </div>
                  ))}
                  <div style={css("display:flex; align-items:center; justify-content:space-between; gap:18px; padding:20px 26px; border-bottom:1.5px solid #EADFD0")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:22px; letter-spacing:-0.04em")}>You pay</span>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:26px; letter-spacing:-0.04em; font-variant-numeric:tabular-nums")}>{v.finalTotal}</span>
                  </div>
                  {!!v.quoteMethod && (
                    <div style={css("padding:12px 26px; display:flex; flex-direction:column; gap:3px; background:#FBF3E8; border-bottom:1px solid #EADFD0")}>
                      <span style={css("display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:800; letter-spacing:0.02em; color:#B4600F")}>✦ {v.quoteMethod}</span>
                      {!!v.quoteRationale && <span style={css("font-size:13px; line-height:1.45; color:#6B4A3A")}>{v.quoteRationale}</span>}
                    </div>
                  )}
                  <div style={css("padding:18px 26px; display:flex; flex-direction:column; gap:10px")}>
                    {v.deliverables.map((d, ddi) => (
                      <div key={ddi} style={css("display:flex; gap:11px; align-items:flex-start")}>
                        <span style={css("flex-shrink:0; width:19px; height:19px; margin-top:2px; border-radius:999px; background:#0E6B5E; color:#FFF3E4; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center")}>✓</span>
                        <span style={css("font-size:15px; line-height:1.45; color:#3A2B24")}>{d.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={css("display:flex; flex-direction:column; gap:16px")}>
                  <div style={css("background:#0B0806; border:1.5px solid rgba(255,243,228,0.14); border-radius:28px; padding:26px; display:flex; flex-direction:column; gap:18px")}>
                    <span style={css("font-size:12px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:#FF9C5B")}>To start · {v.advancePctLabel}</span>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(36px,4.4vw,52px); line-height:0.94; letter-spacing:-0.05em; color:#FF7A00; font-variant-numeric:tabular-nums")}>{v.advanceAmount}</span>
                    <span style={css("font-size:15px; line-height:1.5; color:rgba(255,243,228,0.6)")}>The rest — {v.balanceAmount} — is invoiced across the build. Nothing is charged until you&apos;ve read the contract.</span>

                    <div style={css("display:flex; flex-direction:column; gap:12px; border-top:1px solid rgba(255,243,228,0.12); padding-top:18px")}>
                      <div style={css("display:flex; gap:12px; align-items:flex-start")}>
                        <span style={css("flex-shrink:0; width:26px; height:26px; border-radius:999px; background:#0E6B5E; color:#FFF3E4; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center")}>1</span>
                        <span style={css("display:flex; flex-direction:column; gap:5px")}>
                          <span style={css("display:flex; flex-wrap:wrap; align-items:center; gap:8px")}>
                            <span style={css("font-size:15px; font-weight:700; line-height:1.3")}>Module 1 — brief &amp; wireframes</span>
                            <span style={css("padding:3px 9px; border-radius:999px; background:#0E6B5E; color:#FFF3E4; font-size:11.5px; font-weight:800")}>fully refundable</span>
                          </span>
                          <span style={css("font-size:13.5px; line-height:1.45; color:rgba(255,243,228,0.55)")}>Exactly how we&apos;ll do your project, on paper. Don&apos;t like it? Say the word and the whole {v.advanceAmount} goes back. No argument, no deduction.</span>
                        </span>
                      </div>
                      <div style={css("display:flex; gap:12px; align-items:flex-start")}>
                        <span style={css("flex-shrink:0; width:26px; height:26px; border-radius:999px; background:rgba(255,243,228,0.12); color:rgba(255,243,228,0.7); font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center")}>2</span>
                        <span style={css("display:flex; flex-direction:column; gap:5px")}>
                          <span style={css("display:flex; flex-wrap:wrap; align-items:center; gap:8px")}>
                            <span style={css("font-size:15px; font-weight:700; line-height:1.3")}>Module 2 onward — design &amp; build</span>
                            <span style={css("padding:3px 9px; border-radius:999px; background:rgba(255,243,228,0.12); color:rgba(255,243,228,0.6); font-size:11.5px; font-weight:800")}>committed</span>
                          </span>
                          <span style={css("font-size:13.5px; line-height:1.45; color:rgba(255,243,228,0.55)")}>Once you approve module 1, your slot and your team are locked in — so from there the advance stays with us.</span>
                        </span>
                      </div>
                    </div>

                    <button type="button" onClick={v.approve} style={css("cursor:pointer; border:0; padding:19px 28px; border-radius:999px; background:#FF7A00; color:#16100D; font-size:16.5px; font-weight:700; transition:transform 200ms ease")} {...hoverFrom("transform:translateY(-2px)")}>Lock it in — pay {v.advanceAmount} →</button>
                    <button type="button" onClick={v.openChat} style={css("cursor:pointer; border:1.5px solid rgba(255,243,228,0.25); background:transparent; color:#FFF3E4; padding:16px 28px; border-radius:999px; font-size:15px; font-weight:700")}>Talk to a human first</button>
                  </div>

                  {v.hasFinalNudge && (
                    <div style={css("background:#0E6B5E; border-radius:28px; padding:24px; display:flex; flex-direction:column; gap:12px")}>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:23px; line-height:1; letter-spacing:-0.04em")}>{v.finalNudgeTitle}</span>
                      <span style={css("font-size:14.5px; line-height:1.5; color:rgba(255,243,228,0.75)")}>{v.finalNudgeBody}</span>
                      <button type="button" onClick={v.acceptFinalNudge} style={css("cursor:pointer; align-self:flex-start; border:0; background:#FFF3E4; color:#16100D; padding:13px 20px; border-radius:999px; font-size:14.5px; font-weight:700")}>{v.finalNudgeCta}</button>
                    </div>
                  )}
                </div>
              </div>
              </>) : (
              /* ── v1: no-price "brief ready" screen ── */
              <>
                <div style={css("position:relative; overflow:hidden; border-radius:32px; background:#FF7A00; color:#16100D; padding:44px")}>
                  <span aria-hidden="true" style={css("position:absolute; top:-160px; right:-90px; width:420px; height:420px; border-radius:999px; background:radial-gradient(circle, rgba(255,243,228,0.5) 0%, rgba(255,243,228,0) 66%)")}></span>
                  <div style={css("position:relative; display:flex; flex-direction:column; gap:16px")}>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:15px; letter-spacing:0.06em")}>06 · YOUR BRIEF</span>
                    <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(40px,6vw,72px); line-height:0.94; letter-spacing:-0.05em")}>Your build is scoped.</span>
                    <span style={css("font-size:17px; line-height:1.5; color:rgba(22,16,13,0.78); max-width:54ch")}>Here&apos;s everything we&apos;ll build. Send it over and we&apos;ll come back with a fixed price and a launch date — usually within a day. No obligation, nothing charged now.</span>
                    <div style={css("display:flex; flex-wrap:wrap; gap:10px; padding-top:2px")}>
                      <span style={css("padding:10px 16px; border-radius:999px; background:rgba(22,16,13,0.12); font-size:13.5px; font-weight:700")}>{v.timelineLabel} to launch</span>
                      <span style={css("padding:10px 16px; border-radius:999px; background:rgba(22,16,13,0.12); font-size:13.5px; font-weight:700")}>{v.scopeLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="pb-col" style={css("display:grid; grid-template-columns:1.15fr 0.85fr; gap:18px; align-items:start")}>
                  <div style={css("background:#FFF3E4; color:#16100D; border-radius:28px; overflow:hidden")}>
                    <div style={css("padding:22px 26px; display:flex; align-items:center; justify-content:space-between; gap:14px; border-bottom:1.5px solid #EADFD0")}>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:24px; letter-spacing:-0.04em")}>Everything we&apos;ll build.</span>
                      <button type="button" onClick={v.restart} style={css("cursor:pointer; background:transparent; border:0; font-size:14px; font-weight:700; color:#B4643C")}>Change it</button>
                    </div>
                    {v.quoteLines.map((l, li) => (
                      <div key={li} style={css("display:flex; align-items:flex-start; gap:12px; padding:15px 26px; border-bottom:1px solid #F1E4D4")}>
                        <span style={css("flex-shrink:0; width:19px; height:19px; margin-top:2px; border-radius:999px; background:#0E6B5E; color:#FFF3E4; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center")}>✓</span>
                        <span style={css("display:flex; flex-direction:column; gap:2px")}>
                          <span style={css("font-size:15.5px; font-weight:700; line-height:1.3")}>{l.label}</span>
                          <span style={css("font-size:13px; line-height:1.4; color:#8A6B5B")}>{l.detail}</span>
                        </span>
                      </div>
                    ))}
                    <div style={css("padding:18px 26px; display:flex; flex-direction:column; gap:10px")}>
                      {v.deliverables.map((d, ddi) => (
                        <div key={ddi} style={css("display:flex; gap:11px; align-items:flex-start")}>
                          <span style={css("flex-shrink:0; width:19px; height:19px; margin-top:2px; border-radius:999px; background:#16100D; color:#FFF3E4; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center")}>✓</span>
                          <span style={css("font-size:15px; line-height:1.45; color:#3A2B24")}>{d.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={css("display:flex; flex-direction:column; gap:16px")}>
                    <div style={css("background:#0B0806; border:1.5px solid rgba(255,243,228,0.14); border-radius:28px; padding:26px; display:flex; flex-direction:column; gap:16px")}>
                      <span style={css("font-size:12px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:#FF9C5B")}>Next step</span>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:clamp(26px,3vw,34px); line-height:1; letter-spacing:-0.045em; color:#FFF3E4")}>Send us your brief.</span>
                      <span style={css("font-size:15px; line-height:1.5; color:rgba(255,243,228,0.6)")}>We&apos;ll read it, come back with a fixed quote and a launch date, and answer anything you&apos;re unsure about — usually within a day.</span>
                      <button type="button" onClick={v.approve} style={css("cursor:pointer; border:0; padding:19px 28px; border-radius:999px; background:#FF7A00; color:#16100D; font-size:16.5px; font-weight:700; transition:transform 200ms ease")} {...hoverFrom("transform:translateY(-2px)")}>Get my quote →</button>
                      <button type="button" onClick={v.openChat} style={css("cursor:pointer; border:1.5px solid rgba(255,243,228,0.25); background:transparent; color:#FFF3E4; padding:16px 28px; border-radius:999px; font-size:15px; font-weight:700")}>Book a 15-min call</button>
                    </div>
                  </div>
                </div>
              </>
              )}
            </section>
          )}
        </main>

        {/* ══ RUNNING ESTIMATE BAR ══ */}
        <div style={css("position:fixed; left:0; right:0; bottom:0; z-index:50; padding:14px 24px 20px; background:linear-gradient(to top, rgba(11,8,6,0.98) 55%, rgba(11,8,6,0))")}>
          <div style={css("max-width:1180px; margin:0 auto; display:flex; align-items:center; gap:18px; padding:14px 14px 14px 24px; border-radius:999px; border:1px solid rgba(255,243,228,0.16); background:rgba(22,16,13,0.96); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); box-shadow:0 24px 60px -30px rgba(0,0,0,1)")}>
            <div style={css("display:flex; flex-direction:column; gap:2px; min-width:0")}>
              <span style={css("font-size:11px; letter-spacing:0.2em; text-transform:uppercase; font-weight:700; color:rgba(255,243,228,0.4)")}>{v.billLabel}</span>
              <span style={css("font-size:13.5px; font-weight:600; color:rgba(255,243,228,0.7); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:30ch")}>{v.billScope}</span>
            </div>
            <div style={css("display:flex; align-items:center; gap:12px; margin-left:auto")}>
              <span style={css(v.savingChipStyle)}>bundle saving {v.savingText}</span>
              <div style={css("display:flex; align-items:baseline; gap:9px")}>
                <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:28px; letter-spacing:-0.045em; color:#FFF3E4; font-variant-numeric:tabular-nums")}>{v.railTotal}</span>
                {v.hasMonthly && (
                  <span style={css("font-size:14px; font-weight:700; color:#FFB169; white-space:nowrap")}>+ {v.monthlyTotal}/mo</span>
                )}
              </div>
            </div>
            <div style={css("display:flex; align-items:center; gap:10px")}>
              <button type="button" onClick={v.back} style={css(v.backStyle)}>←</button>
              <button type="button" onClick={v.next} style={css(v.nextStyle)} {...hoverFrom("transform:translateY(-2px)")}>{v.nextLabel}</button>
            </div>
          </div>
        </div>

        {/* ══ BROWSE PRICES ══ */}
        {v.browseOpen && (
          <div style={css("position:fixed; inset:0; z-index:80; background:rgba(11,8,6,0.72); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:24px")}>
            <div style={css("background:#16100D; border:1.5px solid rgba(255,243,228,0.16); border-radius:30px; padding:32px; width:100%; max-width:820px; max-height:86vh; overflow:auto; animation:bibRiseA 380ms cubic-bezier(.16,.84,.28,1) both")}>
              <div style={css("display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:22px")}>
                <div style={css("display:flex; flex-direction:column; gap:6px")}>
                  <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:34px; letter-spacing:-0.045em; line-height:0.98")}>What things usually cost.</span>
                  <span style={css("font-size:15px; line-height:1.45; color:rgba(255,243,228,0.6)")}>Real builds we&apos;ve priced, with the 30% first-project offer already taken off. Load any of them and change whatever you like — nothing gets booked.</span>
                </div>
                <button type="button" onClick={v.closeBrowse} aria-label="Close" style={css("cursor:pointer; background:transparent; border:0; font-size:26px; line-height:1; color:rgba(255,243,228,0.55); padding:0 4px")}>×</button>
              </div>
              <div style={css("display:flex; flex-direction:column; gap:10px")}>
                {v.examples.map((e) => (
                  <button type="button" key={e.key} onClick={e.pick} style={css("cursor:pointer; font-family:'DM Sans',sans-serif; text-align:left; display:flex; flex-wrap:wrap; align-items:center; gap:16px; padding:18px 20px; border-radius:20px; border:1.5px solid rgba(255,243,228,0.14); background:rgba(255,243,228,0.05); color:#FFF3E4; transition:border-color 200ms ease, transform 200ms ease")} {...hoverFrom("border-color:#FF7A00; transform:translateY(-2px)")}>
                    <span style={css("display:flex; flex-direction:column; gap:4px; flex:1; min-width:240px")}>
                      <span style={css("font-size:17px; font-weight:700; line-height:1.25")}>{e.label}</span>
                      <span style={css("font-size:13.5px; line-height:1.4; color:rgba(255,243,228,0.55)")}>{e.note}</span>
                    </span>
                    <span style={css("display:flex; flex-direction:column; gap:2px; align-items:flex-end")}>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:24px; letter-spacing:-0.04em; color:#FF7A00; font-variant-numeric:tabular-nums")}>{e.price}</span>
                      <span style={css("font-size:12.5px; color:rgba(255,243,228,0.45)")}>{e.days}</span>
                    </span>
                    <span style={css("font-size:13.5px; font-weight:700; padding:11px 16px; border-radius:999px; background:rgba(255,243,228,0.1)")}>Load this →</span>
                  </button>
                ))}
              </div>
              <div style={css("display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:14px; margin-top:22px; padding-top:20px; border-top:1px solid rgba(255,243,228,0.12)")}>
                <span style={css("font-size:14px; color:rgba(255,243,228,0.5); max-width:48ch")}>Every one of these is what you&apos;d actually pay, not a starting point. It changes only if your scope does.</span>
                <button type="button" onClick={v.closeBrowse} style={css("cursor:pointer; font-size:14.5px; font-weight:700; padding:14px 22px; border-radius:999px; border:1.5px solid rgba(255,243,228,0.25); background:transparent; color:#FFF3E4")}>Build mine instead</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ CHAT ══ */}
        {v.chatOpen && (
          <div style={css("position:fixed; inset:0; z-index:80; background:rgba(11,8,6,0.72); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:24px")}>
            <div style={css("background:#FFF3E4; color:#16100D; border-radius:30px; padding:32px; width:100%; max-width:560px; max-height:88vh; overflow:auto; animation:bibRiseA 380ms cubic-bezier(.16,.84,.28,1) both")}>
              {v.chatSent && (
                <div style={css("display:flex; flex-direction:column; gap:16px; align-items:flex-start")}>
                  <span style={css("width:48px; height:48px; border-radius:999px; background:#0E6B5E; color:#FFF3E4; font-size:22px; font-weight:800; display:flex; align-items:center; justify-content:center; animation:bibPop 520ms cubic-bezier(.16,.84,.28,1) both")}>✓</span>
                  <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:34px; letter-spacing:-0.045em; line-height:0.98")}>Slot requested.</span>
                  <span style={css("font-size:16px; line-height:1.5; color:#4A3730")}>{v.chatConfirmLine} We&apos;ll confirm on WhatsApp within a few hours. If that time stops working, reply and we&apos;ll move it — no forms.</span>
                  <button type="button" onClick={v.closeChat} style={css("cursor:pointer; margin-top:4px; font-size:15px; font-weight:700; padding:15px 26px; border-radius:999px; border:0; background:#16100D; color:#FFF3E4")}>Back to my build</button>
                </div>
              )}
              {v.chatForm && (
                <div style={css("display:flex; flex-direction:column; gap:22px")}>
                  <div style={css("display:flex; align-items:flex-start; justify-content:space-between; gap:16px")}>
                    <div style={css("display:flex; flex-direction:column; gap:6px")}>
                      <span style={css("font-family:'Gabarito',sans-serif; font-weight:800; font-size:34px; letter-spacing:-0.045em; line-height:0.98")}>Pick a time. We&apos;ll confirm.</span>
                      <span style={css("font-size:15px; line-height:1.45; color:#6B4A3A")}>15 minutes. No deck, no pitch. Bring whatever you&apos;re unsure about.</span>
                    </div>
                    <button type="button" onClick={v.closeChat} aria-label="Close" style={css("cursor:pointer; background:transparent; border:0; font-size:26px; line-height:1; color:#8A6B5B; padding:0 4px")}>×</button>
                  </div>
                  <div style={css("display:flex; flex-direction:column; gap:10px")}>
                    <span style={css("font-size:12px; letter-spacing:0.18em; text-transform:uppercase; font-weight:700; color:#6B4A3A")}>Day</span>
                    <div style={css("display:flex; flex-wrap:wrap; gap:8px")}>
                      {v.chatDays.map((d) => (
                        <button type="button" key={d.key} onClick={d.pick} style={css(d.style)}>
                          <span style={css("font-size:11.5px; font-weight:600; opacity:.7")}>{d.dow}</span>
                          <span style={css("font-size:17px; font-weight:700")}>{d.num}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={css("display:flex; flex-direction:column; gap:10px")}>
                    <span style={css("font-size:12px; letter-spacing:0.18em; text-transform:uppercase; font-weight:700; color:#6B4A3A")}>Time · IST</span>
                    <div style={css("display:flex; flex-wrap:wrap; gap:8px")}>
                      {v.chatTimes.map((t) => (
                        <button type="button" key={t.key} onClick={t.pick} style={css(t.style)}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="pb-col" style={css("display:grid; grid-template-columns:1fr 1fr; gap:10px")}>
                    <input type="text" placeholder="Your name" value={v.chatName} onChange={v.onChatName} style={css("font-size:15px; padding:15px 18px; border-radius:999px; border:1.5px solid rgba(22,16,13,0.15); background:#fff; color:#16100D; outline:none")} />
                    <input type="tel" placeholder="WhatsApp number" value={v.chatPhone} onChange={v.onChatPhone} style={css("font-size:15px; padding:15px 18px; border-radius:999px; border:1.5px solid rgba(22,16,13,0.15); background:#fff; color:#16100D; outline:none")} />
                  </div>
                  <button type="button" onClick={v.sendChat} style={css(v.chatSubmitStyle)}>{v.chatSubmitLabel}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default function PricingPage() {
  const { pricing } = useContent() as unknown as { pricing?: Partial<Pricing> };
  // Merge over defaults so a missing or partial pricing block never crashes the
  // builder (stale cache / older published content).
  const merged: Pricing = {
    ...DEFAULT_PRICING,
    ...(pricing || {}),
    bundle: { ...DEFAULT_PRICING.bundle, ...(pricing?.bundle || {}) },
    website: { ...DEFAULT_PRICING.website, ...(pricing?.website || {}) },
    app: { ...DEFAULT_PRICING.app, ...(pricing?.app || {}) },
  };
  return <PricingBuilder pricing={merged} />;
}
