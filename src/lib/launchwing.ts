import "server-only";

/**
 * Launchwing Copilot form forwarding.
 *
 * Every enquiry that hits /api/enquiry (contact page, mobile app, pricing
 * builder) is mirrored to the Launchwing form so leads show up there too.
 * Switched on when LAUNCHWING_FORM_ID + LAUNCHWING_KEY are set; best-effort —
 * a Launchwing outage never blocks or fails the enquiry.
 */
const FORM_ID = process.env.LAUNCHWING_FORM_ID || "";
const KEY = process.env.LAUNCHWING_KEY || "";
const BASE = process.env.LAUNCHWING_API_BASE || "https://api.copilot.launchwing.io";

export const launchwingEnabled = Boolean(FORM_ID && KEY);

export interface LaunchwingFields {
  what_do_you_need: string;
  name: string;
  whatsapp_number: string;
  email: string;
}

export async function submitToLaunchwing(fields: LaunchwingFields, pageUrl?: string): Promise<void> {
  if (!launchwingEnabled) return;
  const res = await fetch(`${BASE}/v1/public/forms/${FORM_ID}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Launchwing-Key": KEY },
    body: JSON.stringify({ fields, pageUrl: pageUrl || "" }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Launchwing ${res.status}: ${detail.slice(0, 300)}`);
  }
}
