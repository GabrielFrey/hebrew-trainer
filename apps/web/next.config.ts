import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Full client shells (demo auth + usePathname). cacheComponents prerender
  // overlays a blocking-hook error on /learn/[slug] in this Next 16 app.
  cacheComponents: false,
  transpilePackages: ["@biti/i18n", "@biti/design-tokens", "@biti/hebrew-text"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
