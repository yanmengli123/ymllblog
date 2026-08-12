# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YMLL Blog — a Chinese-language personal technology and computational biology blog. The reader-facing site is statically generated with Astro; the private admin area uses a small authenticated Node.js API. **Primary host: VPS at `https://yanmengli.cn`**.

## Tech Stack

- **Framework:** Astro 7.x (static output mode)
- **Styling:** Tailwind CSS 4.x through Vite + design tokens in `src/styles/global.css`
- **Interactivity:** lightweight browser JavaScript; Pagefind is lazy-loaded for search
- **Math Rendering:** KaTeX via `remark-math` + `rehype-katex`
- **Search:** Pagefind (build-time WASM index, lazy-loaded on first keystroke)
- **Comments:** giscus → GitHub Discussions backend
- **Admin:** custom username/password session API + GitHub Contents API
- **Language:** TypeScript (strict mode)
- **Deployment:** Nginx + systemd on the VPS, automatically updated by GitHub Actions

## Commands

```bash
npm run dev             # Dev server at http://localhost:4321/ymllblog  (base path is mandatory in URLs)
npm run build           # Static build to dist/ + auto-generates sitemap.xml  (chains `astro build && node scripts/generate-sitemap.mjs`)
npm run build:pagefind  # Rebuild only the Pagefind index (rarely needed — runs as part of build)
npm run preview         # Preview built site locally

# Tests — run individually with `node tests/<file>.test.mjs`. They use only Node's `node:assert`, no test framework.
node tests/home-layout.test.mjs     # Home page layout + component structure assertions
node tests/runtime-safety.test.mjs  # XSS safety, inline handler, sitemap, _headers, _redirects assertions
node tests/smoke-production.mjs     # Live HTTP probes against the deployed site. Optional env: SMOKE_BASE_URL (default https://ymllblog.pages.dev)

# One-shot ops
bash scripts/enable-branch-protection.sh   # Apply full main-branch protection ruleset via gh CLI
```

No linting, no pre-commit hooks. CI runs `.github/workflows/ci.yml` on every PR and push to `main` (test + build + link-check + markdownlint). Deployment to GitHub Pages is currently inactive (workflow file repurposed as CI); Cloudflare Pages is the recommended primary host — see `docs/RUNBOOK.md` for migration steps.

## Architecture

### Content Collections (Astro 4)
Blog posts live in `src/content/blog/` as Markdown files. Schema validated by `src/content.config.ts`:

```typescript
schema: z.object({
  title, description, pubDate, updatedDate?,
  author (default 'YMLL'), tags (string[]),
  category?, cover?, draft (default false),
  featured (default false), lang (default 'zh-CN')
})
```

To add a post: create `.md` in `src/content/blog/`, add frontmatter, push to main.

### Base Path
Deployed at `/ymllblog` subpath on GitHub Pages **or** at root (`/`) on Cloudflare Pages — both supported via env. **Always** use:
```typescript
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
// Then: `${base}/blog`, `${base}/tags`, etc.
```
Never hardcode `/blog` — 404s on the host.

`astro.config.mjs` reads `process.env.BASE_URL` (default `/ymllblog`). Cloudflare Pages sets `BASE_URL=/` so URLs are root-relative. The sitemap script reads `process.env.SITEMAP_SITE_ROOT` (default `https://yanmengli123.github.io/ymllblog`); set it to your Cloudflare Pages URL when deploying there so `sitemap.xml` points at the live host.

### Client Architecture
The public site is static Astro markup plus small browser scripts. `src/components/motion/MotionRoot.astro` initializes one shared, framework-free motion runtime; Pagefind and Mermaid are loaded on demand. There are no React islands or animation-framework dependencies.

### CSS Architecture (CRITICAL — read before touching styles)
- `src/styles/global.css` **MUST be imported** in `src/layouts/Layout.astro` at the top of the frontmatter: `import '../styles/global.css';`. Without this, the file is never bundled.
- `src/styles/motion.css` owns motion tokens, states and capability/reduced-motion media queries. Keep component motion values tokenized instead of adding ad-hoc durations.
- Use the existing semantic visual tokens (`--paper`, `--surface`, `--ink`, `--muted`, `--line`, `--brand`) rather than hard-coded theme colors.
- Inline `<style is:global>` blocks in `.astro` files get component-scoped IDs and Tailwind still purges them. Prefer `global.css` for app-wide styles.

### Motion Design System
`Layout.astro` accepts four motion levels: `expressive` (home), `standard` (indexes/about/404), `reading` (articles), and `none` (explicit isolation). The admin is a separate static app and must never import the public motion system.

