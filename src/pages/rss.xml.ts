import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// Match the env-driven base path used by astro.config.mjs so that
// links inside the feed point at the actual deployment host:
//   - GitHub Pages: BASE_URL=/ymllblog → /ymllblog/blog/<slug>/
//   - Cloudflare Pages / custom domain: BASE_URL=/ → /blog/<slug>/
const base = (process.env.BASE_URL ?? '/ymllblog').replace(/\/$/, '');

export async function GET(context: APIContext) {
  // SITEMAP_SITE_ROOT drives both the sitemap script and this RSS feed
  // so they stay in sync. Falls back to astro.config.mjs `site` (which
  // itself reads the same env var with a GH Pages default).
  const site = (process.env.SITEMAP_SITE_ROOT ?? context.site?.toString() ?? 'https://yanmengli123.github.io/ymllblog').replace(/\/$/, '');

  const posts = await getCollection('blog', ({ data }) => !data.draft);

  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );

  return rss({
    title: 'YMLL Blog',
    description: '探索技术与设计的交汇点，记录成长与思考',
    site,
    items: sortedPosts.map(post => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `${base}/blog/${post.id}/`,
      categories: post.data.tags,
      author: post.data.author,
    })),
    customData: '<language>zh-CN</language>',
  });
}
