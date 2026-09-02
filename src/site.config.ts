/**
 * ─────────────────────────────────────────────────────────────
 *  branditbro — CONFIG (defaults + non-editable settings)
 * ─────────────────────────────────────────────────────────────
 *  The editable marketing copy now lives in src/content/schema.ts and is
 *  managed from the admin CMS (/admin/content). This file DERIVES its exports
 *  from those defaults, so existing imports keep working and server/SEO code
 *  (sitemap, robots, OG image, metadata) has a synchronous source.
 *
 *  At runtime, client components read the *published* content via
 *  useContent() (ContentProvider) — these exports are the fallback/defaults.
 *
 *  Non-content settings that are NOT edited in the CMS (endpoints, SES) stay
 *  here as plain config.
 * ───────────────────────────────────────────────────────────── */
import { defaultContent, type SizeKey as _SizeKey, type ServiceContent } from "@/content/schema";

export type SizeKey = _SizeKey;
export type ServiceSpec = ServiceContent;

export const site = {
  name: defaultContent.site.name,
  wordmark: defaultContent.site.name,
  shortName: defaultContent.site.name,
  url: defaultContent.site.url,
  locale: defaultContent.site.locale,
  tagline: defaultContent.site.tagline,
  descriptor: defaultContent.site.descriptor,
  description: defaultContent.site.description,
} as const;

export const contact = {
  email: defaultContent.contact.email,
  whatsapp: defaultContent.contact.whatsapp,
  whatsappDisplay: defaultContent.contact.whatsappDisplay,
  dmKeyword: defaultContent.contact.dmKeyword,
} as const;

export const social = {
  instagram: defaultContent.social.instagram,
  get instagramUrl() {
    return this.instagram ? `https://instagram.com/${this.instagram}` : "";
  },
} as const;

/** Marketing form provider. The /api/enquiry route emails you via AWS SES.
 *  Set ENQUIRY_FROM (+ AWS_SES_REGION and IAM role or keys) to enable email.
 *  Leads are saved to Postgres when DATABASE_URL is set (see /admin). */
export const forms = { enquiryEndpoint: "/api/enquiry" } as const;

export const offer = { firstProjectDiscountPct: defaultContent.offer.firstProjectDiscountPct } as const;

export const nav = {
  links: defaultContent.nav.links,
  cta: defaultContent.nav.cta,
} as const;

export const catalog: ServiceSpec[] = defaultContent.catalog;
export const sizes = defaultContent.sizes;
export const whens = defaultContent.whens;
export const proof = defaultContent.proof;
