# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YMLL Blog — a Chinese-language personal tech/design blog built as a fully static site. Deployed to GitHub Pages at `https://yanmengli123.github.io/ymllblog`.

## Tech Stack

- **Framework:** Astro 4.x (static output mode)
- **Styling:** Tailwind CSS 3.4 via `@astrojs/tailwind`
- **Interactivity:** React 18 + Framer Motion 11 (used only in `AnimatedPostCard.tsx`)
- **Language:** TypeScript (strict mode)
- **Deployment:** GitHub Pages via GitHub Actions

## Commands

```bash
npm run dev      # Start dev server (usually http://localhost:4321)
npm run build    # Build static site to dist/
npm run preview  # Preview built site locally
```

## Architecture

### Islands Pattern
The site uses Astro's islands architecture. All components are static `.astro` files except `AnimatedPostCard.tsx`, which is a React component hydrated on the client via `client:load`. This is the only component that ships JavaScript to the browser.

### Content is Hardcoded
Blog posts are defined as arrays of objects directly in page files — there are no Markdown files, no `src/content/` directory, and no CMS. To add a new post, edit the post arrays in:
- `src/pages/index.astro` (homepage featured posts)
- `src/pages/blog/index.astro` (blog listing)
- `src/pages/archive.astro` (archive timeline)

### Missing Dynamic Routes
Post cards link to `/blog/{slug}`, but no `src/pages/blog/[slug].astro` exists. These links 404. Individual blog post pages need to be created.

### Design System
- **Primary color:** Emerald (#10b981) — defined in `tailwind.config.mjs`
- **Fonts:** Inter (sans), Playfair Display (serif) — loaded via Google Fonts in `Layout.astro`
- **Utility classes:** `.glass` (frosted glass), `.gradient-text`, `.hover-lift`, `.animate-on-scroll` — defined in `src/styles/global.css`

### Dark Mode (Incomplete)
Tailwind is configured with `darkMode: 'class'` and the Header has a toggle button. However, most components don't use `dark:` variants, so toggling has minimal visible effect.

## Key Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Site URL, base path (`/ymllblog`), integrations |
| `tailwind.config.mjs` | Custom theme, colors, fonts, animations |
| `src/layouts/Layout.astro` | Base HTML, SEO meta, OG tags, font loading |
| `src/components/Header.astro` | Navigation with scroll effects, mobile menu |
| `src/components/AnimatedPostCard.tsx` | Only React island — Framer Motion animations |
| `.github/workflows/deploy.yml` | GitHub Pages deployment pipeline |

## Deployment

Automatic on every push to `main`. The GitHub Actions workflow runs `npm ci && npm run build`, then deploys `dist/` to GitHub Pages. Manual trigger also supported via `workflow_dispatch`.

## Known Issues

1. **No individual post pages** — `/blog/[slug]` routes don't exist
2. **Dark mode incomplete** — most components lack `dark:` variants
3. **No sitemap** — `robots.txt` references one but no Astro sitemap integration is configured
4. **Post data inconsistency** — archive page has posts not listed on blog index or homepage
5. **No tests, linting, or pre-commit hooks** — CI only handles build/deploy
