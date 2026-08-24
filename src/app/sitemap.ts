import type { MetadataRoute } from "next";

// Required for `output: export` — otherwise Next treats `new Date()` below
// as request-time and refuses to prerender this route statically.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://skup.ge";
  const lastModified = new Date();

  // Two real, separately indexable pages: "/" (ka) and "/en/" (en). #anchor
  // fragments aren't distinct crawlable resources — Google folds them into
  // the base page and never indexes them separately, so they don't belong
  // here (they previously showed up as noise in Search Console's
  // "discovered/crawled — currently not indexed" buckets).
  return [
    {
      url: base,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: { ka: base, en: `${base}/en/` } },
    },
    {
      url: `${base}/en/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { ka: base, en: `${base}/en/` } },
    },
  ];
}
