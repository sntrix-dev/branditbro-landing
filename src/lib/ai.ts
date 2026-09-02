import "server-only";

/**
 * AI tailoring for the pricing builder. Given a plain-language description of
 * what someone wants to build ("a streaming platform for indie artists"), it
 * picks the best-fit TYPE and the relevant feature options — constrained to the
 * options the builder actually offers — plus a couple of genuinely-needed
 * extras and a one-line summary.
 *
 *  • Enabled when GEMINI_API_KEY is set (get one free at aistudio.google.com).
 *    Model is configurable via GEMINI_MODEL (default: gemini-2.0-flash).
 *  • With no key, or on any error/timeout, it falls back to a lightweight
 *    keyword heuristic so the feature still works (just less flexibly).
 */

export const aiEnabled = !!process.env.GEMINI_API_KEY;

export interface Opt { key: string; label: string }
export interface TailorInput {
  service: string;            // "website" | "app" | ...
  text: string;               // the user's plain-language description
  industry?: string;
  types: Opt[];               // available type options for this service
  features: Opt[];            // available feature options (key + label)
}
export interface TailorResult {
  type: string | null;        // a valid type key, or null
  features: string[];         // valid feature keys to pre-select
  custom: string[];           // 0–3 short extra items not in the list
  summary: string;            // one plain sentence
  source: "ai" | "fallback";
}

const clampCustom = (arr: unknown): string[] =>
  Array.isArray(arr)
    ? arr.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : [];

/** Pull the first JSON object out of a model response (handles code fences). */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  return JSON.parse(raw.slice(start, end + 1));
}

async function callGemini(input: TailorInput): Promise<TailorResult> {
  const typeKeys = input.types.map((t) => t.key);
  const featKeys = new Set(input.features.map((f) => f.key));

  const system =
    "You configure a digital-agency pricing builder. Given what a customer wants to build, choose the single best-fit TYPE and the relevant FEATURES from ONLY the provided lists, then suggest up to 3 genuinely-needed extras that are NOT already in the feature list. Reply with STRICT JSON only, no prose. Shape: {\"type\": <one type key from the list, or null>, \"features\": [<feature keys from the list>], \"custom\": [<up to 3 short extra items, 2-5 words each>], \"summary\": <one plain, non-salesy sentence describing the build>}. Do not invent keys. Keep custom items concrete and specific to what they described.";

  const user = [
    `Service: ${input.service}`,
    input.industry ? `Industry: ${input.industry}` : "",
    `They want: ${input.text}`,
    "",
    `TYPE options (key — label):`,
    ...input.types.map((t) => `- ${t.key} — ${t.label}`),
    "",
    `FEATURE options (key — label):`,
    ...input.features.map((f) => `- ${f.key} — ${f.label}`),
  ].filter(Boolean).join("\n");

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY as string,
        "content-type": "application/json",
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const parsed = extractJson(text) as { type?: unknown; features?: unknown; custom?: unknown; summary?: unknown };
    const type = typeof parsed.type === "string" && typeKeys.includes(parsed.type) ? parsed.type : null;
    const features = Array.isArray(parsed.features)
      ? (parsed.features.filter((k): k is string => typeof k === "string" && featKeys.has(k)))
      : [];
    return {
      type,
      features: [...new Set(features)],
      custom: clampCustom(parsed.custom),
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      source: "ai",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Keyword heuristic used when the model is unavailable. Coarse but useful. */
function heuristic(input: TailorInput): TailorResult {
  const t = input.text.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  const typeKeys = new Set(input.types.map((x) => x.key));
  const pick = (...cands: string[]) => cands.find((c) => typeKeys.has(c)) || null;

  let type: string | null = null;
  if (input.service === "website") {
    if (has("stream", "ott", "video platform", "music", "podcast", "course", "e-learning", "learning", "community", "social", "portal", "dashboard", "saas", "login", "membership", "web app", "webapp", "platform")) type = pick("webapp");
    else if (has("shop", "store", "ecommerce", "e-commerce", "d2c", "sell", "cart", "checkout", "product")) type = pick("store");
    else if (has("book", "appointment", "salon", "clinic", "table", "reservation", "class", "slot")) type = pick("booking");
    else if (has("landing", "one page", "one-page", "single page", "campaign", "waitlist")) type = pick("landing");
    else type = pick("business", "landing");
  } else if (input.service === "app") {
    if (has("market", "seller", "buyer", "vendor")) type = pick("marketplace");
    else if (has("deliver", "order", "track", "ride", "food", "logistics")) type = pick("ondemand");
    else if (has("saas", "business tool", "internal", "dashboard", "b2b")) type = pick("saas");
    else type = pick("consumer");
  }
  return { type, features: [], custom: input.text ? [input.text.trim()].slice(0, 1) : [], summary: "", source: "fallback" };
}

export async function tailorBuild(input: TailorInput): Promise<TailorResult> {
  if (aiEnabled) {
    try {
      const r = await callGemini(input);
      // If the model returned nothing usable, back off to the heuristic.
      if (r.type || r.features.length || r.custom.length) return r;
    } catch (e) {
      console.error("[ai] tailorBuild failed, using heuristic", e);
    }
  }
  return heuristic(input);
}
