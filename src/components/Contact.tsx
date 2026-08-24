"use client";

import Reveal from "./Reveal";
import ContactForm from "./ContactForm";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-6 border-b border-line py-6 transition-colors hover:border-line-strong"
    >
      <span className="text-[12px] tracking-[0.1em] text-subtle">
        {label}
      </span>
      <span className="flex items-center gap-3 font-display text-lg text-fg transition-colors group-hover:text-accent md:text-xl">
        {value}
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-subtle transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
        >
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

export default function Contact() {
  const { t } = useLanguage();
  const contact = siteContent.contact;
  const links = contact.links.filter((l) => l.url);

  return (
    <section id="contact" className="border-t border-line px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <Reveal>
              <h2 className="text-[12px] font-medium tracking-[0.12em] text-muted">
                {t(contact.title)}
              </h2>
            </Reveal>

            <Reveal delay={80}>
              <p className="mt-6 max-w-md font-display text-2xl leading-snug font-normal text-fg md:text-[2rem]">
                {t(contact.heading)}
              </p>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted">
                {t(contact.body)}
              </p>
            </Reveal>

            <Reveal delay={160}>
              <a
                href={`mailto:${contact.email}`}
                className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-fg px-6 py-3 text-[13px] font-medium text-bg transition-opacity hover:opacity-85"
              >
                {t(contact.ctaLabel)}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Reveal>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <Reveal delay={120}>
              <h3 className="text-[12px] tracking-[0.12em] text-subtle">
                {t(contact.infoLabel)}
              </h3>
              <div className="mt-4 border-t border-line">
                <ContactRow
                  label={t({ ka: "ელფოსტა", en: "Email" })}
                  value={contact.email}
                  href={`mailto:${contact.email}`}
                />
                {contact.phone && (
                  <ContactRow
                    label={t({ ka: "ტელეფონი", en: "Phone" })}
                    value={contact.phone}
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                  />
                )}
                <div className="flex items-center justify-between gap-6 border-b border-line py-6">
                  <span className="text-[12px] tracking-[0.1em] text-subtle">
                    {t({ ka: "ადგილმდებარეობა", en: "Location" })}
                  </span>
                  <span className="font-display text-lg text-fg md:text-xl">
                    {t(contact.location)}
                  </span>
                </div>
                {links.map((link) => (
                  <ContactRow
                    key={link.label}
                    label={link.label}
                    value={link.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    href={link.url}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={160}>
          <div className="mt-20 max-w-xl border-t border-line pt-14">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
