"use client";

import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function Services() {
  const { t } = useLanguage();
  const services = siteContent.services;

  return (
    <section id="services" className="border-t border-white/10 bg-white/[0.02] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
          {t(services.title)}
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((service, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20"
            >
              <div className="text-3xl">{service.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {t(service.title)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {t(service.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
