"use client";

import Reveal from "./Reveal";
import DeviceShowcase from "./DeviceShowcase";
import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";

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

                    <p className="mt-4 text-[14px] leading-relaxed text-muted">
                      {t(project.description)}
                    </p>

                    {project.tech.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {project.tech.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full border border-line px-3 py-1 text-[11px] tracking-wide text-subtle"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-7 inline-flex items-center gap-2 border-b border-line pb-1 text-[13px] text-fg transition-colors hover:border-accent"
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
