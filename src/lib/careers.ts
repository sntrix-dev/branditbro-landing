import "server-only";
import { getPool, dbEnabled } from "@/lib/db";
import { DEFAULT_ROLES, type RoleSeed } from "@/content/careers-schema";

/**
 * Careers data layer — roles + applications.
 *
 * Mirrors lib/db.ts: plain SQL over the shared `pg` pool, a lazily-created
 * schema memoised per process, and graceful degradation when no DATABASE_URL
 * is set (the page then falls back to the seed roles and applications simply
 * aren't stored — email/S3 paths still run where configured).
 */

export { dbEnabled };

export type RoleStatus = "open" | "closed";
export type ApplicationKind = "role" | "open" | "referral";
export type AppStatus = "new" | "reviewing" | "trial" | "hired" | "rejected" | "archived";
export const APP_STATUSES: AppStatus[] = ["new", "reviewing", "trial", "hired", "rejected", "archived"];

export interface Role {
  id: number;
  key: string;
  team: string;
  title: string;
  mode: string;
  pay: string;
  band: string;
  blurb: string;
  tags: string[];
  skills: string[];
  hints: string[];
  status: RoleStatus;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  ref: string;
  created_at: string;
  kind: ApplicationKind;
  role_key: string | null;
  role_title: string | null;
  name: string;
  email: string;
  phone: string | null;
  years: string | null;
  links: string[];
  skills: string[];
  why: string | null;
  video_link: string | null;
  engagement: string | null;
  pay: string | null;
  notice: string | null;
  hours: string | null;
  source: string | null;
  ref_city: string | null;
  ref_payout: string | null;
  ref_volume: string | null;
  ref_who: string | null;
  resume_key: string | null;
  resume_name: string | null;
  extract_source: string | null;
  match_pct: number | null;
  status: AppStatus;
  admin_note: string | null;
}

export interface NewApplication {
  ref: string;
  kind: ApplicationKind;
  roleKey?: string | null;
  roleTitle?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  years?: string | null;
  links?: string[];
  skills?: string[];
  why?: string | null;
  videoLink?: string | null;
  engagement?: string | null;
  pay?: string | null;
  notice?: string | null;
  hours?: string | null;
  source?: string | null;
  refCity?: string | null;
  refPayout?: string | null;
  refVolume?: string | null;
  refWho?: string | null;
  resumeKey?: string | null;
  resumeName?: string | null;
  extractSource?: string | null;
  matchPct?: number | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __bibCareersSchema: Promise<void> | undefined;
}

