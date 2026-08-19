import type { MetadataRoute } from "next";

// Required for `output: export` — otherwise Next treats `new Date()` below
// as request-time and refuses to prerender this route statically.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://skup.ge";
  const lastModified = new Date();

  // Single-page site: list the page plus its in-page sections so crawlers
  // have anchor-level entries to work with.
  return [
    { url: base, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/#about`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/#services`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/#projects`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/#contact`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
