# Sveltia CMS — install & upgrade

This file documents how the CMS is set up. If you are setting it up from scratch, follow steps 1–3 in order. For day-to-day editing, see [RUNBOOK.md](RUNBOOK.md) § "Author a new post".

## What is Sveltia CMS?

A browser-based, Git-backed content management UI. It runs entirely in the browser — there is no backend server. Authentication uses the **GitHub Device Flow** (you see a code on the CMS page, paste it into github.com/login/device, done). All edits commit directly to your repo.

It is a modern fork of Decap CMS with a better editor, native i18n, and no need for an OAuth proxy.

## Install (already done in this repo)

Files live under `public/admin/`. Astro copies `public/*` to `dist/*` verbatim during build, so the CMS is reachable at `${BASE_URL}/admin/` automatically — no route config needed.

```
public/admin/
├── index.html   # Entry point. Loads Sveltia via ESM CDN.
└── config.yml   # Field definitions. MUST mirror src/content.config.ts.
```

### Upgrading Sveltia

The version is pinned in `public/admin/index.html`:

```html
<script type="module">
  const sveltiaUrl = 'https://unpkg.com/@sveltia/cms@0.110.0/dist/sveltia-cms.js';
  ...
</script>
```

When Dependabot opens a PR for `@sveltia/cms` (after you add it to package.json or just bump the URL manually):

1. Check [Sveltia's CHANGELOG](https://github.com/sveltia/sveltia-cms/blob/main/packages/cms/CHANGELOG.md) for breaking changes.
2. Update the URL.
3. Bump the version in this doc.
4. Open a PR — CI will build, and you can click the Cloudflare Pages preview URL to verify the CMS loads.

## Field parity with `src/content.config.ts`

| Zod schema field (source of truth) | Sveltia widget | Required? |
|-------------------------------------|----------------|-----------|
| `title` | `string` | yes |
| `description` | `text` | yes |
| `pubDate` | `datetime` | yes |
| `updatedDate` | `datetime` | optional |
| `author` | `string` (default "YMLL") | optional |
| `tags` | `list` of strings | optional |
| `category` | `string` | optional |
| `cover` | `image` | optional |
| `draft` | `boolean` (default false) | optional |
| `featured` | `boolean` (default false) | optional |
| `lang` | `select` (default "zh-CN") | optional |
| `body` | `markdown` | yes |

If you add a new field to either side, add it to the other in the same PR. A drift will fail the next `astro check` run.

## Authentication notes

- GitHub Device Flow does NOT require you to register an OAuth app — it uses the standard GitHub endpoint.
- Each browser session asks for re-auth (token lifetime is short). This is intentional for security.
- For multi-author setups, add each GitHub user as a repository collaborator. The CMS will then commit under their GitHub identity.

## Why not Decap CMS?

Decap needs a separate OAuth proxy server (`decap-server` or Netlify Identity) to handle GitHub login. That violates the "zero backend" constraint. Sveltia uses the GitHub Device Flow directly — no proxy required.

## Why not TinaCMS?

Tina's free self-hosted tier still requires you to run a Node.js backend. Sveltia is purely static + browser.
