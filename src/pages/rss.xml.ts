import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );

  return rss({
    title: 'YMLL Blog',
    description: '探索技术与设计的交汇点，记录成长与思考',
    site: context.site!,
    items: sortedPosts.map(post => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/ymllblog/blog/${post.slug}/`,
      categories: post.data.tags,
      author: post.data.author,
    })),
    customData: '<language>zh-CN</language>',
  });
}
