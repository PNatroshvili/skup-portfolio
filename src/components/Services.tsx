"use client";

import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

/**
 * Services render as a numbered editorial list rather than a card grid — with
 * seven items a 3-column grid always leaves an orphan on the last row, and the
 * list reads calmer besides.
 */
export default function Services() {
  const { t } = useLanguage();
  const services = siteContent.services;

  return (
    <section id="services" className="border-t border-line px-6 py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[200px_1fr] md:gap-16">
        <Reveal>
          <h2 className="text-[12px] font-medium tracking-[0.12em] text-muted md:sticky md:top-28">
            {t(services.title)}
          </h2>
        </Reveal>

        <div className="border-t border-line">
          {services.items.map((service, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 border-b border-line py-7 transition-colors md:grid-cols-[auto_minmax(0,15rem)_1fr] md:gap-x-8">
                <span className="font-display text-[13px] tabular-nums text-subtle transition-colors group-hover:text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-lg font-medium text-fg md:text-xl">
                  {t(service.title)}
                </h3>
                <p className="col-start-2 max-w-xl text-[14px] leading-relaxed text-muted md:col-start-3">
                  {t(service.description)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
