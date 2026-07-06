# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YMLL Blog — a Chinese-language personal tech/design blog built as a fully static site. Deployed to GitHub Pages at `https://yanmengli123.github.io/ymllblog`. Inspired by Hexo Matery theme and dlog.com.cn layout patterns. Features a comprehensive personalization system (8 color themes, 8 background modes, 5 banner modes, custom CSS, etc.) accessible via a right-side settings panel.

## Tech Stack

- **Framework:** Astro 4.x (static output mode)
- **Styling:** Tailwind CSS 3.4 via `@astrojs/tailwind` + custom CSS variables in `src/styles/global.css`
- **Interactivity:** React 18 + Framer Motion 11 (only `AnimatedPostCard.tsx`)
- **Animations:** AOS (Animate On Scroll), CSS keyframes, IntersectionObserver, canvas particles
- **Math Rendering:** KaTeX via `remark-math` + `rehype-katex`
- **Language:** TypeScript (strict mode)
- **Deployment:** GitHub Pages via GitHub Actions (auto-deploy on push to `main`)

## Commands

```bash
npm run dev      # Dev server at http://localhost:4321/ymllblog  (base path is mandatory in URLs)
npm run build    # Static build to dist/ + auto-generates sitemap.xml  (chains `astro build && node scripts/generate-sitemap.mjs`)
npm run preview  # Preview built site locally

# Tests — run individually with `node tests/<file>.test.mjs`. They use only Node's `node:assert`, no test framework.
node tests/home-layout.test.mjs     # Home page layout + component structure assertions
node tests/runtime-safety.test.mjs  # XSS safety, inline handler, and sitemap script assertions
```

No linting, no pre-commit hooks. CI only runs `npm ci && npm run build` (`.github/workflows/deploy.yml`).

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
Deployed at `/ymllblog` subpath. **Always** use:
```typescript
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
// Then: `${base}/blog`, `${base}/tags`, etc.
```
Never hardcode `/blog` — 404s on GitHub Pages.

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
The `@astrojs/sitemap` integration was removed due to incompatibility. Sitemap is generated by `scripts/generate-sitemap.mjs` which runs automatically as part of `npm run build` (chained after `astro build`). The script reads the built `dist/` output and writes `sitemap.xml` with proper URL encoding and XML escaping.

### RSS / Subscription
`@astrojs/rss` is a dependency but the project does **not** use a fake email form anywhere — `runtime-safety.test.mjs` enforces the absence of one. Subscriptions go through `/rss.xml` only. Both `Header.astro` and `PostLayout.astro` link to `${base}/rss.xml`; the in-page subscription prompt (`createSubscribePrompt` in `Layout.astro`) also points to RSS.

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
| `.github/workflows/deploy.yml` | GitHub Pages deploy on push to main |

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
