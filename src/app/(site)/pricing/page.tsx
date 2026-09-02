import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PricingPage from "@/components/PricingPage";
import { PRICING_ENABLED } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "No “contact us for pricing.” Answer three questions and see an honest ballpark for a website, app, branding, marketing or video — before anyone calls you. The exact quote comes later, in writing.",
  alternates: { canonical: "/pricing" },
};

export default function Page() {
  // Pricing is switched off for v1 — the builder still exists (below), but the
  // page redirects home until PRICING_ENABLED is flipped back on.
  if (!PRICING_ENABLED) redirect("/contact");
  return <PricingPage />;
}
