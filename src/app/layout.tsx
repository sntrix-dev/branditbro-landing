import type { Metadata, Viewport } from "next";
// Self-hosted fonts (no external Google Fonts request at build or runtime)
import "@fontsource-variable/gabarito";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { site, contact, social } from "@/site.config";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — put your business online`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "digital agency India",
    "website design",
    "mobile app development",
    "performance marketing",
    "video editing",
    "branding agency",
    "small business website",
  ],
  applicationName: site.name,
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — put your business online`,
    description: site.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — put your business online`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#16100D",
  width: "device-width",
  initialScale: 1,
};

/** Bare root shell — just <html>/<body>, fonts and org schema.
 *  Marketing chrome (nav, footer, mobile app) lives in (site)/layout.tsx so
 *  the /admin section can render its own shell without any of it. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    description: site.description,
    email: contact.email,
    areaServed: "IN",
    sameAs: [social.instagramUrl].filter(Boolean),
    makesOffer: ["Websites", "Mobile apps", "Marketing", "Video editing", "Branding"].map(
      (s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s } })
    ),
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
