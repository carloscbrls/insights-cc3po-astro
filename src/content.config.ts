import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Categories shown as the colored pill on the homepage cards.
// Keep in sync with `tagConfig` in src/lib/blog.ts.
export const CATEGORIES = ['compliance', 'strategy', 'story', 'technical', 'briefing'] as const;

const blog = defineCollection({
  // One file per post: src/content/blog/<slug>.mdx -> /blog/<slug>/
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Byline: one or more authors. Optional role is shown after an em dash.
    authors: z.array(z.string()).default(['Tinta 🖋️']),
    role: z.string().optional(),
    eyebrow: z.string(),
    category: z.enum(CATEGORIES),
    tags: z.array(z.string()).default([]),
    excerpt: z.string(),
    readTime: z.string(),
    // Path under /public, e.g. /blog-images/68-audit-the-agent-hero.jpg. Skipped if the file is missing.
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
