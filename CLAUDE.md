# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YMLL Blog — a Chinese-language personal tech/design blog built as a fully static site. **Primary host: Cloudflare Pages at `https://ymllblog.pages.dev`** (legacy GitHub Pages mirror at `https://yanmengli123.github.io/ymllblog`). Inspired by Hexo Matery theme and dlog.com.cn layout patterns. Features a comprehensive personalization system (8 color themes, 8 background modes, 5 banner modes, custom CSS, etc.) accessible via a right-side settings panel.

## Tech Stack

- **Framework:** Astro 4.x (static output mode)
- **Styling:** Tailwind CSS 3.4 via `@astrojs/tailwind` + custom CSS variables in `src/styles/global.css`
- **Interactivity:** React 18 + Framer Motion 11 (only `AnimatedPostCard.tsx`)
- **Animations:** AOS (Animate On Scroll), CSS keyframes, IntersectionObserver, canvas particles
- **Math Rendering:** KaTeX via `remark-math` + `rehype-katex`
- **Search:** Pagefind (build-time WASM index, lazy-loaded on first keystroke)
- **Comments:** giscus → GitHub Discussions backend
- **CMS:** Sveltia CMS via GitHub Device Flow (browser-only, no OAuth server)
- **Language:** TypeScript (strict mode)
- **Deployment:** Cloudflare Pages (auto-deploy on push to `main`) + legacy GitHub Pages fallback

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

### Islands Architecture
Only `AnimatedPostCard.tsx` ships JS via `client:load`. Everything else is static `.astro`. The site intentionally has minimal client-side hydration.

### CSS Architecture (CRITICAL — read before touching styles)
- `src/styles/global.css` **MUST be imported** in `src/layouts/Layout.astro` at the top of the frontmatter: `import '../styles/global.css';`. Without this, the file is never bundled.
- The Layout.astro body class uses `theme-bg-gradient` (default) — see `applyBackground()` in `theme.ts`.
- **Custom background/utility classes use the `theme-` prefix** to avoid conflict with Tailwind utilities (e.g. `theme-bg-gradient` not `bg-gradient`). Tailwind purges any class that matches its own utility naming convention.
- All background mode classes (`.theme-bg-gradient`, `.theme-bg-aurora`, etc.) live **outside** `@layer` in `global.css` to prevent Tailwind purge.
- Inline `<style is:global>` blocks in `.astro` files get component-scoped IDs and Tailwind still purges them. Prefer `global.css` for app-wide styles.

### Personalization System (in `src/lib/theme.ts`)
User preferences persist in `localStorage`:
- `ymll_user_settings` — main settings object (JSON)
- `ymll_settings_version` — version string; mismatch wipes settings (currently `2.0.0`)

**Constants exported from `theme.ts`:**
- `COLOR_THEMES` — 8 presets (purple, green, blue, pink, orange, cyan, red, yellow)
- `BACKGROUND_MODES` — 8 modes (gradient, aurora, particles, waves, mesh, stars, image, solid)
- `BANNER_MODES` — 5 modes (parallax, fullscreen, minimal, wave, particles)
- `POST_LAYOUTS` — 4 layouts (list, grid, card, masonry)
- `DEFAULT_SETTINGS` — sane defaults used when localStorage is empty

**API functions:** `loadSettings`, `saveSettings`, `resetSettings`, `applyAllSettings`, `applyColorTheme`, `applyThemeMode`, `applyFont`, `applyBackground`, `applyBanner`. All work client-side; `loadSettings` includes a version-check that clears stale settings on upgrade.

To add a new background mode: extend `BACKGROUND_MODES` in `theme.ts` AND add a matching `.theme-bg-myname` class in `global.css` (outside `@layer`). The body class drives the visual via `applyBackground()`.

