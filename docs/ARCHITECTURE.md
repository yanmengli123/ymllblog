# Architecture

Last updated: 2026-07-06. This file mirrors the high-level architecture described in [CLAUDE.md](../CLAUDE.md). Update both when architecture changes.

## System context

```
┌─────────────────┐      PR/push      ┌──────────────────┐
│  Developer /    │ ────────────────► │   GitHub Repo    │
│  Sveltia CMS    │                   │  yanmengli123/   │
│  (browser)      │ ◄─────────────── │     ymllblog     │
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
- **Sveltia CMS at edit time** — reads [public/admin/config.yml](../public/admin/config.yml). The two schemas MUST stay in sync. When you add/remove/rename a field, edit both files in the same PR.

## Content authoring paths

| Path | When to use |
|------|-------------|
| Browser → `https://<host>/admin` → Sveltia | Default for new posts, non-technical edits, image uploads |
| Local editor (Obsidian / VS Code) → git push | When working on multi-file refactors, schema changes, or batch edits |
| GitHub web editor → commit | Quick typo fixes from a phone |

All three paths converge on the same Markdown files in `src/content/blog/` and trigger the same CI/CD pipeline.

## Deployment topology

| Stage | Host | URL pattern | Trigger |
|-------|------|-------------|---------|
| PR preview | Cloudflare Pages | `https://<branch>.<project>.pages.dev` | PR opened/updated |
| Production | Cloudflare Pages | `https://<project>.pages.dev` (and optionally a future custom domain) | merge to `main` |
| Legacy mirror | GitHub Pages | `https://yanmengli123.github.io/ymllblog/` | kept as cold standby; mirror via Cloudflare → GH Pages sync or remove when confident |

## Quality gates (all must pass to merge to `main`)

1. `node tests/home-layout.test.mjs`
2. `node tests/runtime-safety.test.mjs`
3. `npx astro check` (TypeScript + Astro diagnostics)
4. `npm run build` produces `dist/sitemap.xml` and `dist/rss.xml`
5. Lychee link check on built `dist/**/*.html`
6. markdownlint-cli2 on `src/content/blog/**/*.md`

## Observability

| Layer | Tool | Cost |
|-------|------|------|
| Analytics | Cloudflare Web Analytics (when on Pages) / GH Pages does not include this | $0 |
| Uptime | UptimeRobot (free tier, 5-min interval) | $0 |
| Errors | Cloudflare Pages build logs + GitHub Actions logs | $0 |

## Backup / disaster recovery

- **Content** is Git → GitHub → Cloudflare Pages; triple-redundant.
- **Mirror** to GitLab: `Settings → Repository → Mirrored repositories` (one-click, free).
- **Scheduled export** of `public/` to Cloudflare R2 free tier: optional, not currently configured.
- **Comments** (when added): giscus → GitHub Discussions → already in git.
- **Analytics**: Cloudflare keeps 30 days of free analytics; export monthly if you want long-term retention.

## When to revisit

- Buying a custom domain → see RUNBOOK § "Adding a custom domain".
- Adding dynamic features (comments, search, contact form) → see RUNBOOK § "Adding dynamic features".
- Migrating to Astro 5/6 → requires switching from `@astrojs/cloudflare` v11 to v13+ (Workers Static Assets); see [Astro Cloudflare adapter docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).
