"use client";

import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function Hero() {
  const { t } = useLanguage();
  const hero = siteContent.hero;
  const projectCount = siteContent.projects.items.length;
  const serviceCount = siteContent.services.items.length;

  return (
    <section id="top" className="relative overflow-hidden px-6 pt-24 pb-24 md:pt-32 md:pb-32">
      {/* Barely-there texture instead of a saturated gradient wash. */}
      <div
        aria-hidden
        className="hairline-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />

      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h1 className="max-w-4xl font-display text-[2.6rem] leading-[1.08] font-medium tracking-tight text-fg sm:text-6xl lg:text-[4rem]">
            {t(hero.title)}
          </h1>
        </Reveal>

        <Reveal delay={80}>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
            {t(hero.subtitle)}
          </p>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#projects"
              className="group inline-flex items-center gap-2.5 rounded-full bg-fg px-6 py-3 text-[13px] font-medium text-bg transition-opacity hover:opacity-85"
            >
              {t(hero.ctaPrimary)}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="#contact"
              className="inline-flex items-center rounded-full border border-line px-6 py-3 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {t(hero.ctaSecondary)}
            </a>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <dl className="mt-20 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
            {[
              { value: `${projectCount}+`, label: { ka: "პროექტი", en: "Projects" } },
              { value: `${serviceCount}`, label: { ka: "სერვისი", en: "Services" } },
              { value: "3", label: { ka: "პლატფორმა", en: "Platforms" } },
            ].map((stat) => (
              <div key={stat.value + stat.label.en} className="bg-bg px-5 py-6">
                <dt className="font-display text-3xl font-medium text-fg">{stat.value}</dt>
                <dd className="mt-1.5 text-[12px] tracking-[0.08em] text-subtle">
                  {t(stat.label)}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
