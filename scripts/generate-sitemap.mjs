import { readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const siteRoot = 'https://yanmengli123.github.io/ymllblog';

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(fullPath);
    if (entry.isFile() && entry.name === 'index.html') return [fullPath];
    return [];
  }));
  return files.flat();
}

function toUrl(filePath) {
  const relativePath = relative(distDir, filePath).split(sep).join('/');
  const route = relativePath.replace(/index\.html$/, '').replace(/\/$/, '');
  const encodedRoute = route
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${siteRoot}${encodedRoute ? `/${encodedRoute}` : '/'}`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

const urls = (await listHtmlFiles(distDir))
  .map(toUrl)
  .sort((a, b) => a.localeCompare(b));

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n') +
  `\n</urlset>\n`;

await writeFile(join(distDir, 'sitemap.xml'), xml, 'utf8');
console.log(`Generated sitemap.xml with ${urls.length} URLs`);
