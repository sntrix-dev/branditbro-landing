import "server-only";
import { lookup } from "node:dns/promises";
import { lookup as dnsLookupCb, type LookupAddress } from "node:dns";
import { Agent, fetch as undiciFetch } from "undici";
import mammoth from "mammoth";
import type { ResumeKind } from "@/lib/security";

/**
 * Résumé / link → structured fields, powered by Google Gemini.
 *
 * Why Gemini: a real free tier (Google AI Studio), native multimodal PDF
 * understanding (no separate parser — it OCRs scanned/image résumés too), a
 * 1M-token context and first-class JSON-schema output. The cheapest paid model,
 * gemini-2.5-flash-lite, is a fraction of a cent per résumé.
 *
 *   • Enabled when GEMINI_API_KEY is set (`extractEnabled`). Until then the
 *     apply flow still works — applicants just fill the form by hand.
 *   • PDFs are sent to Gemini natively as a document part. DOCX is converted to
 *     text with mammoth. Links are fetched server-side (SSRF-guarded) and
 *     reduced to text.
 *   • PRIVACY: the free tier may use submitted content to improve Google's
 *     models. For real candidate PII, run a paid key (still near-free) — see
 *     .env.example. The model id is configurable via GEMINI_MODEL.
 */

export const extractEnabled = !!process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const API = "https://generativelanguage.googleapis.com/v1beta/models";

export interface ExtractedFields {
  name: string;
  email: string;
  phone: string;
  years: string;
  links: string[];
  skills: string[];
  summary: string;
  suggestedRoleKey: string | null;
  matchPct: number;
}

export interface RoleHint { key: string; title: string; skills: string[]; hints: string[] }

export interface ExtractResult {
  ok: boolean;
  fields?: ExtractedFields;
  /** Plain-text we pulled from the source (stored/trimmed by the caller). */
  text?: string;
  error?: string;
  /** Non-fatal note surfaced to the applicant (e.g. a link we couldn't read). */
  warning?: string;
}

const EMPTY: ExtractedFields = {
  name: "", email: "", phone: "", years: "", links: [], skills: [], summary: "",
  suggestedRoleKey: null, matchPct: 0,
};

/* ── public entry points ─────────────────────────────────────────── */

export async function extractFromFile(
  bytes: Uint8Array,
  kind: ResumeKind,
  roles: RoleHint[]
): Promise<ExtractResult> {
  if (!extractEnabled) return { ok: false, error: "disabled" };
  try {
    if (kind === "pdf") {
      const b64 = Buffer.from(bytes).toString("base64");
      return await callGemini(roles, [
        { text: userPrompt(roles) },
        { inlineData: { mimeType: "application/pdf", data: b64 } },
      ]);
    }
    if (kind === "docx") {
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      const text = value.trim();
      if (!text) return { ok: false, error: "empty_document" };
      return await callGemini(roles, [{ text: userPrompt(roles) + "\n\nRÉSUMÉ TEXT:\n" + cap(text, 20000) }], text);
    }
    // Legacy .doc — no reliable text layer without extra tooling.
    return { ok: false, error: "unsupported_doc", warning: "We couldn't read that .doc — please upload a PDF or DOCX, or fill the form in by hand." };
  } catch (err) {
    console.error("[extract] file failed", err);
    return { ok: false, error: "parse_error" };
  }
}

