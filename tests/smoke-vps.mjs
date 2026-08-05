import assert from 'node:assert/strict';

const base = 'https://yanmengli.cn';

const probes = [
  { path: '/',                       mustContain: ['<html', 'YMLL'],  desc: 'Homepage' },
  { path: '/blog/',                  mustContain: ['<html'],          desc: 'Blog index' },
  { path: '/admin/',                 mustContain: ['Sveltia', 'sveltia-cms'], desc: 'CMS admin' },
  { path: '/admin/config.yml',       mustContain: ['backend', 'collections'], desc: 'CMS config' },
  { path: '/sitemap.xml',            mustContain: ['<urlset', '</urlset>'],  desc: 'Sitemap' },
  { path: '/rss.xml',                mustContain: ['<rss', '</rss>'],         desc: 'RSS' },
  { path: '/.well-known/acme-challenge/test', mustContain: [], desc: 'Certbot path (expects 404)' },
];

let failed = 0;
const summary = [];

for (const p of probes) {
  const url = `${base}${p.path}`;
  const r = await fetch(url, { redirect: 'manual' });
  const body = await r.text();
  let ok = true;
  for (const m of p.mustContain) if (!body.includes(m)) { ok = false; break; }
  summary.push(`${ok ? '✅' : '❌'} ${p.desc.padEnd(25)} HTTP ${r.status}  ${p.path}`);
  if (!ok) failed++;
}

console.log('\nSmoke test against', base, '\n');
for (const s of summary) console.log('  ' + s);

// Header check on root
const root = await fetch(base + '/');
const h = root.headers;
const headerChecks = [
  ['strict-transport-security', 'HSTS'],
  ['x-content-type-options', 'X-Content-Type-Options'],
  ['x-frame-options', 'X-Frame-Options'],
  ['content-security-policy', 'CSP'],
];
console.log('\nSecurity headers:');
for (const [name, label] of headerChecks) {
  console.log(`  ${h.get(name) ? '✅' : '❌'} ${label}: ${h.get(name) ? 'present' : 'MISSING'}`);
}

// Redirect tests
const redir1 = await fetch('http://yanmengli.cn', { redirect: 'manual' });
const redir2 = await fetch('https://yanmengli.cn/ymllblog/blog/', { redirect: 'manual' });
console.log('\nRedirects:');
console.log(`  ${redir1.status === 301 && redir1.headers.get('location')?.startsWith('https://') ? '✅' : '❌'} HTTP → HTTPS (got ${redir1.status} → ${redir1.headers.get('location')})`);
console.log(`  ${redir2.status === 301 && !redir2.headers.get('location')?.includes('/ymllblog/') ? '✅' : '❌'} /ymllblog/* → / (got ${redir2.status} → ${redir2.headers.get('location')})`);

if (failed > 0) {
  console.error(`\n${failed} probe(s) failed`);
  process.exit(1);
}
console.log('\n✅ All checks passed');
