import type { Metadata } from "next";
import ServicesPage from "@/components/ServicesPage";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Websites & web apps, mobile applications, brand identity, performance marketing and short-form video — with measurement wired in, source files in your name, and a scope fixed on signature.",
  alternates: { canonical: "/services" },
};

export default function Page() {
  return <ServicesPage />;
}