export async function extractFromUrl(url: string, roles: RoleHint[]): Promise<ExtractResult> {
  if (!extractEnabled) return { ok: false, error: "disabled" };
  let text: string;
  try {
    text = await fetchReadable(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    return { ok: false, error: msg, warning: "We couldn't open that link — some sites (LinkedIn especially) block automated reads. Paste another link or fill the form in by hand." };
  }
  if (!text || text.length < 40) {
    return { ok: false, error: "too_little", warning: "That page didn't give us much to read. Add another link or fill the form in by hand." };
  }
  return await callGemini(roles, [{ text: userPrompt(roles) + "\n\nSOURCE URL: " + url + "\n\nPAGE TEXT:\n" + cap(text, 20000) }], text);
}

/* ── Gemini call ─────────────────────────────────────────────────── */

function userPrompt(roles: RoleHint[]): string {
  const roleList = roles.map((r) => `- ${r.key}: ${r.title} (skills: ${r.skills.join(", ")})`).join("\n");
  return [
    "You are parsing a job applicant's résumé or portfolio for a small digital agency.",
    "Extract ONLY what is actually present. Never invent a name, email, phone or skill.",
    "If a field is not present, return an empty string (or empty array).",
    "Rules:",
    "- name: the person's full name.",
    "- email: a single valid email if present.",
    "- phone: include country code if shown; digits/spaces/+ only.",
    "- years: approximate total years of professional experience as a short string (e.g. \"3\"); empty if unclear.",
    "- links: portfolio / LinkedIn / GitHub / Behance / personal-site URLs found (max 6, de-duplicated).",
    "- skills: concrete skills/tools (max 8), most relevant first.",
    "- summary: one neutral sentence describing what they do.",
    "- suggestedRoleKey: the single best match from the roles below by key, or empty string if none fit well.",
    "- matchPct: 0-100 confidence that they fit the suggested role (0 if none).",
    "",
    "OPEN ROLES:",
    roleList || "(none provided)",
  ].join("\n");
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    email: { type: "STRING" },
    phone: { type: "STRING" },
    years: { type: "STRING" },
    links: { type: "ARRAY", items: { type: "STRING" } },
    skills: { type: "ARRAY", items: { type: "STRING" } },
    summary: { type: "STRING" },
    suggestedRoleKey: { type: "STRING" },
    matchPct: { type: "INTEGER" },
  },
  required: ["name", "email", "phone", "years", "links", "skills", "summary", "suggestedRoleKey", "matchPct"],
  propertyOrdering: ["name", "email", "phone", "years", "links", "skills", "summary", "suggestedRoleKey", "matchPct"],
} as const;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

async function callGemini(roles: RoleHint[], parts: GeminiPart[], sourceText?: string): Promise<ExtractResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const res = await fetch(`${API}/${encodeURIComponent(MODEL)}:generateContent`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[extract] gemini http", res.status, body.slice(0, 300));
      return { ok: false, error: "provider_error" };
    }
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") ;
    if (!text) return { ok: false, error: "no_output" };
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return { ok: false, error: "bad_json" }; }
    return { ok: true, fields: normalize(parsed, roles), text: sourceText };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return { ok: false, error: "timeout" };
    console.error("[extract] gemini failed", err);
    return { ok: false, error: "provider_error" };
  } finally {
    clearTimeout(timer);
  }
}

function normalize(raw: unknown, roles: RoleHint[]): ExtractedFields {
  if (!raw || typeof raw !== "object") return { ...EMPTY };
  const o = raw as Record<string, unknown>;
  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const list = (v: unknown, n: number, max: number) => {
    if (!Array.isArray(v)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const it of v) {
      const s = str(it, max);
      if (!s || seen.has(s.toLowerCase())) continue;
      seen.add(s.toLowerCase());
      out.push(s);
      if (out.length >= n) break;
    }
    return out;
  };
  let key = str(o.suggestedRoleKey, 40) || null;
  if (key && !roles.some((r) => r.key === key)) key = null;
  let pct = typeof o.matchPct === "number" ? Math.round(o.matchPct) : parseInt(String(o.matchPct || 0), 10) || 0;
  pct = Math.max(0, Math.min(100, pct));
  return {
    name: str(o.name, 120),
    email: str(o.email, 254),
    phone: str(o.phone, 40),
    years: str(o.years, 24),
    links: list(o.links, 6, 300),
    skills: list(o.skills, 8, 60),
    summary: str(o.summary, 300),
    suggestedRoleKey: key,
    matchPct: pct,
  };
}

/* ── SSRF-safe readable fetch ─────────────────────────────────────── */

