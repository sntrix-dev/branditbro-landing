import "server-only";
import { Pool } from "pg";

/**
 * Postgres data layer for enquiries (leads).
 *
 * Design goals:
 *  • Zero-config safety: with no DATABASE_URL the whole app still runs — the
 *    site, the WhatsApp fallback and email all work; only lead *storage* and
 *    the admin dashboard need a database. `dbEnabled` gates that cleanly.
 *  • Portable: plain SQL over `pg`, so it runs on AWS RDS, Neon, Supabase or a
 *    local Postgres with the same connection string. No migration engine.
 *  • Serverless-friendly: a single module-level pool is reused across
 *    invocations; the schema is created once, lazily, and memoised.
 */

export const dbEnabled = !!process.env.DATABASE_URL;

export type LeadStatus = "new" | "contacted" | "won" | "lost";
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "won", "lost"];

export interface Lead {
  id: number;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  services: string[];
  est: string | null;
  scope: string | null;
  note: string | null;
  status: LeadStatus;
  source: string;
}

export interface NewLead {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  services?: string[];
  est?: string | null;
  scope?: string | null;
  note?: string | null;
  source?: string;
}

// ── pool (singleton) ──────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __bibPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __bibSchema: Promise<void> | undefined;
}

/**
 * Strip the `sslmode`/`ssl`/`uselibpqcompat` query params from the connection
 * string. We control TLS explicitly via the pool's `ssl` option below, so these
 * params are redundant — and leaving `sslmode=require` (etc.) in the URL makes
 * node-postgres emit a noisy deprecation warning about future libpq semantics.
 * Removing them keeps behaviour identical and silences the warning.
 */
function cleanConnectionString(url: string): string {
  try {
    const u = new URL(url);
    ["sslmode", "ssl", "uselibpqcompat"].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url; // not a parseable URL — hand it to pg untouched
  }
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  if (!global.__bibPool) {
    global.__bibPool = new Pool({
      connectionString: cleanConnectionString(process.env.DATABASE_URL),
      // Managed Postgres (RDS/Neon/Supabase) requires TLS. Local dev can opt
      // out with DATABASE_SSL=disable. TLS is controlled here, not via the
      // URL's sslmode (see cleanConnectionString).
      ssl:
        process.env.DATABASE_SSL === "disable"
          ? undefined
          : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return global.__bibPool;
}

/** Create the table on first use; memoised so it runs at most once per process. */
function ensureSchema(): Promise<void> {
  if (!global.__bibSchema) {
    global.__bibSchema = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS leads (
           id          SERIAL PRIMARY KEY,
           created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
           name        TEXT        NOT NULL,
           email       TEXT,
           phone       TEXT,
           company     TEXT,
           services    TEXT[]      NOT NULL DEFAULT '{}',
           est         TEXT,
           scope       TEXT,
           note        TEXT,
           status      TEXT        NOT NULL DEFAULT 'new',
           source      TEXT        NOT NULL DEFAULT 'web'
         );
         CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
         CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);`
      )
      .then(() => undefined)
      .catch((e) => {
        // Reset so a transient failure can be retried on the next call.
        global.__bibSchema = undefined;
        throw e;
      });
  }
  return global.__bibSchema;
}

// ── writes ────────────────────────────────────────────────────────
export async function saveLead(lead: NewLead): Promise<number> {
  await ensureSchema();
  const { rows } = await getPool().query<{ id: number }>(
    `INSERT INTO leads (name, email, phone, company, services, est, scope, note, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [
      lead.name,
      lead.email || null,
      lead.phone || null,
      lead.company || null,
      lead.services || [],
      lead.est || null,
      lead.scope || null,
      lead.note || null,
      lead.source || "web",
    ]
  );
  return rows[0].id;
}

export async function updateLeadStatus(id: number, status: LeadStatus): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await getPool().query(
    `UPDATE leads SET status = $2 WHERE id = $1`,
    [id, status]
  );
  return (rowCount ?? 0) > 0;
}

// ── reads ─────────────────────────────────────────────────────────
export interface LeadFilter {
  status?: LeadStatus | "all";
  service?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function listLeads(filter: LeadFilter = {}): Promise<Lead[]> {
  await ensureSchema();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status && filter.status !== "all") {
    params.push(filter.status);
    where.push(`status = $${params.length}`);
  }
  if (filter.service) {
    params.push(filter.service);
    where.push(`$${params.length} = ANY(services)`);
  }
  if (filter.q) {
    params.push(`%${filter.q}%`);
    const p = `$${params.length}`;
    where.push(`(name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR company ILIKE ${p} OR note ILIKE ${p})`);
  }
  const limit = Math.min(Math.max(filter.limit ?? 200, 1), 500);
  const offset = Math.max(filter.offset ?? 0, 0);
  params.push(limit, offset);
  const sql = `SELECT * FROM leads
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const { rows } = await getPool().query<Lead>(sql, params);
  return rows;
}

export interface LeadStats {
  total: number;
  last7: number;
  last30: number;
  byStatus: Record<string, number>;
  byService: { service: string; count: number }[];
  daily: { day: string; count: number }[];
}

export async function getStats(): Promise<LeadStats> {
  await ensureSchema();
  const pool = getPool();
  const [totals, statusRows, serviceRows, dailyRows] = await Promise.all([
    pool.query<{ total: string; last7: string; last30: string }>(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int  AS last7,
              COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS last30
       FROM leads`
    ),
    pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::int AS count FROM leads GROUP BY status`
    ),
    pool.query<{ service: string; count: string }>(
      `SELECT unnest(services) AS service, COUNT(*)::int AS count
       FROM leads GROUP BY service ORDER BY count DESC`
    ),
    pool.query<{ day: string; count: string }>(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
       FROM leads WHERE created_at >= now() - interval '30 days'
       GROUP BY day ORDER BY day`
    ),
  ]);
  const byStatus: Record<string, number> = {};
  for (const r of statusRows.rows) byStatus[r.status] = Number(r.count);
  return {
    total: Number(totals.rows[0]?.total ?? 0),
    last7: Number(totals.rows[0]?.last7 ?? 0),
    last30: Number(totals.rows[0]?.last30 ?? 0),
    byStatus,
    byService: serviceRows.rows.map((r) => ({ service: r.service, count: Number(r.count) })),
    daily: dailyRows.rows.map((r) => ({ day: r.day, count: Number(r.count) })),
  };
}
