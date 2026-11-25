import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The ONE topic taxonomy (Insights Shift Change, 2026-11-25). `category`
// is the single topic; the homepage pills, topic pages, and article
// headers all generate from this field so they can never drift again.
// Keep in sync with `tagConfig` in src/lib/blog.ts.
export const CATEGORIES = ['security', 'compliance', 'ai-automation', 'strategy', 'technical', 'story'] as const;

// Named franchise series (Insights Shift Change, pattern 3).
export const SERIES = ['audit-the-agent', 'compliance-explained', 'village-builds'] as const;

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
    // Second half of the old header tags ("Security · Small Business"):
    // the header renders `Topic · Audience` from these two fields.
    audience: z.string().optional(),
    // Franchise series membership + position (Insights Shift Change).
    series: z.enum(SERIES).optional(),
    seriesOrder: z.number().optional(),
    // Per-post question for the article-end ResponseDoor.
    responsePrompt: z.string().optional(),
    // Homepage curation flags: at most one leadStory at a time.
    editorsPick: z.boolean().default(false),
    leadStory: z.boolean().default(false),
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

