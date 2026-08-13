import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');
const layout = read('src/layouts/Layout.astro');
const header = read('src/components/Header.astro');
const postLayout = read('src/layouts/PostLayout.astro');
const adminHtml = read('public/admin/index.html');
const adminClient = read('public/admin/admin.js');
const gardenAdminClient = read('public/admin/garden-admin.js');
const adminServer = read('server/admin-server.mjs');
const adminService = read('server/ymllblog-admin.service');
const headers = read('public/_headers');
const sitemapScript = read('scripts/generate-sitemap.mjs');
const astroConfig = read('astro.config.mjs');

assert.match(layout, /<meta name="description"/, 'layout should include description metadata');
assert.match(layout, /application\/ld\+json/, 'layout should expose structured data');
assert.match(layout, /createSubscribePrompt/, 'layout should expose the RSS subscription target safely');
assert.doesNotMatch(layout, /onclick=|onsubmit=/, 'layout should avoid inline event handlers');

assert.match(header, /replaceChildren\(\)/, 'search results should be cleared safely');
assert.match(header, /textContent/, 'search content should be assigned as text');
assert.match(postLayout, /data-share-url/, 'share action should store the canonical URL as data');

assert.match(adminHtml, /autocomplete="username"/, 'admin login should support username/password managers');
assert.match(adminHtml, /autocomplete="current-password"/, 'admin login should use a password field');
assert.match(adminHtml, /id="post-form"/, 'admin should expose post editing');
assert.match(adminHtml, /data-admin-section="garden"/, 'admin should expose garden status management');
assert.match(adminHtml, /id="project-form"/, 'admin should expose project CRUD');
assert.match(adminHtml, /id="research-form"/, 'admin should expose research CRUD');
assert.match(adminHtml, /id="reading-form"/, 'admin should expose reading shelf management');
assert.doesNotMatch(adminHtml, /sveltia|github.*token/i, 'admin browser bundle should not request GitHub credentials');
assert.match(adminClient, /X-CSRF-Token/, 'admin writes should send a CSRF token');
assert.match(adminClient, /textContent/, 'admin should render repository content safely');
assert.doesNotMatch(adminClient, /innerHTML\s*=/, 'admin should avoid unsafe HTML assignment');
assert.doesNotMatch(gardenAdminClient, /innerHTML\s*=/, 'garden admin should avoid unsafe HTML assignment');
assert.match(adminServer, /\/admin-api\/garden/, 'admin API should expose garden status writes');
assert.match(adminServer, /projects\|research/, 'admin API should expose project and research CRUD');
assert.match(adminServer, /HttpOnly; SameSite=Strict/, 'admin session cookie should be hardened');
assert.match(adminServer, /scrypt/, 'admin password should use a memory-hard hash');
assert.match(adminServer, /timingSafeEqual/, 'credential comparisons should resist timing attacks');
assert.match(adminServer, /blockedUntil/, 'admin login should rate-limit repeated failures');
assert.match(adminService, /NoNewPrivileges=true/, 'admin service should use systemd sandboxing');

assert.match(headers, /Content-Security-Policy/, 'security headers should include a CSP');
assert.match(headers, /Strict-Transport-Security/, 'security headers should include HSTS');
assert.match(headers, /\/admin\/\*/, 'admin should have dedicated noindex and no-store rules');
assert.match(headers, /Cross-Origin-Opener-Policy: same-origin/, 'admin should isolate its browsing context');
assert.doesNotMatch(headers, /unsafe-eval/, 'CSP should not allow eval');

assert.match(sitemapScript, /SITEMAP_SITE_ROOT/, 'sitemap should be configurable per deployment');
assert.match(sitemapScript, /escapeXml/, 'sitemap should escape generated URLs');
assert.match(astroConfig, /ymll-admin-index-redirect/, 'local admin directory URLs should resolve to the isolated static entry');
assert.match(astroConfig, /adminPath}\/index\.html/, 'local admin redirect should preserve the configured base path');
assert.match(astroConfig, /'\/admin', '\/admin\/'/, 'local admin redirect should also recognize Vite base-stripped paths');

console.log('runtime and admin safety tests passed');
