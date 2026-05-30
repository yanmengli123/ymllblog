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
npm run dev      # Start dev server (usually http://localhost:4321/ymllblog)
npm run build    # Build static site to dist/
npm run preview  # Preview built site locally
```

## Architecture

### Content Collections (Astro 4)
Blog posts are managed via Astro Content Collections, not hardcoded arrays. Posts are Markdown files in `src/content/blog/` with frontmatter validated by a schema in `src/content/config.ts`.

To add a new post:
1. Create a `.md` file in `src/content/blog/`
2. Add required frontmatter (title, description, pubDate, tags)
3. Push to GitHub — the site rebuilds automatically

### Islands Pattern
The site uses Astro's islands architecture. All components are static `.astro` files except `AnimatedPostCard.tsx`, which is a React component hydrated on the client via `client:load`. This is the only component that ships JavaScript to the browser.

### Base Path
The site is deployed under `/ymllblog` subpath. All internal links must use:
```javascript
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
// Then: `${base}/blog`, `${base}/tags`, etc.
```
Never hardcode `/blog` — it will 404 on GitHub Pages.

### Dynamic Routes
- `src/pages/blog/[slug].astro` — individual blog posts (generated from content collection)
- `src/pages/tags/[tag].astro` — tag filtering pages (generated from post tags)

### Helper Functions
Located in `src/lib/`:
- `posts.ts` — Content collection queries (getPublishedPosts, getPostsByTag, etc.)
- `reading-time.ts` — Reading time calculation
- `seo.ts` — SEO utilities (JSON-LD, canonical URLs)

## Key Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Site URL (`yanmengli123.github.io`), base path (`/ymllblog`), integrations |
| `src/content/config.ts` | Content collection schema (blog posts) |
| `src/lib/posts.ts` | Post query functions |
| `src/layouts/Layout.astro` | Base HTML, SEO meta, OG tags, JSON-LD, font loading |
| `src/layouts/PostLayout.astro` | Blog post detail layout with TOC, related posts, sharing |
| `src/components/Header.astro` | Navigation with scroll effects, mobile menu |
| `src/components/TableOfContents.astro` | Auto-generated TOC from headings |
| `.github/workflows/deploy.yml` | GitHub Pages deployment pipeline |

## Design System

- **Primary color:** Emerald (#10b981) — defined in `tailwind.config.mjs`
- **Fonts:** Inter (sans), Playfair Display (serif) — loaded via Google Fonts
- **Utility classes:** `.glass` (frosted glass), `.gradient-text`, `.hover-lift`, `.animate-on-scroll`

## Deployment

Automatic on every push to `main`. The GitHub Actions workflow runs `npm ci && npm run build`, then deploys `dist/` to GitHub Pages. Manual trigger also supported via `workflow_dispatch`.

## Known Issues

1. **Dark mode incomplete** — Tailwind `darkMode: 'class'` is configured but most components lack `dark:` variants
2. **No sitemap integration** — `robots.txt` references sitemap but `@astrojs/sitemap` is not configured
3. **No tests, linting, or pre-commit hooks** — CI only handles build/deploy
