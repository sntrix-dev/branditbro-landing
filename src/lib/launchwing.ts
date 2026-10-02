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
    headers: { "Content-Type": "application/json", "X-Launchwing-Key": KEY },
    body: JSON.stringify({ fields, pageUrl: pageUrl || "" }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Launchwing ${res.status}: ${detail.slice(0, 500)}`);
  }
}
