"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/* ── curated sections: friendly names + which content keys they contain ── */
const SECTIONS: { id: string; label: string; blurb: string; keys: string[] }[] = [
  { id: "business", label: "Business", blurb: "Name, tagline and the description used across the site and SEO.", keys: ["site"] },
  { id: "contact", label: "Contact & social", blurb: "Where enquiries go, your WhatsApp number and social handle.", keys: ["contact", "social"] },
  { id: "services", label: "Services & pricing", blurb: "Each service’s copy and its price bands, plus the first-project discount.", keys: ["catalog", "offer"] },
  { id: "pricing", label: "Pricing builder", blurb: "The levers and base prices behind the /pricing builder — first-project, rush & deposit %, bundle discounts, and the five base service prices per size.", keys: ["pricing"] },
  { id: "audience", label: "Audience & timing", blurb: "The options and replies in the pricing quiz.", keys: ["sizes", "whens"] },
  { id: "proof", label: "Proof", blurb: "The client results shown as social proof.", keys: ["proof"] },
  { id: "careers", label: "Careers", blurb: "The careers page copy — hero, stats, referral %, process and FAQ. (Open roles are managed under Roles.)", keys: ["careers"] },
  { id: "navigation", label: "Navigation", blurb: "The header links and call-to-action.", keys: ["nav"] },
];

const HIDDEN_KEYS = new Set(["key"]); // structural identifiers — not editable
const UNIT: Record<string, string> = { days: "days", one: "₹ one-time", per: "₹ / month" };
const SIZE_LABEL: Record<string, string> = { solo: "Just me", growing: "Small business", funded: "Funded company" };

const humanize = (k: string) =>
  ({ own: "What you own", note: "Short line", reaction: "Quiz reply", est: "Estimate", dmKeyword: "DM keyword", firstProjectDiscountPct: "First-project discount (%)", isSample: "These are sample figures", instagram: "Instagram handle", twitter: "X / Twitter handle", linkedin: "LinkedIn handle", whatsapp: "WhatsApp number (digits only)", whatsappDisplay: "WhatsApp (display)", cta: "Button",
    advancePct: "Deposit to start (%)", firstProjectPct: "First-project discount (%)", rushPct: "Rush surcharge (%)", bundle: "Bundle discounts (%)", pairPct: "Two services (%)", triadPct: "Three builds (%)", quadBonusPct: "Four+ bonus (%)", mixedTrioPct: "Any three (%)",
    website: "Website base price by type (₹)", app: "App base price by type (₹)", branding: "Branding (₹, one-time)", marketing: "Marketing (₹ / month)", video: "Video (₹ / month)",
    landing: "Landing page", business: "Business site", store: "Online store", booking: "Bookings site", webapp: "Web app / portal", consumer: "Consumer app", marketplace: "Marketplace", saas: "Business / SaaS", ondemand: "On-demand / delivery" } as Record<string, string>)[k]
  || k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (c) => c.toUpperCase()).trim();

function setAtPath(obj: Json, path: (string | number)[], value: Json): Json {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[head as number] = setAtPath(obj[head as number], rest, value);
    return copy;
  }
  const o = (obj && typeof obj === "object" ? obj : {}) as { [k: string]: Json };
  return { ...o, [head]: setAtPath(o[head as string], rest, value) };
}

const isBandGroup = (v: Json): v is { [k: string]: [number, number] } =>
  !!v && typeof v === "object" && !Array.isArray(v) &&
  Object.values(v).every((x) => Array.isArray(x) && x.length === 2 && x.every((n) => typeof n === "number"));

