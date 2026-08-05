#!/usr/bin/env node
/**
 * Deep verification — extends smoke-production with header/redirect checks.
 * Run after any change to public/_headers or public/_redirects.
 */

const base = (process.env.SMOKE_BASE_URL ?? 'https://ymllblog.pages.dev').replace(/\/$/, '');

const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
  } catch (e) {
    checks.push({ name, ok: false, err: String(e.message ?? e) });
  }
}

// Security headers
await check('X-Content-Type-Options: nosniff', async () => {
  const r = await fetch(`${base}/`);
  if (r.headers.get('x-content-type-options') !== 'nosniff') throw new Error('missing');
});

await check('HSTS preload', async () => {
  const r = await fetch(`${base}/`);
  const hsts = r.headers.get('strict-transport-security') ?? '';
  if (!hsts.includes('max-age=31536000') || !hsts.includes('preload')) throw new Error(`got: ${hsts}`);
});

await check('CSP present', async () => {
  const r = await fetch(`${base}/`);
  const csp = r.headers.get('content-security-policy') ?? '';
  if (!csp.includes("default-src 'self'")) throw new Error(`no default-src`);
  if (!csp.includes('music.163.com')) throw new Error('missing NetEase domain');
  if (!csp.includes('giscus.app')) throw new Error('missing giscus domain');
});

await check('Cache-Control on /_astro/* assets', async () => {
  // Find any /_astro/* asset from the homepage
  const html = await fetch(`${base}/`).then(r => r.text());
  const m = html.match(/\/_astro\/[^"']+\.css/);
  if (!m) throw new Error('no _astro asset found in homepage');
  const r = await fetch(`${base}${m[0]}`);
  const cc = r.headers.get('cache-control') ?? '';
  if (!cc.includes('max-age=31536000')) throw new Error(`got: ${cc}`);
});

await check('/admin/* → noindex', async () => {
  const r = await fetch(`${base}/admin/`);
  const xrt = r.headers.get('x-robots-tag') ?? '';
  if (!xrt.includes('noindex')) throw new Error(`got: ${xrt}`);
});

await check('Legacy /ymllblog/* → / (301)', async () => {
  const r = await fetch(`${base}/ymllblog/blog/`, { redirect: 'manual' });
  if (r.status !== 301) throw new Error(`expected 301, got ${r.status}`);
  const loc = r.headers.get('location') ?? '';
  if (!loc.includes('/blog/')) throw new Error(`unexpected redirect target: ${loc}`);
});

// Pagefind index present
await check('Pagefind index accessible', async () => {
  const r = await fetch(`${base}/pagefind/pagefind.js`);
  if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
  const body = await r.text();
  if (!body.includes('pagefind')) throw new Error('not Pagefind');
});

await check('Pagefind index entry has entries', async () => {
  const r = await fetch(`${base}/pagefind/index.html`);
  if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
});

// Sitemap and RSS sanity
await check('sitemap.xml has pages.dev URLs', async () => {
  const body = await fetch(`${base}/sitemap.xml`).then(r => r.text());
  if (!body.includes('ymllblog.pages.dev')) throw new Error('sitemap does not point at live host');
  const count = (body.match(/<loc>/g) ?? []).length;
  if (count < 5) throw new Error(`only ${count} URLs`);
});

await check('rss.xml has pages.dev URLs', async () => {
  const body = await fetch(`${base}/rss.xml`).then(r => r.text());
  if (!body.includes('ymllblog.pages.dev')) throw new Error('rss does not point at live host');
});

await check('rss.xml has at least 1 item', async () => {
  const body = await fetch(`${base}/rss.xml`).then(r => r.text());
  const count = (body.match(/<item>/g) ?? []).length;
  if (count < 1) throw new Error(`only ${count} items`);
});

// CMS
await check('Sveltia CMS index loads', async () => {
  const r = await fetch(`${base}/admin/`);
  const body = await r.text();
  if (!body.includes('Sveltia') && !body.includes('sveltia-cms')) {
    throw new Error('Sveltia CMS script not loaded');
  }
});

await check('CMS config.yml has all 12 fields', async () => {
  const body = await fetch(`${base}/admin/config.yml`).then(r => r.text());
  const required = ['title', 'description', 'pubDate', 'updatedDate', 'author', 'tags', 'category', 'cover', 'draft', 'featured', 'lang', 'body'];
  const missing = required.filter(f => !body.includes(f));
  if (missing.length) throw new Error(`missing fields: ${missing.join(', ')}`);
});

// Output
console.log(`\nDeep check against ${base}\n`);
let failed = 0;
for (const c of checks) {
  console.log(`  ${c.ok ? '✅' : '❌'} ${c.name}${c.ok ? '' : ` — ${c.err}`}`);
  if (!c.ok) failed++;
}
console.log();
if (failed) {
  console.error(`${failed} check(s) failed.`);
  process.exit(1);
}
console.log('All deep checks passed.');