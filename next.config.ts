import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // LUKMA is deployed on Vercel. Keeping the app server-enabled lets us proxy
  // the restaurant API through the same origin and avoid browser CORS issues.
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async headers() {
    return [
      {
        source: "/discover/",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