- `src/styles/motion.css` — duration/easing/distance tokens, native view transitions, reveal/card/header/timeline/tag/reading states.
- `src/scripts/motion.ts` — one shared `IntersectionObserver`, one pointer frame scheduler, bounded click effects, counters, reading-image preparation, and live media-query updates.
- `src/components/motion/MotionRoot.astro` — grid, optional expressive cursor glow, click-effect layer and runtime bootstrap.
- Hover-only effects must stay inside `(hover: hover) and (pointer: fine)`; all new motion must have a `prefers-reduced-motion` fallback.
- Cross-document navigation uses the native View Transition enhancement. Normal navigation remains the fallback when the API is unavailable.

### Default Visual Identity
- Editorial digital-garden layout with warm paper surfaces, near-black ink and restrained emerald accents.
- The home page combines author positioning, research NOW card, selected/latest writing, subject fields and the official NetEase Cloud Music player.
- Serif display typography is paired with a neutral sans-serif UI/body font; dark mode preserves the same semantic token relationships.

### Sitemap Generation
The `@astrojs/sitemap` integration was removed due to incompatibility. Sitemap is generated by `scripts/generate-sitemap.mjs` which runs automatically as part of `npm run build` (chained after `astro build`). The script reads the built `dist/` output and writes `sitemap.xml` with proper URL encoding and XML escaping. The URL prefix is `process.env.SITEMAP_SITE_ROOT` (defaults to the GitHub Pages URL; set to your Cloudflare Pages or custom-domain URL in production).

### Content Management
The admin UI lives in `public/admin/`; `server/admin-server.mjs` provides username/password sessions, CSRF protection, login throttling, Markdown CRUD and media uploads. In production it uses a server-held fine-grained GitHub token, so credentials never enter browser storage. The API listens on `127.0.0.1:8787` and Nginx proxies `/admin-api/`. See `docs/SVELTIA-CMS.md` (the historical filename is retained for existing links).

**Critical contract**: when content fields change, update `src/content.config.ts`, the admin form/client payload and `editableFields`/serialization in `server/admin-server.mjs` in the same PR.

### RSS / Subscription
`@astrojs/rss` is a dependency but the project does **not** use a fake email form anywhere — `runtime-safety.test.mjs` enforces the absence of one. Subscriptions go through `/rss.xml` only. Both `Header.astro` and `PostLayout.astro` link to `${base}/rss.xml`; the in-page subscription prompt (`createSubscribePrompt` in `Layout.astro`) also points to RSS.

### Search (Pagefind)
`src/components/PagefindSearch.astro` lazy-loads the Pagefind WASM+JS bundle on first search keystroke. `Header.astro`'s input listener first calls `window.__ymll_pagefind()`; if Pagefind isn't available (dev mode, before WASM loads), it falls back to the static `searchIndex` of post titles/descriptions/tags. The Pagefind index is generated at build time by `pagefind --site dist`, chained into `npm run build`.

### Comments (giscus)
`src/components/GiscusComments.astro` renders a giscus widget at the bottom of every blog post. giscus uses GitHub Discussions as the backend — no database, no server. **One-time setup required**: enable Discussions on the repo, install the giscus app, then replace the placeholder `repoId` / `categoryId` props in `GiscusComments.astro` with the values from <https://giscus.app/>. See `docs/RUNBOOK.md` § "Adding dynamic features".

### Cloudflare Pages infra files
Both `public/_headers` and `public/_redirects` are honored by Cloudflare Pages at the edge — no Astro/Vite config needed. `_headers` sets CSP, HSTS, asset caching, and admin noindex. `_redirects` rewrites legacy `/ymllblog/*` URLs to root so old bookmarks keep working after migrating off GitHub Pages. `runtime-safety.test.mjs` asserts both files contain the required entries.

### Music Player
`MusicPlayer.astro` uses the **official NetEase Cloud Music iframe** (`music.163.com/outchain/player`, `type=0` playlist mode, full 430px height). It exposes `data-player-provider="netease-cloud-music"` and accepts a `playlistId?: string` prop so the playlist can be swapped without editing the component. The component must NOT use `new Audio()` or render a `music-song-btn` — direct mp3 links are unstable, so playlist switching is delegated to the iframe. `runtime-safety.test.mjs` enforces this.

### Mermaid Diagram Support
`MermaidSupport.astro` is imported in `PostLayout.astro` and dynamically loads the `mermaid` npm package via `import('mermaid')` at runtime, then calls `mermaid.run()` to render `language-mermaid` code fences as SVG. All client-side — no server-side rendering.

