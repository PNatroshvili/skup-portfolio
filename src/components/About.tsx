"use client";

import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function About() {
  const { t } = useLanguage();
  const about = siteContent.about;

  return (
    <section id="about" className="border-t border-line px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[200px_1fr] md:gap-16">
          <Reveal>
            <h2 className="text-[12px] font-medium tracking-[0.12em] text-muted md:sticky md:top-28">
              {t(about.title)}
            </h2>
          </Reveal>

          <div className="max-w-2xl">
            <Reveal>
              <p className="font-display text-2xl font-medium leading-snug text-fg md:text-[2rem]">
                {t(about.heading)}
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-6 whitespace-pre-line text-[15px] leading-[1.75] text-muted">
                {t(about.body)}
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="mt-8 font-display text-sm text-fg">
                <p className="font-medium">SKUP</p>
                <p className="text-subtle">Tbilisi, Georgia</p>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={100}>
          <div className="mt-20 border-t border-line pt-14 text-center">
            <p className="mx-auto max-w-2xl font-display text-2xl font-medium leading-snug text-fg md:text-3xl">
              “{about.statement.heading}”
            </p>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted">
              {t(about.statement.body)}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
