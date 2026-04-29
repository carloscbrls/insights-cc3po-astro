// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://insights.cc3po.com',
	integrations: [mdx(), react(), sitemap()],
	output: 'static',
	build: {
		inlineStylesheets: 'auto'
	},
	// Phase 6: Image optimization settings
	image: {
		// Use Sharp for optimization
		service: {
			entrypoint: 'astro/assets/services/sharp',
		},
		// Default to WebP with fallbacks
		domains: ['cc3po.com'],
		// Remote patterns for external images
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cc3po.com',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: '*.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: 'plus.unsplash.com',
			},
		],
	},
	// Phase 6: Font optimization
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
	// Phase 6: Performance optimizations
	vite: {
		build: {
			// Minify CSS/JS
			minify: 'esbuild',
			cssMinify: true,
			// Target modern browsers for smaller bundles
			target: 'es2022',
			// Enable CSS code splitting
			cssCodeSplit: true,
			// Rollup options for chunk optimization
			rollupOptions: {
				output: {
					// Separate vendor chunks
					manualChunks: {
						'vendor': ['astro'],
					},
				},
			},
		},
	},
});