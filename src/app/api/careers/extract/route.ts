import { NextResponse } from "next/server";
import { extractEnabled, extractFromFile, extractFromUrl, type RoleHint } from "@/lib/extract";
import { dbEnabled, listRoles } from "@/lib/careers";
import { DEFAULT_ROLES } from "@/content/careers-schema";
import { clientIp, rateLimit, sniffResume, MAX_RESUME_BYTES, clamp } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function roleHints(): Promise<RoleHint[]> {
  try {
    if (dbEnabled) {
      const roles = await listRoles({ openOnly: true });
      return roles.map((r) => ({ key: r.key, title: r.title, skills: r.skills, hints: r.hints }));
    }
  } catch { /* fall through to seed */ }
  return DEFAULT_ROLES.map((r) => ({ key: r.key, title: r.title, skills: r.skills, hints: r.hints }));
}

/**
 * POST /api/careers/extract
 *   multipart form-data: `file` (résumé), OR
 *   JSON / form field: `link` (a URL)
 * → { ok, fields, source, sourceName, warning? }
 *
 * Parses only — nothing is stored here. The file is uploaded (and the
 * application saved) later, at /api/careers/apply, so abandoned applications
 * leave nothing behind.
 */
export async function POST(req: Request) {
  if (!extractEnabled) {
    return NextResponse.json(
      { ok: false, error: "disabled", warning: "Auto-fill isn't switched on yet — fill the form in by hand (about two minutes)." },
      { status: 503 }
    );
  }

  const rl = rateLimit(`extract:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", warning: "That's a lot of tries in a row — give it a moment and retry." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const ctype = req.headers.get("content-type") || "";
  const roles = await roleHints();

  try {
    // ── file upload ──
    if (ctype.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const link = clamp(form.get("link"), 500);

      if (file && typeof file !== "string") {
        if (file.size > MAX_RESUME_BYTES) {
          return NextResponse.json({ ok: false, error: "too_large", warning: "That file is over 8 MB — please upload a smaller PDF or DOCX." }, { status: 413 });
        }
        if (file.size === 0) {
          return NextResponse.json({ ok: false, error: "empty" }, { status: 422 });
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const kind = sniffResume(bytes);
        if (kind === "unknown") {
          return NextResponse.json({ ok: false, error: "bad_type", warning: "That doesn't look like a PDF or Word file — upload a PDF/DOCX or fill the form in by hand." }, { status: 415 });
        }
        const out = await extractFromFile(bytes, kind, roles);
        return respond(out, file.name || "your résumé", "file");
      }
      if (link) return respond(await extractFromUrl(link, roles), link, "link");
      return NextResponse.json({ ok: false, error: "no_input" }, { status: 422 });
    }

    // ── JSON link ──
    const body = await req.json().catch(() => ({}));
    const link = clamp((body as { link?: unknown }).link, 500);
    if (!link) return NextResponse.json({ ok: false, error: "no_input" }, { status: 422 });
    return respond(await extractFromUrl(link, roles), link, "link");
  } catch (err) {
    console.error("[careers/extract] failed", err);
    return NextResponse.json({ ok: false, error: "server_error", warning: "Something went wrong reading that — fill the form in by hand." }, { status: 500 });
  }
}

function respond(
  out: Awaited<ReturnType<typeof extractFromFile>>,
  sourceName: string,
  source: "file" | "link"
) {
  if (out.ok && out.fields) {
    const f = out.fields;
    const filled =
      (f.name ? 1 : 0) + (f.email ? 1 : 0) + (f.phone ? 1 : 0) + (f.years ? 1 : 0) +
      (f.links.length ? 1 : 0) + (f.skills.length ? 1 : 0);
    return NextResponse.json({ ok: true, fields: f, source, sourceName, filledCount: filled });
  }
  // Soft failure — the client falls back to manual entry. 200 keeps the UX calm.
  return NextResponse.json({ ok: false, source, sourceName, error: out.error || "no_data", warning: out.warning });
}
