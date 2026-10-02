import "server-only";

/**
 * Launchwing Copilot form forwarding.
 *
 * Every enquiry that hits /api/enquiry (contact page, mobile app, pricing
 * builder) is mirrored to the Launchwing "Contact" form. Best-effort — a
 * Launchwing failure never blocks or fails the enquiry.
 *
 * The form ID + key are PUBLIC (pk_) values meant for browsers, so they're
 * defaulted here. Env vars can override them, but nothing depends on Amplify
 * passing env vars through to the server runtime.
 *
 * Form schema (GET /v1/public/forms/:id):
 *   what_do_you_need  checkboxes  — array, values must be one of OPTIONS
 *   name              text (req, max 60)
 *   whatsapp_number   tel
 *   email             email (REQUIRED)
 *   brand_name        text (max 60)
 *   brief             textarea
 */
const FORM_ID = process.env.LAUNCHWING_FORM_ID || "01a0fdc9-9a28-7000-b581-c99ac22e7dcc";
const KEY = process.env.LAUNCHWING_KEY || "pk_live_KXAKSJEToZEzLz7bJx5Ev4tFOoqazpBHNZ2VvVpsjMa";
const BASE = process.env.LAUNCHWING_API_BASE || "https://api.copilot.launchwing.io";

export const launchwingEnabled = process.env.LAUNCHWING_DISABLED !== "1" && Boolean(FORM_ID && KEY);

const OPTIONS = ["Website", "Mobile app", "Branding", "Marketing", "Video editing", "Not sure yet"] as const;

/** Map whatever label a form used ("A website", "app", "Websites") to a Launchwing option. */
function toOption(label: string): string | null {
  const s = label.toLowerCase();
  if (s.includes("web")) return "Website";
  if (s.includes("app")) return "Mobile app";
  if (s.includes("brand")) return "Branding";
  if (s.includes("market") || s.includes("ads")) return "Marketing";
  if (s.includes("video") || s.includes("reel")) return "Video editing";
  if (s.includes("unsure") || s.includes("not sure")) return "Not sure yet";
  return null;
}

const SITE_ORIGIN = process.env.LAUNCHWING_ORIGIN || "https://branditbro.com";
function originOf(url?: string): string {
  try { return url ? new URL(url).origin : SITE_ORIGIN; } catch { return SITE_ORIGIN; }
}

export interface LaunchwingInput {
  services: string[];
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  brief?: string;
}

export async function submitToLaunchwing(input: LaunchwingInput, pageUrl?: string): Promise<void> {
  if (!launchwingEnabled) return;
  const need = [...new Set(input.services.map(toOption).filter((o): o is string => !!o))]
    .filter((o) => (OPTIONS as readonly string[]).includes(o));

  const fields: Record<string, unknown> = {
    name: input.name.slice(0, 60),
    email: input.email || "",
  };
  if (need.length) fields.what_do_you_need = need;
  if (input.phone) fields.whatsapp_number = input.phone;
  if (input.company) fields.brand_name = input.company.slice(0, 60);
  if (input.brief) fields.brief = input.brief;

  const res = await fetch(`${BASE}/v1/public/forms/${FORM_ID}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Launchwing-Key": KEY,
      // Public (pk_) keys are origin-checked like a browser call would be —
      // a server-side request has no Origin, so send the site's own.
      Origin: originOf(pageUrl),
      Referer: pageUrl || `${originOf(pageUrl)}/`,
    },
    body: JSON.stringify({ fields, pageUrl: pageUrl || "" }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Launchwing ${res.status}: ${detail.slice(0, 500)}`);
  }
}

/* ─────────────────────────── Emailer ───────────────────────────
 * Transactional email through Launchwing Emailer (replaces AWS SES).
 * Content, sender (hello@branditbro.com) and reply-to live in the Launchwing
 * templates — the code only picks a template and fills its variables.
 *
 * Needs LAUNCHWING_SECRET_KEY (an "Emailer only" secret key, server-side).
 * Without it, emails are skipped and logged; enquiries and applications are
 * still saved.
 */
const SECRET = process.env.LAUNCHWING_SECRET_KEY || "";
export const emailerEnabled = Boolean(SECRET);

// Template IDs aren't secret; they're defaulted so only the secret key needs configuring.
// Enquiry auto-reply ("Enquiries · We received your enquiry") is sent by the
// Launchwing Contact form itself, not from code.
export const TEMPLATES = {
  /** "Careers · Application received (to applicant)" — variables: receiver_name, ref, applied_for, reply_days, next_step */
  applicationReceived: process.env.LAUNCHWING_TPL_APPLICATION_RECEIVED || "01a0fe69-2a59-7000-91a3-c4c9615c4828",
  /** "Team · New lead or application alert (internal)" — variables: alert_type, name, email, phone, headline, details, ref */
  teamAlert: process.env.LAUNCHWING_TPL_TEAM_ALERT || "01a0fdfb-95ed-7000-897b-db2fc71e5791",
};

export interface SendEmailInput {
  template: string;
  to: string;
  variables: Record<string, string>;
  /** Same key = same email; protects against double sends on retries. */
  idempotencyKey?: string;
}

export async function sendTemplateEmail(m: SendEmailInput): Promise<string | undefined> {
  if (!emailerEnabled) {
    console.log(`[launchwing] (LAUNCHWING_SECRET_KEY not set — email skipped) template=${m.template} to=${m.to}`);
    return undefined;
  }
  if (!m.template) throw new Error("Launchwing template id missing");
  // Launchwing treats an empty string as "sent" — drop blanks so template defaults apply.
  const variables = Object.fromEntries(Object.entries(m.variables).filter(([, v]) => v != null && String(v).trim() !== ""));
  const res = await fetch(`${BASE}/v1/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
      "Idempotency-Key": m.idempotencyKey || crypto.randomUUID(),
    },
    body: JSON.stringify({ template: m.template, to: m.to, variables }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Launchwing email ${res.status}: ${body.slice(0, 500)}`);
  try { return (JSON.parse(body) as { id?: string }).id; } catch { return undefined; }
}