### Helper Functions (`src/lib/`)
- `posts.ts` — Content collection queries
- `reading-time.ts` — Reading time calculation
- `seo.ts` — JSON-LD, canonical URLs, OG tags

### Key Files
| File | Purpose |
|------|---------|
| `astro.config.mjs` | Site URL, base path, KaTeX, Shiki theme (github-dark) |
| `tailwind.config.mjs` | Tailwind content and typography configuration |
| `src/content.config.ts` | Blog collection schema |
| `src/styles/global.css` | Semantic color tokens, layout primitives, typography and reading styles |
| `src/styles/motion.css` | Motion tokens, states, capability queries and reduced-motion fallbacks |
| `src/scripts/motion.ts` | Shared public-site motion runtime |
| `src/layouts/Layout.astro` | Base HTML, SEO, theme bootstrap and explicit motion level |
| `src/layouts/PostLayout.astro` | Post page with TOC, reading progress, related posts |
| `src/components/Header.astro` | Fixed navbar, compact scroll state, active indicator, search and theme toggle |
| `src/components/motion/MotionRoot.astro` | Decorative motion layers and runtime bootstrap |
| `public/admin/` + `server/admin-server.mjs` | Username/password admin UI and server-side Markdown CRUD API. |
| `src/components/PagefindSearch.astro` | Lazy-loads Pagefind WASM on first search keystroke. Wired into `Header.astro` (Pagefind first, static fallback). |
| `src/components/GiscusComments.astro` | GitHub Discussions-backed comment widget at the bottom of every post. Placeholder `repoId`/`categoryId` must be replaced after one-time giscus.app setup. |
| `public/_headers` | Cloudflare Pages edge config: CSP, HSTS, asset caching, admin noindex. |
| `public/_redirects` | Cloudflare Pages edge config: legacy `/ymllblog/*` → `/` for old bookmark compatibility. |
| `scripts/generate-sitemap.mjs` | Post-build sitemap generator. Reads `dist/` and writes `sitemap.xml`. Reads `SITEMAP_SITE_ROOT` env (default GH Pages URL). |
| `scripts/enable-branch-protection.sh` | One-shot gh CLI script that applies the full main-branch ruleset (no force-push, PR-only, 1 review, 4 required CI checks). |
| `tests/smoke-production.mjs` | Live HTTP probes against the deployed site. Run after deploys to verify production health. |
| `docs/ARCHITECTURE.md` | System diagram, source-of-truth model, deployment topology. Read before changing architecture. |
| `docs/RUNBOOK.md` | Daily ops, incident response, dynamic-feature playbook, custom-domain steps, CF Pages deploy steps. |
| `docs/SVELTIA-CMS.md` | Admin service setup, security and local testing (historical filename). |
| `docs/OBSERVABILITY.md` | UptimeRobot + Cloudflare Web Analytics setup, privacy posture, alerting escalation. |
| `.github/workflows/ci.yml` | Test + build + link-check + markdownlint on every PR. Does NOT deploy. Originally was `deploy.yml`; deployment is now handled by Cloudflare Pages. |
| `.github/dependabot.yml` | Weekly dependency PRs, grouped by area. |
| `.github/CODEOWNERS` | Code-review routing (single owner for now). |
| `.markdownlint.jsonc` | Markdown lint rules for `src/content/blog/`. |

## Design System

- **Core colors:** warm paper `#f4f3ee`, ink `#171b18`, emerald brand `#0c7c66` with semantic dark-mode equivalents.
- **Surfaces:** restrained borders, soft editorial shadows and generous rounded corners.
- **Buttons:** pill-shaped primary/secondary variants with tokenized micro-lift feedback.
- **Fonts:** Inter for interface/body and Noto Serif SC for display hierarchy.
- **Motion:** 100–480 ms token scale, small 2–12 px travel, shared standard/out easings, no animation framework.

## Known Issues / Gotchas

