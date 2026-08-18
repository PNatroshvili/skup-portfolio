"use client";

import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-white/40 sm:flex-row">
        <span>
          © {year} {siteContent.nav.brand}. {t(siteContent.footer.text)}
        </span>
      </div>
    </footer>
  );
}
