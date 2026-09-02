import "server-only";

/**
 * The adaptive pricing interview engine.
 *
 * Instead of a fixed form, the builder asks ONE question at a time and grows
 * the questionnaire as it goes. Given the path so far — service, company size,
 * industry, and every question already answered — this returns the *next* node:
 * either another question (with concrete options, each carrying a price, plus an
 * always-available "something else" escape hatch) or a "done" signal once enough
 * is known to price the project.
 *
 * Prices are AI-decided (the owner's explicit choice), but the model is handed
 * the agency's real price levels as reference so the numbers land in a realistic
 * Indian small-business range rather than anywhere. Every node is cached by its
 * path upstream of here, so the same journey always yields the same node — and
 * the same price.
 *
 *  • Live generation when GEMINI_API_KEY is set (get one free at
 *    aistudio.google.com). Model via GEMINI_MODEL (default gemini-2.0-flash).
 *  • With no key or on any error, a compact deterministic fallback script keeps
 *    the flow working (two sizing questions, then a price).
 */

export const interviewEnabled = !!process.env.GEMINI_API_KEY;

/** One prior answer in the path. */
export interface Turn { q: string; a: string }

/** Reference price levels (from the admin-editable content) so AI numbers stay
 *  grounded. All optional — the engine copes with a partial context. */
export interface PriceContext {
  website?: Record<string, number>;
  app?: Record<string, number>;
  branding?: number;
  marketing?: number;
  video?: number;
}

export interface InterviewInput {
  service: string;   // "website" | "app"
  scale: string;     // human label, e.g. "A small business"
  industry: string;  // the (possibly custom) industry, e.g. "Gaming"
  path: Turn[];       // answers so far, in order
  price: PriceContext;
}

export interface NodeOption {
  key: string;       // slug, stable within a node
  label: string;     // what the buyer reads
  hint: string;      // one short clarifying line
  amount: number;    // ₹ added to the quote if picked (0 = free/included)
}

export interface InterviewNode {
  done: boolean;
  /** First node only: the base line item for the core build. */
  base?: { label: string; amount: number };
  question?: string;          // the question to ask
  help?: string;              // one supporting line
  options?: NodeOption[];     // concrete choices
  allowCustom?: boolean;      // show the "something else" field
  customPrompt?: string;      // placeholder for that field
  closing?: string;           // shown when done:true
  source: "ai" | "fallback";
}

const round500 = (n: number) => Math.max(0, Math.round(n / 500) * 500);

/* ── Gemini structured generation ─────────────────────────────────── */

function contextLine(p: PriceContext): string {
  const bits: string[] = [];
  if (p.website) bits.push(`websites by type: ${Object.entries(p.website).map(([k, v]) => `${k} ₹${v}`).join(", ")}`);
  if (p.app) bits.push(`apps by type: ${Object.entries(p.app).map(([k, v]) => `${k} ₹${v}`).join(", ")}`);
  if (p.branding) bits.push(`branding ₹${p.branding}`);
  if (p.marketing) bits.push(`marketing ₹${p.marketing}/mo`);
  if (p.video) bits.push(`video ₹${p.video}/mo`);
  return bits.join("; ");
}

