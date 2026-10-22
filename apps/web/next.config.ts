import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Full client shells (demo auth + usePathname). cacheComponents prerender
  // overlays a blocking-hook error on /learn/[slug] in this Next 16 app.
  cacheComponents: false,
  // The Next.js 16 NEXTJS-PORTAL badge is focusable and steals the first Tab
  // from the skip link in Playwright.
  devIndicators: false,
  transpilePackages: ["@biti/i18n", "@biti/design-tokens", "@biti/hebrew-text", "@biti/grading"],
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
