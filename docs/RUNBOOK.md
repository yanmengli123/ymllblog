# Runbook

Step-by-step procedures for routine and incident operations. If something here is wrong, fix it AND update this file in the same PR.

## Daily operations

### Author a new post (recommended)

1. Open `https://<host>/admin` in your browser.
2. Log in via GitHub Device Flow (one-time per browser session).
3. Click "文章管理" → "新建".
4. Fill in title, description, pubDate, tags. Pick `featured: true` if it should appear in the homepage FeaturedPosts area.
5. Write the body in Markdown. Drop images into the editor — they auto-upload to `public/uploads/`.
6. Click "发布" → Sveltia commits to `main` → CI runs (~30s) → Cloudflare Pages rebuilds (~30s) → post is live at `https://<host>/blog/<slug>/`.

### Author a new post (from a local editor)

```bash
git checkout main && git pull
# Create the file — frontmatter MUST match src/content.config.ts
cp src/content/blog/.template.md src/content/blog/$(date +%Y-%m-%d)-my-post.md  # or use your own template
# Edit the file
git add src/content/blog/my-post.md
git commit -m "content: 新建文章 my-post"
git push origin main
```

CI will validate the frontmatter. If `astro check` or the build fails, your commit will not break the live site — but you also won't see the new post until you fix the schema.

### Edit / delete an existing post

- **Via CMS**: open the post → edit → publish. Delete via the post's "Delete" button.
- **Via Git**: `git rm src/content/blog/some-post.md && git commit -m "content: 删除 some-post" && git push`.

## Weekly operations

### Review Dependabot PRs

`.github/dependabot.yml` opens weekly PRs. Review and merge — they're grouped by area (astro/react/lint) to reduce noise.

```bash
gh pr list --label dependencies --author app/dependabot
```

### Check analytics + uptime

- Cloudflare dashboard → Analytics → last 7 days.
- UptimeRobot dashboard → incident history.

## Releases

This project does not version releases (it's a blog). When you want a "release marker":

```bash
git tag v2026.07.06-snapshot
git push origin v2026.07.06-snapshot
```

Tags are not currently used to trigger anything — they're just markers you can `git checkout` to if you need a known-good snapshot.

## Incident response

### Site is down

1. Check UptimeRobot email/SMS — it tells you the failure type.
2. Check Cloudflare status: <https://www.cloudflarestatus.com/>.
3. Check GitHub status: <https://www.githubstatus.com/>.
4. Open Cloudflare Pages → project → "Deployments" → click the last green deployment → "Rollback to this deploy". This reverts to the previous build in ~30s.
5. If Cloudflare is degraded, the GitHub Pages mirror at `https://yanmengli123.github.io/ymllblog/` should still be live. Update DNS / links if needed.

### Build is failing on `main`

1. Click the red ❌ on the failing commit in GitHub → open the failed workflow.
2. Most common causes:
   - Frontmatter schema mismatch (CMS or manual edit) — check `astro check` output.
   - Broken external link caught by lychee — fix the link in the post, or whitelist it in `lychee.toml`.
   - Dependency mismatch after a Dependabot PR — `git revert` the PR.
3. Fix on a branch, merge via PR. Never push directly to `main` once branch protection is enabled.

### Content accidentally deleted

1. Cloudflare Pages has the last ~50 deployments — click any to view the built site, but the source Markdown needs to be restored from Git.
2. `git log --diff-filter=D -- src/content/blog/<file>.md` → find the deletion commit.
3. `git revert <commit-sha>` to undo the deletion. Push. Rebuilds.

### Lost GitHub access

- Your repo is mirrored to GitLab (see ARCHITECTURE.md). You can pull from there.
- Cloudflare Pages is connected to GitHub — without GitHub access, you cannot push new code. You'd need to reconnect the project to the GitLab mirror.

## Adding dynamic features

When (if) you outgrow pure-static:

| Feature | Cost-free option | When to upgrade |
|---------|------------------|------------------|
| Comments | [giscus](https://giscus.app/) (GitHub Discussions) | Never — works for years |
| Search | [Pagefind](https://pagefind.app/) (build-time static index) | When >5,000 posts; switch to Algolia |
| Email subscription | Buttondown / Substack redirect (link out) | When >1,000 subscribers; self-host Listmonk on $5 VPS |
| Newsletter (own domain) | Buttondown free tier | When you outgrow free tier |
| Contact form | Cloudflare Workers + Workers KV free tier | Never needed |

All of these can be added **without** buying a domain or running a server.

## Adding a custom domain (when you decide to)

1. Buy from Cloudflare Registrar (at-cost, no markup): ~$10/yr for `.com`, ¥10/yr for `.cn`.
2. Cloudflare Pages → project → "Custom domains" → "Set up a custom domain" → enter the domain.
3. Cloudflare auto-detects if DNS is on Cloudflare; if not, it shows you the CNAME records to add at your registrar.
4. SSL is provisioned automatically within ~5 min.
5. Update `astro.config.mjs` `site:` field to your new domain. Update the sitemap script in [scripts/generate-sitemap.mjs](../scripts/generate-sitemap.mjs).
6. Optionally add an RSS link with the new domain.

The build itself does not need to change — only config.
