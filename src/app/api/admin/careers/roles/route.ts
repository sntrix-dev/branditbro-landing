import { NextResponse } from "next/server";
import {
  dbEnabled, listRoles, createRole, updateRole, deleteRole, setRoleStatus,
  type RoleInput, type RoleStatus,
} from "@/lib/careers";
import { clamp, clampList } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "role";
}

/** Coerce arbitrary JSON into a safe RoleInput. */
function coerce(body: Record<string, unknown>): RoleInput | null {
  const title = clamp(body.title, 120);
  const team = clamp(body.team, 60);
  if (!title || !team) return null;
  const key = clamp(body.key, 40) ? slug(String(body.key)) : slug(title);
  const status: RoleStatus = body.status === "closed" ? "closed" : "open";
  return {
    key, team, title,
    mode: clamp(body.mode, 80),
    pay: clamp(body.pay, 120),
    band: clamp(body.band, 120),
    blurb: clamp(body.blurb, 600),
    tags: clampList(body.tags, 8, 40),
    skills: clampList(body.skills, 12, 60),
    hints: clampList(body.hints, 16, 40),
    status,
    sort: typeof body.sort === "number" ? Math.round(body.sort) : 0,
  };
}

export async function GET() {
  if (!dbEnabled) return NextResponse.json({ ok: true, dbEnabled: false, roles: [] });
  try {
    return NextResponse.json({ ok: true, dbEnabled: true, roles: await listRoles() });
  } catch (err) {
    console.error("[admin/roles] list failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const input = coerce(body);
  if (!input) return NextResponse.json({ ok: false, error: "invalid", message: "A title and team are required." }, { status: 422 });
  try {
    const role = await createRole(input);
    return NextResponse.json({ ok: true, role });
  } catch (err) {
    if (err instanceof Error && /duplicate key/i.test(err.message)) {
      return NextResponse.json({ ok: false, error: "duplicate", message: "A role with that key already exists — change the title or key." }, { status: 409 });
    }
    console.error("[admin/roles] create failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const id = Number(body.id);
  const input = coerce(body);
  if (!id || !input) return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  try {
    const role = await updateRole(id, input);
    if (!role) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, role });
  } catch (err) {
    if (err instanceof Error && /duplicate key/i.test(err.message)) {
      return NextResponse.json({ ok: false, error: "duplicate", message: "Another role already uses that key." }, { status: 409 });
    }
    console.error("[admin/roles] update failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  let body: { id?: number; status?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const id = Number(body.id);
  const status: RoleStatus = body.status === "closed" ? "closed" : "open";
  if (!id) return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  try {
    const ok = await setRoleStatus(id, status);
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[admin/roles] status failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  try {
    const ok = await deleteRole(id);
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[admin/roles] delete failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
