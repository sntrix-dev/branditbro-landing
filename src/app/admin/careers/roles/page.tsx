"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

interface Role {
  id: number; key: string; team: string; title: string; mode: string; pay: string; band: string;
  blurb: string; tags: string[]; skills: string[]; hints: string[]; status: "open" | "closed"; sort: number;
}
type Draft = Omit<Role, "id" | "tags" | "skills" | "hints"> & { id?: number; tags: string; skills: string; hints: string };

const BLANK: Draft = { key: "", team: "", title: "", mode: "Per-task or full-time", pay: "", band: "", blurb: "", tags: "", skills: "", hints: "", status: "open", sort: 0 };

const toDraft = (r: Role): Draft => ({ ...r, tags: r.tags.join(", "), skills: r.skills.join(", "), hints: r.hints.join(", ") });
const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [dbEnabled, setDbEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/careers/roles", { cache: "no-store" });
      if (res.status === 401) { router.replace("/admin/login"); return; }
      const j = await res.json();
      setDbEnabled(j.dbEnabled);
      setRoles(j.roles || []);
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.team.trim()) { setMsg("A title and team are required."); return; }
    setBusy(true); setMsg("");
    const body = {
      id: editing.id, key: editing.key, team: editing.team, title: editing.title, mode: editing.mode,
      pay: editing.pay, band: editing.band, blurb: editing.blurb,
      tags: splitList(editing.tags), skills: splitList(editing.skills), hints: splitList(editing.hints),
      status: editing.status, sort: Number(editing.sort) || 0,
    };
    const res = await fetch("/api/admin/careers/roles", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && j.ok) { setEditing(null); load(); }
    else setMsg(j.message || "Couldn't save that role.");
  };

  const toggle = async (r: Role) => {
    setRoles((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: x.status === "open" ? "closed" : "open" } : x)));
    await fetch("/api/admin/careers/roles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: r.status === "open" ? "closed" : "open" }) });
    load();
  };
  const remove = async (r: Role) => {
    if (!confirm(`Delete “${r.title}”? This can't be undone.`)) return;
    await fetch(`/api/admin/careers/roles?id=${r.id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell title="Roles" subtitle={dbEnabled ? `${roles.length} role${roles.length === 1 ? "" : "s"} · ${roles.filter((r) => r.status === "open").length} open` : "Database not connected"}
      actions={dbEnabled ? <button onClick={() => { setEditing({ ...BLANK, sort: roles.length }); setMsg(""); }} className="h-9 px-4 rounded-full bg-mango text-ink text-[13px] font-extrabold border-0 hover:opacity-90">+ Add role</button> : undefined}
    >
      <div className="max-w-[880px] mx-auto">
        {!dbEnabled && (
          <div className="rounded-2xl border border-mango/30 bg-mango/[0.06] p-5 text-[14px] leading-relaxed text-cream/75">
            Managing roles needs a database. Set <code className="text-mango-soft">DATABASE_URL</code> and reload — until then the careers page shows the built-in seed roles.
          </div>
        )}

        {dbEnabled && loading && <p className="text-cream/40 py-16 text-center">Loading…</p>}

        {dbEnabled && !loading && (
          <div className="flex flex-col gap-2.5">
            {roles.length === 0 && <p className="text-cream/50 text-[14px] py-10 text-center">No roles yet. Add your first one.</p>}
            {roles.map((r) => (
              <div key={r.id} className="rounded-2xl border border-cream/10 bg-ink p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em]"
                    style={r.status === "open" ? { background: "rgba(74,222,128,0.16)", color: "#7BE6A0" } : { background: "rgba(255,243,228,0.10)", color: "#B9AC9C" }}>{r.status}</span>
                  <span className="font-bold text-[15px] text-cream">{r.title}</span>
                  <span className="text-[12px] text-cream/45">{r.team}</span>
                  <span className="ml-auto text-[12.5px] text-mango-soft font-bold">{r.band}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(toDraft(r)); setMsg(""); }} className="h-8 px-3 rounded-full border border-cream/15 text-[12px] font-bold text-cream/80 hover:text-cream bg-transparent">Edit</button>
                    <button onClick={() => toggle(r)} className="h-8 px-3 rounded-full border border-cream/15 text-[12px] font-bold text-cream/70 hover:text-cream bg-transparent">{r.status === "open" ? "Close" : "Reopen"}</button>
                    <button onClick={() => remove(r)} className="h-8 px-3 rounded-full border border-chili/30 text-[12px] font-bold text-chili/80 hover:text-chili bg-transparent">Delete</button>
                  </div>
                </div>
                {r.blurb && <p className="mt-2 mb-0 text-[13.5px] leading-relaxed text-cream/55">{r.blurb}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-deep/70 backdrop-blur-sm p-4 sm:p-8" onClick={() => setEditing(null)}>
          <div className="w-full max-w-[640px] rounded-2xl border border-cream/12 bg-ink my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream/10">
              <h2 className="font-display font-extrabold text-[18px] text-cream m-0">{editing.id ? "Edit role" : "New role"}</h2>
              <button onClick={() => setEditing(null)} className="text-cream/50 hover:text-cream bg-transparent border-0 text-[20px] leading-none">×</button>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <RField label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
                <RField label="Team" value={editing.team} onChange={(v) => setEditing({ ...editing, team: v })} placeholder="Engineering · Design · …" />
                <RField label="Mode" value={editing.mode} onChange={(v) => setEditing({ ...editing, mode: v })} placeholder="Per-task or full-time" />
                <RField label="Pay (summary)" value={editing.pay} onChange={(v) => setEditing({ ...editing, pay: v })} placeholder="₹1,200–2,500 / hr or ₹45k–90k / mo" />
                <RField label="Band (suggested)" value={editing.band} onChange={(v) => setEditing({ ...editing, band: v })} placeholder="₹1,200–2,500 / hr" />
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cream/40">Status</span>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as "open" | "closed" })} className="h-10 rounded-lg border border-cream/15 bg-ink-deep px-3 text-[14px] text-cream outline-none focus:border-mango">
                    <option value="open">Open</option><option value="closed">Closed</option>
                  </select>
                </label>
              </div>
              <RField label="Blurb" value={editing.blurb} onChange={(v) => setEditing({ ...editing, blurb: v })} textarea />
              <RField label="Tags (comma separated)" value={editing.tags} onChange={(v) => setEditing({ ...editing, tags: v })} placeholder="React, Next.js, Tailwind" />
              <RField label="Skills (comma separated)" value={editing.skills} onChange={(v) => setEditing({ ...editing, skills: v })} placeholder="React, TypeScript, GSAP" />
              <RField label="Match hints (comma separated · used by AI role-match, hidden from applicants)" value={editing.hints} onChange={(v) => setEditing({ ...editing, hints: v })} placeholder="react, next, frontend" />
              <div className="grid sm:grid-cols-2 gap-3.5">
                <RField label="Sort order" value={String(editing.sort)} onChange={(v) => setEditing({ ...editing, sort: Number(v) || 0 })} />
                <RField label="Key (auto from title if blank)" value={editing.key} onChange={(v) => setEditing({ ...editing, key: v })} placeholder="frontend" />
              </div>
              {msg && <span className="text-[13px] text-chili">{msg}</span>}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-cream/10">
              <button onClick={() => setEditing(null)} className="h-10 px-4 rounded-full border border-cream/15 text-[13px] font-bold text-cream/80 bg-transparent">Cancel</button>
              <button onClick={save} disabled={busy} className="h-10 px-5 rounded-full bg-mango text-ink text-[13px] font-extrabold border-0 disabled:opacity-50">{busy ? "Saving…" : "Save role"}</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function RField({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cream/40">{label}</span>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className="rounded-lg border border-cream/15 bg-ink-deep px-3 py-2.5 text-[14px] leading-relaxed text-cream outline-none focus:border-mango resize-y" />
        : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 rounded-lg border border-cream/15 bg-ink-deep px-3 text-[14px] text-cream outline-none focus:border-mango" />}
    </label>
  );
}
