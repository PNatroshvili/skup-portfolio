import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LUKMA is deployed on Vercel. Keeping the app server-enabled lets us proxy
  // the restaurant API through the same origin and avoid browser CORS issues.
  images: {
    unoptimized: true,
  },
  // Makes every route export as /route/index.html, which plays nicely with
  // GitHub Pages' static file server (no rewrites needed).
  trailingSlash: true,
};

export default nextConfig;
