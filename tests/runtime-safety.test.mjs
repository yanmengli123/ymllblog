import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

const header = read('src/components/Header.astro');
assert.match(header, /placeholder="搜索文章、标签、摘要"/, 'search input placeholder should be valid HTML');
assert.doesNotMatch(header, /searchResults\.innerHTML\s*=/, 'search results should be rendered with DOM APIs, not innerHTML');
assert.match(header, /createElement\('a'\)/, 'search results should create result links safely');
assert.match(header, /textContent/, 'search results should set text with textContent');

const postLayout = read('src/layouts/PostLayout.astro');
assert.doesNotMatch(postLayout, /onclick=\{?`?/, 'post layout should not use inline onclick handlers');
assert.match(postLayout, /data-share-url/, 'share buttons should expose the share URL as data');
assert.match(postLayout, /id="copy-link-btn"/, 'copy link action should be wired by script');
assert.match(postLayout, /href=\{`\$\{base\}\/rss\.xml`\}/, 'article sidebar subscription should use RSS on a static site');
assert.doesNotMatch(postLayout, /<form class="flex flex-col gap-2">/, 'article sidebar should not render a fake email subscription form');

const layout = read('src/layouts/Layout.astro');
for (const brokenPattern of [
  /document\.title = '[^'\n]*\n/,
  /unlockAchievement\([^)]*馃摎[^)]*\n/,
  /backToTop\.innerHTML = '[^'\n]*\n/,
  /badge\.innerHTML = '[^'\n]*\n/,
  /onsubmit=/,
  /onclick=/,
]) {
  assert.doesNotMatch(layout, brokenPattern, `layout should not contain broken or inline script pattern ${brokenPattern}`);
}
assert.match(layout, /createSubscribePrompt/, 'layout should use a safe subscription prompt builder');
assert.match(layout, /rss\.xml/, 'subscription prompt should point to RSS');

const astroConfig = read('astro.config.mjs');
assert.doesNotMatch(astroConfig, /sitemap\(\)/, 'Astro config should avoid the incompatible sitemap integration');

const packageJson = read('package.json');
assert.match(packageJson, /node scripts\/generate-sitemap\.mjs/, 'build script should generate a sitemap after Astro build');

const sitemapScript = read('scripts/generate-sitemap.mjs');
assert.match(sitemapScript, /sitemap\.xml/, 'sitemap script should write sitemap.xml');
assert.match(sitemapScript, /SITEMAP_SITE_ROOT/, 'sitemap script should read site root from env so it works on both GH Pages and Cloudflare');
assert.match(sitemapScript, /yanmengli123\.github\.io/, 'sitemap script should default to the GitHub Pages URL when env is unset');
assert.match(sitemapScript, /encodeURIComponent/, 'sitemap script should URL-encode dynamic path segments');
assert.match(sitemapScript, /escapeXml/, 'sitemap script should XML-escape URLs');

const headersFile = read('public/_headers');
assert.match(headersFile, /Content-Security-Policy/, 'public/_headers should set a CSP');
assert.match(headersFile, /Strict-Transport-Security/, 'public/_headers should enable HSTS');
assert.match(headersFile, /X-Content-Type-Options/, 'public/_headers should disable MIME sniffing');
assert.match(headersFile, /\/admin\/\*/, 'public/_headers should apply a special rule to /admin (e.g. noindex)');
assert.match(headersFile, /giscus\.app/, 'CSP must allow giscus.app (comment widget)');
assert.match(headersFile, /Cache-Control.*immutable/, 'public/_headers should cache-bust hashed /_astro/* assets');

const redirectsFile = read('public/_redirects');
assert.match(redirectsFile, /\/ymllblog\//, 'public/_redirects should rewrite legacy /ymllblog/* to root for Cloudflare Pages');

console.log('runtime safety tests passed');
