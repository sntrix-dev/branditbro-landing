import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_TTL_MS, adminConfigured, createSession, passwordOk } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "not_configured", message: "Set ADMIN_PASSWORD to enable the admin login." },
      { status: 503 }
    );
  }
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!passwordOk(password || "")) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }
  const token = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
