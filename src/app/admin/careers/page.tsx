"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

type AppStatus = "new" | "reviewing" | "trial" | "hired" | "rejected" | "archived";
const STATUSES: AppStatus[] = ["new", "reviewing", "trial", "hired", "rejected", "archived"];
type Kind = "role" | "open" | "referral";

interface Application {
  id: number; ref: string; created_at: string; kind: Kind;
  role_key: string | null; role_title: string | null;
  name: string; email: string; phone: string | null; years: string | null;
  links: string[]; skills: string[]; why: string | null; video_link: string | null;
  engagement: string | null; pay: string | null; notice: string | null; hours: string | null; source: string | null;
  ref_city: string | null; ref_payout: string | null; ref_volume: string | null; ref_who: string | null;
  resume_key: string | null; resume_name: string | null; extract_source: string | null; match_pct: number | null;
  status: AppStatus; admin_note: string | null;
}
interface Stats {
  total: number; last7: number; last30: number;
  byStatus: Record<string, number>;
  byRole: { role: string; count: number }[];
  daily: { day: string; count: number }[];
}

const STATUS_STYLE: Record<AppStatus, { bg: string; fg: string; label: string }> = {
  new: { bg: "rgba(255,122,0,0.16)", fg: "#FF9C5B", label: "New" },
  reviewing: { bg: "rgba(14,107,94,0.22)", fg: "#5FD0BE", label: "Reviewing" },
  trial: { bg: "rgba(96,165,250,0.18)", fg: "#8FB8FF", label: "Trial task" },
  hired: { bg: "rgba(74,222,128,0.16)", fg: "#7BE6A0", label: "Hired" },
  rejected: { bg: "rgba(226,62,44,0.16)", fg: "#F08A7E", label: "Rejected" },
  archived: { bg: "rgba(255,243,228,0.10)", fg: "#B9AC9C", label: "Archived" },
};
const KIND_LABEL: Record<Kind, string> = { role: "Role", open: "Open", referral: "Referral" };

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    ", " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dbEnabled, setDbEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<AppStatus | "all">("all");
  const [kind, setKind] = useState<Kind | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const p = new URLSearchParams();
      if (status !== "all") p.set("status", status);
      if (kind !== "all") p.set("kind", kind);
      if (q.trim()) p.set("q", q.trim());
      const res = await fetch("/api/admin/careers?" + p.toString(), { cache: "no-store" });
      if (res.status === 401) { router.replace("/admin/login"); return; }
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "failed");
      setDbEnabled(j.dbEnabled);
      setApps(j.applications || []);
      setStats(j.stats || null);
    } catch {
      setError("Couldn't load applications. Check the database connection and refresh.");
    } finally {
      setLoading(false);
    }
  }, [status, kind, q, router]);

  useEffect(() => { const t = setTimeout(load, 180); return () => clearTimeout(t); }, [load]);

  const changeStatus = async (id: number, next: AppStatus) => {
    setApps((a) => a.map((x) => (x.id === id ? { ...x, status: next } : x)));
    try { await fetch("/api/admin/careers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: next }) }); load(); }
    catch { /* optimistic */ }
  };
  const saveNote = async (id: number, adminNote: string) => {
    try { await fetch("/api/admin/careers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, adminNote }) }); }
    catch { /* ignore */ }
  };

  const maxDaily = useMemo(() => Math.max(1, ...(stats?.daily || []).map((d) => d.count)), [stats]);
  const maxRole = useMemo(() => Math.max(1, ...(stats?.byRole || []).map((s) => s.count)), [stats]);

  const activeFilters = (status !== "all" ? 1 : 0) + (kind !== "all" ? 1 : 0) + (q.trim() ? 1 : 0);
  const subtitle = dbEnabled ? `${stats?.total ?? 0} total · ${stats?.last7 ?? 0} this week` : "Database not connected";

  return (
    <AdminShell title="Applications" subtitle={subtitle}
      actions={dbEnabled ? (
        <button onClick={load} className="h-9 px-4 rounded-full border border-cream/15 text-[13px] font-bold text-cream/75 hover:text-cream hover:border-cream/30 bg-transparent transition-colors">Refresh</button>
      ) : undefined}
    >
      <div className="max-w-[1040px] mx-auto">
        {!dbEnabled && (
          <div className="rounded-2xl border border-mango/30 bg-mango/[0.06] p-5">
            <p className="m-0 text-[15px] font-bold text-mango-light">No database connected yet</p>
            <p className="mt-2 mb-0 text-[14px] leading-relaxed text-cream/70">
              The careers page is live, but applications aren&apos;t being stored. Set <code className="text-mango-soft">DATABASE_URL</code> and redeploy — new
              applications will start appearing here. Until then, every application still reaches you by email (when SES is configured).
            </p>
          </div>
        )}

        {dbEnabled && (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ["Total", stats?.total ?? 0],
                ["This week", stats?.last7 ?? 0],
                ["In review", (stats?.byStatus?.reviewing ?? 0) + (stats?.byStatus?.trial ?? 0)],
                ["Hired", stats?.byStatus?.hired ?? 0],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-2xl border border-cream/10 bg-ink p-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-cream/45">{label}</div>
                  <div className="mt-1 font-display font-extrabold text-[34px] leading-none tabnum">{val}</div>
                </div>
              ))}
            </section>

            {stats && (stats.daily.length > 0 || stats.byRole.length > 0) && (
              <section className="mt-3 grid lg:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-cream/10 bg-ink p-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-cream/45 mb-3">Applications · last 30 days</div>
                  <div className="flex items-end gap-[3px] h-[90px]">
                    {stats.daily.length === 0 && <span className="text-[13px] text-cream/40">Nothing yet.</span>}
                    {stats.daily.map((d) => (<div key={d.day} className="flex-1 rounded-t-[3px] bg-mango/70" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: 3 }} title={`${d.day}: ${d.count}`} />))}
                  </div>
                </div>
                <div className="rounded-2xl border border-cream/10 bg-ink p-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-cream/45 mb-3">By role</div>
                  <div className="flex flex-col gap-2">
                    {stats.byRole.length === 0 && <span className="text-[13px] text-cream/40">Nothing yet.</span>}
                    {stats.byRole.map((s) => (
                      <div key={s.role} className="flex items-center gap-3">
                        <span className="w-[130px] shrink-0 text-[13px] text-cream/70 truncate">{s.role}</span>
                        <div className="flex-1 h-[10px] rounded-full bg-cream/8 overflow-hidden"><div className="h-full rounded-full bg-teal" style={{ width: `${(s.count / maxRole) * 100}%` }} /></div>
                        <span className="w-6 text-right text-[13px] font-bold tabnum text-cream/60">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* filters */}
            <section className="mt-6 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-cream/12 p-1 flex-wrap">
                {(["all", ...STATUSES] as const).map((s) => (
                  <button key={s} onClick={() => setStatus(s)} className="h-8 px-3 rounded-full text-[13px] font-bold capitalize transition-colors"
                    style={{ background: status === s ? "rgba(255,122,0,0.16)" : "transparent", color: status === s ? "#FF9C5B" : "rgba(255,243,228,0.55)" }}>{s}</button>
                ))}
              </div>
              <select value={kind} onChange={(e) => setKind(e.target.value as Kind | "all")} className="h-10 rounded-full border border-cream/12 bg-ink px-4 text-[13px] font-bold text-cream/80 outline-none focus:border-mango">
                <option value="all">All kinds</option>
                <option value="role">Role</option>
                <option value="open">Open</option>
                <option value="referral">Referral</option>
              </select>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, ref…" className="h-10 flex-1 min-w-[180px] rounded-full border border-cream/12 bg-ink px-4 text-[14px] text-cream outline-none focus:border-mango" />
              {activeFilters > 0 && <button onClick={() => { setStatus("all"); setKind("all"); setQ(""); }} className="h-10 px-3 text-[13px] font-bold text-cream/50 hover:text-cream bg-transparent border-0">Clear</button>}
            </section>

            {/* list */}
            <section className="mt-4">
              {error && <p className="text-[14px] text-chili">{error}</p>}
              {loading && apps.length === 0 && <p className="text-[14px] text-cream/40 py-10 text-center">Loading…</p>}
              {!loading && apps.length === 0 && !error && (
                <div className="rounded-2xl border border-cream/10 bg-ink py-14 text-center">
                  <p className="text-[14px] text-cream/50">{activeFilters ? "No applications match these filters." : "No applications yet — they'll show up here."}</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {apps.map((a) => {
                  const st = STATUS_STYLE[a.status];
                  const isOpen = open === a.id;
                  return (
                    <div key={a.id} className="rounded-2xl border border-cream/10 bg-ink overflow-hidden">
                      <button onClick={() => setOpen(isOpen ? null : a.id)} className="w-full flex items-center gap-3 p-4 text-left bg-transparent border-0">
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                        <span className="font-bold text-[15px] text-cream truncate">{a.name}</span>
                        <span className="text-[12px] text-cream/45 truncate hidden sm:inline">{a.role_title || KIND_LABEL[a.kind]}</span>
                        <span className="ml-auto text-[12px] text-mango-soft font-bold tabnum hidden sm:inline">{a.ref}</span>
                        <span className="text-[12px] text-cream/40 tabnum whitespace-nowrap">{fmtDate(a.created_at)}</span>
                        <span className="text-cream/30 text-[12px]">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-cream/8 pt-3">
                          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
                            <Field label="Email" value={a.email} link={`mailto:${a.email}`} />
                            <Field label="WhatsApp" value={a.phone} link={a.phone ? `https://wa.me/${a.phone.replace(/[^0-9]/g, "")}` : undefined} />
                            <Field label="Reference" value={a.ref} />
                            <Field label="Kind" value={KIND_LABEL[a.kind]} />
                            <Field label="Target role" value={a.role_title} />
                            <Field label="Experience" value={a.years ? `${a.years} yrs` : null} />
                            <Field label="Engagement" value={a.engagement} />
                            <Field label="Pay" value={a.pay} />
                            <Field label="Notice" value={a.notice} />
                            <Field label="Hours/wk" value={a.hours} />
                            <Field label="Match" value={a.match_pct != null ? `${a.match_pct}%` : null} />
                            <Field label="Source" value={a.source} />
                            <Field label="Intro area" value={a.ref_city} />
                            <Field label="Payout" value={a.ref_payout} />
                            <Field label="Volume" value={a.ref_volume} />
                            <Field label="In mind" value={a.ref_who} />
                            <Field label="Video" value={a.video_link} link={a.video_link || undefined} />
                          </div>

                          {a.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">{a.skills.map((s) => <span key={s} className="text-[12px] font-bold text-cream/80 bg-cream/[0.06] border border-cream/10 px-2.5 py-1 rounded-full">{s}</span>)}</div>
                          )}
                          {a.links.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1">{a.links.map((l) => <a key={l} href={/^https?:\/\//.test(l) ? l : `https://${l}`} target="_blank" rel="noopener" className="text-[13px] text-mango-soft hover:text-mango break-all">{l}</a>)}</div>
                          )}
                          {a.why && <div className="rounded-xl bg-ink-deep border border-cream/8 p-3 text-[14px] leading-relaxed text-cream/80 whitespace-pre-wrap">{a.why}</div>}

                          {a.resume_name && (
                            <div className="text-[13px]">
                              <span className="text-cream/40 font-bold uppercase tracking-[0.1em] text-[11px] mr-2">Résumé</span>
                              {a.resume_key
                                ? <a href={`/api/admin/careers/resume?id=${a.id}`} target="_blank" rel="noopener" className="text-mango-soft hover:text-mango font-bold">{a.resume_name} ↗</a>
                                : <span className="text-cream/50">{a.resume_name} (not stored — S3 off)</span>}
                            </div>
                          )}

                          <NoteEditor id={a.id} initial={a.admin_note} onSave={saveNote} />

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-cream/40 mr-1">Set status</span>
                            {STATUSES.map((s) => (
                              <button key={s} onClick={() => changeStatus(a.id, s)} className="h-8 px-3 rounded-full text-[12px] font-bold capitalize border transition-colors"
                                style={{ background: a.status === s ? STATUS_STYLE[s].bg : "transparent", color: a.status === s ? STATUS_STYLE[s].fg : "rgba(255,243,228,0.5)", borderColor: a.status === s ? STATUS_STYLE[s].fg + "55" : "rgba(255,243,228,0.14)" }}>{s}</button>
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
      {link ? <a href={link} target="_blank" rel="noopener" className="text-cream hover:text-mango transition-colors break-words">{value}</a> : <span className="text-cream/85 break-words">{value}</span>}
    </div>
  );
}

function NoteEditor({ id, initial, onSave }: { id: number; initial: string | null; onSave: (id: number, note: string) => void }) {
  const [note, setNote] = useState(initial || "");
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-cream/40">Private note</span>
      <textarea value={note} onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        onBlur={() => { onSave(id, note); setSaved(true); }} rows={2} placeholder="Notes only your team sees…"
        className="rounded-xl border border-cream/12 bg-ink-deep px-3 py-2.5 text-[14px] leading-relaxed text-cream outline-none focus:border-mango resize-y" />
      {saved && <span className="text-[11px] text-teal">Saved</span>}
    </div>
  );
}
