"use client";

import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

export default function Contact() {
  const { t } = useLanguage();
  const contact = siteContent.contact;

  return (
    <section
      id="contact"
      className="border-t border-white/10 bg-white/[0.02] px-6 py-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
          {t(contact.title)}
        </h2>
        <p className="mt-4 text-white/70">{t(contact.body)}</p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={`mailto:${contact.email}`}
            className="text-xl font-semibold text-white hover:text-indigo-400"
          >
            {contact.email}
          </a>
          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/\s+/g, "")}`}
              className="text-white/70 hover:text-white"
            >
              {contact.phone}
            </a>
          )}
        </div>

        {contact.links.some((l) => l.url) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {contact.links
              .filter((l) => l.url)
              .map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-white/40 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
