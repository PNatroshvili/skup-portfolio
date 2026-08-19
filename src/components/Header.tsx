"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
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
  const [scrolled, setScrolled] = useState(false);
  const nav = siteContent.nav;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-line bg-bg/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#top" aria-label={nav.brand}>
          <Logo />
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="group relative text-[13px] text-muted transition-colors hover:text-fg"
            >
              {t(nav.links[item.key])}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLocale}
            className="rounded-full border border-line px-3 py-1.5 text-[11px] font-medium tracking-wider text-muted transition-colors hover:border-line-strong hover:text-fg"
            aria-label="Toggle language"
          >
            {locale === "ka" ? "EN" : "ქა"}
          </button>

          <button
            className="-mr-1 p-1.5 text-muted transition-colors hover:text-fg md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 8h16M4 16h16"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`grid overflow-hidden border-t border-line bg-bg/95 backdrop-blur-xl transition-[grid-template-rows] duration-300 md:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-t-transparent"
        }`}
      >
        <nav className="min-h-0">
          <div className="flex flex-col px-6 py-3">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3.5 text-sm text-muted transition-colors last:border-0 hover:text-fg"
              >
                {t(nav.links[item.key])}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
