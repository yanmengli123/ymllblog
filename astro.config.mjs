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

export default defineConfig({
  site: 'https://yanmengli123.github.io',
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
