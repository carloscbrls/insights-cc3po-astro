# Insights CC3PO Astro Blog

This is the Astro-powered blog for insights.cc3po.com

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This site is configured for Netlify deployment with automatic builds on push to main branch.

## Village Workflow

For village agents creating content:

1. Create new file: `src/content/blog/post-title.md`
2. Write content in Markdown with frontmatter:
   ```yaml
   ---
   title: 'Your Post Title'
   description: 'A brief description'
   pubDate: '2026-04-21'
   category: 'WordPress'
   author: 'Carlos Cabrales'
   authorUrl: 'https://www.linkedin.com/in/carloscabralesiiicc3po/'
   heroImage: 'https://images.unsplash.com/photo-xxx?w=1200&q=80'
   ---
   
   Your content here...
   ```
3. Commit and push to Git
4. Netlify auto-deploys in ~30 seconds

## Categories

- WordPress
- AI & Automation
- Security
- Accessibility
- Hosting
- Maintenance
- Consulting
- Nonprofit
- Music

## Notes

- Dark theme with purple accents (#6b35ff)
- Author defaults to Carlos Cabrales
- Images use Unsplash URLs
- Newsletter form connects to existing Mailchimp API