function ensureSchema(): Promise<void> {
  if (!global.__bibCareersSchema) {
    global.__bibCareersSchema = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS job_roles (
          id          SERIAL PRIMARY KEY,
          key         TEXT UNIQUE NOT NULL,
          team        TEXT NOT NULL,
          title       TEXT NOT NULL,
          mode        TEXT NOT NULL DEFAULT '',
          pay         TEXT NOT NULL DEFAULT '',
          band        TEXT NOT NULL DEFAULT '',
          blurb       TEXT NOT NULL DEFAULT '',
          tags        TEXT[] NOT NULL DEFAULT '{}',
          skills      TEXT[] NOT NULL DEFAULT '{}',
          hints       TEXT[] NOT NULL DEFAULT '{}',
          status      TEXT NOT NULL DEFAULT 'open',
          sort        INT  NOT NULL DEFAULT 0,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS applications (
          id             SERIAL PRIMARY KEY,
          ref            TEXT UNIQUE NOT NULL,
          created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          kind           TEXT NOT NULL DEFAULT 'role',
          role_key       TEXT,
          role_title     TEXT,
          name           TEXT NOT NULL,
          email          TEXT NOT NULL,
          phone          TEXT,
          years          TEXT,
          links          TEXT[] NOT NULL DEFAULT '{}',
          skills         TEXT[] NOT NULL DEFAULT '{}',
          why            TEXT,
          video_link     TEXT,
          engagement     TEXT,
          pay            TEXT,
          notice         TEXT,
          hours          TEXT,
          source         TEXT,
          ref_city       TEXT,
          ref_payout     TEXT,
          ref_volume     TEXT,
          ref_who        TEXT,
          resume_key     TEXT,
          resume_name    TEXT,
          extract_source TEXT,
          match_pct      INT,
          status         TEXT NOT NULL DEFAULT 'new',
          admin_note     TEXT
        );

        CREATE INDEX IF NOT EXISTS applications_created_at_idx ON applications (created_at DESC);
        CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status);
        CREATE INDEX IF NOT EXISTS applications_role_idx ON applications (role_key);
        CREATE INDEX IF NOT EXISTS job_roles_status_idx ON job_roles (status, sort);
      `);
      // Seed the roles table once, only when it is completely empty.
      const { rows } = await pool.query<{ n: string }>(`SELECT COUNT(*)::int AS n FROM job_roles`);
      if (Number(rows[0]?.n ?? 0) === 0) {
        for (let i = 0; i < DEFAULT_ROLES.length; i++) await insertRole(DEFAULT_ROLES[i], i);
      }
    })().catch((e) => {
      global.__bibCareersSchema = undefined;
      throw e;
    });
  }
  return global.__bibCareersSchema;
}

async function insertRole(r: RoleSeed, sort: number): Promise<void> {
  await getPool().query(
    `INSERT INTO job_roles (key, team, title, mode, pay, band, blurb, tags, skills, hints, status, sort)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open',$11)
     ON CONFLICT (key) DO NOTHING`,
    [r.key, r.team, r.title, r.mode, r.pay, r.band, r.blurb, r.tags, r.skills, r.hints, sort]
  );
}

/* ── roles ─────────────────────────────────────────────────────── */

export async function listRoles(opts: { openOnly?: boolean } = {}): Promise<Role[]> {
  await ensureSchema();
  const where = opts.openOnly ? `WHERE status = 'open'` : "";
  const { rows } = await getPool().query<Role>(
    `SELECT * FROM job_roles ${where} ORDER BY sort ASC, id ASC`
  );
  return rows;
}

export async function getRole(key: string): Promise<Role | null> {
  await ensureSchema();
  const { rows } = await getPool().query<Role>(`SELECT * FROM job_roles WHERE key = $1`, [key]);
  return rows[0] ?? null;
}

export interface RoleInput {
  key: string; team: string; title: string; mode: string; pay: string; band: string;
  blurb: string; tags: string[]; skills: string[]; hints: string[]; status: RoleStatus; sort: number;
}

export async function createRole(r: RoleInput): Promise<Role> {
  await ensureSchema();
  const { rows } = await getPool().query<Role>(
    `INSERT INTO job_roles (key, team, title, mode, pay, band, blurb, tags, skills, hints, status, sort)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [r.key, r.team, r.title, r.mode, r.pay, r.band, r.blurb, r.tags, r.skills, r.hints, r.status, r.sort]
  );
  return rows[0];
}

export async function updateRole(id: number, r: RoleInput): Promise<Role | null> {
  await ensureSchema();
  const { rows } = await getPool().query<Role>(
    `UPDATE job_roles SET key=$2, team=$3, title=$4, mode=$5, pay=$6, band=$7, blurb=$8,
       tags=$9, skills=$10, hints=$11, status=$12, sort=$13, updated_at=now()
     WHERE id=$1 RETURNING *`,
    [id, r.key, r.team, r.title, r.mode, r.pay, r.band, r.blurb, r.tags, r.skills, r.hints, r.status, r.sort]
  );
  return rows[0] ?? null;
}

export async function setRoleStatus(id: number, status: RoleStatus): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await getPool().query(
    `UPDATE job_roles SET status=$2, updated_at=now() WHERE id=$1`,
    [id, status]
  );
  return (rowCount ?? 0) > 0;
}

export async function deleteRole(id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await getPool().query(`DELETE FROM job_roles WHERE id=$1`, [id]);
  return (rowCount ?? 0) > 0;
}

/* ── applications ─────────────────────────────────────────────── */

