"use client";

import Reveal from "./Reveal";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

/**
 * Credibility section that doesn't fabricate anything: no client logos or
 * testimonials on file, so instead of inventing them, this points straight
 * at live, shipped projects — the same ones detailed in <Projects> — as
 * self-checkable proof. See the audit: "missing #2 — any trust signal."
 */
export default function Trust() {
  const { t } = useLanguage();
  const trust = siteContent.trust;

  return (
    <section className="border-t border-line px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-16">
          <Reveal>
            <h2 className="text-[12px] font-medium tracking-[0.12em] text-muted">
              {t(trust.title)}
            </h2>
          </Reveal>

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-lg">
              <Reveal>
                <p className="font-display text-xl font-medium leading-snug text-fg md:text-2xl">
                  {t(trust.heading)}
                </p>
              </Reveal>
              <Reveal delay={80}>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">
                  {t(trust.body)}
                </p>
              </Reveal>
            </div>

            <Reveal delay={120}>
              <div className="flex flex-wrap gap-2.5">
                {trust.items.map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    {item.name}
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-subtle transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                    >
                      <path d="M5 11l6-6M6 5h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
