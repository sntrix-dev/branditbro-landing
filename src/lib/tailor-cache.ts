import "server-only";
import { dbEnabled, getPool } from "@/lib/db";
import type { TailorResult } from "@/lib/ai";

/**
 * Persistent cache for pricing-builder tailoring results.
 *
 * Why this exists: turning a free-text ask ("a streaming platform for indie
 * artists") into a type + option set costs one AI call. But most asks repeat —
 * the 50th person who types "online store" wants exactly what the 1st got. So
 * we store each resolved answer keyed by a normalised (service + text) key, and
 * serve future identical asks straight from Postgres. AI only ever fires on a
 * genuinely-new phrasing, so cost trends to zero as the site is used.
 *
 * Degrades cleanly: with no DATABASE_URL the whole thing is a no-op (reads
 * return null, writes do nothing) and the builder falls back to a live AI call
 * or the keyword heuristic — exactly as if the cache weren't here.
 */

/** Stored payload — the AI's picks minus the transient `source` field. */
export type CachedTailor = Omit<TailorResult, "source">;

declare global {
  // eslint-disable-next-line no-var
  var __bibTailorSchema: Promise<void> | undefined;
}

/** Normalise an ask to a stable cache key: lowercased, punctuation-stripped,
 *  whitespace-collapsed, and namespaced by service so "store" as a website vs
 *  an app never collide. */
export function tailorKey(service: string, text: string): string {
  const norm = (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${(service || "").toLowerCase()}|${norm}`;
}

function ensureTailorSchema(): Promise<void> {
  if (!global.__bibTailorSchema) {
    global.__bibTailorSchema = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS pricing_tailor_cache (
           key         TEXT        PRIMARY KEY,
           service     TEXT        NOT NULL,
           text        TEXT        NOT NULL,
           result      JSONB       NOT NULL,
           hits        INTEGER     NOT NULL DEFAULT 1,
           created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
           updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
         );`
      )
      .then(() => undefined)
      .catch((e) => {
        global.__bibTailorSchema = undefined;
        throw e;
      });
  }
  return global.__bibTailorSchema;
}

/** Look up a cached result for this ask. Returns null on miss, no DB, or any
 *  error. Bumps the hit counter fire-and-forget (never blocks the response). */
export async function getCachedTailor(
  service: string,
  text: string
): Promise<CachedTailor | null> {
  if (!dbEnabled) return null;
  try {
    await ensureTailorSchema();
    const key = tailorKey(service, text);
    const { rows } = await getPool().query<{ result: CachedTailor }>(
      `SELECT result FROM pricing_tailor_cache WHERE key = $1`,
      [key]
    );
    if (!rows.length) return null;
    // fire-and-forget usage bump
    getPool()
      .query(
        `UPDATE pricing_tailor_cache SET hits = hits + 1, updated_at = now() WHERE key = $1`,
        [key]
      )
      .catch(() => {});
    return rows[0].result;
  } catch (e) {
    console.error("[tailor-cache] read failed", e);
    return null;
  }
}

/** Store a freshly-resolved result. First writer wins on conflict (identical
 *  asks resolve to the same answer, so there's nothing to overwrite). Silent on
 *  no DB or error — caching is best-effort, never load-bearing. */
export async function putCachedTailor(
  service: string,
  text: string,
  result: CachedTailor
): Promise<void> {
  if (!dbEnabled) return;
  try {
    await ensureTailorSchema();
    const key = tailorKey(service, text);
    await getPool().query(
      `INSERT INTO pricing_tailor_cache (key, service, text, result)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE SET hits = pricing_tailor_cache.hits + 1, updated_at = now()`,
      [key, service, text, JSON.stringify(result)]
    );
  } catch (e) {
    console.error("[tailor-cache] write failed", e);
  }
}
