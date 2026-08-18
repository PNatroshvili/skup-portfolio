"use client";

import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function Hero() {
  const { t } = useLanguage();
  const hero = siteContent.hero;

  return (
    <section id="top" className="relative overflow-hidden px-6 pt-24 pb-20 md:pt-32 md:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.25),transparent)]"
      />
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-indigo-400">
          {t(hero.eyebrow)}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          {t(hero.title)}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          {t(hero.subtitle)}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#projects"
            className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
          >
            {t(hero.ctaPrimary)}
          </a>
          <a
            href="#contact"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 transition-colors hover:border-white/40"
          >
            {t(hero.ctaSecondary)}
          </a>
        </div>
      </div>
    </section>
  );
}
