import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://yanmengli123.github.io',
  base: '/ymllblog',
  integrations: [
    tailwind(),
    react(),
  ],
  output: 'static',
});
