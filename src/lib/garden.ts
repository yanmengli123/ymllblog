import { getCollection, type CollectionEntry } from 'astro:content';

export type GardenPost = CollectionEntry<'blog'>;

export interface ActivityItem {
  date: string;
  count: number;
  publications: GardenPost[];
  cultivations: GardenPost[];
}

const dayKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function latestCultivatedAt(post: GardenPost): Date {
  const growthDates = post.data.growthLog.map((entry) => entry.date.getTime());
  return new Date(Math.max(post.data.updatedDate?.getTime() ?? 0, ...growthDates, post.data.pubDate.getTime()));
}

export function buildActivity(posts: GardenPost[], days = 365): ActivityItem[] {
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  const activity = new Map<string, ActivityItem>();

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = dayKey(cursor);
    activity.set(key, { date: key, count: 0, publications: [], cultivations: [] });
  }

  posts.forEach((post) => {
    const publishedKey = dayKey(post.data.pubDate);
    const published = activity.get(publishedKey);
    if (published) {
      published.count += 1;
      published.publications.push(post);
    }

    const growthDates = post.data.growthLog.length
      ? post.data.growthLog.map((entry) => entry.date)
      : post.data.updatedDate ? [post.data.updatedDate] : [];
    const uniqueGrowthDays = new Set(growthDates.map(dayKey));
    uniqueGrowthDays.forEach((key) => {
      if (key === publishedKey) return;
      const cultivated = activity.get(key);
      if (cultivated) {
        cultivated.count += 1;
        cultivated.cultivations.push(post);
      }
    });
  });

  return [...activity.values()];
}

export function aggregateTopics(posts: GardenPost[]) {
  const topics = new Map<string, { name: string; count: number; posts: GardenPost[]; lastActive: number }>();
  posts.forEach((post) => {
    post.data.tags.forEach((name) => {
      const key = name.toLocaleLowerCase('zh-CN');
      const current = topics.get(key) ?? { name, count: 0, posts: [], lastActive: 0 };
      current.count += 1;
      current.posts.push(post);
      current.lastActive = Math.max(current.lastActive, latestCultivatedAt(post).getTime());
      topics.set(key, current);
    });
  });
  return [...topics.values()]
    .map((topic) => ({ ...topic, posts: topic.posts.sort((a, b) => latestCultivatedAt(b).getTime() - latestCultivatedAt(a).getTime()).slice(0, 3) }))
    .sort((a, b) => b.count - a.count || b.lastActive - a.lastActive);
}

export function countWords(posts: GardenPost[]) {
  return posts.reduce((total, post) => total + (post.body ?? '').replace(/\s/g, '').length, 0);
}

export async function getGardenDashboard() {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  const [garden] = await getCollection('garden');
  const projects = (await getCollection('projects'))
    .filter((project) => project.data.featured && project.data.status !== 'archived')
    .sort((a, b) => a.data.order - b.data.order || b.data.updatedAt.getTime() - a.data.updatedAt.getTime());
  const research = (await getCollection('research')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const reading = (await getCollection('reading')).sort((a, b) => {
    const rank = { reading: 0, queued: 1, completed: 2 };
    return rank[a.data.status] - rank[b.data.status] || b.data.progress - a.data.progress;
  });
  const featured = posts.filter((post) => post.data.featured).sort((a, b) => a.data.featuredOrder - b.data.featuredOrder).slice(0, 3);
  const featuredPosts = featured.length ? featured : posts.slice(0, 3);
  const recentlyPublished = posts.slice(0, 5);
  const recentlyCultivated = [...posts].sort((a, b) => latestCultivatedAt(b).getTime() - latestCultivatedAt(a).getTime()).slice(0, 5);
  const topics = aggregateTopics(posts);
  const activity = buildActivity(posts);
  const words = countWords(posts);
  const yearMap = new Map<number, number>();
  posts.forEach((post) => yearMap.set(post.data.pubDate.getFullYear(), (yearMap.get(post.data.pubDate.getFullYear()) ?? 0) + 1));
  const years = [...yearMap.entries()].sort((a, b) => b[0] - a[0]);

  return {
    posts,
    garden: garden?.data,
    projects,
    research,
    reading,
    featured: featuredPosts,
    recentlyPublished,
    recentlyCultivated,
    topics,
    activity,
    words,
    years,
    stats: { notes: posts.length, topics: topics.length, projects: projects.length, words },
  };
}
