"use client";

import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function About() {
  const { t } = useLanguage();
  const about = siteContent.about;

  return (
    <section id="about" className="border-t border-line px-6 py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[200px_1fr] md:gap-16">
        <Reveal>
          <h2 className="text-[12px] font-medium tracking-[0.12em] text-muted md:sticky md:top-28">
            {t(about.title)}
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <p className="max-w-3xl font-display text-xl leading-[1.65] font-normal text-fg/90 md:text-[1.6rem] md:leading-[1.6]">
            {t(about.body)}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
