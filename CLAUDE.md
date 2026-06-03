# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YMLL Blog — a Chinese-language personal tech/design blog built as a fully static site. Deployed to GitHub Pages at `https://yanmengli123.github.io/ymllblog`. Inspired by Hexo Matery theme with dlog.com.cn layout patterns. Features a comprehensive personalization system (8 color themes, 8 background modes, custom CSS, etc.) accessible via a side settings panel.

## Tech Stack

- **Framework:** Astro 4.x (static output mode)
- **Styling:** Tailwind CSS 3.4 via `@astrojs/tailwind` + custom CSS variables (`global.css`)
- **Interactivity:** React 18 + Framer Motion 11 (only `AnimatedPostCard.tsx`)
- **Animations:** AOS (Animate On Scroll), CSS keyframes, IntersectionObserver, canvas particles
- **Math Rendering:** KaTeX via `remark-math` + `rehype-katex`
- **Language:** TypeScript (strict mode)
- **Deployment:** GitHub Pages via GitHub Actions (auto-deploy on push to `main`)

## Commands

```bash
npm run dev      # Dev server at http://localhost:4321/ymllblog
npm run build    # Static build to dist/
npm run preview  # Preview built site locally
```

No linting, no tests, no pre-commit hooks. CI only runs `npm ci && npm run build`.

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

### Personalization System (custom, recently added)
User preferences persist in `localStorage` under key `ymll_user_settings` via `src/lib/theme.ts`. Exposed APIs:

- **`applyAllSettings(settings)`** — single entry point
- **`COLOR_THEMES`** — 8 presets (purple, green, blue, pink, orange, cyan, red, yellow)
- **`BACKGROUND_MODES`** — 8 modes (gradient, aurora, particles, waves, mesh, stars, image, solid)
- **`BANNER_MODES`** — 5 modes (parallax, fullscreen, minimal, wave, particles)
- **`POST_LAYOUTS`** — 4 layouts (list, grid, card, masonry)
- `applyColorTheme`, `applyThemeMode`, `applyFont`, `applyBackground`, `applyBanner` — granular

To add a new theme/background: extend the corresponding constant in `lib/theme.ts` and add a matching class in `global.css` (e.g. `.bg-myname { ... }`). The body class drives the visual.

### Default Visual Identity
- **Background:** Blue-purple gradient (`#6366f1 → #8b5cf6 → #a78bfa`)
- **Color theme:** Blue (hue 240, saturation 60%, lightness 55%)
- **Layout:** Glass-morphism content board overlapping full-screen parallax hero
- **Hero:** Background image with strong indigo/purple gradient overlay for text contrast
- **Wave fill:** `#f5f3ff` (light lavender, matches gradient theme)

### Floating Widgets (positioned to avoid overlap)
| Widget | Position | z-index | Default visibility |
|--------|----------|---------|-------------------|
| `SettingsPanel.astro` | Right side, slide-out | 999 | Hidden, hover/click to open |
| `MusicPlayer.astro` | Bottom-right | 998 | Visible (after first paint) |
| `Announcement.astro` | Bottom-left | 997 | Hidden, auto-shown 5s after load |
| `FloatingAvatar.astro` | Bottom-right (compact) | 996 | Hidden by default |
| `ParticlesBg.astro` | Full-screen canvas | -1 | Off by default |

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
| `src/styles/global.css` | CSS variables, glass-morphism, animations, bg modes, wave, note-box |
| `src/layouts/Layout.astro` | Base HTML, SEO, AOS init, page loader, click effects, console easter egg, scroll progress, mouse follower, auto dark mode, reading time |
| `src/layouts/PostLayout.astro` | Post page with TOC, reading progress, related posts |
| `src/components/HeroSection.astro` | Full-screen parallax hero with dark indigo/purple overlay |
| `src/components/Header.astro` | Fixed navbar, transparent→solid on scroll, color changes on scroll |
| `src/components/SettingsPanel.astro` | Side panel with all personalization controls (8 themes, 8 backgrounds, 5 banners, 4 layouts, 4 fonts, custom CSS/avatar/greeting) |
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

1. **No tests, linting, or pre-commit hooks** — CI only builds
2. **Dark mode toggle** in code but mostly unused; personalization uses light/dark/auto via `<html class="dark">`
3. **`doublesevenshop.github.io-master/`** in repo is a reference copy of dlog.com.cn source — do not modify, used as design inspiration
4. **localStorage settings** apply client-side only — first paint always shows defaults until JS hydrates
5. **Hero background image** is `/image/006.jpg` — must exist in `public/image/`
6. **Wave fill color** (`#f5f3ff` in `global.css`) must contrast with whatever `bg-XXX` mode is active
7. **Setting panel buttons** use inline `style="border-color: ..."` for active state — overrides Tailwind classes; reset with `borderColor = 'transparent'` in `updateActiveButton()`
