import "server-only";

/**
 * Shared security helpers for the public careers endpoints:
 *   • a best-effort in-memory rate limiter,
 *   • client-IP extraction from proxy headers,
 *   • file-type sniffing by magic bytes (never trust the client MIME),
 *   • string clamping + email validation.
 *
 * The rate limiter is per-process (fine behind a single Node instance or as a
 * first line of defence on serverless). For hard multi-instance guarantees put
 * a WAF / API-gateway rate rule in front — this stops casual abuse and runaway
 * clients without extra infra.
 */

// ── rate limiting ────────────────────────────────────────────────
interface Bucket { count: number; resetAt: number }
declare global {
  // eslint-disable-next-line no-var
  var __bibRate: Map<string, Bucket> | undefined;
}
const buckets: Map<string, Bucket> = (global.__bibRate ??= new Map());

export interface RateResult { ok: boolean; remaining: number; retryAfter: number }

/** Fixed-window limiter. Returns ok=false with retryAfter (seconds) when over. */
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // opportunistic cleanup so the map can't grow unbounded
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

/**
 * Best-effort client IP for rate-limiting.
 *
 * X-Forwarded-For is "client, proxy1, proxy2…": the LEFTMOST entry is
 * client-supplied and trivially spoofable, so we must NOT key limits on it.
 * We take the RIGHTMOST entry (appended by your own edge and not attacker-
 * controllable) by default. If you sit behind N trusted proxies that each
 * append a hop, set RATE_LIMIT_PROXY_HOPS=N to step that many entries in from
 * the right and recover the true client IP.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) {
      const hops = parseInt(process.env.RATE_LIMIT_PROXY_HOPS || "0", 10);
      const idx = Math.min(Math.max(parts.length - 1 - (Number.isFinite(hops) ? hops : 0), 0), parts.length - 1);
      return parts[idx];
    }
  }
  return req.headers.get("x-real-ip") || "unknown";
}

// ── file sniffing ────────────────────────────────────────────────
export type ResumeKind = "pdf" | "docx" | "doc" | "unknown";

/** Detect the real file type from magic bytes, ignoring the declared name/MIME. */
export function sniffResume(bytes: Uint8Array): ResumeKind {
  // PDF: "%PDF"
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";
  // ZIP container ("PK\x03\x04") → modern Office (.docx). Confirmed as docx downstream.
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) return "docx";
  // Legacy OLE compound file ("D0 CF 11 E0 A1 B1 1A E1") → old .doc
  if (
    bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 && bytes[5] === 0xb1 && bytes[6] === 0x1a && bytes[7] === 0xe1
  ) return "doc";
  return "unknown";
}

export const MAX_RESUME_BYTES = 8 * 1024 * 1024; // 8 MB, matches the design copy

// ── strings ──────────────────────────────────────────────────────
/** Trim + hard-cap a string; returns "" for non-strings. */
export function clamp(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length > max ? s.slice(0, max) : s;
}

/** Clamp and de-duplicate a list of short strings (tags, skills, links). */
export function clampList(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of v) {
    const s = clamp(item, maxLen);
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function isValidEmail(v: string): boolean {
  const s = v.trim();
  return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
