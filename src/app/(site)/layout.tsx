import { cookies, draftMode } from "next/headers";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import MotionRoot from "@/components/MotionRoot";
import PreviewBar from "@/components/PreviewBar";
import { ContentProvider } from "@/components/ContentProvider";
import { getSiteContent, getPublishedContentCached } from "@/lib/content";

/** Marketing shell — the public site chrome. Everything under this route
 *  group (/, /services, /pricing, /contact, /how-it-works) gets it; the
 *  /admin section, which lives outside the group, does not.
 *
 *  Content: renders CMS-published copy (cached, revalidated on publish). In
 *  preview mode (draftMode or the bib_preview cookie, both admin-only) it
 *  renders the unpublished draft instead. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: draftOn } = await draftMode();
  const previewCookie = (await cookies()).get("bib_preview")?.value === "1";
  const preview = draftOn || previewCookie;
  const content = preview ? await getSiteContent(true) : await getPublishedContentCached();

  return (
    <ContentProvider content={content}>
      <MotionRoot />
      {/* One responsive site for every screen — hamburger nav on mobile. */}
      <SiteNav />
      <main id="content">{children}</main>
      <SiteFooter content={content} />
      {preview && <PreviewBar />}
    </ContentProvider>
  );
}
