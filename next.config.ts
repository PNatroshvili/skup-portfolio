import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export -> produces an /out folder that GitHub Pages can serve directly.
  output: "export",
  // next/image optimization needs a server; disable it for static hosting.
  images: {
    unoptimized: true,
  },
  // Makes every route export as /route/index.html, which plays nicely with
  // GitHub Pages' static file server (no rewrites needed).
  trailingSlash: true,
};

export default nextConfig;
