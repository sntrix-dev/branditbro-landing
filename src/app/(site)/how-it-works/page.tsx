import type { Metadata } from "next";
import HowItWorksPage from "@/components/HowItWorksPage";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Six stages, nothing hidden in between. A fixed price and launch date agreed up front, a real first direction you can walk away from, built in the open, and full ownership handed over on launch day.",
  alternates: { canonical: "/how-it-works" },
};

export default function Page() {
  return <HowItWorksPage />;
}