export async function saveApplication(a: NewApplication): Promise<number> {
  await ensureSchema();
  const { rows } = await getPool().query<{ id: number }>(
    `INSERT INTO applications
      (ref, kind, role_key, role_title, name, email, phone, years, links, skills, why, video_link,
       engagement, pay, notice, hours, source, ref_city, ref_payout, ref_volume, ref_who,
       resume_key, resume_name, extract_source, match_pct)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
     RETURNING id`,
    [
      a.ref, a.kind, a.roleKey || null, a.roleTitle || null, a.name, a.email, a.phone || null,
      a.years || null, a.links || [], a.skills || [], a.why || null, a.videoLink || null,
      a.engagement || null, a.pay || null, a.notice || null, a.hours || null, a.source || null,
      a.refCity || null, a.refPayout || null, a.refVolume || null, a.refWho || null,
      a.resumeKey || null, a.resumeName || null, a.extractSource || null,
      a.matchPct == null ? null : Math.round(a.matchPct),
    ]
  );
  return rows[0].id;
}

export interface AppFilter {
  status?: AppStatus | "all";
  kind?: ApplicationKind | "all";
  role?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function listApplications(filter: AppFilter = {}): Promise<Application[]> {
  await ensureSchema();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status && filter.status !== "all") { params.push(filter.status); where.push(`status = $${params.length}`); }
  if (filter.kind && filter.kind !== "all") { params.push(filter.kind); where.push(`kind = $${params.length}`); }
  if (filter.role) { params.push(filter.role); where.push(`role_key = $${params.length}`); }
  if (filter.q) {
    params.push(`%${filter.q}%`);
    const p = `$${params.length}`;
    where.push(`(name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR ref ILIKE ${p} OR why ILIKE ${p})`);
  }
  const limit = Math.min(Math.max(filter.limit ?? 200, 1), 500);
  const offset = Math.max(filter.offset ?? 0, 0);
  params.push(limit, offset);
  const sql = `SELECT * FROM applications
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const { rows } = await getPool().query<Application>(sql, params);
  return rows;
}

export async function getApplication(id: number): Promise<Application | null> {
  await ensureSchema();
  const { rows } = await getPool().query<Application>(`SELECT * FROM applications WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function updateApplication(
  id: number,
  patch: { status?: AppStatus; adminNote?: string }
): Promise<boolean> {
  await ensureSchema();
  const sets: string[] = [];
  const params: unknown[] = [id];
  if (patch.status) { params.push(patch.status); sets.push(`status = $${params.length}`); }
  if (patch.adminNote !== undefined) { params.push(patch.adminNote); sets.push(`admin_note = $${params.length}`); }
  if (!sets.length) return false;
  const { rowCount } = await getPool().query(
    `UPDATE applications SET ${sets.join(", ")} WHERE id = $1`,
    params
  );
  return (rowCount ?? 0) > 0;
}

/** Does an application with this reference already exist? (idempotency guard.) */
export async function refExists(ref: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT 1 FROM applications WHERE ref = $1`, [ref]);
  return rows.length > 0;
}

export interface CareerStats {
  total: number;
  last7: number;
  last30: number;
  byStatus: Record<string, number>;
  byRole: { role: string; count: number }[];
  daily: { day: string; count: number }[];
}

export async function getCareerStats(): Promise<CareerStats> {
  await ensureSchema();
  const pool = getPool();
  const [totals, statusRows, roleRows, dailyRows] = await Promise.all([
    pool.query<{ total: string; last7: string; last30: string }>(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int  AS last7,
              COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS last30
       FROM applications`
    ),
    pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::int AS count FROM applications GROUP BY status`
    ),
    pool.query<{ role: string; count: string }>(
      `SELECT COALESCE(role_title, role_key, kind) AS role, COUNT(*)::int AS count
       FROM applications GROUP BY role ORDER BY count DESC LIMIT 12`
    ),
    pool.query<{ day: string; count: string }>(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
       FROM applications WHERE created_at >= now() - interval '30 days'
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
    byRole: roleRows.rows.map((r) => ({ role: r.role, count: Number(r.count) })),
    daily: dailyRows.rows.map((r) => ({ day: r.day, count: Number(r.count) })),
  };
}