### Default Visual Identity
- **Body class:** `theme-bg-gradient` (linear-gradient `#6366f1 → #8b5cf6 → #a78bfa`)
- **Color theme:** Blue (hue 240, saturation 60%, lightness 55%)
- **Layout:** Glass-morphism content board overlapping full-screen parallax hero
- **Hero:** Background image with strong indigo/purple gradient overlay for text contrast
- **Wave fill:** `#f5f3ff` (light lavender, matches gradient theme)
- **Body min-height:** `100vh` so gradient always fills viewport

### Floating Widgets (positioned to avoid overlap)
| Widget | Position | z-index | Default visibility |
|--------|----------|---------|-------------------|
| `SettingsPanel.astro` | Right side, slide-out | 999 | Hidden, hover/click to open |
| `MusicPlayer.astro` | Bottom-right | 998 | Visible (after first paint) |
| `Announcement.astro` | Bottom-left (floating variant) | 997 | Hidden, auto-shown 5s after load |
| `FloatingAvatar.astro` | Bottom-right (compact) | 996 | Visible by default |
| `ParticlesBg.astro` | Full-screen canvas | -1 | Off unless `theme-bg-particles` or `theme-bg-aurora` active |

**Variant prop pattern.** `Announcement`, `MusicPlayer`, and `SettingsPanel` accept a `variant?: 'floating' | 'sidebar'` prop and branch via `const isSidebar = variant === 'sidebar'`. Use `'floating'` (default, fixed-position) for standalone placement and `'sidebar'` when the component is embedded inside the home page right/left sidebar. `home-layout.test.mjs` asserts every variant type exists on every one of these components.

### Home Page Layout (newer pattern)
The home page uses a 3-column layout: left sidebar + central article feed + right sidebar. Wrapper is `HomeSidebarLayout` (referenced as a class/component in `src/pages/index.astro`); each side has a fixed `id`:
- `#home-left-sidebar` — `ProfileCard` and friends
- `#home-feed` — `<main>` with `FeaturedPosts`
- `#home-right-sidebar` — `SiteStatsCard`, `PostCalendarCard`, `Announcement` (sidebar variant), etc.

Required sidebar components (asserted by `tests/home-layout.test.mjs`):
- `src/components/ProfileCard.astro`
- `src/components/SiteStatsCard.astro`
- `src/components/PostCalendarCard.astro`

`FeaturedPosts.astro` reads the saved `postLayout` from localStorage and swaps the grid class. It listens for the `layout-change` custom event dispatched by `SettingsPanel` when the user picks a new layout. Supported layouts and their classes:

```js
const layoutClasses = {
  grid:    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  list:    'grid grid-cols-1 gap-4',
  card:    'grid grid-cols-1 md:grid-cols-2 gap-6',
  masonry: 'columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6',
};
```

In `list` mode, the primary featured post is hidden via `primary.classList.toggle('hidden', true)`.

### Sitemap Generation
The `@astrojs/sitemap` integration was removed due to incompatibility. Sitemap is generated by `scripts/generate-sitemap.mjs` which runs automatically as part of `npm run build` (chained after `astro build`). The script reads the built `dist/` output and writes `sitemap.xml` with proper URL encoding and XML escaping. The URL prefix is `process.env.SITEMAP_SITE_ROOT` (defaults to the GitHub Pages URL; set to your Cloudflare Pages or custom-domain URL in production).

### Content Management (Sveltia CMS)
The site has a browser-based CMS at `/admin` (`public/admin/index.html` + `config.yml`). It uses **Sveltia CMS** — a Git-based, browser-only CMS with **GitHub Device Flow authentication** (no OAuth proxy server required). All edits commit directly to the `main` branch of `yanmengli123/ymllblog`, which triggers CI + redeploy.

**Critical contract**: the field list in `public/admin/config.yml` MUST match the Zod schema in `src/content.config.ts`. When you add or rename a field, edit both files in the same PR. Drift between the two will cause Astro builds to fail when the CMS writes a post.

