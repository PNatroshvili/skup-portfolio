"use client";

import Reveal from "./Reveal";
import DeviceShowcase from "./DeviceShowcase";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

const defaultCtaLabel = { ka: "პროექტის ნახვა", en: "View Project" };

export default function Projects() {
  const { t } = useLanguage();
  const projects = siteContent.projects;

  return (
    <section id="projects" className="border-t border-line px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-[12px] font-medium tracking-[0.12em] text-muted">
            {t(projects.title)}
          </h2>
        </Reveal>

        <div className="mt-16 space-y-24 md:space-y-32">
          {projects.items.map((project, i) => {
            const flipped = i % 2 === 1;

            return (
              <Reveal key={project.name + i}>
                <article className="grid items-center gap-10 md:grid-cols-12 md:gap-14">
                  <div
                    className={`md:col-span-7 ${
                      flipped ? "md:order-2 md:col-start-6" : ""
                    }`}
                  >
                    {project.image ? (
                      <DeviceShowcase images={project.image} name={project.name} />
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-line bg-surface text-4xl font-medium text-subtle">
                        {project.name.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className={`md:col-span-5 ${flipped ? "md:order-1 md:col-start-1 md:row-start-1" : ""}`}>
                    <span className="font-display text-[12px] tabular-nums text-subtle">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <h3 className="mt-3 font-display text-2xl font-medium tracking-tight text-fg md:text-3xl">
                      {project.name}
                    </h3>

                    <p className="mt-1.5 text-[13px] font-medium text-muted">
                      {t(project.eyebrow)}
                    </p>

                    <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-muted">
                      {t(project.description)}
                    </p>

                    {(project.challenge || project.approach) && (
                      <dl className="mt-5 space-y-4 border-t border-line pt-5">
                        {project.challenge && (
                          <div>
                            <dt className="text-[11px] font-medium tracking-[0.1em] text-subtle">
                              {t({ ka: "გამოწვევა", en: "Challenge" })}
                            </dt>
                            <dd className="mt-1.5 text-[13px] leading-relaxed text-muted">
                              {t(project.challenge)}
                            </dd>
                          </div>
                        )}
                        {project.approach && (
                          <div>
                            <dt className="text-[11px] font-medium tracking-[0.1em] text-subtle">
                              {t({ ka: "მიდგომა", en: "Approach" })}
                            </dt>
                            <dd className="mt-1.5 text-[13px] leading-relaxed text-muted">
                              {t(project.approach)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}

                    {project.tags.length > 0 && (
                      <p className="mt-5 text-[12px] tracking-[0.02em] text-subtle">
                        {project.tags.join(" · ")}
                      </p>
                    )}

                    {project.link && (
                      <div className="mt-6">
                        <span className="block text-[13px] font-medium text-fg">
                          {t(project.ctaLabel ?? defaultCtaLabel)}
                        </span>
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group mt-1.5 inline-flex items-center gap-2 border-b border-line pb-1 text-[13px] text-muted transition-colors hover:border-accent hover:text-fg"
                        >
                          {project.link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill="none"
                            className="text-subtle transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                          >
                            <path d="M5 11l6-6M6 5h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