function isPrivateIp(ip: string): boolean {
  // IPv6
  if (ip.includes(":")) {
    const l = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0]; // strip brackets + zone id
    // IPv4-mapped / -compatible → normalise to the v4 form and re-check
    if (l.startsWith("::ffff:") || l.startsWith("::")) {
      const rest = l.replace(/^::(ffff:)?/, "");
      if (rest.includes(".")) return isPrivateIp(rest);           // ::ffff:127.0.0.1
      const g = rest.split(":");                                   // ::ffff:7f00:1  (hex form)
      if (g.length === 2) {
        const hi = parseInt(g[0], 16), lo = parseInt(g[1], 16);
        if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
          return isPrivateIp(`${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`);
        }
      }
    }
    return l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80");
  }
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true; // treat unparseable as unsafe
  const [a, b] = p;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||          // link-local incl. cloud metadata 169.254.169.254
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    a >= 224                              // multicast / reserved
  );
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("blocked_host");
  }
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new Error("dns_failed");
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked_host");
}

/**
 * A dispatcher whose connect step re-checks the ACTUAL resolved IP against the
 * private ranges. This closes the DNS-rebinding / TOCTOU gap: even if the
 * pre-flight `assertPublicHost` lookup returned a public IP, a rebinding domain
 * that flips to 127.0.0.1 / 169.254.169.254 at connect time is refused here.
 */
const ssrfDispatcher = new Agent({
  connect: {
    // undici calls the custom lookup with all:true and expects (err, LookupAddress[]).
    // Note: for a URL that is already a literal IP, undici skips DNS entirely — those
    // are caught first by assertPublicHost(); this guard covers hostnames (incl. a
    // rebinding domain that flips to a private IP at connect time).
    lookup(hostname: string, options: object, cb: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void) {
      dnsLookupCb(hostname, { ...(options as object), all: true }, (err, addresses) => {
        if (err) return cb(err, []);
        const list = addresses as LookupAddress[];
        if (!list.length) return cb(new Error("dns_empty") as NodeJS.ErrnoException, []);
        for (const a of list) if (isPrivateIp(a.address)) return cb(new Error("blocked_private_ip") as NodeJS.ErrnoException, []);
        cb(null, list);
      });
    },
  },
});

/** Fetch a URL as text with SSRF protection, manual redirect re-validation,
 *  a timeout that covers the whole read, and a hard size cap. Uses undici's
 *  fetch directly so the SSRF dispatcher is guaranteed to apply (Next patches
 *  the global fetch) and so the scrape is never framework-cached. */
async function fetchReadable(rawUrl: string): Promise<string> {
  let url: URL;
  try { url = new URL(rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl); } catch { throw new Error("bad_url"); }

  for (let hop = 0; hop < 4; hop++) {
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("bad_protocol");
    await assertPublicHost(url.hostname); // fast pre-flight; the dispatcher is the authoritative guard

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000); // covers headers AND body read
    try {
      const res = await undiciFetch(url, {
        signal: ctrl.signal,
        redirect: "manual",
        dispatcher: ssrfDispatcher,
        headers: {
          "User-Agent": "branditbro-careers/1.0 (+https://branditbro.com/careers)",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
        },
      });

      // follow a redirect, but re-validate the target host each hop
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) throw new Error("bad_redirect");
        url = new URL(loc, url);
        continue;
      }
      if (!res.ok) throw new Error("http_" + res.status);

      const ctype = res.headers.get("content-type") || "";
      if (ctype && !/text\/html|text\/plain|application\/xhtml|application\/json/i.test(ctype)) throw new Error("not_readable");

      // size-capped read (still under the abort timer)
      const reader = res.body?.getReader();
      if (!reader) return "";
      const chunks: Uint8Array[] = [];
      let total = 0;
      const CAP = 2 * 1024 * 1024; // 2 MB
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          total += value.length;
          if (total > CAP) { reader.cancel().catch(() => {}); break; }
        }
      }
      return htmlToText(Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8"));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("too_many_redirects");
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function cap(s: string, n: number): string { return s.length > n ? s.slice(0, n) : s; }
