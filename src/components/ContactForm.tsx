"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

/**
 * Static export has no backend to POST to, so submission opens the visitor's
 * email client with a pre-filled message to `contact.email` — zero moving
 * parts, works everywhere, no third-party form service or API key needed.
 * (If a real POST endpoint — e.g. Web3Forms/Formspree — gets set up later,
 * swap the onSubmit body for a fetch() call; the markup stays the same.)
 */
export default function ContactForm() {
  const { t } = useLanguage();
  const form = siteContent.contact.form;
  const [type, setType] = useState(form.types[0]?.value ?? "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const budget = String(data.get("budget") ?? "").trim();
    const timeline = String(data.get("timeline") ?? "").trim();
    const typeLabel = form.types.find((tp) => tp.value === type)?.label;

    const subject = `New project inquiry from ${name || "website"}`;
    const bodyLines = [
      typeLabel ? `Project type: ${t(typeLabel)}` : null,
      `Email: ${email}`,
      budget ? `Budget: ${budget}` : null,
      timeline ? `Timeline: ${timeline}` : null,
      "",
      message,
    ].filter((l) => l !== null);

    const mailto = `mailto:${siteContent.contact.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailto;
  };

  const fieldClass =
    "mt-2 w-full border-0 border-b border-line bg-transparent py-2.5 text-[15px] text-fg placeholder:text-subtle focus:border-fg focus:outline-none";
  const labelClass = "block text-[11px] uppercase tracking-[0.1em] text-subtle";

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Two columns fill the section's actual width instead of one long
          center-aligned stack: "who's asking" on the left, "what/when/send"
          on the right — split by a vertical rule at md so the page reads as
          one deliberate block, not a form that trails off into empty space. */}
      <div className="grid gap-x-14 gap-y-10 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className={labelClass}>
              {t(form.nameLabel)}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder={t(form.namePlaceholder)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              {t(form.emailLabel)}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="message" className={labelClass}>
              {t(form.messageLabel)}
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              placeholder={t(form.messagePlaceholder)}
              className={`${fieldClass} resize-none leading-relaxed`}
            />
          </div>
        </div>

        <div className="space-y-6 md:border-l md:border-line md:pl-14">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="budget" className={labelClass}>
                {t(form.budgetLabel)}
              </label>
              <input
                id="budget"
                name="budget"
                type="text"
                placeholder={t(form.budgetPlaceholder)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="timeline" className={labelClass}>
                {t(form.timelineLabel)}
              </label>
              <input
                id="timeline"
                name="timeline"
                type="text"
                placeholder={t(form.timelinePlaceholder)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <span className={labelClass}>{t(form.typeLabel)}</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {form.types.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  aria-pressed={type === option.value}
                  className={`rounded-full border px-3.5 py-1.5 text-[12px] transition-colors ${
                    type === option.value
                      ? "border-fg bg-fg text-bg"
                      : "border-line text-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  {t(option.label)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="group inline-flex items-center gap-2.5 rounded-full bg-fg px-6 py-3 text-[13px] font-medium text-bg transition-opacity hover:opacity-85"
          >
            {t(form.submit)}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
