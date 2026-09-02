import { NextResponse } from "next/server";
import {
  dbEnabled, listApplications, getCareerStats, updateApplication,
  APP_STATUSES, type AppStatus, type ApplicationKind,
} from "@/lib/careers";
import { clamp } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/careers?status=&kind=&role=&q= → { ok, dbEnabled, applications, stats }
export async function GET(req: Request) {
  if (!dbEnabled) {
    return NextResponse.json({ ok: true, dbEnabled: false, applications: [], stats: null });
  }
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "all") as AppStatus | "all";
  const kind = (url.searchParams.get("kind") || "all") as ApplicationKind | "all";
  const role = url.searchParams.get("role") || undefined;
  const q = url.searchParams.get("q") || undefined;
  try {
    const [applications, stats] = await Promise.all([
      listApplications({ status, kind, role, q }),
      getCareerStats(),
    ]);
    return NextResponse.json({ ok: true, dbEnabled: true, applications, stats });
  } catch (err) {
    console.error("[admin/careers] query failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

// PATCH /api/admin/careers { id, status?, adminNote? }
export async function PATCH(req: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  let body: { id?: number; status?: string; adminNote?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const id = Number(body.id);
  if (!id) return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  if (body.status && !APP_STATUSES.includes(body.status as AppStatus)) {
    return NextResponse.json({ ok: false, error: "bad_status" }, { status: 422 });
  }
  try {
    const ok = await updateApplication(id, {
      status: body.status as AppStatus | undefined,
      adminNote: body.adminNote === undefined ? undefined : clamp(body.adminNote, 2000),
    });
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[admin/careers] update failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
