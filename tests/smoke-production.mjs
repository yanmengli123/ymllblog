#!/usr/bin/env node
/**
 * Production smoke test — runs against the live Cloudflare Pages deployment
 * to confirm the most recent deploy actually serves a working site.
 *
 * Usage:
 *   node tests/smoke-production.mjs
 *
 * Env:
 *   SMOKE_BASE_URL — defaults to https://ymllblog.pages.dev
 *                    override when testing PR previews: https://<hash>.ymllblog.pages.dev
 *
 * Exits 0 on success, 1 on any failure. Designed to be safe to run on
 * every CI build that has a known preview URL (PR comments expose the URL).
 */

import assert from 'node:assert/strict';

const base = (process.env.SMOKE_BASE_URL ?? 'https://ymllblog.pages.dev').replace(/\/$/, '');

const probes = [
  { path: '/',               mustContain: ['<html', 'YMLL'],  mustNotContain: [] },
  { path: '/blog/',          mustContain: ['<html'],          mustNotContain: [] },
  { path: '/admin/',         mustContain: ['Sveltia'],        mustNotContain: [] },
  { path: '/admin/config.yml', mustContain: ['backend', 'collections'], mustNotContain: [] },
  { path: '/sitemap.xml',    mustContain: ['<urlset', '</urlset>'],    mustNotContain: [] },
  { path: '/rss.xml',        mustContain: ['<rss', '</rss>'],          mustNotContain: [] },
];

let failures = 0;
const summary = [];

for (const probe of probes) {
  const url = `${base}${probe.path}`;
  const res = await fetch(url, { redirect: 'follow' });
  const body = await res.text();

  if (res.status !== 200) {
    failures++;
    summary.push(`❌ ${probe.path} → HTTP ${res.status}`);
    continue;
  }

  let probeOk = true;
  for (const must of probe.mustContain) {
    if (!body.includes(must)) {
      probeOk = false;
      summary.push(`❌ ${probe.path} missing required string "${must}"`);
    }
  }
  for (const banned of probe.mustNotContain) {
    if (body.includes(banned)) {
      probeOk = false;
      summary.push(`❌ ${probe.path} contains forbidden string "${banned}"`);
    }
  }

  if (probeOk) summary.push(`✅ ${probe.path}`);
  else failures++;
}

console.log(`\nSmoke test against ${base}\n`);
for (const line of summary) console.log('  ' + line);
console.log();

if (failures > 0) {
  console.error(`${failures} probe(s) failed.`);
  process.exit(1);
}
console.log('All probes passed.');