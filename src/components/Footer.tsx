"use client";

import { LogoMark } from "./Logo";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-5 w-5 text-subtle" />
          <span className="text-[12px] text-subtle">
            © {year} {siteContent.nav.brand}. {t(siteContent.footer.text)}
          </span>
        </div>

        <a
          href="#top"
          className="group flex items-center gap-2 text-[12px] text-subtle transition-colors hover:text-fg"
        >
          {t({ ka: "ზემოთ", en: "Back to top" })}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:-translate-y-0.5">
            <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
