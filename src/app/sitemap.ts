import type { MetadataRoute } from "next";

// Required for `output: export` — otherwise Next treats `new Date()` below
// as request-time and refuses to prerender this route statically.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://skup.ge";
  const lastModified = new Date();

  // Single-page site: only the canonical URL belongs here. #anchor entries
  // aren't distinct crawlable resources — Google folds them into the base
  // page and never indexes them separately, so listing them just wastes
  // crawl attention (and showed up as noise in Search Console's
  // "discovered/crawled — currently not indexed" buckets).
  return [{ url: base, lastModified, changeFrequency: "monthly", priority: 1 }];
}
