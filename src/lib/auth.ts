/**
 * Minimal, dependency-free session auth for the single-owner admin.
 *
 * A login checks the password against ADMIN_PASSWORD, then issues a signed,
 * http-only cookie holding only an expiry timestamp. The signature is an
 * HMAC-SHA256 over the payload using ADMIN_SESSION_SECRET (falls back to the
 * password). Everything uses Web Crypto (globalThis.crypto.subtle) so the SAME
 * code verifies the cookie in the Edge middleware and issues it in the Node
 * route — no per-runtime branches.
 */

export const ADMIN_COOKIE = "bib_admin";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

function secretBytes(): Uint8Array {
  const s =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "branditbro-dev-secret-change-me";
  return new TextEncoder().encode(s);
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < b.length; i++) str += String.fromCharCode(b[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes() as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload) as BufferSource
  );
  return b64url(sig);
}

/** Constant-time string compare (avoids leaking match length via timing). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function passwordOk(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  return timingSafeEqual(input, expected);
}

export async function createSession(): Promise<string> {
  const payload = b64url(
    new TextEncoder().encode(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }))
  );
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(payload);
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const json = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0)
        )
      )
    );
    return typeof json.exp === "number" && json.exp > Date.now();
  } catch {
    return false;
  }
}
