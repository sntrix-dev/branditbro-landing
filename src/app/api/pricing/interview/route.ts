import { NextResponse } from "next/server";
import { nextNode, type Turn, type PriceContext } from "@/lib/interview";
import { getCachedNode, putCachedNode, pathKey } from "@/lib/interview-cache";

export const runtime = "nodejs";

interface Body {
  service?: string;
  scale?: string;
  industry?: string;
  path?: Turn[];
  price?: PriceContext;
}

/** POST { service, scale, industry, path[], price } → the next InterviewNode.
 *  Cache-first: an identical path is served from Postgres with no AI call. Only
 *  a genuinely-new path hits the model, and its node is written back for next
 *  time — so the question tree fills in and gets cheaper as it's used. */
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
  if (!industry) {
    return NextResponse.json({ error: "missing_industry" }, { status: 422 });
  }
  // Sanitise the path (cap length + string lengths so a client can't blow up
  // the prompt or the cache key).
  const path: Turn[] = Array.isArray(body.path)
    ? body.path
        .filter((t) => t && typeof t.q === "string" && typeof t.a === "string")
        .slice(0, 8)
        .map((t) => ({ q: t.q.slice(0, 240), a: t.a.slice(0, 240) }))
    : [];
  const price: PriceContext = body.price && typeof body.price === "object" ? body.price : {};

  const key = pathKey(service, scale, industry, path);

  // 1 · cache hit → return instantly.
  const cached = await getCachedNode(key);
  if (cached) return NextResponse.json({ ...cached, cached: true });

  // 2 · miss → generate (AI or deterministic fallback).
  try {
    const node = await nextNode({ service, scale, industry, path, price });
    // 3 · persist only real AI nodes — fallback is free to recompute and
    //     shouldn't freeze into the tree before a key is configured.
    if (node.source === "ai") {
      await putCachedNode(key, { service, scale, industry, depth: path.length }, node);
    }
    return NextResponse.json({ ...node, cached: false });
  } catch (e) {
    console.error("[api/pricing/interview] failed", e);
    return NextResponse.json({ done: true, closing: "Let's price this together — tell us a little more.", source: "fallback", cached: false });
  }
}
