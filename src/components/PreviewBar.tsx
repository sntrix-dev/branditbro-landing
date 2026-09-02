/** Thin banner shown only in CMS preview mode, so you never mistake unpublished
 *  draft copy for the live site. Links back out of preview. */
export default function PreviewBar() {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[9999] flex items-center justify-center gap-3 h-9 text-[12.5px] font-bold text-ink"
      style={{ background: "#FFB169" }}
    >
      <span>Preview — showing unpublished draft</span>
      <a href="/api/admin/preview?on=0" className="underline underline-offset-2">Exit preview</a>
    </div>
  );
}
