import type { Metadata } from "next";
import { Suspense } from "react";
import ContactPage from "@/components/ContactPage";

export const metadata: Metadata = {
  title: "Get in touch",
  description:
    "Tell us what you're trying to fix. One person reads every message — no bot, no ticket queue. We reply on WhatsApp within one working day with a plan and a price.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ContactPage />
    </Suspense>
  );
}
