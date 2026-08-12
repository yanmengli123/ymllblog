import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * 获取所有博客文章（包括草稿）
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  return await getCollection('blog');
}

/**
 * 获取已发布的文章（排除草稿），按日期降序
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => {
    return !data.draft;
  });
  return sortPostsByDate(posts);
}

/**
 * 获取精选文章
 */
export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  return posts.filter(post => post.data.featured);
}

/**
 * 获取最新文章
 */
export async function getRecentPosts(count: number = 5): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  return posts.slice(0, count);
}

/**
 * 根据 slug 获取单篇文章
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts();
  return posts.find(post => post.id === slug);
}

/**
 * 获取指定标签下的文章
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  return posts.filter(post =>
    post.data.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * 获取所有标签及其文章数量
 */
export async function getAllTagsWithCount(): Promise<{ name: string; count: number }[]> {
  const posts = await getPublishedPosts();
  const tagMap = new Map<string, number>();

  posts.forEach(post => {
    post.data.tags.forEach(tag => {
      const normalizedTag = tag.toLowerCase();
      tagMap.set(normalizedTag, (tagMap.get(normalizedTag) || 0) + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 获取按年份分组的文章
 */
export async function getPostsByYear(): Promise<Map<number, BlogPost[]>> {
  const posts = await getPublishedPosts();
  const yearMap = new Map<number, BlogPost[]>();

  posts.forEach(post => {
    const year = post.data.pubDate.getFullYear();
    if (!yearMap.has(year)) {
      yearMap.set(year, []);
    }
    yearMap.get(year)!.push(post);
  });

  return new Map([...yearMap.entries()].sort((a, b) => b[0] - a[0]));
}

/**
 * 获取相关文章（基于标签匹配）
 */
export async function getRelatedPosts(
  currentPost: { id: string; data: { tags: string[] } },
  count: number = 3
): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const currentTags = new Set(currentPost.data.tags.map(t => t.toLowerCase()));

  const scored = posts
    .filter(post => post.id !== currentPost.id)
    .map(post => {
      const matchingTags = post.data.tags.filter(t =>
        currentTags.has(t.toLowerCase())
      ).length;
      return { post, score: matchingTags };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map(item => item.post);
}

/**
 * 获取所有文章分类
 */
export async function getAllCategories(): Promise<string[]> {
  const posts = await getPublishedPosts();
  const categories = new Set<string>();

  posts.forEach(post => {
    if (post.data.category) {
      categories.add(post.data.category);
    }
  });

  return Array.from(categories).sort();
}

/**
 * 按日期降序排序
 */
function sortPostsByDate(posts: BlogPost[]): BlogPost[] {
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
