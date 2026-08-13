import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('YMLL'),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    featuredOrder: z.number().int().min(0).default(99),
    maturity: z.enum(['seedling', 'growing', 'evergreen']).default('growing'),
    growthLog: z.array(z.object({
      date: z.coerce.date(),
      summary: z.string().min(1),
    })).default([]),
    lang: z.string().default('zh-CN'),
  }),
});

const garden = defineCollection({
  loader: file('./src/content/garden.yml'),
  schema: z.object({
    status: z.enum(['available', 'building', 'writing', 'researching']).default('building'),
    timezone: z.string().default('Asia/Shanghai'),
    headline: z.string(),
    summary: z.string(),
    exploring: z.array(z.string()).default([]),
    building: z.object({ title: z.string(), detail: z.string(), progress: z.number().min(0).max(100) }),
    reading: z.object({ title: z.string(), detail: z.string(), progress: z.number().min(0).max(100) }),
    updatedAt: z.coerce.date(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(['active', 'building', 'experiment', 'maintained', 'paused', 'archived']),
    technologies: z.array(z.string()).default([]),
    updatedAt: z.coerce.date(),
    repository: z.url().optional(),
    website: z.url().optional(),
    relatedPost: z.string().optional(),
    order: z.number().int().min(0).default(99),
    featured: z.boolean().default(true),
  }),
});

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    topic: z.string(),
    status: z.enum(['question', 'exploring', 'validated', 'parked']).default('exploring'),
    relatedPost: z.string().optional(),
  }),
});

const reading = defineCollection({
  loader: file('./src/content/reading.yml'),
  schema: z.object({
    title: z.string(),
    creator: z.string(),
    kind: z.enum(['book', 'paper', 'course', 'documentation']).default('book'),
    status: z.enum(['reading', 'queued', 'completed']).default('reading'),
    progress: z.number().min(0).max(100).default(0),
    url: z.url().optional(),
    note: z.string().optional(),
  }),
});

export const collections = { blog, garden, projects, research, reading };
