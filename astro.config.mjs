// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://insights.cc3po.com',
	integrations: [mdx(), sitemap()],
	output: 'static',
	build: {
		inlineStylesheets: 'auto'
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Inter',
			cssVariable: '--font-inter',
			fallbacks: ['system-ui', 'sans-serif'],
			options: {
				variants: [
					{ weight: 400, style: 'normal' },
					{ weight: 500, style: 'normal' },
					{ weight: 600, style: 'normal' },
					{ weight: 700, style: 'normal' },
					{ weight: 800, style: 'normal' },
				],
			},
		},
	],
});