"use client";

import type { CareersContent } from "@/content/careers-schema";
import type { PublicRole } from "@/components/CareersPage";

const INPUT =
  "text-[16px] text-ink py-3.5 px-4 rounded-[14px] border-[1.5px] border-ink/15 bg-[#fffdfa] outline-none w-full box-border transition-colors focus:border-mango";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer py-[9px] px-4 rounded-full text-[14px] font-bold border-[1.5px] transition-colors"
      style={active ? { background: "#16100d", color: "#fff3e4", borderColor: "#16100d" } : { background: "transparent", color: "#16100d", borderColor: "rgba(22,16,13,0.18)" }}>
      {children}
    </button>
  );
}

function CardBtn({ active, onClick, title, meta }: { active: boolean; onClick: () => void; title: string; meta: string }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer text-left flex flex-col gap-1 py-3.5 px-4 rounded-[16px] border-[1.5px] transition-colors"
      style={active ? { background: "#16100d", color: "#fff3e4", borderColor: "#16100d" } : { background: "#fffdfa", color: "#16100d", borderColor: "rgba(22,16,13,0.14)" }}>
      <span className="font-display font-extrabold text-[15.5px] tracking-[-0.02em]">{title}</span>
      <span className="text-[12.5px] leading-[1.35] opacity-70">{meta}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[12.5px] font-bold tracking-[0.02em] text-brown-mid">{children}</span>;
}

export interface ReviewProps {
  careers: CareersContent; roles: PublicRole[]; matched: PublicRole | null;
  isReferral: boolean; didScan: boolean; filledCount: number; sourceName: string;
  warning: string; error: string; submitting: boolean;
  name: string; setName: (s: string) => void; email: string; setEmail: (s: string) => void;
  phone: string; setPhone: (s: string) => void; years: string; setYears: (s: string) => void;
  links: string[]; setLinks: (f: (l: string[]) => string[]) => void; linkDraft: string; setLinkDraft: (s: string) => void; addLink: () => void;
  skills: string[]; setSkills: (f: (s: string[]) => string[]) => void; skillDraft: string; setSkillDraft: (s: string) => void; addSkill: () => void;
  matchKey: string; setMatchKey: (s: string) => void; matchPct: number;
  why: string; setWhy: (s: string) => void; videoLink: string; setVideoLink: (s: string) => void;
  engagement: string; setEngagement: (s: string) => void;
  pay: string; setPay: (s: string) => void; suggestedPay: string; notice: string; setNotice: (s: string) => void;
  hours: string; setHours: (s: string) => void; source: string; setSource: (s: string) => void;
  refCity: string; setRefCity: (s: string) => void; refPayout: string; setRefPayout: (s: string) => void;
  refVolume: string; setRefVolume: (s: string) => void; refWho: string; setRefWho: (s: string) => void;
  onSubmit: () => void;
}

