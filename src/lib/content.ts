import "server-only";
import { unstable_cache } from "next/cache";
import { getPool, dbEnabled } from "@/lib/db";
import { defaultContent, mergeContent, type Content } from "@/content/schema";

export const CONTENT_TAG = "site-content";

/**
 * CMS storage. A single row holds the whole content document twice:
 *   • `published` — what the live site renders
 *   • `draft`     — work in progress, shown only in preview mode
 * Publishing copies draft → published. Everything is deep-merged over the
 * built-in defaults on read, so a missing/partial document never blanks the
 * site, and with no DB configured the site simply renders the defaults.
 */

declare global {
  // eslint-disable-next-line no-var
  var __bibContentSchema: Promise<void> | undefined;
}

function ensureSchema(): Promise<void> {
  if (!global.__bibContentSchema) {
    global.__bibContentSchema = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS site_content (
           id            INT PRIMARY KEY DEFAULT 1,
           draft         JSONB,
           published     JSONB,
           draft_updated_at  TIMESTAMPTZ,
           published_at      TIMESTAMPTZ,
           CONSTRAINT site_content_singleton CHECK (id = 1)
         );
         INSERT INTO site_content (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`
      )
      .then(() => undefined)
      .catch((e) => { global.__bibContentSchema = undefined; throw e; });
  }
  return global.__bibContentSchema;
}

interface Row {
  draft: unknown;
  published: unknown;
  draft_updated_at: string | null;
  published_at: string | null;
}

async function readRow(): Promise<Row | null> {
  await ensureSchema();
  const { rows } = await getPool().query<Row>(
    `SELECT draft, published, draft_updated_at, published_at FROM site_content WHERE id = 1`
  );
  return rows[0] ?? null;
}

export interface ContentState {
  doc: Content;                 // the editable document (draft ?? published ?? defaults)
  published: Content;           // what's live (published ?? defaults)
  hasDraft: boolean;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
}

/** Full editor state — draft to edit plus what's currently live. */
export async function getContentState(): Promise<ContentState> {
  if (!dbEnabled) {
    return { doc: defaultContent, published: defaultContent, hasDraft: false, draftUpdatedAt: null, publishedAt: null };
  }
  try {
    const row = await readRow();
    const published = mergeContent(defaultContent, row?.published);
    const doc = row?.draft ? mergeContent(defaultContent, row.draft) : published;
    return {
      doc,
      published,
      hasDraft: !!row?.draft,
      draftUpdatedAt: row?.draft_updated_at ?? null,
      publishedAt: row?.published_at ?? null,
    };
  } catch {
    return { doc: defaultContent, published: defaultContent, hasDraft: false, draftUpdatedAt: null, publishedAt: null };
  }
}

/** What the site should render. `preview` returns the draft when one exists. */
export async function getSiteContent(preview = false): Promise<Content> {
  if (!dbEnabled) return defaultContent;
  try {
    const row = await readRow();
    if (preview && row?.draft) return mergeContent(defaultContent, row.draft);
    return mergeContent(defaultContent, row?.published);
  } catch {
    return defaultContent;
  }
}

/** Published content, cached across requests and revalidated on publish
 *  (revalidateTag(CONTENT_TAG)). Use this for the live site so a page render
 *  doesn't hit the DB every time; preview mode bypasses it via getSiteContent(true). */
export const getPublishedContentCached = unstable_cache(
  async (): Promise<Content> => getSiteContent(false),
  ["bib-published-content"],
  { tags: [CONTENT_TAG], revalidate: 3600 }
);

export async function saveDraft(doc: Content): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE site_content SET draft = $1, draft_updated_at = now() WHERE id = 1`,
    [JSON.stringify(doc)]
  );
}

export async function discardDraft(): Promise<void> {
  await ensureSchema();
  await getPool().query(`UPDATE site_content SET draft = NULL, draft_updated_at = NULL WHERE id = 1`);
}

/** Promote the current draft (or an explicit doc) to published. */
export async function publish(doc?: Content): Promise<void> {
  await ensureSchema();
  if (doc) {
    await getPool().query(
      `UPDATE site_content SET published = $1, published_at = now(), draft = NULL, draft_updated_at = NULL WHERE id = 1`,
      [JSON.stringify(doc)]
    );
  } else {
    await getPool().query(
      `UPDATE site_content SET published = COALESCE(draft, published), published_at = now(), draft = NULL, draft_updated_at = NULL WHERE id = 1`
    );
  }
}

export { dbEnabled };
