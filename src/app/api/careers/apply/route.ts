import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { dbEnabled, saveApplication, getRole, refExists, type ApplicationKind, type NewApplication } from "@/lib/careers";
import { DEFAULT_ROLES, REFERRAL_ROLE } from "@/content/careers-schema";
import { s3Enabled, uploadResume, resumeKey } from "@/lib/s3";
import { mailEnabled, sendMail } from "@/lib/mailer";
import { getSiteContent } from "@/lib/content";
import {
  clientIp, rateLimit, sniffResume, MAX_RESUME_BYTES,
  clamp, clampList, isValidEmail,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const KINDS: ApplicationKind[] = ["role", "open", "referral"];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Payload {
  kind?: string; roleKey?: string;
  name?: string; email?: string; phone?: string; years?: string;
  links?: unknown; skills?: unknown; why?: string; videoLink?: string;
  engagement?: string; pay?: string; notice?: string; hours?: string; source?: string;
  refCity?: string; refPayout?: string; refVolume?: string; refWho?: string;
  matchPct?: number; extractSource?: string;
  website?: string; // honeypot — real users never see or fill this
}

async function uniqueRef(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const ref = "BB-" + String(randomInt(1000, 10000));
    if (!dbEnabled) return ref;
    try { if (!(await refExists(ref))) return ref; } catch { return ref; }
  }
  return "BB-" + String(randomInt(1000, 10000));
}

async function roleTitleFor(kind: ApplicationKind, key: string | null): Promise<string | null> {
  if (kind === "referral") return REFERRAL_ROLE.title;
  if (!key) return null;
  try {
    if (dbEnabled) { const r = await getRole(key); if (r) return r.title; }
  } catch { /* ignore */ }
  return DEFAULT_ROLES.find((r) => r.key === key)?.title ?? null;
}

/**
 * POST /api/careers/apply  (multipart form-data)
 *   `payload` : JSON of the application fields
 *   `resume`  : optional résumé file
 *
 * Order: rate-limit → honeypot → validate → upload résumé (S3) → store (DB) →
 * email (applicant receipt + team alert). Storage/email are best-effort and
 * never lose an application that passed validation — the applicant always gets
 * their reference id back.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`apply:${clientIp(req)}`, 6, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", message: "You've sent a few already — give it a few minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  let payload: Payload;
  try { payload = JSON.parse(String(form.get("payload") || "{}")); }
  catch { return NextResponse.json({ ok: false, error: "bad_payload" }, { status: 400 }); }

  // ── honeypot: pretend success, store nothing ──
  if (clamp(payload.website, 100)) {
    return NextResponse.json({ ok: true, ref: "BB-" + String(randomInt(1000, 10000)) });
  }

  // ── validate + sanitise ──
  const kind: ApplicationKind = KINDS.includes(payload.kind as ApplicationKind) ? (payload.kind as ApplicationKind) : "open";
  const name = clamp(payload.name, 120);
  const email = clamp(payload.email, 254);
  if (name.length < 2) return NextResponse.json({ ok: false, error: "missing_name", message: "We need a name to call you by." }, { status: 422 });
  if (!isValidEmail(email)) return NextResponse.json({ ok: false, error: "bad_email", message: "That email doesn't look right — check it once?" }, { status: 422 });

  const roleKey = clamp(payload.roleKey, 40) || null;
  const roleTitle = await roleTitleFor(kind, roleKey);
  const ref = await uniqueRef();

  // ── résumé upload (best-effort) ──
  let resKey: string | null = null;
  let resName: string | null = null;
  const extractSource = clamp(payload.extractSource, 12) || "manual";
  const resume = form.get("resume");
  if (resume && typeof resume !== "string" && resume.size > 0) {
    if (resume.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ ok: false, error: "resume_too_large", message: "That résumé is over 8 MB." }, { status: 413 });
    }
    const bytes = new Uint8Array(await resume.arrayBuffer());
    const rkind = sniffResume(bytes);
    // Best-effort: an unreadable/odd file is dropped, never blocks a valid
    // application (the résumé is optional at submit — the form already has the
    // parsed fields). Only a genuine PDF/Word file is stored.
    if (rkind !== "unknown") {
      resName = clamp(resume.name, 200) || `resume.${rkind}`;
      if (s3Enabled) {
        const now = new Date();
        const key = resumeKey(ref, rkind, now.getUTCFullYear(), now.getUTCMonth() + 1);
        try {
          await uploadResume(key, bytes, rkind, resName);
          resKey = key;
        } catch (err) {
          console.error("[careers/apply] S3 upload failed (continuing)", err);
        }
      }
    }
  }

  const app: NewApplication = {
    ref, kind, roleKey, roleTitle,
    name, email,
    phone: clamp(payload.phone, 40) || null,
    years: clamp(payload.years, 24) || null,
    links: clampList(payload.links, 8, 300),
    skills: clampList(payload.skills, 12, 60),
    why: clamp(payload.why, 1000) || null,
    videoLink: clamp(payload.videoLink, 400) || null,
    engagement: clamp(payload.engagement, 20) || null,
    pay: clamp(payload.pay, 80) || null,
    notice: clamp(payload.notice, 120) || null,
    hours: clamp(payload.hours, 40) || null,
    source: clamp(payload.source, 60) || null,
    refCity: clamp(payload.refCity, 120) || null,
    refPayout: clamp(payload.refPayout, 160) || null,
    refVolume: clamp(payload.refVolume, 40) || null,
    refWho: clamp(payload.refWho, 300) || null,
    resumeKey: resKey,
    resumeName: resName,
    extractSource,
    matchPct: typeof payload.matchPct === "number" ? Math.max(0, Math.min(100, Math.round(payload.matchPct))) : null,
  };

  // ── store (best-effort) ──
  if (dbEnabled) {
    try { await saveApplication(app); }
    catch (err) { console.error("[careers/apply] saveApplication failed (continuing)", err); }
  }

  // ── email (best-effort) ──
  const content = await getSiteContent();
  const inbox = content.careers?.inboxEmail?.trim() || content.contact.email;
  const brand = content.site.name;
  const replyDays = content.careers?.replyDays ?? 3;

  if (mailEnabled) {
    const from = process.env.ENQUIRY_FROM as string;
    // team alert
    try {
      await sendMail({
        from, to: inbox, replyTo: email,
        subject: `New application — ${name}${roleTitle ? ` · ${roleTitle}` : ""} (${ref})`,
        text: teamText(app, brand),
        html: teamHtml(app),
      });
    } catch (err) { console.error("[careers/apply] team email failed", err); }
    // applicant receipt
    try {
      await sendMail({
        from, to: email, replyTo: inbox,
        subject: `We've got your application — ${ref}`,
        text: receiptText(name, ref, roleTitle, kind, replyDays, brand),
        html: receiptHtml(name, ref, roleTitle, kind, replyDays),
      });
    } catch (err) { console.error("[careers/apply] receipt email failed", err); }
  } else {
    console.log(`[careers/apply] (SES off) new application ${ref}\n` + teamText(app, brand));
  }

  return NextResponse.json({ ok: true, ref });
}

/* ── email bodies ─────────────────────────────────────────────── */

