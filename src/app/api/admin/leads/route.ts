import { NextResponse } from "next/server";
import { dbEnabled, listLeads, getStats, updateLeadStatus, LEAD_STATUSES, type LeadStatus } from "@/lib/db";
import { recordOutcomeByLead } from "@/lib/pricing-deals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/leads?status=&service=&q=  → { ok, dbEnabled, leads, stats }
export async function GET(req: Request) {
  if (!dbEnabled) {
    return NextResponse.json({ ok: true, dbEnabled: false, leads: [], stats: null });
  }
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "all") as LeadStatus | "all";
  const service = url.searchParams.get("service") || undefined;
  const q = url.searchParams.get("q") || undefined;
  try {
    const [leads, stats] = await Promise.all([
      listLeads({ status, service, q }),
      getStats(),
    ]);
    return NextResponse.json({ ok: true, dbEnabled: true, leads, stats });
  } catch (err) {
    console.error("[admin/leads] query failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

// PATCH /api/admin/leads  { id, status, finalPrice? }  → update a lead's status.
// When a lead is marked "won", an optional finalPrice labels the quote it came
// from as a training example for the pricing model.
export async function PATCH(req: Request) {
  if (!dbEnabled) {
    return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  }
  let id: number, status: LeadStatus, finalPrice: unknown;
  try {
    ({ id, status, finalPrice } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!id || !LEAD_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  try {
    const ok = await updateLeadStatus(id, status);
    // Mirror won/lost into the pricing-deals training store. A won deal with a
    // final price becomes a labelled example the model learns from.
    if (status === "won" || status === "lost") {
      const price = typeof finalPrice === "number" && finalPrice > 0 ? Math.round(finalPrice) : null;
      try { await recordOutcomeByLead(id, status, price); } catch { /* non-fatal */ }
    }
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[admin/leads] update failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
