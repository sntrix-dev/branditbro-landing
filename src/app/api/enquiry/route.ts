import { NextResponse } from "next/server";
import { dbEnabled, saveLead } from "@/lib/db";
import { linkLead } from "@/lib/pricing-deals";
import { getSiteContent } from "@/lib/content";
import { launchwingEnabled, submitToLaunchwing, sendTemplateEmail, TEMPLATES } from "@/lib/launchwing";

export const runtime = "nodejs";

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
  // The Launchwing Contact form requires an email, so WhatsApp-only leads (and
  // the pricing builder, which only asks for a phone) skip it and go straight
  // to the team alert below.
  let launchwing = !launchwingEnabled ? "disabled" : data.email ? "ok" : "skipped_no_email";
  if (launchwingEnabled && data.email) {
    const brief = [
      data.note || "",
      data.est ? `Estimate: ${data.est}` : "",
      data.scope ? `Scope: ${data.scope}` : "",
      data.source && data.source !== "web" ? `Source: ${data.source}` : "",
    ].filter(Boolean).join("\n");
    try {
      await submitToLaunchwing(
        {
          services: data.services || [],
          name: data.name,
          phone: data.phone,
          email: data.email,
          company: data.company,
          brief,
        },
        data.pageUrl || req.headers.get("referer") || undefined,
      );
    } catch (err) {
      console.error("[enquiry] Launchwing submit failed (continuing)", err);
      launchwing = err instanceof Error ? err.message.slice(0, 300) : "error";
    }
  }

  // Emails: the Launchwing "Contact" form sends the customer auto-reply and the
  // team alert itself. If the form submission failed, alert the team directly
  // through the Emailer so the lead is never silent.
  if (launchwing !== "ok") {
    try {
      await sendTemplateEmail({
        template: TEMPLATES.teamAlert,
        to: contact.email,
        variables: {
          alert_type: "New enquiry",
          name: data.name,
          email: data.email || "",
          phone: data.phone || "",
          headline: (data.services || []).join(", ") || "Enquiry",
          details: text,
          ref: data.source || "web",
        },
      });
    } catch (err) {
      console.error("[enquiry] fallback team alert failed", err);
    }
    console.log("[enquiry] →\n" + text);
  }

  return NextResponse.json({ ok: true, launchwing });
}
