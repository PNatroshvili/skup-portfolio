"use client";

import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";
import type { ServiceIconKey } from "@/lib/types";

/**
 * Thin-stroke, single-weight icon set — same visual language as the terminal
 * mark in Logo.tsx (1.6px stroke, round caps) instead of emoji. Emoji renders
 * inconsistently across platforms and read as a template default, which is
 * the opposite of what these four capabilities are meant to signal.
 */
const icons: Record<ServiceIconKey, React.ReactNode> = {
  web: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  apps: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="12" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 17h4M9.5 13.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="16.5" y="9.5" width="5" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M18.3 17.3h1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  design: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9h17M9 20.5V9" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  growth: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 17.5 9.5 12l3.2 3.2L20 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 7.5H20v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

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

        <div>
          {services.intro && (
            <Reveal>
              <p className="max-w-xl font-display text-xl font-medium leading-snug text-fg md:text-2xl">
                {t(services.intro)}
              </p>
            </Reveal>
          )}

          <div className="mt-10 border-t border-line">
            {services.items.map((service, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="group grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-2 border-b border-line py-7 transition-colors md:grid-cols-[auto_minmax(0,15rem)_1fr] md:gap-x-8">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-subtle transition-colors group-hover:border-accent group-hover:text-accent [&_svg]:h-4 [&_svg]:w-4">
                    {icons[service.icon]}
                  </span>
                  <h3 className="font-display text-lg font-medium text-fg md:text-xl">
                    {t(service.title)}
                  </h3>
                  <div className="col-start-2 max-w-xl md:col-start-3">
                    <p className="text-[14px] leading-relaxed text-muted">
                      {t(service.description)}
                    </p>
                    {service.tags.length > 0 && (
                      <p className="mt-3 text-[12px] tracking-[0.02em] text-subtle">
                        {service.tags.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
