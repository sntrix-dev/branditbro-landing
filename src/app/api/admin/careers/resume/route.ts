import { NextResponse } from "next/server";
import { dbEnabled, getApplication } from "@/lib/careers";
import { s3Enabled, signedResumeUrl } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/careers/resume?id=123 → 302 to a short-lived signed S3 URL.
 *  Admin-only (guarded by middleware). Returns 404 when there's no stored file. */
export async function GET(req: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  if (!s3Enabled) return NextResponse.json({ ok: false, error: "s3_disabled" }, { status: 503 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });

  try {
    const app = await getApplication(id);
    if (!app?.resume_key) return NextResponse.json({ ok: false, error: "no_resume" }, { status: 404 });
    const url = await signedResumeUrl(app.resume_key, 300);
    return NextResponse.redirect(url, 302);
  } catch (err) {
    console.error("[admin/careers/resume] failed", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
