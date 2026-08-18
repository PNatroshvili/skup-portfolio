"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

const navItems = [
  { key: "about", href: "#about" },
  { key: "services", href: "#services" },
  { key: "projects", href: "#projects" },
  { key: "contact", href: "#contact" },
] as const;

export default function Header() {
  const { t, locale, toggleLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const nav = siteContent.nav;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--background)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="text-lg font-semibold tracking-tight">
          {nav.brand}
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {t(nav.links[item.key])}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLocale}
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
            aria-label="Toggle language"
          >
            {locale === "ka" ? "EN" : "KA"}
          </button>

          <button
            className="text-white/80 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-6 py-4 md:hidden">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              {t(nav.links[item.key])}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
