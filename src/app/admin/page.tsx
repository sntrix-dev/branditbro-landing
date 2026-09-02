"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { catalog } from "@/site.config";
import AdminShell from "@/components/admin/AdminShell";

type LeadStatus = "new" | "contacted" | "won" | "lost";
const STATUSES: LeadStatus[] = ["new", "contacted", "won", "lost"];

interface Lead {
  id: number;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  services: string[];
  est: string | null;
  scope: string | null;
  note: string | null;
  status: LeadStatus;
  source: string;
}
interface Stats {
  total: number;
  last7: number;
  last30: number;
  byStatus: Record<string, number>;
  byService: { service: string; count: number }[];
  daily: { day: string; count: number }[];
}

const STATUS_STYLE: Record<LeadStatus, { bg: string; fg: string; label: string }> = {
  new: { bg: "rgba(255,122,0,0.16)", fg: "#FF9C5B", label: "New" },
  contacted: { bg: "rgba(14,107,94,0.22)", fg: "#5FD0BE", label: "Contacted" },
  won: { bg: "rgba(74,222,128,0.16)", fg: "#7BE6A0", label: "Won" },
  lost: { bg: "rgba(226,62,44,0.16)", fg: "#F08A7E", label: "Lost" },
};

const serviceLabel = (key: string) => catalog.find((c) => c.key === key)?.label || key;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    ", " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dbEnabled, setDbEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [service, setService] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams();
      if (status !== "all") p.set("status", status);
      if (service) p.set("service", service);
      if (q.trim()) p.set("q", q.trim());
      const res = await fetch("/api/admin/leads?" + p.toString(), { cache: "no-store" });
      if (res.status === 401) { router.replace("/admin/login"); return; }
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "failed");
      setDbEnabled(j.dbEnabled);
      setLeads(j.leads || []);
      setStats(j.stats || null);
    } catch {
      setError("Couldn't load leads. Check the database connection and refresh.");
    } finally {
      setLoading(false);
    }
  }, [status, service, q, router]);

  useEffect(() => {
    const t = setTimeout(load, 180); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const changeStatus = async (id: number, next: LeadStatus) => {
    // Marking a lead "won" captures the final agreed price — this labels the
    // quote it came from as a training example for the pricing model.
    let finalPrice: number | undefined;
    if (next === "won") {
      const lead = leads.find((l) => l.id === id);
      const guess = lead?.est ? (lead.est.match(/[\d,]+/)?.[0] || "").replace(/,/g, "") : "";
      const input = window.prompt("Won! Final agreed price in ₹? (trains the pricing model — leave blank to skip)", guess);
      if (input === null) return; // cancelled — don't change status
      const n = parseInt(input.replace(/[^\d]/g, ""), 10);
      if (n > 0) finalPrice = n;
    }
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: next } : l)));
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next, finalPrice }),
      });
      load();
    } catch { /* optimistic; reload will reconcile */ }
  };

  const maxDaily = useMemo(() => Math.max(1, ...(stats?.daily || []).map((d) => d.count)), [stats]);
  const maxService = useMemo(() => Math.max(1, ...(stats?.byService || []).map((s) => s.count)), [stats]);

  const activeFilters = (status !== "all" ? 1 : 0) + (service ? 1 : 0) + (q.trim() ? 1 : 0);
  const subtitle = dbEnabled
    ? `${stats?.total ?? 0} total · ${stats?.last7 ?? 0} this week`
    : "Database not connected";

  return (
    <AdminShell
      title="Leads"
      subtitle={subtitle}
      actions={
        dbEnabled ? (
          <button onClick={load} className="h-9 px-4 rounded-full border border-cream/15 text-[13px] font-bold text-cream/75 hover:text-cream hover:border-cream/30 bg-transparent transition-colors">
            Refresh
          </button>
        ) : undefined
      }
    >
      <div className="max-w-[1040px] mx-auto">
        {!dbEnabled && (
          <div className="rounded-2xl border border-mango/30 bg-mango/[0.06] p-5">
            <p className="m-0 text-[15px] font-bold text-mango-light">No database connected yet</p>
            <p className="mt-2 mb-0 text-[14px] leading-relaxed text-cream/70">
              The admin is live, but leads aren&apos;t being stored. Set <code className="text-mango-soft">DATABASE_URL</code> in your
              environment and redeploy — new enquiries will start appearing here automatically. Until then, every enquiry still reaches
              you by email and WhatsApp.
            </p>
          </div>
        )}

        {dbEnabled && (
          <>
            {/* stat tiles */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ["Total leads", stats?.total ?? 0],
                ["This week", stats?.last7 ?? 0],
                ["Last 30 days", stats?.last30 ?? 0],
                ["Won", stats?.byStatus?.won ?? 0],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-2xl border border-cream/10 bg-ink p-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-cream/45">{label}</div>
                  <div className="mt-1 font-display font-extrabold text-[34px] leading-none tabnum">{val}</div>
                </div>
              ))}
            </section>

            {/* charts */}
            {stats && (stats.daily.length > 0 || stats.byService.length > 0) && (
              <section className="mt-3 grid lg:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-cream/10 bg-ink p-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-cream/45 mb-3">Enquiries · last 30 days</div>
                  <div className="flex items-end gap-[3px] h-[90px]">
                    {stats.daily.length === 0 && <span className="text-[13px] text-cream/40">No enquiries yet.</span>}
                    {stats.daily.map((d) => (
                      <div key={d.day} className="flex-1 rounded-t-[3px] bg-mango/70" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: 3 }} title={`${d.day}: ${d.count}`} />
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-cream/10 bg-ink p-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-cream/45 mb-3">By service</div>
                  <div className="flex flex-col gap-2">
                    {stats.byService.length === 0 && <span className="text-[13px] text-cream/40">No enquiries yet.</span>}
                    {stats.byService.map((s) => (
                      <div key={s.service} className="flex items-center gap-3">
                        <span className="w-[110px] shrink-0 text-[13px] text-cream/70 truncate">{serviceLabel(s.service)}</span>
                        <div className="flex-1 h-[10px] rounded-full bg-cream/8 overflow-hidden">
                          <div className="h-full rounded-full bg-teal" style={{ width: `${(s.count / maxService) * 100}%` }} />
                        </div>
                        <span className="w-6 text-right text-[13px] font-bold tabnum text-cream/60">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* filters */}
            <section className="mt-6 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-cream/12 p-1">
                {(["all", ...STATUSES] as const).map((s) => (
                  <button key={s} onClick={() => setStatus(s)}
                    className="h-8 px-3 rounded-full text-[13px] font-bold capitalize transition-colors"
                    style={{ background: status === s ? "rgba(255,122,0,0.16)" : "transparent", color: status === s ? "#FF9C5B" : "rgba(255,243,228,0.55)" }}>
                    {s}
                  </button>
                ))}
              </div>
              <select value={service} onChange={(e) => setService(e.target.value)}
                className="h-10 rounded-full border border-cream/12 bg-ink px-4 text-[13px] font-bold text-cream/80 outline-none focus:border-mango">
                <option value="">All services</option>
                {catalog.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, note…"
                className="h-10 flex-1 min-w-[180px] rounded-full border border-cream/12 bg-ink px-4 text-[14px] text-cream outline-none focus:border-mango" />
              {activeFilters > 0 && (
                <button onClick={() => { setStatus("all"); setService(""); setQ(""); }}
                  className="h-10 px-3 text-[13px] font-bold text-cream/50 hover:text-cream bg-transparent border-0">Clear</button>
              )}
            </section>

            {/* leads */}
            <section className="mt-4">
              {error && <p className="text-[14px] text-chili">{error}</p>}
              {loading && leads.length === 0 && <p className="text-[14px] text-cream/40 py-10 text-center">Loading…</p>}
              {!loading && leads.length === 0 && !error && (
                <div className="rounded-2xl border border-cream/10 bg-ink py-14 text-center">
                  <p className="text-[14px] text-cream/50">{activeFilters ? "No leads match these filters." : "No leads yet — enquiries will show up here."}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {leads.map((l) => {
                  const st = STATUS_STYLE[l.status];
                  const isOpen = open === l.id;
                  return (
                    <div key={l.id} className="rounded-2xl border border-cream/10 bg-ink overflow-hidden">
                      <button onClick={() => setOpen(isOpen ? null : l.id)}
                        className="w-full flex items-center gap-3 p-4 text-left bg-transparent border-0">
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em]"
                          style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                        <span className="font-bold text-[15px] text-cream truncate">{l.name}</span>
                        {l.est && <span className="text-[13px] font-bold text-mango-soft tabnum hidden sm:inline">{l.est}</span>}
                        <span className="ml-auto text-[12px] text-cream/40 tabnum whitespace-nowrap">{fmtDate(l.created_at)}</span>
                        <span className="text-cream/30 text-[12px]">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-cream/8 pt-3">
                          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
                            <Field label="Email" value={l.email} link={l.email ? `mailto:${l.email}` : undefined} />
                            <Field label="WhatsApp" value={l.phone} link={l.phone ? `https://wa.me/${l.phone.replace(/[^0-9]/g, "")}` : undefined} />
                            <Field label="Business" value={l.company} />
                            <Field label="Estimate" value={l.est} />
                            <Field label="Services" value={l.services.map(serviceLabel).join(", ") || null} />
                            <Field label="Scope" value={l.scope} />
                          </div>
                          {l.note && (
                            <div className="rounded-xl bg-ink-deep border border-cream/8 p-3 text-[14px] leading-relaxed text-cream/80">{l.note}</div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-cream/40 mr-1">Set status</span>
                            {STATUSES.map((s) => (
                              <button key={s} onClick={() => changeStatus(l.id, s)}
                                className="h-8 px-3 rounded-full text-[12px] font-bold capitalize border transition-colors"
                                style={{
                                  background: l.status === s ? STATUS_STYLE[s].bg : "transparent",
                                  color: l.status === s ? STATUS_STYLE[s].fg : "rgba(255,243,228,0.5)",
                                  borderColor: l.status === s ? STATUS_STYLE[s].fg + "55" : "rgba(255,243,228,0.14)",
                                }}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Field({ label, value, link }: { label: string; value: string | null; link?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-cream/40">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener" className="text-cream hover:text-mango transition-colors break-words">{value}</a>
      ) : (
        <span className="text-cream/85 break-words">{value}</span>
      )}
    </div>
  );
}
