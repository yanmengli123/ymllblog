import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
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

function adminIndexRedirect(basePath) {
  const prefix = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  const adminPath = `${prefix}/admin`;
  return {
    name: 'ymll-admin-index-redirect',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname;
        const isAdminDirectory = [adminPath, `${adminPath}/`, '/admin', '/admin/'].includes(pathname);
        if (!isAdminDirectory) return next();
        response.statusCode = 302;
        response.setHeader('Location', `${adminPath}/index.html`);
        response.end();
      });
    },
  };
}

export default defineConfig({
  site,
  base,
  integrations: [],
  vite: {
    plugins: [adminIndexRedirect(base), tailwindcss()],
    server: {
      proxy: {
        '/admin-api': 'http://127.0.0.1:8787',
        '/ymllblog/admin-api': {
          target: 'http://127.0.0.1:8787',
          rewrite: (path) => path.replace(/^\/ymllblog/, ''),
        },
      },
    },
  },
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
