import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { dbEnabled, getContentState, saveDraft, discardDraft, publish, CONTENT_TAG } from "@/lib/content";
import type { Content } from "@/content/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATHS = ["/", "/services", "/pricing", "/contact", "/how-it-works"];

// GET → full editor state (editable doc + what's live + flags)
export async function GET() {
  if (!dbEnabled) {
    return NextResponse.json({ ok: true, dbEnabled: false });
  }
  try {
    const state = await getContentState();
    return NextResponse.json({ ok: true, dbEnabled: true, ...state });
  } catch (err) {
    console.error("[admin/content] read failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

// PUT { doc } → save draft
export async function PUT(req: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  let doc: Content;
  try {
    ({ doc } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!doc || typeof doc !== "object") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  try {
    await saveDraft(doc);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/content] saveDraft failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

// POST { action: "publish" | "discard", doc? } → promote or drop the draft
export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  let action: string, doc: Content | undefined;
  try {
    ({ action, doc } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  try {
    if (action === "publish") {
      await publish(doc);
      revalidateTag(CONTENT_TAG);
      PATHS.forEach((p) => revalidatePath(p));
      return NextResponse.json({ ok: true });
    }
    if (action === "discard") {
      await discardDraft();
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 422 });
  } catch (err) {
    console.error("[admin/content] action failed", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}