**Default install location**: the CMS UI lives at `${base}/admin/` where `base = import.meta.env.BASE_URL.replace(/\/$/, '')`. Under `/ymllblog` deployment it is `https://yanmengli123.github.io/ymllblog/admin/`.

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

### Official Widgets Card
`OfficialWidgetsCard.astro` lives in the right sidebar and links to the GitHub repo, `/rss.xml`, and the sitemap. The sitemap URL is matched as one of `/sitemap-index.xml`, `/sitemap-0.xml`, or `/sitemap.xml` (the latter is what `scripts/generate-sitemap.mjs` actually writes). It also calls out Astro as the static-site framework.

### Mermaid Diagram Support
`MermaidSupport.astro` is imported in `PostLayout.astro` and dynamically loads the `mermaid` npm package via `import('mermaid')` at runtime, then calls `mermaid.run()` to render `language-mermaid` code fences as SVG. All client-side — no server-side rendering.

### Helper Functions (`src/lib/`)
- `posts.ts` — Content collection queries
- `reading-time.ts` — Reading time calculation
- `seo.ts` — JSON-LD, canonical URLs, OG tags
- `theme.ts` — Personalization system (above)

### Key Files
| File | Purpose |
|------|---------|
| `astro.config.mjs` | Site URL, base path, KaTeX, Shiki theme (github-dark) |
| `tailwind.config.mjs` | Design tokens, custom colors (primary, accent, matery) |
| `src/content.config.ts` | Blog collection schema |
| `src/styles/global.css` | CSS variables, glass-morphism, animations, **theme-bg-*** modes, wave, note-box |
| `src/layouts/Layout.astro` | Base HTML, imports `global.css`, SEO, AOS init, page loader, click effects, console easter egg, scroll progress, mouse follower, auto dark mode, reading time |
| `src/layouts/PostLayout.astro` | Post page with TOC, reading progress, related posts |
| `src/components/HeroSection.astro` | Full-screen parallax hero with dark indigo/purple overlay |
| `src/components/Header.astro` | Fixed navbar, transparent→solid on scroll, color changes on scroll |
| `src/components/SettingsPanel.astro` | Side panel with all personalization controls |
| `src/components/ParticlesBg.astro` | Dynamic particle canvas (auto-starts/stops based on body class) |
| `public/admin/index.html` + `public/admin/config.yml` | Sveltia CMS browser-based editor (Git-backed, no backend). Fields MUST match `src/content.config.ts`. |
| `src/components/PagefindSearch.astro` | Lazy-loads Pagefind WASM on first search keystroke. Wired into `Header.astro` (Pagefind first, static fallback). |
| `src/components/GiscusComments.astro` | GitHub Discussions-backed comment widget at the bottom of every post. Placeholder `repoId`/`categoryId` must be replaced after one-time giscus.app setup. |
| `public/_headers` | Cloudflare Pages edge config: CSP, HSTS, asset caching, admin noindex. |
| `public/_redirects` | Cloudflare Pages edge config: legacy `/ymllblog/*` → `/` for old bookmark compatibility. |
| `scripts/generate-sitemap.mjs` | Post-build sitemap generator. Reads `dist/` and writes `sitemap.xml`. Reads `SITEMAP_SITE_ROOT` env (default GH Pages URL). |
| `scripts/enable-branch-protection.sh` | One-shot gh CLI script that applies the full main-branch ruleset (no force-push, PR-only, 1 review, 4 required CI checks). |
| `tests/smoke-production.mjs` | Live HTTP probes against the deployed site. Run after deploys to verify production health. |
| `docs/ARCHITECTURE.md` | System diagram, source-of-truth model, deployment topology. Read before changing architecture. |
| `docs/RUNBOOK.md` | Daily ops, incident response, dynamic-feature playbook, custom-domain steps, CF Pages deploy steps. |
| `docs/SVELTIA-CMS.md` | Sveltia CMS install, upgrade, field-parity contract. |
| `docs/OBSERVABILITY.md` | UptimeRobot + Cloudflare Web Analytics setup, privacy posture, alerting escalation. |
| `.github/workflows/ci.yml` | Test + build + link-check + markdownlint on every PR. Does NOT deploy. Originally was `deploy.yml`; deployment is now handled by Cloudflare Pages. |
| `.github/dependabot.yml` | Weekly dependency PRs, grouped by area. |
| `.github/CODEOWNERS` | Code-review routing (single owner for now). |
| `.markdownlint.jsonc` | Markdown lint rules for `src/content/blog/`. |

