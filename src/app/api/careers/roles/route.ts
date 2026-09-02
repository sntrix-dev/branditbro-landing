import { NextResponse } from "next/server";
import { dbEnabled, listRoles } from "@/lib/careers";
import { DEFAULT_ROLES } from "@/content/careers-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: the open roles shown on /careers. Falls back to the built-in seed
 *  (all open) when no database is configured, so the page never renders empty. */
export async function GET() {
  if (!dbEnabled) {
    const roles = DEFAULT_ROLES.map((r, i) => ({ ...r, id: i, status: "open", sort: i }));
    return NextResponse.json({ ok: true, dbEnabled: false, roles });
  }
  try {
    const roles = await listRoles({ openOnly: true });
    return NextResponse.json({ ok: true, dbEnabled: true, roles });
  } catch (err) {
    console.error("[careers/roles] failed", err);
    return NextResponse.json({ ok: false, error: "db_error", roles: [] }, { status: 500 });
  }
}
