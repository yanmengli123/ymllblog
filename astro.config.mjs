import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// BASE_URL controls the site subpath:
//   - GitHub Pages deploys need '/ymllblog' (set in package.json scripts via process.env, or hardcoded below)
//   - Cloudflare Pages deploys use '/' (set via the BASE_URL env var in the Cloudflare dashboard)
//   - Local dev defaults to '/' so http://localhost:4321/ just works
const base = process.env.BASE_URL ?? '/ymllblog';

// SITE controls the canonical host for RSS / sitemap / OG tags.
//   - GitHub Pages default: https://yanmengli123.github.io/ymllblog
//   - Cloudflare Pages:  set SITEMAP_SITE_ROOT=https://ymllblog.pages.dev in dashboard
//   - Custom domain:    set SITEMAP_SITE_ROOT=https://yourdomain.tld
const site = process.env.SITEMAP_SITE_ROOT ?? 'https://yanmengli123.github.io/ymllblog';

export default defineConfig({
  site,
  base,
  integrations: [
    tailwind(),
    react(),
  ],
  output: 'static',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