function teamText(a: NewApplication, brand: string): string {
  const skills = a.skills ?? [];
  const links = a.links ?? [];
  return [
    `New ${a.kind} application via ${brand}`,
    `Ref:       ${a.ref}`,
    a.roleTitle ? `Role:      ${a.roleTitle}` : "",
    `Name:      ${a.name}`,
    `Email:     ${a.email}`,
    `WhatsApp:  ${a.phone || "—"}`,
    a.years ? `Experience: ${a.years} yrs` : "",
    skills.length ? `Skills:    ${skills.join(", ")}` : "",
    links.length ? `Links:     ${links.join("  ")}` : "",
    a.engagement ? `Engagement: ${a.engagement}` : "",
    a.pay ? `Pay:       ${a.pay}` : "",
    a.notice ? `Notice:    ${a.notice}` : "",
    a.hours ? `Hours/wk:  ${a.hours}` : "",
    a.refCity ? `Intro area: ${a.refCity}` : "",
    a.refPayout ? `Payout:    ${a.refPayout}` : "",
    a.refVolume ? `Volume:    ${a.refVolume}` : "",
    a.refWho ? `In mind:   ${a.refWho}` : "",
    a.source ? `Source:    ${a.source}` : "",
    a.resumeName ? `Résumé:    ${a.resumeName}${a.resumeKey ? " (in S3)" : " (not stored)"}` : "",
    a.videoLink ? `Video:     ${a.videoLink}` : "",
    a.why ? `\nWhy us:\n${a.why}` : "",
  ].filter(Boolean).join("\n");
}

function row(label: string, value?: string | null) {
  return value
    ? `<tr><td style="padding:6px 14px 6px 0;color:#6b4a3a;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;color:#16100d;font-size:14px">${esc(value)}</td></tr>`
    : "";
}

