import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://insights.cc3po.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    // Keep straight quotes and dashes exactly as written (matches the old hand-written pages).
    smartypants: false,
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
