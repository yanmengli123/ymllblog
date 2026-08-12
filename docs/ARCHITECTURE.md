# Architecture

Last updated: 2026-08-13. This file mirrors the high-level architecture described in [CLAUDE.md](../CLAUDE.md). Update both when architecture changes.

## System context

```
┌─────────────────┐      PR/push      ┌──────────────────┐
│ Developer /     │ ────────────────► │   GitHub Repo    │
│ Admin browser   │                   │  yanmengli123/   │
│ → VPS API       │ ◄─────────────── │     ymllblog     │
└─────────────────┘   commits/PRs     └──────────────────┘
                                            │
                            ┌───────────────┼───────────────┐
                            ▼               ▼               ▼
                      ┌──────────┐   ┌──────────┐   ┌──────────┐
                      │ CI (GH   │   │ Cloudflr │   │ GH Pages │
                      │ Actions) │   │  Pages   │   │ (legacy) │
                      │ lint+test│   │ (primary)│   │          │
                      └──────────┘   └──────────┘   └──────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │ readers (CN +   │
                                   │ global edge)    │
                                   └─────────────────┘
```

## Source of truth

`src/content/blog/*.md` is the **single source of truth** for all content. The same files are read by:

- **Astro at build time** — validates frontmatter against [src/content.config.ts](../src/content.config.ts) (Zod schema).
- **Admin API at edit time** — `server/admin-server.mjs` validates and serializes the same frontmatter fields before committing through GitHub. When changing the content model, update the editor form, the server field list and Zod schema together.

## Content authoring paths

| Path | When to use |
|------|-------------|
| Browser → `https://<host>/admin` → authenticated VPS API | Default for new posts, edits, deletion and image uploads |
| Local editor (Obsidian / VS Code) → git push | When working on multi-file refactors, schema changes, or batch edits |
| GitHub web editor → commit | Quick typo fixes from a phone |

All three paths converge on the same Markdown files in `src/content/blog/` and trigger the same CI/CD pipeline.

## Public experience architecture

The reader-facing application is static Astro HTML with two small client runtimes: public motion and search. The motion system is deliberately framework-free.

| Layer | Responsibility |
|-------|----------------|
| `src/layouts/Layout.astro` | Selects `expressive`, `standard`, `reading` or `none`; provides native cross-document transition metadata |
| `src/components/motion/MotionRoot.astro` | Renders decorative grid, optional expressive cursor glow and the bounded click-effect layer |
| `src/scripts/motion.ts` | Owns one shared observer, the pointer frame loop, counters and live capability/reduced-motion state |
| `src/styles/motion.css` | Owns motion tokens, page/component states, hover capability queries and reduced-motion fallbacks |
| `public/admin/` | Separate static application; does not import public layout, theme or motion assets |

Normal navigation, static content and admin CRUD remain functional without native View Transition support. Fine-pointer-only effects are disabled for coarse/touch input, and `prefers-reduced-motion: reduce` removes non-essential motion.

## Deployment topology

| Stage | Host | URL pattern | Trigger |
|-------|------|-------------|---------|
| PR preview | Cloudflare Pages | `https://<branch>.<project>.pages.dev` | PR opened/updated |
| Production | Nginx + Node API on VPS | `https://yanmengli.cn` | merge to `main` |
| Legacy mirror | GitHub Pages | `https://yanmengli123.github.io/ymllblog/` | kept as cold standby; mirror via Cloudflare → GH Pages sync or remove when confident |

## Quality gates (all must pass to merge to `main`)

1. `node tests/home-layout.test.mjs`
2. `node tests/runtime-safety.test.mjs`
3. `node tests/admin-server.test.mjs`
4. `node tests/motion-system.test.mjs`
5. `npx astro check` (TypeScript + Astro diagnostics)
6. `npm run build` produces `dist/sitemap.xml` and `dist/rss.xml`
7. Lychee link check on built `dist/**/*.html`
8. markdownlint-cli2 on `src/content/blog/**/*.md`

## Observability

| Layer | Tool | Cost |
|-------|------|------|
| Analytics | Cloudflare Web Analytics (when on Pages) / GH Pages does not include this | $0 |
| Uptime | UptimeRobot (free tier, 5-min interval) | $0 |
| Errors | Cloudflare Pages build logs + GitHub Actions logs | $0 |

## Backup / disaster recovery

- **Content** is Git → GitHub → VPS build output; Git history remains the recoverable source of truth.
- **Mirror** to GitLab: `Settings → Repository → Mirrored repositories` (one-click, free).
- **Scheduled export** of `public/` to Cloudflare R2 free tier: optional, not currently configured.
- **Comments** (when added): giscus → GitHub Discussions → already in git.
- **Analytics**: Cloudflare keeps 30 days of free analytics; export monthly if you want long-term retention.

## When to revisit

- Buying a custom domain → see RUNBOOK § "Adding a custom domain".
- Adding dynamic features (comments, search, contact form) → see RUNBOOK § "Adding dynamic features".
- Migrating to Astro 5/6 → requires switching from `@astrojs/cloudflare` v11 to v13+ (Workers Static Assets); see [Astro Cloudflare adapter docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).