function teamHtml(a: NewApplication): string {
  return `<!doctype html><html><body style="margin:0;background:#fff3e4;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #eadfd0;border-radius:16px;overflow:hidden">
      <div style="background:#16100d;padding:18px 22px">
        <span style="font-size:18px;font-weight:800;color:#fff3e4;letter-spacing:-0.02em">brandit<span style="color:#ff7a00">bro</span><span style="color:#e23e2c">.</span></span>
        <span style="float:right;color:#ff9c5b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;padding-top:4px">New application · ${esc(a.ref)}</span>
      </div>
      <div style="padding:22px">
        <table style="border-collapse:collapse;width:100%">
          ${row("Role", a.roleTitle)}${row("Kind", a.kind)}${row("Name", a.name)}${row("Email", a.email)}
          ${row("WhatsApp", a.phone)}${row("Experience", a.years ? a.years + " yrs" : null)}
          ${row("Skills", (a.skills ?? []).join(", ") || null)}${row("Links", (a.links ?? []).join("  ·  ") || null)}
          ${row("Engagement", a.engagement)}${row("Pay", a.pay)}${row("Notice", a.notice)}${row("Hours/wk", a.hours)}
          ${row("Intro area", a.refCity)}${row("Payout", a.refPayout)}${row("Volume", a.refVolume)}${row("In mind", a.refWho)}
          ${row("Source", a.source)}${row("Résumé", a.resumeName ? a.resumeName + (a.resumeKey ? " (in S3 — download from admin)" : " (not stored)") : null)}
          ${row("Video", a.videoLink)}
        </table>
        ${a.why ? `<div style="margin-top:16px;padding:14px;background:#fff3e4;border-radius:10px;color:#16100d;font-size:14px;line-height:1.5;white-space:pre-wrap">${esc(a.why)}</div>` : ""}
      </div>
    </div>
  </body></html>`;
}

function receiptText(name: string, ref: string, roleTitle: string | null, kind: ApplicationKind, replyDays: number, brand: string): string {
  const what = kind === "referral" ? "referral partner application" : roleTitle ? `application for ${roleTitle}` : "application";
  return [
    `Hi ${name.split(" ")[0]},`,
    "",
    `Thanks — we've got your ${what}. Your reference is ${ref}.`,
    "",
    `What happens next:`,
    `• Now — this receipt, so you know it arrived.`,
    `• Within ${replyDays} working days — a real reply from a person on the team, yes or no.`,
    kind === "referral"
      ? `• If it's a go — we send the commission terms in writing before your first intro.`
      : `• If it's a yes — a 30-minute call and one small paid trial task at your rate.`,
    "",
    `No need to follow up before then — chasing doesn't move you up the pile, and not chasing doesn't move you down.`,
    "",
    `— ${brand}`,
  ].join("\n");
}

function receiptHtml(name: string, ref: string, roleTitle: string | null, kind: ApplicationKind, replyDays: number): string {
  const steps = [
    ["NOW", "A receipt with everything you sent, so you know it arrived."],
    [`≤${replyDays}d`, "A real reply from a person on the team. Yes or no, you'll know."],
    kind === "referral"
      ? ["IF GO", "We send the commission terms in writing before your first intro."]
      : ["IF YES", "A 30-minute call slot and the brief for one small paid trial task."],
  ];
  return `<!doctype html><html><body style="margin:0;background:#fff3e4;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eadfd0;border-radius:16px;overflow:hidden">
      <div style="background:#16100d;padding:20px 22px">
        <span style="font-size:18px;font-weight:800;color:#fff3e4;letter-spacing:-0.02em">brandit<span style="color:#ff7a00">bro</span><span style="color:#e23e2c">.</span></span>
      </div>
      <div style="padding:24px 22px">
        <h1 style="margin:0 0 6px;font-size:22px;color:#16100d">Got it, ${esc(name.split(" ")[0])}.</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#4a3730">Your ${roleTitle ? esc(roleTitle) + " " : ""}application is in. Reference <strong>${esc(ref)}</strong>.</p>
        <div style="background:#16100d;border-radius:14px;padding:18px 20px">
          ${steps.map(([k, v]) => `<div style="display:flex;gap:12px;margin:8px 0"><span style="color:#ff7a00;font-weight:800;font-size:13px;min-width:52px">${k}</span><span style="color:rgba(255,243,228,0.8);font-size:14px;line-height:1.4">${esc(v)}</span></div>`).join("")}
        </div>
        <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#8a6b5b">No need to follow up before then — we mean the ${replyDays} days.</p>
      </div>
    </div>
  </body></html>`;
}
