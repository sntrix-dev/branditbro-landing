"use client";

import { usePathname, useRouter } from "next/navigation";

/** Shared admin chrome: a persistent left sidebar on desktop, a compact top
 *  bar on mobile, and a page header with a title + an actions slot. Every
 *  admin screen (except login) renders inside this so navigation and identity
 *  are always visible and consistent. */

const NAV = [
  { href: "/admin", label: "Leads", match: (p: string) => p === "/admin", icon: InboxIcon },
  { href: "/admin/careers", label: "Applications", match: (p: string) => p === "/admin/careers", icon: UsersIcon },
  { href: "/admin/careers/roles", label: "Roles", match: (p: string) => p.startsWith("/admin/careers/roles"), icon: BriefcaseIcon },
  { href: "/admin/content", label: "Content", match: (p: string) => p.startsWith("/admin/content"), icon: DocIcon },
];

export default function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-[100svh] bg-ink-deep text-cream">
      {/* ── desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[236px] flex-col border-r border-cream/10 bg-ink px-4 py-5 z-30">
        <div className="px-2 pb-6">
          <span className="font-display font-extrabold text-[21px] tracking-[-0.04em] leading-none">
            brandit<span className="text-mango">bro</span><span className="text-chili">.</span>
          </span>
          <div className="mt-1 text-[10.5px] font-bold tracking-[0.22em] uppercase text-cream/35">Admin</div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = n.match(pathname);
            return (
              <a key={n.href} href={n.href}
                className="flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] font-bold transition-colors"
                style={{ background: active ? "rgba(255,122,0,0.14)" : "transparent", color: active ? "#FF9C5B" : "rgba(255,243,228,0.62)" }}>
                <n.icon active={active} />
                {n.label}
              </a>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-cream/10">
          <a href="/" target="_blank" rel="noopener"
            className="flex items-center gap-3 h-10 px-3 rounded-xl text-[13.5px] font-bold text-cream/55 hover:text-cream transition-colors">
            <ExternalIcon /> View site
          </a>
          <button onClick={logout}
            className="flex items-center gap-3 h-10 px-3 rounded-xl text-[13.5px] font-bold text-cream/55 hover:text-cream bg-transparent border-0 transition-colors text-left">
            <LogoutIcon /> Sign out
          </button>
        </div>
      </aside>

      {/* ── mobile top nav ── */}
      <div className="md:hidden sticky top-0 z-30 bg-ink/95 backdrop-blur-md border-b border-cream/10">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-display font-extrabold text-[18px] tracking-[-0.04em]">
            brandit<span className="text-mango">bro</span><span className="text-chili">.</span>
          </span>
          <button onClick={logout} className="text-[13px] font-bold text-cream/60 bg-transparent border-0">Sign out</button>
        </div>
        <div className="flex items-center gap-1 px-3 pb-2">
          {NAV.map((n) => {
            const active = n.match(pathname);
            return (
              <a key={n.href} href={n.href} className="h-9 px-4 rounded-full text-[13px] font-bold flex items-center"
                style={{ background: active ? "rgba(255,122,0,0.16)" : "rgba(255,243,228,0.05)", color: active ? "#FF9C5B" : "rgba(255,243,228,0.6)" }}>
                {n.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* ── main ── */}
      <div className="md:ml-[236px] flex flex-col min-h-[100svh]">
        <header className="sticky top-0 md:top-0 z-20 bg-ink-deep/85 backdrop-blur-md border-b border-cream/8">
          <div className="flex items-center gap-4 px-5 sm:px-8 h-[68px]">
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-[22px] leading-none tracking-[-0.03em] truncate">{title}</h1>
              {subtitle && <p className="m-0 mt-1 text-[12.5px] text-cream/45 truncate">{subtitle}</p>}
            </div>
            {actions && <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
          </div>
        </header>
        <main className="flex-1 px-5 sm:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

/* ── icons (inline, no dependency) ── */
function InboxIcon({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? "#FF9C5B" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
function UsersIcon({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? "#FF9C5B" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function BriefcaseIcon({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? "#FF9C5B" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function DocIcon({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? "#FF9C5B" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="m10 14 11-11" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
    </svg>
  );
}
