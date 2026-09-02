"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useContent } from "@/components/ContentProvider";
import type { CareersContent } from "@/content/careers-schema";
import { Review, Done, makeConfetti } from "@/components/CareersApply";

/* ── shape of an open role coming from the server ── */
export interface PublicRole {
  key: string;
  team: string;
  title: string;
  mode: string;
  pay: string;
  band: string;
  blurb: string;
  tags: string[];
  skills: string[];
}

type View = "landing" | "applying" | "done";
type Stage = "intake" | "scan" | "review";
type ApplyKind = "role" | "open" | "referral";

interface ExtractedFields {
  name: string; email: string; phone: string; years: string;
  links: string[]; skills: string[]; summary: string;
  suggestedRoleKey: string | null; matchPct: number;
}

const REFERRAL_KEY = "referral";
const REF_VOLUMES = ["1–2", "3–5", "5–10", "As many as I can"];

export default function CareersPage({
  roles,
  extractEnabled,
}: {
  roles: PublicRole[];
  extractEnabled: boolean;
}) {
  const { careers } = useContent();

  const [view, setView] = useState<View>("landing");
  const [stage, setStage] = useState<Stage>("intake");
  const [kind, setKind] = useState<ApplyKind>("open");
  const [role, setRole] = useState<PublicRole | null>(null);
  const [filter, setFilter] = useState("All roles");

  // intake / scan
  const [link, setLink] = useState("");
  const [dragging, setDragging] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [scanPct, setScanPct] = useState(0);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [scanChips, setScanChips] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  // review fields
  const [didScan, setDidScan] = useState(false);
  const [filledCount, setFilledCount] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [years, setYears] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [matchKey, setMatchKey] = useState<string>(roles[0]?.key || "");
  const [matchPct, setMatchPct] = useState(0);
  const [why, setWhy] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [source, setSource] = useState("");
  const [engagement, setEngagement] = useState("task");
  const [pay, setPay] = useState("");
  const [notice, setNotice] = useState("");
  const [hours, setHours] = useState("");
  // referral
  const [refCity, setRefCity] = useState("");
  const [refPayout, setRefPayout] = useState("");
  const [refVolume, setRefVolume] = useState("");
  const [refWho, setRefWho] = useState("");

  const [extractSource, setExtractSource] = useState<"file" | "link" | "manual">("manual");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refId, setRefId] = useState("");
  const [confetti, setConfetti] = useState<{ key: number; style: React.CSSProperties }[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const scanTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isReferral = kind === "referral";
  const teams = useMemo(() => {
    const t: string[] = [];
    for (const r of roles) if (!t.includes(r.team)) t.push(r.team);
    return ["All roles", ...t];
  }, [roles]);
  const visibleRoles = roles.filter((r) => filter === "All roles" || r.team === filter);
  const matched = roles.find((r) => r.key === matchKey) || roles[0] || null;

  const suggestedPay = useMemo(() => {
    if (isReferral) return `${careers.referral.pct}% of project value`;
    if (!matched) return "";
    if (engagement === "fulltime" || engagement === "retainer") {
      const parts = matched.pay.split(" or ");
      return parts[1] || matched.band;
    }
    return matched.band;
  }, [isReferral, matched, engagement, careers.referral.pct]);

  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const resetForm = () => {
    setLink(""); setResumeFile(null); setSourceName(""); setScanPct(0); setScanLog([]); setScanChips([]);
    setDidScan(false); setFilledCount(0);
    setName(""); setEmail(""); setPhone(""); setYears(""); setLinks([]); setLinkDraft("");
    setSkills([]); setSkillDraft(""); setMatchPct(0); setWhy(""); setVideoLink(""); setSource("");
    setEngagement("task"); setPay(""); setNotice(""); setHours("");
    setRefCity(""); setRefPayout(""); setRefVolume(""); setRefWho("");
    setExtractSource("manual"); setError(""); setWarning("");
  };

  const startApply = (r: PublicRole | null, referral = false) => {
    resetForm();
    setRole(r);
    setKind(referral ? "referral" : r ? "role" : "open");
    setMatchKey(r ? r.key : roles[0]?.key || "");
    setStage(referral ? "review" : "intake");
    setView("applying");
    top();
  };

  const backToLanding = () => { setView("landing"); setStage("intake"); setError(""); top(); };

  /* ── extraction ───────────────────────────────────────────────── */
  const beginScan = useCallback(async (payloadBuilder: () => FormData, srcName: string, src: "file" | "link") => {
    setSourceName(srcName);
    setExtractSource(src);
    setStage("scan");
    setScanning(true);
    setScanPct(6);
    setScanLog([src === "file" ? "Opened the file…" : "Fetching the page…"]);
    setScanChips([]);
    setError(""); setWarning("");

    // animate progress toward ~90% while we wait for the model
    if (scanTimer.current) clearInterval(scanTimer.current);
    scanTimer.current = setInterval(() => {
      setScanPct((p) => (p < 90 ? p + Math.max(1, Math.round((90 - p) * 0.08)) : p));
    }, 180);

    const finish = () => {
      if (scanTimer.current) { clearInterval(scanTimer.current); scanTimer.current = null; }
      setScanning(false);
    };

    try {
      const res = await fetch("/api/careers/extract", { method: "POST", body: payloadBuilder() });
      const j = await res.json();
      finish();
      if (j.ok && j.fields) {
        const f = j.fields as ExtractedFields;
        setScanPct(100);
        setScanLog([
          src === "file" ? "Read your résumé" : "Read the page",
          "Pulled out your details",
          `Matched ${f.skills.length} skills to our roles`,
        ]);
        setScanChips([f.name, f.email, ...f.skills].filter(Boolean).slice(0, 7));
        // fill fields (don't clobber anything the user already typed)
        setName((v) => v || f.name);
        setEmail((v) => v || f.email);
        setPhone((v) => v || f.phone);
        setYears((v) => v || f.years);
        setLinks((v) => (v.length ? v : f.links));
        setSkills((v) => (v.length ? v : f.skills));
        setFilledCount(j.filledCount || 0);
        setMatchPct(f.matchPct || 0);
        if (!role && f.suggestedRoleKey && roles.some((r) => r.key === f.suggestedRoleKey)) {
          setMatchKey(f.suggestedRoleKey);
        }
        setDidScan(true);
        setTimeout(() => { setStage("review"); top(); }, 650);
      } else {
        setWarning(j.warning || "We couldn't read that automatically — fill the form in below (about two minutes).");
        setDidScan(false);
        setStage("review");
        top();
      }
    } catch {
      finish();
      setWarning("Something interrupted the read — fill the form in below.");
      setDidScan(false);
      setStage("review");
      top();
    }
  }, [role, roles]);

  const scanFile = (file: File) => {
    setResumeFile(file);
    beginScan(() => { const fd = new FormData(); fd.append("file", file); return fd; }, file.name, "file");
  };
  const scanLink = () => {
    const v = link.trim();
    if (v.length < 4) return;
    beginScan(() => { const fd = new FormData(); fd.append("link", v); return fd; }, v, "link");
    if (v && !links.includes(v)) setLinks((l) => [...l, v]);
  };
  const skipScan = () => { setDidScan(false); setExtractSource("manual"); setStage("review"); setWarning(""); top(); };

  /* ── list editors ─────────────────────────────────────────────── */
  const addLink = () => { const v = linkDraft.trim(); if (v) { setLinks((l) => [...l, v]); setLinkDraft(""); } };
  const addSkill = () => { const v = skillDraft.trim(); if (v) { setSkills((s) => [...s, v]); setSkillDraft(""); } };

  /* ── submit ───────────────────────────────────────────────────── */
  const submit = async () => {
    if (name.trim().length < 2) { setError("We need a name to call you by."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("That email doesn't look like an email. Check it once?"); return; }
    setError(""); setSubmitting(true);

    const payload = {
      kind,
      roleKey: isReferral ? null : matchKey || null,
      name: name.trim(), email: email.trim(), phone, years,
      links, skills, why, videoLink,
      engagement, pay, notice, hours, source,
      refCity, refPayout, refVolume, refWho,
      matchPct, extractSource,
      website: "", // honeypot stays empty
    };
    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));
    if (resumeFile) fd.append("resume", resumeFile);

    try {
      const res = await fetch("/api/careers/apply", { method: "POST", body: fd });
      const j = await res.json();
      setSubmitting(false);
      if (j.ok && j.ref) {
        setRefId(j.ref);
        setConfetti(makeConfetti());
        setView("done");
        top();
      } else {
        setError(j.message || "Something went wrong sending that. Try once more?");
      }
    } catch {
      setSubmitting(false);
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  };

  /* ── derived copy ─────────────────────────────────────────────── */
  const appliedTitle = role ? role.title : isReferral ? "Referral partner" : didScan && matched ? matched.title : "Open application";
  const appliedNote = isReferral
    ? `Referral partner · no skills needed · ${careers.referral.pct}% of every project you bring in`
    : role ? `${role.team} · ${role.mode} · ${role.pay}`
      : didScan && matched ? `${matched.team} · ${matched.mode} · ${matched.pay}`
        : "Not sure which role? Drop your résumé and we'll work out where you fit.";

  const stageIndex = { intake: 0, scan: 1, review: 2 }[stage];

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-cream text-ink font-sans">
      {view === "landing" && (
        <Landing
          careers={careers}
          teams={teams}
          filter={filter}
          setFilter={setFilter}
          visibleRoles={visibleRoles}
          onApplyRole={(r) => startApply(r)}
          onOpen={() => startApply(null)}
          onReferral={() => startApply(null, true)}
        />
      )}

      {view === "applying" && (
        <section className="px-5 pt-28 pb-24 flex justify-center min-h-screen">
          <div className="w-full max-w-[820px] flex flex-col gap-6">
            {/* header row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={backToLanding} className="bg-transparent border-0 p-0 text-[14px] font-bold text-brown hover:text-ink transition-colors cursor-pointer">← All roles</button>
              <div className="flex items-center gap-2">
                {[["1", "Drop"], ["2", "Read"], ["3", "Check"]].map(([n, label], i) => (
                  <span key={n} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center font-display text-[12px] font-bold"
                      style={{ background: i < stageIndex ? "#0e6b5e" : i === stageIndex ? "#ff7a00" : "rgba(22,16,13,0.08)", color: i < stageIndex ? "#fff3e4" : i === stageIndex ? "#16100d" : "#8a6b5b" }}>
                      {i < stageIndex ? "✓" : n}
                    </span>
                    <span className="text-[13px] font-bold mr-1.5" style={{ color: i === stageIndex ? "#16100d" : "#a8907f" }}>{label}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] tracking-[0.3em] uppercase font-bold text-brown">Applying for</span>
              <h1 className="font-display font-extrabold text-[clamp(26px,3.2vw,40px)] leading-[0.98] tracking-[-0.045em] m-0 balance">{appliedTitle}</h1>
              <span className="text-[14.5px] leading-relaxed text-brown-mid">{appliedNote}</span>
            </div>

            {stage === "intake" && (
              <Intake
                careers={careers}
                extractEnabled={extractEnabled}
                dragging={dragging}
                setDragging={setDragging}
                onFile={scanFile}
                fileRef={fileRef}
                link={link}
                setLink={setLink}
                onScan={scanLink}
                onSkip={skipScan}
              />
            )}

            {stage === "scan" && (
              <Scan sourceName={sourceName} scanPct={scanPct} scanLog={scanLog} scanChips={scanChips} scanning={scanning} />
            )}

            {stage === "review" && (
              <Review
                careers={careers} roles={roles} matched={matched}
                isReferral={isReferral} didScan={didScan} filledCount={filledCount} sourceName={sourceName}
                warning={warning} error={error} submitting={submitting}
                name={name} setName={setName} email={email} setEmail={setEmail}
                phone={phone} setPhone={setPhone} years={years} setYears={setYears}
                links={links} setLinks={setLinks} linkDraft={linkDraft} setLinkDraft={setLinkDraft} addLink={addLink}
                skills={skills} setSkills={setSkills} skillDraft={skillDraft} setSkillDraft={setSkillDraft} addSkill={addSkill}
                matchKey={matchKey} setMatchKey={setMatchKey} matchPct={matchPct}
                why={why} setWhy={setWhy} videoLink={videoLink} setVideoLink={setVideoLink}
                engagement={engagement} setEngagement={setEngagement}
                pay={pay} setPay={setPay} suggestedPay={suggestedPay} notice={notice} setNotice={setNotice}
                hours={hours} setHours={setHours} source={source} setSource={setSource}
                refCity={refCity} setRefCity={setRefCity} refPayout={refPayout} setRefPayout={setRefPayout}
                refVolume={refVolume} setRefVolume={setRefVolume} refWho={refWho} setRefWho={setRefWho}
                onSubmit={submit}
              />
            )}
          </div>
        </section>
      )}

      {view === "done" && (
        <Done careers={careers} name={name} email={email} appliedTitle={appliedTitle} refId={refId}
          confetti={confetti} onBack={backToLanding} onAnother={() => startApply(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════ LANDING ═══════════════════════════ */
function Landing({ careers, teams, filter, setFilter, visibleRoles, onApplyRole, onOpen, onReferral }: {
  careers: CareersContent; teams: string[]; filter: string; setFilter: (t: string) => void;
  visibleRoles: PublicRole[]; onApplyRole: (r: PublicRole) => void; onOpen: () => void; onReferral: () => void;
}) {
  const titleLines = careers.hero.title.split("\n");
  const marquee = careers.marquee.split("·").map((s) => s.trim()).filter(Boolean);
  const pct = careers.referral.pct;
  return (
    <>
      {/* hero */}
      <section className="px-5 pt-28 sm:pt-32 pb-0 flex justify-center">
        <div className="w-full max-w-[1180px] grid gap-11 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] items-end">
          <div className="flex flex-col gap-[22px] min-w-0">
            <span className="text-[12.5px] tracking-[0.3em] uppercase font-bold text-brown">{careers.hero.eyebrow}</span>
            <h1 data-reveal className="font-display font-extrabold text-[clamp(40px,7.4vw,84px)] leading-[0.92] tracking-[-0.05em] m-0 balance">
              {titleLines.map((l, i) => (<span key={i}>{l}{i < titleLines.length - 1 && <br />}</span>))}
              <span className="text-mango" style={{ animation: "bibCaret 1.1s steps(1) infinite" }}>_</span>
            </h1>
            <p data-reveal className="m-0 text-[clamp(16.5px,2vw,19px)] leading-[1.55] text-brown-ink max-w-[44ch] pretty">{careers.hero.subtitle}</p>
            <div data-reveal className="flex flex-wrap gap-3 pt-1">
              <a href="#roles" className="text-[16px] font-bold py-[17px] px-7 rounded-full bg-ink text-cream transition-transform duration-200 hover:-translate-y-0.5">{careers.hero.ctaPrimary}</a>
              <button onClick={onOpen} className="cursor-pointer text-[16px] font-bold py-[17px] px-7 rounded-full bg-transparent text-ink border-[1.5px] border-ink/20 hover:border-ink transition-colors">{careers.hero.ctaSecondary}</button>
            </div>
            <span data-reveal className="text-[13.5px]" style={{ color: "#8a6b5b" }}>{careers.hero.note}</span>
          </div>

          {/* stats card */}
          <div data-reveal className="min-w-0 flex flex-col gap-3.5">
            <div className="bg-ink text-cream rounded-[28px] p-[26px] flex flex-col gap-[18px]" style={{ boxShadow: "0 34px 70px -46px rgba(22,16,13,0.8)" }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-mango-soft">The deal, in numbers</span>
                <span className="inline-flex items-center gap-[7px] text-[12px] font-bold text-mango-soft bg-mango/[0.16] py-1.5 px-[11px] rounded-full">
                  <span className="w-[7px] h-[7px] rounded-full bg-mango inline-block" />Hiring now
                </span>
              </div>
              <div className="grid gap-0.5 [grid-template-columns:repeat(auto-fit,minmax(128px,1fr))]">
                {careers.stats.map((s, i) => (
                  <div key={i} className="py-3.5 px-1 flex flex-col gap-1">
                    <span className="font-display font-extrabold text-[clamp(30px,4vw,42px)] leading-none tracking-[-0.045em] text-mango tabnum">{s.value}</span>
                    <span className="text-[13.5px] leading-[1.4] text-cream/60">{s.label}</span>
                  </div>
                ))}
              </div>
              <span className="text-[12.5px] leading-[1.5] text-cream/40 border-t border-cream/12 pt-3.5">{careers.statsNote}</span>
            </div>
          </div>
        </div>
      </section>

      {/* marquee */}
      <section aria-hidden className="mt-14 bg-ink text-cream py-4 overflow-hidden border-y border-cream/10">
        <div className="flex w-max" style={{ animation: "hvMarquee 34s linear infinite" }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center gap-[26px] pr-[26px] font-display font-extrabold text-[19px] tracking-[-0.02em] whitespace-nowrap lowercase">
              {marquee.map((m, i) => (<span key={i} className="flex items-center gap-[26px]">{m}<span className="text-mango">·</span></span>))}
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="py-[76px] px-5 flex justify-center bg-cream">
        <div className="w-full max-w-[1180px] flex flex-col gap-10">
          <div data-reveal className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] items-start">
            <h2 className="font-display font-extrabold text-[clamp(30px,4.2vw,52px)] leading-[0.98] tracking-[-0.045em] m-0 balance">{careers.how.title}</h2>
            <p className="m-0 text-[16.5px] leading-[1.55] text-brown-ink max-w-[46ch] pretty">{careers.how.body}</p>
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(252px,1fr))]">
            {careers.how.cards.map((c, i) => {
              const dark = i === careers.how.cards.length - 1;
              return (
                <div key={i} data-reveal className={`rounded-[24px] p-[26px] flex flex-col gap-[11px] ${dark ? "bg-ink text-cream" : "bg-white border border-line"}`}>
                  <span className="font-display font-extrabold text-[15px] text-mango">{c.n}</span>
                  <span className="font-display font-extrabold text-[20.5px] tracking-[-0.03em] leading-[1.15]">{c.title}</span>
                  <span className={`text-[15px] leading-[1.5] ${dark ? "text-cream/70" : "text-brown-ink"}`}>{c.body}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* roles */}
      <section id="roles" className="py-[76px] px-5 flex justify-center bg-sand">
        <div className="w-full max-w-[1180px] flex flex-col gap-[30px]">
          <div data-reveal className="grid gap-[22px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] items-end">
            <div className="flex flex-col gap-3">
              <span className="text-[12.5px] tracking-[0.3em] uppercase font-bold text-brown-mid">{careers.roles.eyebrow}</span>
              <h2 className="font-display font-extrabold text-[clamp(30px,4.2vw,52px)] leading-[0.98] tracking-[-0.045em] m-0 balance">{careers.roles.title}</h2>
            </div>
            <p className="m-0 text-[16px] leading-[1.55] text-brown-ink max-w-[42ch] pretty">{careers.roles.body}</p>
          </div>

          {teams.length > 1 && (
            <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter roles by team">
              {teams.map((t) => (
                <button key={t} onClick={() => setFilter(t)} className="cursor-pointer py-[9px] px-4 rounded-full text-[14px] font-bold border-[1.5px] transition-colors"
                  style={filter === t ? { background: "#16100d", color: "#fff3e4", borderColor: "#16100d" } : { background: "transparent", color: "#16100d", borderColor: "rgba(22,16,13,0.18)" }}>
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {visibleRoles.length === 0 && (
              <div className="bg-cream border border-line rounded-[24px] p-6 text-[15px] text-brown-ink">
                No roles open in that team right now — send an open application below and we'll keep it on file.
              </div>
            )}
            {visibleRoles.map((r) => (
              <div key={r.key} className="bg-cream border border-line rounded-[24px] p-6 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] items-center">
                <div className="flex flex-col gap-[9px] min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11.5px] tracking-[0.16em] uppercase font-bold text-brown">{r.team}</span>
                    <span className="text-[11.5px] font-bold text-teal bg-teal/10 py-1 px-[9px] rounded-full">{r.mode}</span>
                  </div>
                  <span className="font-display font-extrabold text-[clamp(21px,2.6vw,27px)] tracking-[-0.035em] leading-[1.08]">{r.title}</span>
                  <span className="text-[15px] leading-[1.5] text-brown-ink max-w-[52ch] pretty">{r.blurb}</span>
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="flex flex-wrap gap-[7px]">
                    {r.tags.map((t) => (<span key={t} className="text-[12.5px] font-medium text-brown-ink border border-ink/[0.14] py-[5px] px-[11px] rounded-full">{t}</span>))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3.5">
                    <button onClick={() => onApplyRole(r)} className="cursor-pointer border-0 text-[15px] font-bold py-3.5 px-6 rounded-full bg-ink text-cream transition-transform duration-200 hover:-translate-y-0.5 hover:bg-mango hover:text-ink">Apply for this</button>
                    <span className="text-[13.5px]" style={{ color: "#8a6b5b" }}>{r.pay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div data-reveal className="bg-ink text-cream rounded-[28px] p-[30px] grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] items-center">
            <div className="flex flex-col gap-[9px] min-w-0">
              <span className="font-display font-extrabold text-[clamp(22px,2.8vw,30px)] tracking-[-0.04em] leading-[1.05]">{careers.roles.openTitle}</span>
              <span className="text-[15.5px] leading-[1.5] text-cream/70 max-w-[50ch] pretty">{careers.roles.openBody}</span>
            </div>
            <div className="flex justify-start">
              <button onClick={onOpen} className="cursor-pointer border-0 text-[16px] font-bold py-[17px] px-7 rounded-full bg-mango text-ink transition-transform duration-200 hover:-translate-y-0.5">{careers.roles.openCta}</button>
            </div>
          </div>
        </div>
      </section>

      {/* referral */}
      <section id="refer" className="py-[76px] px-5 flex justify-center bg-ink text-cream">
        <div className="w-full max-w-[1180px] flex flex-col gap-10">
          <div data-reveal className="grid gap-[30px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] items-end">
            <div className="flex flex-col gap-3.5 min-w-0">
              <span className="text-[12.5px] tracking-[0.3em] uppercase font-bold text-mango-soft">{careers.referral.eyebrow}</span>
              <h2 className="font-display font-extrabold text-[clamp(30px,4.4vw,54px)] leading-[0.96] tracking-[-0.05em] m-0 balance">{careers.referral.title}</h2>
              <p className="m-0 text-[16.5px] leading-[1.55] text-cream/70 max-w-[46ch] pretty">{careers.referral.body}</p>
            </div>
            <div className="flex flex-col gap-2.5 items-start min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-extrabold text-[clamp(72px,11vw,130px)] leading-[0.82] tracking-[-0.06em] text-mango tabnum">{pct}</span>
                <span className="font-display font-extrabold text-[clamp(30px,4vw,48px)] leading-none tracking-[-0.04em] text-mango">%</span>
              </div>
              <span className="text-[15px] leading-[1.5] text-cream/60 max-w-[32ch]">{careers.referral.payoutNote}</span>
            </div>
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {careers.referral.steps.map((s, i) => (
              <div key={i} data-reveal className="border border-cream/15 rounded-[24px] p-6 flex flex-col gap-2.5">
                <span className="font-display font-extrabold text-[15px] text-mango">{s.n}</span>
                <span className="font-display font-extrabold text-[19.5px] tracking-[-0.03em]">{s.title}</span>
                <span className="text-[14.5px] leading-[1.5] text-cream/70">{s.body}</span>
              </div>
            ))}
            <div data-reveal className="bg-sand text-ink rounded-[24px] p-6 flex flex-col gap-2.5">
              <span className="font-display font-extrabold text-[15px] text-brown">Do the maths</span>
              <span className="font-display font-extrabold text-[19.5px] tracking-[-0.03em]">{careers.referral.mathTitle}</span>
              <span className="text-[14.5px] leading-[1.5] text-brown-ink">{careers.referral.mathBody}</span>
            </div>
          </div>
          <div data-reveal className="grid gap-[22px] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] items-center border-t border-cream/15 pt-[30px]">
            <div className="flex flex-col gap-2 min-w-0">
              <span className="font-display font-extrabold text-[clamp(20px,2.4vw,26px)] tracking-[-0.035em] leading-[1.1]">{careers.referral.signupTitle}</span>
              <span className="text-[15px] leading-[1.5] text-cream/60 max-w-[48ch] pretty">{careers.referral.signupBody}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={onReferral} className="cursor-pointer border-0 text-[16px] font-bold py-[17px] px-7 rounded-full bg-mango text-ink transition-transform duration-200 hover:-translate-y-0.5">{careers.referral.cta}</button>
            </div>
          </div>
        </div>
      </section>

      {/* process */}
      <section id="process" className="py-[76px] px-5 flex justify-center bg-cream">
        <div className="w-full max-w-[1180px] flex flex-col gap-[38px]">
          <div data-reveal className="grid gap-[22px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] items-end">
            <h2 className="font-display font-extrabold text-[clamp(30px,4.2vw,52px)] leading-[0.98] tracking-[-0.045em] m-0 balance">{careers.process.title}</h2>
            <p className="m-0 text-[16px] leading-[1.55] text-brown-ink max-w-[44ch] pretty">{careers.process.body}</p>
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {careers.process.steps.map((s, i) => (
              <div key={i} data-reveal className="flex flex-col gap-3 pt-[18px]" style={{ borderTop: `2px solid ${i === careers.process.steps.length - 1 ? "#ff7a00" : "#16100d"}` }}>
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="font-display font-extrabold text-[38px] leading-none tracking-[-0.05em] text-mango">{s.n}</span>
                  <span className="text-[12px] font-bold tracking-[0.14em] uppercase text-brown-mid">{s.dur}</span>
                </div>
                <span className="font-display font-extrabold text-[19px] tracking-[-0.03em]">{s.title}</span>
                <span className="text-[14.5px] leading-[1.5] text-brown-ink">{s.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="py-[76px] px-5 flex justify-center bg-sand">
        <div className="w-full max-w-[1180px] grid gap-11 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] items-start">
          <h2 data-reveal className="font-display font-extrabold text-[clamp(30px,4.2vw,48px)] leading-[0.98] tracking-[-0.045em] m-0 balance">{careers.faq.title}</h2>
          <div data-reveal className="flex flex-col gap-5">
            {careers.faq.items.map((f, i) => (
              <div key={i} className={`flex flex-col gap-1.5 ${i < careers.faq.items.length - 1 ? "border-b border-ink/15 pb-[18px]" : ""}`}>
                <span className="text-[16.5px] font-bold">{f.question}</span>
                <span className="text-[15.5px] leading-[1.5] text-brown-ink">{f.answer}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="py-20 px-5 flex justify-center bg-cream">
        <div className="w-full max-w-[1180px] flex flex-col items-center gap-[22px] text-center">
          <h2 data-reveal className="font-display font-extrabold text-[clamp(32px,5vw,62px)] leading-[0.95] tracking-[-0.05em] m-0 max-w-[22ch] balance">{careers.finalCta.title}</h2>
          <p data-reveal className="m-0 text-[16.5px] leading-[1.55] text-brown-ink max-w-[46ch] pretty">{careers.finalCta.body}</p>
          <button data-reveal onClick={onOpen} className="cursor-pointer border-0 text-[17px] font-bold py-[19px] px-[34px] rounded-full bg-mango text-ink transition-transform duration-200 hover:-translate-y-0.5">{careers.finalCta.button}</button>
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════ INTAKE ═══════════════════════════ */
function Intake({ careers, extractEnabled, dragging, setDragging, onFile, fileRef, link, setLink, onScan, onSkip }: {
  careers: CareersContent; extractEnabled: boolean; dragging: boolean; setDragging: (b: boolean) => void;
  onFile: (f: File) => void; fileRef: React.RefObject<HTMLInputElement | null>;
  link: string; setLink: (s: string) => void; onScan: () => void; onSkip: () => void;
}) {
  const canScan = link.trim().length > 3;
  return (
    <div className="bg-white border border-line rounded-[26px] p-[clamp(20px,2.6vw,30px)] flex flex-col gap-[22px]" style={{ animation: "bibSlideIn 420ms cubic-bezier(.16,.84,.28,1) both" }}>
      <div className="flex flex-col gap-[7px]">
        <h2 className="font-display font-extrabold text-[clamp(24px,3vw,34px)] leading-[1.02] tracking-[-0.04em] m-0">{careers.form.intakeTitle}</h2>
        <p className="m-0 text-[15.5px] leading-[1.5] text-brown-mid max-w-[52ch]">
          {extractEnabled ? careers.form.intakeBody : "Drop a résumé or paste a link, then confirm your details — it only takes a minute or two."}
        </p>
      </div>

      <div role="button" tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); if (!dragging) setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter") fileRef.current?.click(); }}
        className="cursor-pointer rounded-[22px] p-[30px_22px] flex items-center justify-center min-h-[168px] transition-colors"
        style={{ border: `2px dashed ${dragging ? "#ff7a00" : "rgba(22,16,13,0.2)"}`, background: dragging ? "rgba(255,122,0,0.06)" : "#fffdfa" }}>
        <div className="flex flex-col items-center gap-[11px] text-center pointer-events-none">
          <span className="w-[54px] h-[54px] rounded-[18px] bg-sand flex items-center justify-center text-[23px]" style={{ animation: "bibDrift 3.4s ease-in-out infinite" }}>⬆</span>
          <span className="font-display font-extrabold text-[19px] tracking-[-0.03em] text-ink">Drop your résumé here</span>
          <span className="text-[14px] leading-[1.45] text-brown-mid max-w-[38ch]">PDF, DOC, DOCX · up to 8&nbsp;MB · or click to browse</span>
        </div>
        <input ref={fileRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} type="file" accept=".pdf,.doc,.docx" className="hidden" />
      </div>

      <div className="flex items-center gap-3.5">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[12px] font-bold tracking-[0.16em] uppercase" style={{ color: "#a8907f" }}>or paste a link</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-wrap gap-2.5 items-center">
        <input value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && canScan) onScan(); }}
          placeholder="yoursite.com · linkedin.com/in/you · github.com/you"
          className="text-[16px] text-ink py-3.5 px-4 rounded-[14px] border-[1.5px] border-ink/15 bg-[#fffdfa] outline-none w-full box-border transition-colors focus:border-mango flex-1 min-w-[220px]" />
        <button onClick={onScan} disabled={!canScan} className="cursor-pointer border-0 text-[15.5px] font-bold py-3.5 px-6 rounded-full whitespace-nowrap transition-transform duration-200 disabled:cursor-not-allowed"
          style={canScan ? { background: "#ff7a00", color: "#16100d" } : { background: "#f1e4d4", color: "#a8907f" }}>
          {canScan ? "Read it →" : "Read it"}
        </button>
      </div>
      <span className="text-[13.5px] leading-[1.5]" style={{ color: "#8a6b5b" }}>
        Nothing to show? <button onClick={onSkip} className="cursor-pointer bg-transparent border-0 p-0 text-[13.5px] font-bold text-brown underline hover:text-ink">Fill it in by hand</button> — takes about two minutes.
      </span>
    </div>
  );
}

/* ═══════════════════════════ SCAN ═══════════════════════════ */
function Scan({ sourceName, scanPct, scanLog, scanChips, scanning }: {
  sourceName: string; scanPct: number; scanLog: string[]; scanChips: string[]; scanning: boolean;
}) {
  return (
    <div className="bg-white border border-line rounded-[26px] p-[clamp(20px,2.6vw,30px)] flex flex-col gap-6" style={{ animation: "bibSlideIn 380ms cubic-bezier(.16,.84,.28,1) both" }}>
      <div className="flex items-center gap-4">
        <span className="relative w-[56px] h-[56px] shrink-0 rounded-[18px] bg-sand flex items-center justify-center overflow-hidden">
          <span className="text-[22px]">📄</span>
          {scanning && <span className="absolute left-0 right-0 h-4" style={{ background: "linear-gradient(180deg,rgba(255,122,0,0),rgba(255,122,0,0.6),rgba(255,122,0,0))", animation: "bibScan 1.05s linear infinite" }} />}
        </span>
        <span className="flex flex-col gap-1 min-w-0">
          <span className="font-display font-extrabold text-[20px] tracking-[-0.03em] text-ink truncate">Reading {sourceName}</span>
          <span className="text-[14px] text-brown-mid">{Math.min(100, Math.round(scanPct))}% · this takes a couple of seconds</span>
        </span>
      </div>
      <span className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
        <span className="block h-full bg-mango rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, scanPct)}%` }} />
      </span>
      <div className="flex flex-col gap-2.5">
        {scanLog.map((l, i) => (
          <span key={i} className="flex items-baseline gap-2.5 text-[14.5px] text-brown-ink" style={{ animation: "bibSlideIn 300ms cubic-bezier(.16,.84,.28,1) both" }}>
            <span className="text-teal font-bold">✓</span>{l}
          </span>
        ))}
      </div>
      {scanChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {scanChips.map((c, i) => (<span key={i} className="text-[13px] font-bold text-ink bg-sand py-[7px] px-[13px] rounded-full" style={{ animation: "bibPop 420ms cubic-bezier(.16,.84,.28,1) both" }}>{c}</span>))}
        </div>
      )}
    </div>
  );
}

