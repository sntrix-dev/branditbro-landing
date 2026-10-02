import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { dbEnabled, saveApplication, getRole, refExists, type ApplicationKind, type NewApplication } from "@/lib/careers";
import { DEFAULT_ROLES, REFERRAL_ROLE } from "@/content/careers-schema";
import { s3Enabled, uploadResume, resumeKey } from "@/lib/s3";
import { sendTemplateEmail, TEMPLATES } from "@/lib/launchwing";
import { getSiteContent } from "@/lib/content";
import {
  clientIp, rateLimit, sniffResume, MAX_RESUME_BYTES,
  clamp, clampList, isValidEmail,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const KINDS: ApplicationKind[] = ["role", "open", "referral"];

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

  const appliedFor = kind === "referral" ? "referral partner application" : roleTitle ? `application for ${roleTitle}` : "application";
  const nextStep = kind === "referral"
    ? "If it is a go, we send the commission terms in writing before your first intro."
    : "If it is a yes, we set up a 30-minute call and one small paid trial task at your rate.";
  // team alert (reply-to on this template is the careers inbox; the applicant's email is in the body)
  try {
    await sendTemplateEmail({
      template: TEMPLATES.teamAlert,
      to: inbox,
      idempotencyKey: `apply-team-${ref}`,
      variables: {
        alert_type: "New application",
        name,
        email,
        phone: app.phone || "",
        headline: roleTitle || (kind === "referral" ? "Referral partner" : "Open application"),
        details: teamText(app, brand),
        ref,
      },
    });
  } catch (err) { console.error("[careers/apply] team email failed", err); }
  // applicant receipt
  try {
    await sendTemplateEmail({
      template: TEMPLATES.applicationReceived,
      to: email,
      idempotencyKey: `apply-receipt-${ref}`,
      variables: {
        receiver_name: name.split(" ")[0],
        ref,
        applied_for: appliedFor,
        reply_days: String(replyDays),
        next_step: nextStep,
      },
    });
  } catch (err) { console.error("[careers/apply] receipt email failed", err); }

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
