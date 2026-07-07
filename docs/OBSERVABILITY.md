# Observability — uptime, analytics, alerts

Three layers, all free-tier, all privacy-friendly (no cookies, no consent banners needed).

## 1. Uptime monitoring — UptimeRobot (free tier)

Tells you within 5 minutes if your site goes down. Sends email alerts.

**One-time setup (~3 min):**

1. Sign up at <https://uptimerobot.com/> (free, no card).
2. Dashboard → "+ Add New Monitor":
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `YMLL Blog Production`
   - URL: `https://ymllblog.pages.dev`
   - Monitoring Interval: **5 minutes** (free tier minimum)
3. Alert Contacts → add your email.
4. Save.

Now you get an email the moment Cloudflare has an incident or your deployment breaks something at boot.

**Cost:** $0 (50 monitors free, 5-min interval).

## 2. Analytics — Cloudflare Web Analytics (free, privacy-first)

Already enabled automatically once you deploy on Cloudflare Pages. Zero configuration, zero cookies, zero consent banner needed.

**Where to view:**

Cloudflare Dashboard → Workers & Pages → `ymllblog` project → **Analytics** tab.

Shows: requests, bandwidth, unique visitors (sampled), top paths, top referrers, countries.

**Optional: also enable for the GitHub Pages mirror** (the legacy fallback URL):

Not possible without a Cloudflare zone — Cloudflare Web Analytics only works on assets served through Cloudflare. If you want analytics on the GH Pages mirror, use [GoatCounter](https://www.goatcounter.com/) free tier (one-line JS snippet, no cookie consent needed).

## 3. Error tracking — Cloudflare Pages build logs + GitHub Actions logs

Static sites don't have runtime errors in the traditional sense. The errors you can actually see are:

- **Build failures** → Cloudflare Pages → Deployments → click the failed build → View logs.
- **Lint/type failures** → GitHub Actions → click the ❌ → expand the failing job.
- **Broken external links** → GitHub Actions → link-check job.

## 4. Build duration dashboard (Cloudflare)

Cloudflare Pages → project → **Deployments** → sort by duration.

A sudden spike (>2× baseline) usually means:
- A new dependency in `package.json` is large (use `npm ls --all` to find it).
- A new Astro component renders many components (lazy-load with `client:visible`).
- Pagefind rebuild is slow because of a large post corpus (unlikely below ~500 posts).

## 5. Alerting escalation

If a build fails:

1. Cloudflare Pages → Deployments shows the failure.
2. Cloudflare can email you on build failure (Settings → Notifications → toggle "Build failure" for your email).
3. GitHub Actions also emails the commit author on failure.

Set both up so you get notified through whichever channel is alive at the moment.

## 6. Privacy posture

- No third-party cookies (Cloudflare Web Analytics is cookieless).
- No Google Analytics, no Facebook Pixel.
- giscus (when enabled) sets only strictly-necessary cookies for the user's GitHub session.
- Pagefind downloads are kept in your origin — no third-party CDN dependencies for search.

If you ever need to comply with GDPR / China's PIPL, the current setup needs no additional consent banners.