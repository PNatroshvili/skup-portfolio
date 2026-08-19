"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-8xl font-medium tracking-tight text-fg">
            404
          </p>
          <h1 className="mt-6 text-xl font-medium text-fg">
            {t({
              ka: "ეს გვერდი ვერ მოიძებნა",
              en: "This page couldn't be found",
            })}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            {t({
              ka: "ბმული შეიძლება მოძველებული იყოს, ან გვერდი გადატანილია.",
              en: "The link may be outdated, or the page has moved.",
            })}
          </p>
          <a
            href="/"
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-fg px-6 py-3 text-[13px] font-medium text-bg transition-opacity hover:opacity-85"
          >
            {t({ ka: "მთავარ გვერდზე დაბრუნება", en: "Back to home" })}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:-translate-x-0.5">
              <path d="M13 8H3M7 4 3 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