async function callGemini(input: InterviewInput): Promise<InterviewNode> {
  const answered = input.path.length;
  const system = [
    "You are the pricing brain of an Indian digital agency (branditbro). You run a short, smart intake to price a project — like a sharp account manager, not a form.",
    "Ask ONE question at a time. Each question must have 2–5 concrete options tailored to THIS specific industry and company size — not generic. Every option needs a realistic ₹ (INR) price effect: how much it adds to the quote (0 if it's included/negligible).",
    "The FIRST question must also return a `base` line item: the core build price for this kind of project, grounded in the reference levels you're given.",
    "Only ask what genuinely changes the price. Stop EARLY — 2 to 4 questions total is ideal, never more than 5. The moment you can give an exact price, set done:true.",
    "Prices are yours to decide but MUST be realistic for the Indian small-business market and consistent with the reference levels provided. Round every amount to the nearest ₹500.",
    "Always set allowCustom:true so the buyer can type something you didn't list. Keep labels plain and non-salesy. Never repeat a question already answered.",
  ].join(" ");

  const user = [
    `Service: ${input.service}`,
    `Company size: ${input.scale}`,
    `Industry: ${input.industry}`,
    `Reference price levels: ${contextLine(input.price) || "(none provided)"}`,
    "",
    answered
      ? `Answers so far:\n${input.path.map((t, i) => `${i + 1}. ${t.q} → ${t.a}`).join("\n")}`
      : "No questions asked yet. Return the first question AND the base line item.",
    "",
    `Return the ${answered ? "next" : "first"} node. If you already have enough to price this exactly, return done:true with a closing line and no question.`,
  ].join("\n");

  const responseSchema = {
    type: "object",
    properties: {
      done: { type: "boolean" },
      base: {
        type: "object",
        properties: { label: { type: "string" }, amount: { type: "number" } },
      },
      question: { type: "string" },
      help: { type: "string" },
      options: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string" },
            label: { type: "string" },
            hint: { type: "string" },
            amount: { type: "number" },
          },
          required: ["key", "label", "amount"],
        },
      },
      allowCustom: { type: "boolean" },
      customPrompt: { type: "string" },
      closing: { type: "string" },
    },
    required: ["done"],
  };

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 14_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY as string, "content-type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 900, responseMimeType: "application/json", responseSchema },
      }),
    });
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const raw = JSON.parse(text) as Partial<InterviewNode>;
    return normalize(raw, answered === 0);
  } finally {
    clearTimeout(timer);
  }
}

/** Coerce/clean a raw model node into a safe InterviewNode. */
function normalize(raw: Partial<InterviewNode>, isFirst: boolean): InterviewNode {
  const done = !!raw.done;
  const options: NodeOption[] = Array.isArray(raw.options)
    ? raw.options
        .filter((o): o is NodeOption => !!o && typeof o.label === "string")
        .slice(0, 5)
        .map((o, i) => ({
          key: (typeof o.key === "string" && o.key) || `opt${i}`,
          label: o.label.trim(),
          hint: typeof o.hint === "string" ? o.hint.trim() : "",
          amount: round500(Number(o.amount) || 0),
        }))
    : [];
  const base =
    raw.base && typeof raw.base.label === "string"
      ? { label: raw.base.label.trim(), amount: round500(Number(raw.base.amount) || 0) }
      : undefined;
  if (done) {
    return { done: true, closing: typeof raw.closing === "string" ? raw.closing.trim() : "", source: "ai", base: isFirst ? base : undefined };
  }
  return {
    done: false,
    base: isFirst ? base : undefined,
    question: typeof raw.question === "string" ? raw.question.trim() : "",
    help: typeof raw.help === "string" ? raw.help.trim() : "",
    options,
    allowCustom: raw.allowCustom !== false, // default true
    customPrompt: typeof raw.customPrompt === "string" ? raw.customPrompt.trim() : "Something else — tell us",
    source: "ai",
  };
}

/* ── Deterministic fallback (no key / error) ──────────────────────────
   A compact two-question script so the flow always works. Amounts derive
   from the reference levels so it stays in a sane range. */
