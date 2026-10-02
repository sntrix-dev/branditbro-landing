import { NextResponse } from "next/server";
import { dbEnabled, saveLead } from "@/lib/db";
import { linkLead } from "@/lib/pricing-deals";
import { mailEnabled, sendMail } from "@/lib/mailer";
import { getSiteContent } from "@/lib/content";
import { launchwingEnabled, submitToLaunchwing } from "@/lib/launchwing";

export const runtime = "nodejs";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Enquiry {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  note?: string;
  services?: string[];
  est?: string;
  scope?: string;
  source?: string;
  dealId?: number; // links this lead to the analysed quote it came from
  pageUrl?: string; // page the form was submitted from (forwarded to Launchwing)
}

/**
 * Enquiry handler.
 *  • If ENQUIRY_FROM is set (a sender verified in AWS SES), an email is sent to
 *    contact.email via SES. Credentials come from the IAM role or AWS keys.
 *  • Otherwise the enquiry is logged server-side and we still return ok:true,
 *    so the front-end WhatsApp fallback keeps working with zero setup.
 *  • Either way, the lead is persisted first when a database is configured.
 */
export async function POST(req: Request) {
  let data: Enquiry;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!data.name || (!data.email && !data.phone)) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 422 });
  }

  // Recipient + brand name come from the published CMS content, so changing the
  // contact email in /admin takes effect without a redeploy.
  const { site, contact } = await getSiteContent();

  const lines = [
    `New enquiry via ${site.name}`,
    "",
    `Name:     ${data.name}`,
    `Email:    ${data.email || "—"}`,
    `WhatsApp: ${data.phone || "—"}`,
    `Business: ${data.company || "—"}`,
    `Services: ${(data.services || []).join(", ") || "—"}`,
    data.est ? `Estimate: ${data.est}` : "",
    data.scope ? `Scope:    ${data.scope}` : "",
    "",
    "Message:",
    data.note || "—",
  ].filter(Boolean);
  const text = lines.join("\n");

  // Persist the lead when a database is configured. This is best-effort: a DB
  // hiccup must never lose the enquiry, since email/WhatsApp still deliver it —
  // so we log and carry on rather than failing the request.
  if (dbEnabled) {
    try {
      const leadId = await saveLead({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        services: data.services || [],
        est: data.est,
        scope: data.scope,
        note: data.note,
        source: data.source || "web",
      });
      // Tie the lead to its quote so a later "won" mark can label it for the
      // pricing model (best-effort; a bad id just leaves the deal unlinked).
      if (leadId && typeof data.dealId === "number") {
        try { await linkLead(data.dealId, leadId); } catch { /* non-fatal */ }
      }
    } catch (err) {
      console.error("[enquiry] saveLead failed (continuing)", err);
    }
  }

  // Mirror the lead to Launchwing (best-effort, like the DB save above).
  if (launchwingEnabled) {
    const need = [
      (data.services || []).join(", "),
      data.est ? `Estimate: ${data.est}` : "",
      data.scope ? `Scope: ${data.scope}` : "",
      data.company ? `Business: ${data.company}` : "",
      data.note || "",
    ].filter(Boolean).join("\n");
    try {
      await submitToLaunchwing(
        {
          what_do_you_need: need,
          name: data.name,
          whatsapp_number: data.phone || "",
          email: data.email || "",
        },
        data.pageUrl || req.headers.get("referer") || undefined,
      );
    } catch (err) {
      console.error("[enquiry] Launchwing submit failed (continuing)", err);
    }
  }

  if (mailEnabled) {
    try {
      await sendMail({
        from: process.env.ENQUIRY_FROM as string,
        to: contact.email,
        replyTo: data.email || undefined,
        subject: `New enquiry — ${data.name}${data.est ? ` (${data.est})` : ""}`,
        text,
        html: renderHtml(data),
      });
    } catch (err) {
      // The lead is already saved (if a DB is configured) and WhatsApp still
      // delivers client-side, so nothing is lost — but surface the misconfig.
      console.error("[enquiry] SES send failed", err);
      return NextResponse.json({ ok: false, error: "email_error" }, { status: 502 });
    }
  } else {
    // No sender configured yet — log so nothing is lost during setup.
    console.log("[enquiry] (ENQUIRY_FROM not set — SES disabled) →\n" + text);
  }

  return NextResponse.json({ ok: true });
}

/** Simple branded HTML version of the enquiry email. */
function renderHtml(d: Enquiry): string {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:6px 14px 6px 0;color:#6b4a3a;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;color:#16100d;font-size:14px">${esc(value)}</td></tr>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#fff3e4;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eadfd0;border-radius:16px;overflow:hidden">
      <div style="background:#16100d;padding:18px 22px">
        <span style="font-size:18px;font-weight:800;color:#fff3e4;letter-spacing:-0.02em">brandit<span style="color:#ff7a00">bro</span><span style="color:#e23e2c">.</span></span>
        <span style="float:right;color:#ff9c5b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;padding-top:4px">New enquiry</span>
      </div>
      <div style="padding:22px">
        <table style="border-collapse:collapse;width:100%">
          ${row("Name", d.name)}
          ${row("Email", d.email)}
          ${row("WhatsApp", d.phone)}
          ${row("Business", d.company)}
          ${row("Services", (d.services || []).join(", ") || undefined)}
          ${row("Estimate", d.est)}
          ${row("Scope", d.scope)}
        </table>
        ${d.note ? `<div style="margin-top:16px;padding:14px;background:#fff3e4;border-radius:10px;color:#16100d;font-size:14px;line-height:1.5;white-space:pre-wrap">${esc(d.note)}</div>` : ""}
      </div>
    </div>
  </body></html>`;
}
