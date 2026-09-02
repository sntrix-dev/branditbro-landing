import { NextResponse } from "next/server";
import { aiQuote, type Turn, type PriceContext, type QuoteItem } from "@/lib/interview";
import { predict, blend, type DealFeatures } from "@/lib/pricing-model";
import { logQuote, listClosed } from "@/lib/pricing-deals";

export const runtime = "nodejs";

interface Body {
  service?: string;
  scale?: string;
  industry?: string;
  path?: Turn[];
  price?: PriceContext;
  estimate?: number; // client's running fallback subtotal (used if AI is off)
}

/** POST { service, scale, industry, path[], price, estimate } → the final quote.
 *
 *  Blends two sources:
 *   • AI holistic pricing pass over the full scope (grounded in reference levels)
 *   • the learned model — a k-NN over the agency's own closed deals
 *  As real won-deal data accumulates, the learned number takes over from the AI.
 *  Every quote is logged as a pending deal so it can later be labelled. */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const service = (body.service || "").trim().toLowerCase();
  const scale = (body.scale || "").trim();
  const industry = (body.industry || "").trim();
  if (service !== "website" && service !== "app") {
    return NextResponse.json({ error: "unsupported_service" }, { status: 422 });
  }
  const path: Turn[] = Array.isArray(body.path)
    ? body.path.filter((t) => t && typeof t.q === "string" && typeof t.a === "string").slice(0, 12).map((t) => ({ q: t.q.slice(0, 240), a: t.a.slice(0, 240) }))
    : [];
  const price: PriceContext = body.price && typeof body.price === "object" ? body.price : {};
  const estimate = Math.max(0, Math.round(Number(body.estimate) || 0));

  const features: DealFeatures = { service, scale, industry, answers: path.map((t) => t.a) };

  // 1 · AI holistic quote (falls back to the client's running estimate).
  let aiTotal = estimate;
  let items: QuoteItem[] = [];
  let rationale = "";
  try {
    const q = await aiQuote({ service, scale, industry, path, price });
    if (q) { aiTotal = q.total; items = q.items; rationale = q.rationale; }
  } catch (e) {
    console.error("[api/pricing/quote] aiQuote error", e);
  }
  if (!aiTotal && estimate) aiTotal = estimate;

  // 2 · learned model over closed deals, then blend.
  let prediction = null;
  try {
    const closed = await listClosed(service);
    prediction = predict(features, closed);
  } catch (e) {
    console.error("[api/pricing/quote] predict error", e);
  }
  const { total, confidence, source } = blend(aiTotal || estimate, prediction);

  // 3 · keep the breakdown honest: if the blended total differs from the sum of
  //     the AI items, show the delta as an explicit line rather than hiding it.
  let lineItems: QuoteItem[] = items.length ? items : (total ? [{ label: "Custom build", amount: total }] : []);
  const sum = lineItems.reduce((s, i) => s + i.amount, 0);
  if (total && sum && total !== sum) {
    lineItems = [...lineItems, { label: prediction ? "Adjustment from past projects" : "Adjustment", amount: total - sum }];
  }

  // 4 · log this quote as a pending deal (best-effort).
  let dealId: number | null = null;
  try {
    const scopeText = `${industry} ${service} · ${path.map((t) => t.a).join(", ")}`;
    dealId = await logQuote({ features, scopeText, quotedPrice: total });
  } catch (e) {
    console.error("[api/pricing/quote] logQuote error", e);
  }

  return NextResponse.json({
    total,
    lineItems,
    rationale,
    confidence,
    source,                              // "ai" | "blend" | "model"
    neighbours: prediction?.neighbours ?? 0,
    dealId,
  });
}