export default function ContentEditor() {
  const router = useRouter();
  const [doc, setDoc] = useState<Json | null>(null);
  const [dbEnabled, setDbEnabled] = useState(true);
  const [meta, setMeta] = useState<{ hasDraft: boolean; publishedAt: string | null }>({ hasDraft: false, publishedAt: null });
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [section, setSection] = useState("business");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (res.status === 401) { router.replace("/admin/login"); return; }
    const j = await res.json();
    setDbEnabled(j.dbEnabled);
    if (j.dbEnabled) {
      setDoc(j.doc);
      setMeta({ hasDraft: j.hasDraft, publishedAt: j.publishedAt });
      setDirty(false);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const update = (path: (string | number)[], value: Json) => {
    setDoc((d) => (d === null ? d : setAtPath(d, path, value)));
    setDirty(true);
    setMsg("");
  };

  const saveDraft = async () => {
    setBusy("save"); setMsg("");
    const res = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doc }) });
    setBusy("");
    if (res.ok) { setDirty(false); setMeta((m) => ({ ...m, hasDraft: true })); setMsg("Draft saved"); }
    else setMsg("Couldn’t save");
  };

  const publish = async () => {
    setBusy("publish"); setMsg("");
    await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doc }) });
    const res = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish" }) });
    setBusy("");
    if (res.ok) { setDirty(false); setMsg("Published — live now"); load(); }
    else setMsg("Publish failed");
  };

  const discard = async () => {
    if (!confirm("Discard the draft and revert to what’s currently live?")) return;
    setBusy("discard"); setMsg("");
    await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "discard" }) });
    setBusy(""); load();
  };

  const current = SECTIONS.find((s) => s.id === section) || SECTIONS[0];
  const d = doc as { [k: string]: Json } | null;

  return (
    <AdminShell title="Content" subtitle="Edit the site copy, preview it, then publish.">
      {!dbEnabled ? (
        <div className="max-w-[720px] rounded-2xl border border-mango/30 bg-mango/[0.06] p-5 text-[14px] leading-relaxed text-cream/75">
          The CMS needs a database. Set <code className="text-mango-soft">DATABASE_URL</code> and reload — until then the site renders the built-in default copy.
        </div>
      ) : loading ? (
        <p className="text-cream/40 py-16 text-center">Loading…</p>
      ) : d ? (
        <div className="flex flex-col md:flex-row gap-6 pb-28">
          {/* section nav */}
          <nav className="md:w-[210px] shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:sticky md:top-[84px]">
              {SECTIONS.map((s) => {
                const active = s.id === section;
                return (
                  <button key={s.id} onClick={() => setSection(s.id)}
                    className="text-left whitespace-nowrap md:whitespace-normal h-9 md:h-auto md:py-2.5 px-3.5 rounded-xl text-[13.5px] font-bold transition-colors"
                    style={{ background: active ? "rgba(255,122,0,0.14)" : "transparent", color: active ? "#FF9C5B" : "rgba(255,243,228,0.6)" }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* section body */}
          <div className="flex-1 min-w-0 max-w-[680px]">
            <p className="m-0 mb-5 text-[13.5px] text-cream/45 leading-relaxed">{current.blurb}</p>
            <div className="flex flex-col gap-4">
              {current.keys.map((k) => (
                <KeyBlock key={k} name={k} value={d[k]} path={[k]} onChange={update} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* sticky action bar */}
      {dbEnabled && !loading && (
        <div className="fixed bottom-0 right-0 left-0 md:left-[236px] z-40 border-t border-cream/10 bg-ink/95 backdrop-blur-md">
          <div className="flex items-center gap-3 px-5 sm:px-8 h-16">
            <div className="flex items-center gap-2 text-[13px] min-w-0">
              {meta.hasDraft || dirty ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-mango-soft"><span className="w-2 h-2 rounded-full bg-mango" />Draft{dirty ? " · unsaved" : ""}</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-bold text-teal"><span className="w-2 h-2 rounded-full bg-teal" />Live &amp; in sync</span>
              )}
              {msg && <span className="text-cream/50 truncate">· {msg}</span>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {meta.hasDraft && (
                <button onClick={discard} disabled={!!busy} className="hidden sm:block h-10 px-3 text-[13px] font-bold text-chili/80 hover:text-chili bg-transparent border-0 disabled:opacity-50">Discard</button>
              )}
              <a href="/api/admin/preview?on=1" target="_blank" rel="noopener"
                className="h-10 px-4 rounded-full border border-cream/18 text-[13px] font-bold text-cream/85 hover:text-cream hover:border-cream/35 flex items-center transition-colors">Preview ↗</a>
              <button onClick={saveDraft} disabled={!!busy || (!dirty && meta.hasDraft)} className="h-10 px-4 rounded-full border border-cream/18 text-[13px] font-bold text-cream bg-transparent disabled:opacity-40 transition-colors">
                {busy === "save" ? "Saving…" : "Save draft"}
              </button>
              <button onClick={publish} disabled={!!busy} className="h-10 px-5 rounded-full bg-mango text-ink text-[13px] font-extrabold border-0 disabled:opacity-50 active:scale-[0.98] transition-transform">
                {busy === "publish" ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

/* ── a top-level content key rendered as a titled card ── */
function KeyBlock({ name, value, path, onChange }: { name: string; value: Json; path: (string | number)[]; onChange: (p: (string | number)[], v: Json) => void }) {
  const isList = Array.isArray(value);
  return (
    <section className="rounded-2xl border border-cream/10 bg-ink overflow-hidden">
      <div className="px-4 pt-4 pb-1">
        <h2 className="font-display font-extrabold text-[16px] text-cream m-0">{humanize(name)}</h2>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {isList
          ? (value as Json[]).map((item, i) => (
              <ItemCard key={i} item={item} index={i} path={[...path, i]} onChange={onChange} />
            ))
          : <Fields value={value} path={path} onChange={onChange} />}
      </div>
    </section>
  );
}

/* ── one item in a list (a service, a size, a proof stat, a nav link) ── */
function ItemCard({ item, index, path, onChange }: { item: Json; index: number; path: (string | number)[]; onChange: (p: (string | number)[], v: Json) => void }) {
  const obj = (item && typeof item === "object" && !Array.isArray(item)) ? (item as { [k: string]: Json }) : null;
  const heading = obj ? String(obj.label ?? obj.title ?? obj.tag ?? obj.value ?? `Item ${index + 1}`) : `Item ${index + 1}`;
  return (
    <div className="rounded-xl border border-cream/10 bg-ink-deep/40 p-4">
      <div className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-mango-soft mb-3">{heading}</div>
      <Fields value={item} path={path} onChange={onChange} />
    </div>
  );
}

/* ── render the fields of an object (or a single leaf) ── */
function Fields({ value, path, onChange }: { value: Json; path: (string | number)[]; onChange: (p: (string | number)[], v: Json) => void }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return <Leaf label="Value" value={value} path={path} onChange={onChange} />;
  }
  const entries = Object.entries(value as { [k: string]: Json });
  return (
    <div className="flex flex-col gap-3.5">
      {entries.map(([k, v]) => {
        if (HIDDEN_KEYS.has(k)) {
          return (
            <div key={k} className="text-[11px] text-cream/30">id: <span className="tabnum">{String(v)}</span></div>
          );
        }
        if (isBandGroup(v)) {
          return <BandTable key={k} label={humanize(k)} unit={UNIT[k] || ""} group={v as { [s: string]: [number, number] }} path={[...path, k]} onChange={onChange} />;
        }
        if (v && typeof v === "object" && !Array.isArray(v)) {
          return (
            <div key={k} className="rounded-xl border border-cream/8 p-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-cream/40 mb-2.5">{humanize(k)}</div>
              <Fields value={v} path={[...path, k]} onChange={onChange} />
            </div>
          );
        }
        if (Array.isArray(v)) {
          return (
            <div key={k} className="flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-cream/40">{humanize(k)}</div>
              {v.map((it, i) => <ItemCard key={i} item={it} index={i} path={[...path, k, i]} onChange={onChange} />)}
            </div>
          );
        }
        return <Leaf key={k} label={humanize(k)} value={v} path={[...path, k]} onChange={onChange} />;
      })}
    </div>
  );
}

/* ── pricing band editor: rows per audience size, From / To columns ── */
function BandTable({ label, unit, group, path, onChange }: { label: string; unit: string; group: { [s: string]: [number, number] }; path: (string | number)[]; onChange: (p: (string | number)[], v: Json) => void }) {
  return (
    <div className="rounded-xl border border-cream/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-cream/45">{humanize(label)}</span>
        {unit && <span className="text-[11px] font-bold text-cream/35">{unit}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[1fr_80px_80px] gap-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-cream/30 px-1">
          <span>Size</span><span>From</span><span>To</span>
        </div>
        {["solo", "growing", "funded"].filter((k) => group[k]).map((sizeKey) => {
          const band = group[sizeKey];
          return (
          <div key={sizeKey} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center">
            <span className="text-[13px] text-cream/70">{SIZE_LABEL[sizeKey] || sizeKey}</span>
            <input type="number" value={band[0]} onChange={(e) => onChange([...path, sizeKey, 0], e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-9 rounded-lg border border-cream/15 bg-ink-deep px-2.5 text-[13px] text-cream outline-none focus:border-mango tabnum" />
            <input type="number" value={band[1]} onChange={(e) => onChange([...path, sizeKey, 1], e.target.value === "" ? 0 : Number(e.target.value))}
              className="h-9 rounded-lg border border-cream/15 bg-ink-deep px-2.5 text-[13px] text-cream outline-none focus:border-mango tabnum" />
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── a single editable field ── */
function Leaf({ label, value, path, onChange }: { label: string; value: Json; path: (string | number)[]; onChange: (p: (string | number)[], v: Json) => void }) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2.5 text-[13.5px] text-cream/80 select-none cursor-pointer">
        <input type="checkbox" checked={value} onChange={(e) => onChange(path, e.target.checked)} className="accent-mango w-4 h-4" />
        {label}
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cream/40">{label}</span>
        <input type="number" value={value} onChange={(e) => onChange(path, e.target.value === "" ? 0 : Number(e.target.value))}
          className="h-10 rounded-lg border border-cream/15 bg-ink-deep px-3 text-[14px] text-cream outline-none focus:border-mango w-40 tabnum" />
      </label>
    );
  }
  const str = String(value ?? "");
  const multiline = str.length > 56 || str.includes("\n");
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cream/40">{label}</span>
      {multiline ? (
        <textarea value={str} rows={Math.min(6, Math.ceil(str.length / 58) + 1)} onChange={(e) => onChange(path, e.target.value)}
          className="rounded-lg border border-cream/15 bg-ink-deep px-3 py-2.5 text-[14px] leading-relaxed text-cream outline-none focus:border-mango resize-y" />
      ) : (
        <input type="text" value={str} onChange={(e) => onChange(path, e.target.value)}
          className="h-10 rounded-lg border border-cream/15 bg-ink-deep px-3 text-[14px] text-cream outline-none focus:border-mango" />
      )}
    </label>
  );
}
