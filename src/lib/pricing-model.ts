/**
 * The learned pricing model.
 *
 * A quote is a scope → price mapping. Rather than a heavyweight trained network
 * (which we have no data for on day one), this is instance-based learning
 * (k-nearest-neighbours): to price a new project, find the most similar projects
 * the agency has actually CLOSED and take a similarity-weighted average of what
 * they charged. It needs zero data to exist, improves with every won deal, and
 * is fully interpretable — you can always see which past projects drove a quote.
 *
 * Pure and dependency-free so it runs anywhere and is trivially testable. The
 * caller supplies the closed-deal rows (from Postgres); this does the maths.
 */

export interface DealFeatures {
  service: string;          // "website" | "app"
  scale: string;            // company-size label
  industry: string;         // (possibly custom) industry
  answers: string[];        // chosen option labels along the interview path
}

export interface ClosedDeal {
  features: DealFeatures;
  finalPrice: number;       // what the client actually paid
}

export interface Prediction {
  price: number;            // similarity-weighted estimate
  confidence: number;       // 0..0.9 — how much to trust it vs. the AI
  neighbours: number;       // how many past deals informed it
  topSimilarity: number;    // best single match (0..1)
}

const norm = (s: string) =>
  (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

/** Token set of a string, for cheap fuzzy overlap. */
function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((w) => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1;
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Similarity of two scopes, 0..1. Service is assumed pre-matched by the caller.
 *  Weighted: the chosen answers matter most, then industry, then company size. */
export function similarity(a: DealFeatures, b: DealFeatures): number {
  const ansA = new Set(a.answers.map(norm));
  const ansB = new Set(b.answers.map(norm));
  const answersSim = jaccard(ansA, ansB);                 // 0..1
  const indSim = norm(a.industry) === norm(b.industry) ? 1 : jaccard(tokens(a.industry), tokens(b.industry));
  const scaleSim = norm(a.scale) === norm(b.scale) ? 1 : 0;
  return 0.55 * answersSim + 0.3 * indSim + 0.15 * scaleSim;
}

/**
 * Predict a price from closed deals. Returns null when there's nothing similar
 * enough to learn from (the caller then falls back to the AI quote).
 *
 * @param k   neighbours to average (default 5)
 * @param floor minimum similarity to count a neighbour (default 0.15)
 */
export function predict(
  features: DealFeatures,
  deals: ClosedDeal[],
  k = 5,
  floor = 0.15
): Prediction | null {
  const pool = deals.filter((d) => d.features.service === features.service && d.finalPrice > 0);
  if (!pool.length) return null;

  const scored = pool
    .map((d) => ({ sim: similarity(features, d.features), price: d.finalPrice }))
    .filter((s) => s.sim >= floor)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k);
  if (!scored.length) return null;

  const wsum = scored.reduce((s, x) => s + x.sim, 0);
  const price = Math.round(scored.reduce((s, x) => s + x.sim * x.price, 0) / wsum / 500) * 500;
  const avgSim = wsum / scored.length;
  const topSimilarity = scored[0].sim;

  // Confidence rises with (a) how many close deals we have and (b) how close the
  // best matches are. Capped at 0.9 so the AI always keeps a little say, and the
  // model can never fully "lock in" a number on thin evidence.
  const countFactor = Math.min(1, scored.length / k);
  const confidence = Math.max(0, Math.min(0.9, avgSim * (0.5 + 0.5 * countFactor)));

  return { price, confidence, neighbours: scored.length, topSimilarity };
}

/** Blend a learned prediction with the AI/estimate baseline. With no prediction
 *  (cold start) the AI number stands alone; as confidence grows the learned
 *  number takes over. */
export function blend(
  aiTotal: number,
  prediction: Prediction | null
): { total: number; confidence: number; source: "ai" | "blend" | "model" } {
  if (!prediction) return { total: aiTotal, confidence: 0.4, source: "ai" };
  const w = prediction.confidence;
  const total = Math.round((w * prediction.price + (1 - w) * aiTotal) / 500) * 500;
  const source = w >= 0.6 ? "model" : "blend";
  return { total, confidence: Math.max(0.4, w), source };
}
