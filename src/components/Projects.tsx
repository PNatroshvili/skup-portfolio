"use client";

import { useLanguage } from "./LanguageProvider";
import { siteContent } from "@/lib/content";
import type { ProjectImages } from "@/lib/types";

function DeviceShots({ images, name }: { images: ProjectImages; name: string }) {
  return (
    <div className="space-y-2 p-3">
      {/* Desktop — wide browser-chrome frame */}
      <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
        <div className="flex items-center gap-1.5 bg-white/[0.06] px-2.5 py-1.5">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
        </div>
        <div className="aspect-[16/10] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images.desktop}
            alt={`${name} — web`}
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
        </div>
      </div>

      {/* Tablet + mobile — smaller side-by-side frames */}
      <div className="flex gap-2">
        <div className="w-[62%] overflow-hidden rounded-lg border border-white/10 bg-black/40">
          <div className="aspect-[4/3] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images.tablet}
              alt={`${name} — tablet`}
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
        <div className="w-[38%] overflow-hidden rounded-lg border border-white/10 bg-black/40">
          <div className="aspect-[9/16] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images.mobile}
              alt={`${name} — mobile`}
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { t } = useLanguage();
  const projects = siteContent.projects;

  return (
    <section id="projects" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
          {t(projects.title)}
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.items.map((project, i) => {
            const card = (
              <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/25">
                {project.image ? (
                  <DeviceShots images={project.image} name={project.name} />
                ) : (
                  <div className="m-3 flex aspect-[16/10] items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 text-white/20">
                    <span className="text-4xl font-bold">
                      {project.name.slice(0, 1)}
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col px-6 pb-6 pt-1">
                  <h3 className="text-lg font-semibold text-white">
                    {project.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/65">
                    {t(project.description)}
                  </p>
                  {project.tech.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tech.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );

            return project.link ? (
              <a
                key={project.name + i}
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                {card}
              </a>
            ) : (
              <div key={project.name + i} className="h-full">
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
