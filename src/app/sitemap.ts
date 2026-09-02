import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { PRICING_ENABLED } from "@/lib/flags";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/services", "/how-it-works", "/contact", "/careers"]
    .concat(PRICING_ENABLED ? ["/pricing"] : []);
  const now = new Date("2026-07-27");
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.9 : 0.8,
  }));
}
