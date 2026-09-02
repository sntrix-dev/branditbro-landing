import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Toggle preview mode. GET /api/admin/preview?on=1 sets a cookie the site
 *  reads to render the draft instead of the published content, then sends you
 *  to the home page. ?on=0 clears it. Protected by the admin middleware. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const on = url.searchParams.get("on") !== "0";
  const to = url.searchParams.get("to") || "/";
  const res = NextResponse.redirect(new URL(to, url.origin));
  if (on) {
    res.cookies.set("bib_preview", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 4 });
  } else {
    res.cookies.set("bib_preview", "", { httpOnly: true, path: "/", maxAge: 0 });
  }
  return res;
}
