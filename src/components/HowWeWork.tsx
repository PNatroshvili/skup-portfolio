"use client";

import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function HowWeWork() {
  const { t } = useLanguage();
  const work = siteContent.howWeWork;

  return (
    <section className="border-t border-line px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-[12px] font-medium tracking-[0.12em] text-muted">
            {t(work.title)}
          </h2>
        </Reveal>

        <Reveal delay={60}>
          <p className="mt-5 max-w-xl font-display text-xl font-medium leading-snug text-fg md:text-2xl">
            {t(work.subtitle)}
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {work.steps.map((step, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="border-t border-line pt-5">
                <span className="font-display text-[13px] tabular-nums text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-medium text-fg">
                  {t(step.title)}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  {t(step.description)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
