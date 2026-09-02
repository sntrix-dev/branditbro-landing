import "server-only";
import { dbEnabled, getPool } from "@/lib/db";
import type { InterviewNode, Turn } from "@/lib/interview";

/**
 * Path-keyed cache for interview nodes. The tree of questions the AI builds is
 * expensive the first time and free forever after: each node is stored under a
 * signature of the exact path that leads to it (service + size + industry + the
 * questions/answers so far). The 2nd person down an identical path gets the DB
 * copy — no AI call — so cost trends to zero as common journeys get walked.
 *
 * Degrades cleanly: with no DATABASE_URL every read misses and every write is a
 * no-op, so the engine simply generates (or falls back) every time.
 */

declare global {
  // eslint-disable-next-line no-var
  var __bibInterviewSchema: Promise<void> | undefined;
}

const norm = (s: string) =>
  (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

/** A stable key for "the node that comes after this exact path". */
export function pathKey(service: string, scale: string, industry: string, path: Turn[]): string {
  const head = [norm(service), norm(scale), norm(industry)].join("|");
  const trail = path.map((t) => `${norm(t.q)}=>${norm(t.a)}`).join(">>");
  return `${head}##${trail}`;
}

function ensureSchema(): Promise<void> {
  if (!global.__bibInterviewSchema) {
    global.__bibInterviewSchema = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS pricing_interview_nodes (
           path_key    TEXT        PRIMARY KEY,
           service     TEXT        NOT NULL,
           scale       TEXT,
           industry    TEXT,
           depth       INTEGER     NOT NULL DEFAULT 0,
           node        JSONB       NOT NULL,
           hits        INTEGER     NOT NULL DEFAULT 1,
           created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
           updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
         );`
      )
      .then(() => undefined)
      .catch((e) => {
        global.__bibInterviewSchema = undefined;
        throw e;
      });
  }
  return global.__bibInterviewSchema;
}

export async function getCachedNode(key: string): Promise<InterviewNode | null> {
  if (!dbEnabled) return null;
  try {
    await ensureSchema();
    const { rows } = await getPool().query<{ node: InterviewNode }>(
      `SELECT node FROM pricing_interview_nodes WHERE path_key = $1`,
      [key]
    );
    if (!rows.length) return null;
    getPool()
      .query(`UPDATE pricing_interview_nodes SET hits = hits + 1, updated_at = now() WHERE path_key = $1`, [key])
      .catch(() => {});
    return rows[0].node;
  } catch (e) {
    console.error("[interview-cache] read failed", e);
    return null;
  }
}

export async function putCachedNode(
  key: string,
  meta: { service: string; scale: string; industry: string; depth: number },
  node: InterviewNode
): Promise<void> {
  if (!dbEnabled) return;
  try {
    await ensureSchema();
    await getPool().query(
      `INSERT INTO pricing_interview_nodes (path_key, service, scale, industry, depth, node)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (path_key) DO UPDATE SET hits = pricing_interview_nodes.hits + 1, updated_at = now()`,
      [key, meta.service, meta.scale, meta.industry, meta.depth, JSON.stringify(node)]
    );
  } catch (e) {
    console.error("[interview-cache] write failed", e);
  }
}
