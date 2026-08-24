"use client";

import Logo, { LogoMark } from "./Logo";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

const navItems = [
  { key: "projects", href: "#projects" },
  { key: "services", href: "#services" },
  { key: "about", href: "#about" },
  { key: "contact", href: "#contact" },
] as const;

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const nav = siteContent.nav;
  const contact = siteContent.contact;

  return (
    <footer className="border-t border-line px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-[1fr_auto_auto] sm:gap-16">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
              {t(siteContent.footer.tagline)}
            </p>
          </div>

          <nav className="flex flex-col gap-2.5">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="text-[13px] text-muted transition-colors hover:text-fg"
              >
                {t(nav.links[item.key])}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5 text-[13px] text-muted">
            <span>{t(contact.location)}</span>
            <a href={`mailto:${contact.email}`} className="transition-colors hover:text-fg">
              {contact.email}
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-4 w-4 text-subtle" />
            <span className="text-[12px] text-subtle">
              © {year} {nav.brand}. {t(siteContent.footer.text)}
            </span>
          </div>

          <a
            href="#top"
            className="group flex items-center gap-2 text-[12px] text-subtle transition-colors hover:text-fg"
          >
            {t({ ka: "ზემოთ დაბრუნება", en: "Back to top" })}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:-translate-y-0.5">
              <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