export function Review(p: ReviewProps) {
  const { careers } = p;
  const showSkills = !p.isReferral;
  const payLabel = p.engagement === "fulltime" ? "Expected monthly salary" : p.engagement === "retainer" ? "Expected monthly retainer" : "Your rate";
  const footNote = p.isReferral
    ? "We send the commission terms in writing before your first intro. Nothing is exclusive — you can stop any time."
    : p.didScan
      ? "We only keep what's on this screen. Anything you delete here never reaches us."
      : "Nothing here is checked automatically — a human reads it, within three working days.";

  return (
    <div className="flex flex-col gap-4" style={{ animation: "bibSlideIn 420ms cubic-bezier(.16,.84,.28,1) both" }}>
      {p.didScan && (
        <div className="flex items-start gap-[11px] bg-[#e9f3f0] rounded-[18px] p-[15px_17px]">
          <span className="text-[15px]">✨</span>
          <span className="text-[14.5px] leading-[1.45] text-teal">Filled <strong>{p.filledCount}</strong> fields from {p.sourceName}. Everything below is editable — we're confident, not psychic.</span>
        </div>
      )}
      {!p.didScan && p.warning && (
        <div className="flex items-start gap-[11px] bg-mango/10 rounded-[18px] p-[15px_17px]">
          <span className="text-[15px]">✍️</span>
          <span className="text-[14.5px] leading-[1.45] text-brown-ink">{p.warning}</span>
        </div>
      )}

      {/* You */}
      <div className="bg-white border border-line rounded-[26px] p-[clamp(20px,2.6vw,30px)] flex flex-col gap-[18px]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display font-extrabold text-[22px] tracking-[-0.035em] m-0">You</h2>
          {p.didScan && <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.1em] uppercase text-teal bg-teal/10 py-[3px] px-2 rounded-full">auto-filled</span>}
        </div>
        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
          <label className="flex flex-col gap-1.5"><FieldLabel>Name</FieldLabel><input value={p.name} onChange={(e) => p.setName(e.target.value)} placeholder="First and last" className={INPUT} /></label>
          <label className="flex flex-col gap-1.5"><FieldLabel>Email</FieldLabel><input value={p.email} onChange={(e) => p.setEmail(e.target.value)} inputMode="email" placeholder="you@wherever.com" className={INPUT} /></label>
          <label className="flex flex-col gap-1.5"><FieldLabel>WhatsApp</FieldLabel><input value={p.phone} onChange={(e) => p.setPhone(e.target.value)} inputMode="tel" placeholder="+91 …" className={INPUT} /></label>
          {showSkills && <label className="flex flex-col gap-1.5"><FieldLabel>Years doing this</FieldLabel><input value={p.years} onChange={(e) => p.setYears(e.target.value)} placeholder="2" className={INPUT} /></label>}
        </div>
        <div className="flex flex-col gap-2.5">
          <FieldLabel>Your links</FieldLabel>
          {p.links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {p.links.map((l, i) => (
                <span key={l + i} className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink bg-cream border border-line py-2 pl-[13px] pr-2 rounded-full max-w-full">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[230px]">{l}</span>
                  <button type="button" onClick={() => p.setLinks((ls) => ls.filter((_, j) => j !== i))} aria-label="Remove link" className="cursor-pointer border-0 bg-ink/[0.08] w-5 h-5 rounded-full text-[12px] text-brown-mid shrink-0 hover:bg-chili hover:text-cream">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2.5">
            <input value={p.linkDraft} onChange={(e) => p.setLinkDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); p.addLink(); } }} placeholder="Add another link and hit enter" className={`${INPUT} flex-1 min-w-[200px]`} />
            <button type="button" onClick={p.addLink} className="cursor-pointer text-[14px] font-bold py-[13px] px-[18px] rounded-full bg-transparent text-ink border-[1.5px] border-ink/[0.18] whitespace-nowrap hover:border-ink">Add</button>
          </div>
        </div>
      </div>

      {/* What you do */}
      <div className="bg-white border border-line rounded-[26px] p-[clamp(20px,2.6vw,30px)] flex flex-col gap-[18px]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display font-extrabold text-[22px] tracking-[-0.035em] m-0">What you do</h2>
          {p.didScan && showSkills && <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.1em] uppercase text-teal bg-teal/10 py-[3px] px-2 rounded-full">{p.matchPct}% match</span>}
        </div>

        {p.isReferral ? (
          <span className="text-[12.5px] font-bold text-brown-mid">You&apos;re applying as a referral partner — no skills or portfolio needed.</span>
        ) : (
          <div className="flex flex-col gap-2.5">
            <FieldLabel>{p.didScan ? "Closest fit — change it if we read you wrong" : "Pick the role you're after"}</FieldLabel>
            <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
              {p.roles.map((r) => (
                <CardBtn key={r.key} active={p.matchKey === r.key} onClick={() => p.setMatchKey(r.key)} title={r.title} meta={`${r.mode} · ${r.band}`} />
              ))}
            </div>
          </div>
        )}

        {showSkills && (
          <div className="flex flex-col gap-2.5">
            <FieldLabel>{p.didScan ? "Skills we picked up — drop the ones that aren't you" : "Your skills — add as many as apply"}</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((sk, i) => (
                <span key={sk + i} className="inline-flex items-center gap-2 text-[13.5px] font-bold text-ink bg-sand py-2 pl-[13px] pr-2 rounded-full">
                  {sk}
                  <button type="button" onClick={() => p.setSkills((s) => s.filter((_, j) => j !== i))} aria-label="Remove skill" className="cursor-pointer border-0 bg-ink/10 w-5 h-5 rounded-full text-[12px] text-brown-mid hover:bg-chili hover:text-cream">×</button>
                </span>
              ))}
              <input value={p.skillDraft} onChange={(e) => p.setSkillDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); p.addSkill(); } }} placeholder="+ add a skill" className="text-[13.5px] text-ink py-2 px-3.5 rounded-full border-[1.5px] border-dashed border-ink/20 bg-transparent outline-none w-[150px] focus:border-mango" />
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <FieldLabel>One line on why us <span className="font-medium" style={{ color: "#a8907f" }}>Optional, but it&apos;s the bit we read first</span></FieldLabel>
          <textarea value={p.why} onChange={(e) => p.setWhy(e.target.value)} rows={2} placeholder="“Your pricing page is the first agency site that didn't make me guess.” That level of specific." className={`${INPUT} leading-[1.45] resize-y`} />
        </label>
        {!p.isReferral && (
          <label className="flex flex-col gap-1.5">
            <FieldLabel>60-second video intro <span className="font-medium" style={{ color: "#a8907f" }}>Optional, moves you up the pile</span></FieldLabel>
            <input value={p.videoLink} onChange={(e) => p.setVideoLink(e.target.value)} placeholder="Loom, YouTube or Drive link — one take, no edit" className={INPUT} />
          </label>
        )}
      </div>

      {/* Money & timing */}
      <div className="bg-white border border-line rounded-[26px] p-[clamp(20px,2.6vw,30px)] flex flex-col gap-[18px]">
        <h2 className="font-display font-extrabold text-[22px] tracking-[-0.035em] m-0">Money &amp; timing</h2>

        {!p.isReferral && (
          <>
            <div className="flex flex-col gap-2.5">
              <FieldLabel>How you want to work</FieldLabel>
              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
                {careers.form.engagements.map((e) => (
                  <CardBtn key={e.key} active={p.engagement === e.key} onClick={() => p.setEngagement(e.key)} title={e.label} meta={e.note} />
                ))}
              </div>
            </div>
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
              <label className="flex flex-col gap-1.5">
                <FieldLabel>{payLabel}</FieldLabel>
                <input value={p.pay} onChange={(e) => p.setPay(e.target.value)} placeholder={p.suggestedPay} className={INPUT} />
                {p.suggestedPay && <button type="button" onClick={() => p.setPay(p.suggestedPay)} className="cursor-pointer self-start bg-transparent border-0 p-0 text-[12.5px] font-bold text-brown underline hover:text-ink">Use our band: {p.suggestedPay}</button>}
              </label>
              <label className="flex flex-col gap-1.5">
                <FieldLabel>Notice period / when you can start</FieldLabel>
                <input value={p.notice} onChange={(e) => p.setNotice(e.target.value)} placeholder="Immediately · 30 days · after 12 July" className={INPUT} />
              </label>
            </div>
            <div className="flex flex-col gap-2.5">
              <FieldLabel>Realistic hours a week</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {careers.form.hours.map((h) => (<Chip key={h} active={p.hours === h} onClick={() => p.setHours(p.hours === h ? "" : h)}>{h}</Chip>))}
              </div>
            </div>
          </>
        )}

        {p.isReferral && (
          <>
            <div className="flex flex-col gap-2.5">
              <FieldLabel>Your commission — fixed, non-negotiable, in your favour</FieldLabel>
              <div className="flex items-baseline gap-2 bg-sand rounded-[16px] p-[14px_18px]">
                <span className="font-display font-extrabold text-[32px] leading-none tracking-[-0.04em] text-ink">{careers.referral.pct}%</span>
                <span className="text-[14px] leading-[1.4] text-brown-ink">of every project you bring in, for the first year of that client</span>
              </div>
            </div>
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
              <label className="flex flex-col gap-1.5"><FieldLabel>Where can you make intros?</FieldLabel><input value={p.refCity} onChange={(e) => p.setRefCity(e.target.value)} placeholder="Kochi · Bengaluru · online only" className={INPUT} /></label>
              <label className="flex flex-col gap-1.5"><FieldLabel>Where do we send your money?</FieldLabel><input value={p.refPayout} onChange={(e) => p.setRefPayout(e.target.value)} placeholder="UPI id or bank account" className={INPUT} /></label>
            </div>
            <div className="flex flex-col gap-2.5">
              <FieldLabel>Realistically, how many intros a month?</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {["1–2", "3–5", "5–10", "As many as I can"].map((v) => (<Chip key={v} active={p.refVolume === v} onClick={() => p.setRefVolume(p.refVolume === v ? "" : v)}>{v}</Chip>))}
              </div>
            </div>
            <label className="flex flex-col gap-1.5">
              <FieldLabel>Anyone in mind already? <span className="font-medium" style={{ color: "#a8907f" }}>Optional — no names needed yet</span></FieldLabel>
              <input value={p.refWho} onChange={(e) => p.setRefWho(e.target.value)} placeholder="A salon, two cafés and my uncle's clinic" className={INPUT} />
            </label>
          </>
        )}

        <div className="flex flex-col gap-2.5">
          <FieldLabel>Where&apos;d you find us?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {careers.form.sources.map((s) => (<Chip key={s} active={p.source === s} onClick={() => p.setSource(p.source === s ? "" : s)}>{s}</Chip>))}
          </div>
        </div>
      </div>

      {p.error && <span className="text-[14px] font-semibold text-chili">{p.error}</span>}

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3.5 bg-cream border-t border-line pt-4 pb-2.5">
        <button type="button" onClick={p.onSubmit} disabled={p.submitting} className="cursor-pointer border-0 text-[16.5px] font-bold py-[17px] px-[30px] rounded-full bg-mango text-ink transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60">
          {p.submitting ? "Sending…" : "Send it"}
        </button>
        <span className="text-[13.5px] leading-[1.45] flex-1 min-w-[200px]" style={{ color: "#8a6b5b" }}>{footNote}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════ DONE ═══════════════════════════ */
export function Done({ careers, name, email, appliedTitle, refId, confetti, onBack, onAnother }: {
  careers: CareersContent; name: string; email: string; appliedTitle: string; refId: string;
  confetti: { key: number; style: React.CSSProperties }[]; onBack: () => void; onAnother: () => void;
}) {
  const first = name.trim().split(" ")[0];
  return (
    <section className="px-5 pt-28 pb-24 flex justify-center min-h-screen bg-cream">
      <div className="w-full max-w-[760px] flex flex-col gap-[26px] items-center text-center relative">
        <div className="absolute top-[70px] left-1/2 w-px h-px pointer-events-none">
          {confetti.map((c) => (<span key={c.key} style={c.style} />))}
        </div>
        <div className="relative w-[92px] h-[92px] flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#e9f3f0]" style={{ animation: "bibPop 620ms cubic-bezier(.16,.84,.28,1) both" }} />
          <span className="relative text-[38px]" style={{ animation: "bibPop 620ms 120ms cubic-bezier(.16,.84,.28,1) both" }}>📨</span>
        </div>
        <h1 className="font-display font-extrabold text-[clamp(32px,4.6vw,56px)] leading-[0.98] tracking-[-0.05em] m-0 balance">{first ? `${careers.done.headlinePrefix}, ${first}.` : "That's sent."}</h1>
        <p className="m-0 text-[17px] leading-[1.55] text-brown-ink max-w-[48ch] pretty">Your application for <strong className="text-ink">{appliedTitle}</strong> {careers.done.body.replace("your inbox", email.trim() || "your inbox")}</p>

        <div className="w-full bg-ink text-cream rounded-[28px] p-[clamp(22px,3vw,32px)] flex flex-col gap-5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-mango-soft">Your reference</span>
            <span className="font-display font-extrabold text-[20px] tracking-[0.02em] text-mango tabnum">{refId}</span>
          </div>
          <div className="flex flex-col gap-3.5 border-t border-cream/12 pt-[18px]">
            <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-cream/50">What lands in your inbox next</span>
            {careers.done.steps.map((s, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="font-display font-extrabold text-[14px] text-mango shrink-0 pt-0.5 min-w-[52px]">{s.n}</span>
                <span className="text-[15px] leading-[1.45] text-cream/75">{s.body}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={onBack} className="cursor-pointer border-0 text-[15.5px] font-bold py-4 px-[26px] rounded-full bg-ink text-cream">Back to careers</button>
          <button onClick={onAnother} className="cursor-pointer text-[15.5px] font-bold py-4 px-[26px] rounded-full bg-transparent text-ink border-[1.5px] border-ink/20 hover:border-ink">Apply for another role</button>
        </div>
        <span className="text-[14px] leading-[1.5] max-w-[44ch]" style={{ color: "#8a6b5b" }}>{careers.done.footnote}</span>
      </div>
    </section>
  );
}

/** Confetti burst for the done screen (client-only; random is fine here). */
export function makeConfetti(): { key: number; style: React.CSSProperties }[] {
  const cols = ["#ff7a00", "#e23e2c", "#0e6b5e", "#16100d", "#ff9c5b"];
  return Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2;
    const dist = 90 + Math.random() * 140;
    const w = 6 + Math.round(Math.random() * 5);
    return {
      key: i,
      style: {
        position: "absolute", width: w, height: w + 4, borderRadius: 2, background: cols[i % 5],
        "--dx": `${Math.round(Math.cos(a) * dist)}px`,
        "--dy": `${Math.round(Math.sin(a) * dist + 120)}px`,
        "--rot": `${Math.round(Math.random() * 720 - 360)}deg`,
        animation: `bibConfetti ${1100 + Math.random() * 700}ms cubic-bezier(.16,.84,.28,1) ${Math.round(Math.random() * 160)}ms both`,
      } as React.CSSProperties,
    };
  });
}