## Design System

- **Primary gradient:** Indigo/purple → blue-purple (`#4f46e5 → #06b6d4` for accents)
- **Matery gradient:** Purple `#bf30ac` → Green `#0f9d58` (legacy, used in some places)
- **Hero overlay:** `rgba(67, 56, 202, 0.85) → rgba(124, 58, 237, 0.85) → rgba(91, 33, 182, 0.85)`
- **Card shadows:** `0 15px 35px rgba(50, 50, 93, .1), 0 5px 15px rgba(0, 0, 0, .07)`
- **Glass-morphism:** `backdrop-filter: blur(20px) saturate(180%)` via `.glass-board`
- **Buttons:** Pill-shaped, `border-radius: 30px`
- **Fonts:** Inter (sans), Playfair Display (serif), Fira Code (mono), Comfortaa (rounded)
- **macOS code blocks:** Three colored dots (red/yellow/green) at top

## Known Issues / Gotchas

1. **No linting or pre-commit hooks** — CI only builds
2. **Dark mode toggle** in code but mostly unused; personalization uses light/dark/auto via `<html class="dark">`
3. **`doublesevenshop.github.io-master/`** and **`hexo-theme-sungod-master/`** in the repo root are reference copies of upstream theme sources (dlog.com.cn and Hexo Matery derivatives). Do not modify — used as design inspiration only.
4. **localStorage settings** apply client-side only — first paint always shows defaults until JS hydrates
5. **Hero background image** is `/image/006.jpg` — must exist in `public/image/`
6. **Settings version migration:** Changing `VERSION` in `theme.ts` wipes all user settings on next load. Use this to force a defaults refresh after breaking changes.
7. **Setting panel buttons** use inline `style="border-color: ..."` for active state — overrides Tailwind classes; reset with `borderColor = 'transparent'` in `updateActiveButton()`. For the home content board specifically, the **glass** toggle goes through `setGlassMode` in `theme.ts` (NOT a visibility toggle) — `runtime-safety.test.mjs` enforces the absence of `toggleElement('#board', settings.showGlass)`, because the board must never disappear.
8. **CSS class naming:** Never use `bg-X`, `text-X`, `font-X` for custom utility classes — they collide with Tailwind. Prefix with `theme-` or another unique namespace.
9. **`global.css` must be imported** in `Layout.astro` frontmatter or none of its rules ship to the build
10. **Home layout test:** `tests/home-layout.test.mjs` asserts that `index.astro` uses `HomeSidebarLayout` and contains `#home-left-sidebar`, `#home-feed`, `#home-right-sidebar`. If you restructure the home page, update the test too.
11. **Featured post in list layout:** the primary featured post is hidden when `postLayout === 'list'`; do not add it back without considering that path.
12. **No `@astrojs/sitemap`:** the official sitemap integration is incompatible with this project. Use `scripts/generate-sitemap.mjs` instead. The `runtime-safety.test.mjs` asserts that `astro.config.mjs` does NOT contain `sitemap()`.
13. **XSS safety:** `runtime-safety.test.mjs` enforces that search results use `createElement`/`textContent` (not `innerHTML`), and that layouts avoid inline `onclick`/`onsubmit` handlers. Keep event wiring in `<script>` blocks, not inline attributes.
14. **Header search modal:** `Header.astro` must expose `#search-modal` (real modal element), nav links must carry `data-nav-link` and `data-active="true"` for the current page, the theme button must persist via `localStorage.setItem('theme', ...)`, and the search input must filter via an `input` event listener. `home-layout.test.mjs` enforces all of these — don't strip them when refactoring the header.
15. **CMS schema ↔ Zod schema parity:** `public/admin/config.yml` and `src/content.config.ts` define overlapping schemas. They must stay in sync — see `docs/ARCHITECTURE.md` § "Source of truth". Add a new field to both files in the same commit, or builds will silently break.
16. **Workflow file rename history:** the original `.github/workflows/deploy.yml` (GitHub Pages deploy) was repurposed to `.github/workflows/ci.yml` (test + build + link-check + markdownlint). It no longer deploys. The actual deploy is now Cloudflare Pages (auto-wired to push-to-main on `yanmengli123/ymllblog`). If you need to redeploy to GitHub Pages as a fallback, the original `deploy.yml` workflow is preserved in git history at commit `241b78e` — reapply it manually.
17. **`/admin` route under base path:** the Sveltia CMS entry lives at `public/admin/index.html` and is served at `${base}/admin/` — Astro copies `public/*` to `dist/*` verbatim, so the `/ymllblog/admin` URL works without any route config. If you ever add a custom domain (see RUNBOOK), the path stays the same.
18. **Cloudflare Pages env vars:** `BASE_URL=/` and `SITEMAP_SITE_ROOT=https://ymllblog.pages.dev` must be set in the Cloudflare dashboard (Workers & Pages → project → Settings → Environment variables) for the deployment to produce correct root-relative URLs and a sitemap pointing at the live host. Without `BASE_URL=/` the site will be reachable at `https://ymllblog.pages.dev/ymllblog/` instead of `https://ymllblog.pages.dev/`. See `docs/RUNBOOK.md` § "Deploying to Cloudflare Pages".
19. **Env-var changes don't auto-redeploy on Cloudflare Pages:** after changing `BASE_URL` or `SITEMAP_SITE_ROOT`, trigger a manual redeploy from the Deployments tab. GitHub Actions has no such constraint — pushes auto-trigger CI.
20. **`BASE_URL=/` on Windows local builds** corrupts asset URLs to absolute Windows paths (e.g. `/D:/Program Files/Git/_astro/...`). This is a Windows + Astro `BASE_URL=/` resolution quirk; **always test the GH Pages-style build locally** (`unset BASE_URL` so it falls back to `/ymllblog`), and rely on the Linux Cloudflare runner for `BASE_URL=/` builds. The GitHub Actions CI runs on Linux too, so this only affects manual local builds on Windows.
21. **`package.json` and `package-lock.json` MUST be committed together.** Cloudflare Pages uses `npm ci` (strict install from lockfile); if the lockfile is out of sync, the build fails with EUSAGE. After any `package.json` change — even adding a single dev-dep — run `npm install` locally and commit the regenerated `package-lock.json` in the same commit. If you only commit `package.json`, the next Cloudflare deploy will fail.
22. **`GiscusComments.astro` ships with placeholder credentials** (`R_PLACEHOLDER_REPLACE_AFTER_GISCUS_SETUP` etc.). Until replaced via `https://giscus.app/`, the widget renders but fails to load comments. The build itself succeeds — this only affects runtime behavior. Don't treat the placeholder values as a build error.
23. **CI checks required for `main`:** when `scripts/enable-branch-protection.sh` is run, the ruleset requires these exact job names: `test`, `build`, `link-check`, `markdown-lint`. Renaming any of them in `.github/workflows/ci.yml` will block all future merges until the ruleset is updated.
24. **`tests/smoke-production.mjs` is a runtime probe, not a build-time test.** It runs `fetch()` against the live site and exits 1 on any failed probe. Run it manually after a Cloudflare deploy completes, or wire it into the CI workflow as a post-deploy job. Set `SMOKE_BASE_URL` to the preview URL when testing PR previews (`https://<hash>.ymllblog.pages.dev`).
