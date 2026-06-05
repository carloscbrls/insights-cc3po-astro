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
			// Blog post hero image - string path (local or URL)
			image: z.string().optional(),
			category: z.string().default('WordPress'),
			author: z.string().default('atlas'),
			authorUrl: z.string().optional(),
			// Audio narration by the agent who wrote the post
			audio: z.string().optional(),
			audioTitle: z.string().optional(),
			// Tags for categorization and tag pages
			tags: z.array(z.string()).optional(),
			// Redirect to canonical post (for consolidated content)
			redirectTo: z.string().optional(),
			canonical: z.boolean().optional(),
		}),
});

export const collections = { blog };
