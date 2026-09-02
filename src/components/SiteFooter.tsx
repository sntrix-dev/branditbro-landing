import Link from "next/link";
import { resolveContent, type Content } from "@/content/schema";
import { Wordmark } from "@/components/Logo";
import { PRICING_ENABLED } from "@/lib/flags";

const services = [
  "Websites",
  "Mobile apps",
  "Marketing",
  "Video editing",
  "Branding",
];

/* ── minimal brand-mark SVGs (inherit currentColor) ── */
const IG = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const X = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);
const LI = (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5.001ZM3.25 8.9h3.46V21H3.25V8.9ZM9.02 8.9h3.32v1.66h.05c.46-.87 1.6-1.79 3.29-1.79 3.52 0 4.17 2.32 4.17 5.33V21h-3.46v-5.36c0-1.28-.02-2.92-1.78-2.92-1.78 0-2.05 1.39-2.05 2.83V21H9.02V8.9Z" />
  </svg>
);

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center w-[42px] h-[42px] rounded-full border border-cream/20 text-cream/80 hover:text-ink hover:bg-mango hover:border-mango transition-colors duration-200"
    >
      {children}
    </a>
  );
}

export default function SiteFooter({ content }: { content: Content }) {
  const { site, contact, social, nav } = resolveContent(content);
  const year = 2026;
  const wa = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "";
  return (
    <footer className="bg-ink text-cream border-t border-cream/12 px-6 sm:px-12 pt-16 pb-10">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <Wordmark className="text-[34px]" />
            <p className="text-[14.5px] leading-relaxed text-cream/60 max-w-[30ch] pretty">
              {site.tagline}
            </p>
            <span className="text-[13px] text-cream/45">{site.descriptor}</span>
            <div className="flex items-center gap-3 mt-2">
              <SocialIcon href={social.instagramUrl} label="branditbro on Instagram">{IG}</SocialIcon>
              <SocialIcon href={social.twitterUrl} label="branditbro on X (Twitter)">{X}</SocialIcon>
              <SocialIcon href={social.linkedinUrl} label="branditbro on LinkedIn">{LI}</SocialIcon>
            </div>
          </div>

          <nav aria-label="Pages" className="flex flex-col gap-3">
            <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-mango-soft">Pages</span>
            {nav.links.filter((l) => PRICING_ENABLED || l.href !== "/pricing").map((l) => (
              <Link key={l.href} href={l.href} className="text-[14.5px] text-cream/70 hover:text-cream transition-colors">
                {l.label}
              </Link>
            ))}
            <Link href="/contact" className="text-[14.5px] text-cream/70 hover:text-cream transition-colors">
              Contact
            </Link>
            <Link href="/careers" className="text-[14.5px] text-cream/70 hover:text-cream transition-colors">
              Careers
            </Link>
          </nav>

          <div className="flex flex-col gap-3">
            <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-mango-soft">What we build</span>
            {services.map((s) => (
              <span key={s} className="text-[14.5px] text-cream/70">{s}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[12px] tracking-[0.2em] uppercase font-bold text-mango-soft">Reach us</span>
            <a href={`mailto:${contact.email}`} className="text-[14.5px] text-cream/80 hover:text-cream transition-colors break-all">
              {contact.email}
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="text-[14.5px] text-cream/70 hover:text-cream transition-colors">
                WhatsApp {contact.whatsappDisplay}
              </a>
            )}
            <span className="text-[13px] leading-[1.5] text-cream/45 mt-1 max-w-[26ch]">A person replies, usually within a day.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-cream/12 pt-6 text-[13px] text-cream/45">
          <span>© {year} {site.name}. You own everything we make for you.</span>
          <span>Fixed price · agreed launch date · no lock-in</span>
        </div>
      </div>
    </footer>
  );
}
