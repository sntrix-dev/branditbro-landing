import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Bare admin shell — no marketing nav/footer. Each page renders its own
 *  header so the login screen stays clean. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-ink-deep text-cream font-sans antialiased">{children}</div>
  );
}
