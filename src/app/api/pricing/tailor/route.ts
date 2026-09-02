import { NextResponse } from "next/server";
import { tailorBuild, type Opt } from "@/lib/ai";
import { getCachedTailor, putCachedTailor } from "@/lib/tailor-cache";

export const runtime = "nodejs";

interface Body {
  service?: string;
  text?: string;
  industry?: string;
  types?: Opt[];
  features?: Opt[];
}

/** POST { service, text, industry?, types[], features[] } →
 *  { type, features[], custom[], summary, source }. Constrains the AI's picks
 *  to the options the builder passed in, so it can only choose things that
 *  actually exist.
 *
 *  Cache-first: an identical ask (same service + normalised text) is served
 *  from Postgres with source "cache" and never touches the AI. Only genuinely
 *  new asks call the model — and their result is written back for next time. */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const text = (body.text || "").trim();
  const service = (body.service || "").trim();
  if (!text || !service || !Array.isArray(body.types) || !Array.isArray(body.features)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 422 });
  }
  // Keep the payload sane.
  const clip = (a: Opt[]) => a.filter((o) => o && typeof o.key === "string" && typeof o.label === "string").slice(0, 60);
  const types = clip(body.types);
  const features = clip(body.features);
  const clippedText = text.slice(0, 500);

  // 1 · cache hit → return instantly, no AI. Validate the cached type/features
  //     against the options this request offers (option sets can change over
  //     time), so a stale entry can never inject a key that no longer exists.
  const cached = await getCachedTailor(service, clippedText);
  if (cached) {
    const typeKeys = new Set(types.map((t) => t.key));
    const featKeys = new Set(features.map((f) => f.key));
    return NextResponse.json({
      type: cached.type && typeKeys.has(cached.type) ? cached.type : null,
      features: (cached.features || []).filter((k) => featKeys.has(k)),
      custom: cached.custom || [],
      summary: cached.summary || "",
      source: "cache",
    });
  }

  // 2 · miss → resolve (AI, or keyword heuristic when AI is unavailable).
  try {
    const result = await tailorBuild({
      service,
      text: clippedText,
      industry: body.industry?.slice(0, 80),
      types,
      features,
    });
    // 3 · only persist genuine AI answers — heuristic guesses are free to
    //     recompute and shouldn't freeze into the cache before AI is set up.
    if (result.source === "ai" && (result.type || result.features.length)) {
      await putCachedTailor(service, clippedText, {
        type: result.type,
        features: result.features,
        custom: result.custom,
        summary: result.summary,
      });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/pricing/tailor] failed", e);
    return NextResponse.json({ type: null, features: [], custom: [], summary: "", source: "fallback" });
  }
}
