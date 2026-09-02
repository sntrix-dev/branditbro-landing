import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CareersPage, { type PublicRole } from "@/components/CareersPage";
import { dbEnabled, listRoles } from "@/lib/careers";
import { extractEnabled } from "@/lib/extract";
import { getSiteContent } from "@/lib/content";
import { DEFAULT_ROLES } from "@/content/careers-schema";
import { site } from "@/site.config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Work with branditbro — per-task like a freelancer or full-time, always paid, remote-first, India. Scope and pay agreed before you start. Or bring us a client and keep 25%.",
  alternates: { canonical: `${site.url}/careers` },
  openGraph: {
    title: "Careers · branditbro",
    description: "Paid per task or full-time. Remote. No unpaid trials. Reply in 3 working days.",
    url: `${site.url}/careers`,
  },
};

/** Map a stored/seed role to the public shape (drops internal AI hints). */
function toPublic(r: { key: string; team: string; title: string; mode: string; pay: string; band: string; blurb: string; tags: string[]; skills: string[] }): PublicRole {
  return { key: r.key, team: r.team, title: r.title, mode: r.mode, pay: r.pay, band: r.band, blurb: r.blurb, tags: r.tags, skills: r.skills };
}

export default async function Careers() {
  const content = await getSiteContent();
  if (content.careers?.enabled === false) notFound();

  let roles: PublicRole[];
  if (dbEnabled) {
    try {
      roles = (await listRoles({ openOnly: true })).map(toPublic);
    } catch {
      roles = DEFAULT_ROLES.map(toPublic);
    }
  } else {
    roles = DEFAULT_ROLES.map(toPublic);
  }

  return <CareersPage roles={roles} extractEnabled={extractEnabled} />;
}
