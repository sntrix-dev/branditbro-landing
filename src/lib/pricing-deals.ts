import "server-only";
import { dbEnabled, getPool } from "@/lib/db";
import type { DealFeatures, ClosedDeal } from "@/lib/pricing-model";

/**
 * Persistent store of quotes and their outcomes — the training data for the
 * pricing model. Each generated quote is logged as `pending`; when the agency
 * closes the deal and records the final price in the admin, the row becomes a
 * labelled `won` example the model learns from.
 *
 * No DATABASE_URL → every function is a safe no-op / empty, and the model simply
 * has nothing to learn from (the quoter falls back to AI).
 */

export type DealOutcome = "pending" | "won" | "lost";

export interface DealRow {
  id: number;
  created_at: string;
  service: string;
  scale: string;
  industry: string;
  features: DealFeatures;
  quoted_price: number;
  outcome: DealOutcome;
  final_price: number | null;
  lead_id: number | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __bibDealsSchema: Promise<void> | undefined;
}

function ensureSchema(): Promise<void> {
  if (!global.__bibDealsSchema) {
    global.__bibDealsSchema = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS pricing_deals (
           id           SERIAL PRIMARY KEY,
           created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
           service      TEXT        NOT NULL,
           scale        TEXT,
           industry     TEXT,
           features     JSONB       NOT NULL,
           scope_text   TEXT,
           quoted_price INTEGER     NOT NULL DEFAULT 0,
           outcome      TEXT        NOT NULL DEFAULT 'pending',
           final_price  INTEGER,
           lead_id      INTEGER
         );
         CREATE INDEX IF NOT EXISTS pricing_deals_service_idx ON pricing_deals (service);
         CREATE INDEX IF NOT EXISTS pricing_deals_outcome_idx ON pricing_deals (outcome);`
      )
      .then(() => undefined)
      .catch((e) => { global.__bibDealsSchema = undefined; throw e; });
  }
  return global.__bibDealsSchema;
}

/** Log a freshly-generated quote as a pending deal. Returns its id (or null). */
export async function logQuote(input: {
  features: DealFeatures;
  scopeText: string;
  quotedPrice: number;
}): Promise<number | null> {
  if (!dbEnabled) return null;
  try {
    await ensureSchema();
    const { rows } = await getPool().query<{ id: number }>(
      `INSERT INTO pricing_deals (service, scale, industry, features, scope_text, quoted_price)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [input.features.service, input.features.scale, input.features.industry, JSON.stringify(input.features), input.scopeText, Math.round(input.quotedPrice)]
    );
    return rows[0]?.id ?? null;
  } catch (e) {
    console.error("[pricing-deals] logQuote failed", e);
    return null;
  }
}

/** Attach a submitted lead to the quote it came from, so a later "won" mark can
 *  find and label this deal. Best-effort. */
export async function linkLead(dealId: number, leadId: number): Promise<void> {
  if (!dbEnabled) return;
  try {
    await ensureSchema();
    await getPool().query(`UPDATE pricing_deals SET lead_id = $2 WHERE id = $1`, [dealId, leadId]);
  } catch (e) {
    console.error("[pricing-deals] linkLead failed", e);
  }
}

/** Record the outcome of the deal tied to a lead. A won deal with a final price
 *  becomes a labelled training example. */
export async function recordOutcomeByLead(
  leadId: number,
  outcome: DealOutcome,
  finalPrice?: number | null
): Promise<void> {
  if (!dbEnabled) return;
  try {
    await ensureSchema();
    await getPool().query(
      `UPDATE pricing_deals
         SET outcome = $2,
             final_price = CASE WHEN $3::int IS NOT NULL THEN $3::int ELSE final_price END
       WHERE lead_id = $1`,
      [leadId, outcome, finalPrice ?? null]
    );
  } catch (e) {
    console.error("[pricing-deals] recordOutcomeByLead failed", e);
  }
}

/** Every won, priced deal for a service — the model's training set. */
export async function listClosed(service: string): Promise<ClosedDeal[]> {
  if (!dbEnabled) return [];
  try {
    await ensureSchema();
    const { rows } = await getPool().query<{ features: DealFeatures; final_price: number }>(
      `SELECT features, final_price FROM pricing_deals
        WHERE service = $1 AND outcome = 'won' AND final_price IS NOT NULL AND final_price > 0`,
      [service]
    );
    return rows.map((r) => ({ features: r.features, finalPrice: Number(r.final_price) }));
  } catch (e) {
    console.error("[pricing-deals] listClosed failed", e);
    return [];
  }
}

/** How many labelled examples exist for a service (for admin insight). */
export async function closedCount(service: string): Promise<number> {
  if (!dbEnabled) return 0;
  try {
    await ensureSchema();
    const { rows } = await getPool().query<{ n: string }>(
      `SELECT COUNT(*)::int AS n FROM pricing_deals WHERE service = $1 AND outcome = 'won' AND final_price > 0`,
      [service]
    );
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}