1. **No linting or pre-commit hooks** — CI only builds
2. **Dark mode toggle** persists the explicit light/dark preference in `localStorage`; the first visit follows the OS setting.
3. **`doublesevenshop.github.io-master/`** and **`hexo-theme-sungod-master/`** in the repo root are reference copies of upstream theme sources (dlog.com.cn and Hexo Matery derivatives). Do not modify — used as design inspiration only.
4. **Motion state:** keep public motion in `motion.css`/`motion.ts`; do not introduce page-local observers or animation libraries without revisiting the architecture.
5. **`global.css` and `motion.css` must be imported** in `Layout.astro` or their rules do not ship.
12. **No `@astrojs/sitemap`:** the official sitemap integration is incompatible with this project. Use `scripts/generate-sitemap.mjs` instead. The `runtime-safety.test.mjs` asserts that `astro.config.mjs` does NOT contain `sitemap()`.
13. **XSS safety:** `runtime-safety.test.mjs` enforces that search results use `createElement`/`textContent` (not `innerHTML`), and that layouts avoid inline `onclick`/`onsubmit` handlers. Keep event wiring in `<script>` blocks, not inline attributes.
14. **Header search modal:** `Header.astro` must expose `#search-modal` (real modal element), nav links must carry `data-nav-link` and `data-active="true"` for the current page, the theme button must persist via `localStorage.setItem('theme', ...)`, and the search input must filter via an `input` event listener. `home-layout.test.mjs` enforces all of these — don't strip them when refactoring the header.
15. **Admin schema ↔ Zod schema parity:** the admin form, `server/admin-server.mjs` and `src/content.config.ts` define overlapping schemas. They must stay in sync — see `docs/ARCHITECTURE.md` § "Source of truth".
16. **Workflow file rename history:** the original `.github/workflows/deploy.yml` (GitHub Pages deploy) was repurposed to `.github/workflows/ci.yml` (test + build + link-check + markdownlint). It no longer deploys. The actual deploy is now Cloudflare Pages (auto-wired to push-to-main on `yanmengli123/ymllblog`). If you need to redeploy to GitHub Pages as a fallback, the original `deploy.yml` workflow is preserved in git history at commit `241b78e` — reapply it manually.
17. **`/admin` route under base path:** `public/admin/index.html` is served at `${base}/admin/`; its client selects `/admin-api` or `/ymllblog/admin-api` from the current path. Vite proxies both paths locally, while Nginx proxies the root path in production.
18. **Cloudflare Pages env vars:** `BASE_URL=/` and `SITEMAP_SITE_ROOT=https://ymllblog.pages.dev` must be set in the Cloudflare dashboard (Workers & Pages → project → Settings → Environment variables) for the deployment to produce correct root-relative URLs and a sitemap pointing at the live host. Without `BASE_URL=/` the site will be reachable at `https://ymllblog.pages.dev/ymllblog/` instead of `https://ymllblog.pages.dev/`. See `docs/RUNBOOK.md` § "Deploying to Cloudflare Pages".
19. **Env-var changes don't auto-redeploy on Cloudflare Pages:** after changing `BASE_URL` or `SITEMAP_SITE_ROOT`, trigger a manual redeploy from the Deployments tab. GitHub Actions has no such constraint — pushes auto-trigger CI.
20. **`BASE_URL=/` on Windows local builds** corrupts asset URLs to absolute Windows paths (e.g. `/D:/Program Files/Git/_astro/...`). This is a Windows + Astro `BASE_URL=/` resolution quirk; **always test the GH Pages-style build locally** (`unset BASE_URL` so it falls back to `/ymllblog`), and rely on the Linux Cloudflare runner for `BASE_URL=/` builds. The GitHub Actions CI runs on Linux too, so this only affects manual local builds on Windows.
21. **`package.json` and `package-lock.json` MUST be committed together.** Cloudflare Pages uses `npm ci` (strict install from lockfile); if the lockfile is out of sync, the build fails with EUSAGE. After any `package.json` change — even adding a single dev-dep — run `npm install` locally and commit the regenerated `package-lock.json` in the same commit. If you only commit `package.json`, the next Cloudflare deploy will fail.
22. **`GiscusComments.astro` ships with placeholder credentials** (`R_PLACEHOLDER_REPLACE_AFTER_GISCUS_SETUP` etc.). Until replaced via `https://giscus.app/`, the widget renders but fails to load comments. The build itself succeeds — this only affects runtime behavior. Don't treat the placeholder values as a build error.
23. **CI checks required for `main`:** when `scripts/enable-branch-protection.sh` is run, the ruleset requires these exact job names: `test`, `build`, `link-check`, `markdown-lint`. Renaming any of them in `.github/workflows/ci.yml` will block all future merges until the ruleset is updated.
24. **`tests/smoke-production.mjs` is a runtime probe, not a build-time test.** It runs `fetch()` against the live site and exits 1 on any failed probe. Run it manually after a Cloudflare deploy completes, or wire it into the CI workflow as a post-deploy job. Set `SMOKE_BASE_URL` to the preview URL when testing PR previews (`https://<hash>.ymllblog.pages.dev`).
