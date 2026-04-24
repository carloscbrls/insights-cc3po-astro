import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			// Use string instead of image() to avoid build failures when Unsplash URLs 404
			heroImage: z.string().optional(),
			category: z.string().default('WordPress'),
			author: z.string().default('Carlos Cabrales'),
			authorUrl: z.string().optional(),
		}),
});

export const collections = { blog };