function fallback(input: InterviewInput): InterviewNode {
  const answered = input.path.length;
  const web = input.price.website || {};
  const app = input.price.app || {};
  const baseMid = input.service === "app" ? app.consumer || 260000 : web.business || 80000;
  const unit = Math.max(6000, round500(baseMid * 0.12));

  if (answered === 0) {
    return {
      done: false,
      base: { label: `${input.industry} ${input.service} — core build`, amount: round500(baseMid) },
      question: `What will people mainly do on your ${input.service}?`,
      help: "This sets the shape of the build.",
      options: [
        { key: "learn", label: "Browse & learn about you", hint: "Info, pages, contact.", amount: 0 },
        { key: "buy", label: "Buy or pay online", hint: "Catalogue, cart, payments.", amount: round500(unit * 3) },
        { key: "book", label: "Book or sign up", hint: "Slots, forms, reminders.", amount: round500(unit * 2) },
        { key: "tool", label: "Log in & use a tool", hint: "Accounts, dashboards.", amount: round500(unit * 4) },
      ],
      allowCustom: true,
      customPrompt: "Something else — describe it",
      source: "fallback",
    };
  }
  if (answered === 1) {
    return {
      done: false,
      question: "Roughly how big is it?",
      help: "A rough size is fine — we'll firm it up together.",
      options: [
        { key: "small", label: "Small & focused", hint: "A handful of pages/screens.", amount: 0 },
        { key: "medium", label: "A proper build", hint: "Around ten, a few flows.", amount: round500(unit * 2) },
        { key: "large", label: "Big / ongoing", hint: "Lots of screens, keeps growing.", amount: round500(unit * 5) },
      ],
      allowCustom: true,
      customPrompt: "Something else — describe it",
      source: "fallback",
    };
  }
  return {
    done: true,
    closing: "That's enough to price it — here's your estimate.",
    source: "fallback",
  };
}

export async function nextNode(input: InterviewInput): Promise<InterviewNode> {
  if (interviewEnabled) {
    try {
      const n = await callGemini(input);
      // Guard against an empty non-done node (no question, no options).
      if (n.done || (n.question && n.options && n.options.length)) return n;
    } catch (e) {
      console.error("[interview] generate failed, using fallback", e);
    }
  }
  return fallback(input);
}

/* ── Holistic AI pricing pass (the "analyse at the end" quote) ─────────
   Given the whole scope, produce ONE considered quote + a short breakdown,
   grounded in the agency's reference levels. Returns null when AI is
   unavailable, so the caller can fall back to the running estimate. */
export interface QuoteItem { label: string; amount: number }
export interface AiQuote { total: number; items: QuoteItem[]; rationale: string }

export async function aiQuote(input: InterviewInput): Promise<AiQuote | null> {
  if (!interviewEnabled) return null;
  const system = [
    "You are the pricing lead at an Indian digital agency (branditbro). Given the full agreed scope of a project, produce ONE fair fixed quote in INR for the build, with a short itemised breakdown.",
    "Ground every number in the reference price levels provided and the Indian small-business market. The breakdown's amounts should sum to the total. Round every amount to the nearest ₹500.",
    "Reply with STRICT JSON only: {\"total\": <int>, \"items\": [{\"label\": <string>, \"amount\": <int>}], \"rationale\": <one plain sentence>}.",
  ].join(" ");
  const user = [
    `Service: ${input.service}`,
    `Company size: ${input.scale}`,
    `Industry: ${input.industry}`,
    `Reference price levels: ${contextLine(input.price) || "(none)"}`,
    "",
    "Agreed scope (their answers):",
    ...input.path.map((t, i) => `${i + 1}. ${t.q} → ${t.a}`),
  ].join("\n");
  const responseSchema = {
    type: "object",
    properties: {
      total: { type: "number" },
      items: { type: "array", items: { type: "object", properties: { label: { type: "string" }, amount: { type: "number" } }, required: ["label", "amount"] } },
      rationale: { type: "string" },
    },
    required: ["total", "items"],
  };
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 14_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY as string, "content-type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 700, responseMimeType: "application/json", responseSchema },
      }),
    });
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const raw = JSON.parse(text) as { total?: unknown; items?: unknown; rationale?: unknown };
    const total = round500(Number(raw.total) || 0);
    const items: QuoteItem[] = Array.isArray(raw.items)
      ? raw.items
          .filter((it): it is QuoteItem => !!it && typeof (it as QuoteItem).label === "string")
          .map((it) => ({ label: (it as QuoteItem).label.trim(), amount: round500(Number((it as QuoteItem).amount) || 0) }))
          .slice(0, 12)
      : [];
    if (!total) return null;
    return { total, items, rationale: typeof raw.rationale === "string" ? raw.rationale.trim() : "" };
  } catch (e) {
    console.error("[interview] aiQuote failed", e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
