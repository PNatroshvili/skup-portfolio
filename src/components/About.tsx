"use client";

import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function About() {
  const { t } = useLanguage();
  const about = siteContent.about;

  return (
    <section id="about" className="px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
          {t(about.title)}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-white/75">
          {t(about.body)}
        </p>
      </div>
    </section>
  );
}
