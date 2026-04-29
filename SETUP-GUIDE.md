# Astro Blog Migration Complete

## What Was Done

✅ **Astro project created** at `/Users/cc3po/.openclaw/workspace/insights-cc3po-astro`
✅ **29 blog posts migrated** from HTML to Markdown
✅ **Dark theme implemented** matching cc3po branding (purple #6b35ff)
✅ **Blog listing page** with trust bar, testimonials, newsletter
✅ **Individual post templates** with schema.org markup
✅ **Newsletter integration** via existing Mailchimp API
✅ **Build tested** - 37 pages generated successfully
✅ **Git repository initialized** with all files committed

## Remaining Steps (Manual)

### 1. Push to GitHub

You need to authenticate with GitHub first. Run:

```bash
cd /Users/cc3po/.openclaw/workspace/insights-cc3po-astro

# Option A: Use GitHub CLI
gh auth login
gh repo create insights-cc3po-astro --public --source=. --remote=origin --push

# Option B: Manual push
# 1. Create repo at github.com/new (name: insights-cc3po-astro)
# 2. Run:
git remote add origin git@github.com:YOUR_USERNAME/insights-cc3po-astro.git
git branch -M main
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository: `insights-cc3po-astro`
4. Build settings (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

### 3. Configure Custom Domain

In Netlify:
1. Go to Site settings → Domain management
2. Add custom domain: `insights.cc3po.com`
3. Netlify will provide DNS instructions
4. Update DNS at SiteGround:
   - Remove existing A record for insights.cc3po.com
   - Add CNAME: `insights.cc3po.com` → `[your-netlify-subdomain].netlify.app`
   - Or use Netlify's DNS servers

### 4. Update DNS (SiteGround)

Go to SiteGround → Site Tools → Domain → DNS:
```
Type: CNAME
Name: insights
Value: [netlify-subdomain].netlify.app
TTL: 3600
```

## Village Workflow (For Future Posts)

### Creating New Blog Posts

1. **Create file**: `src/content/blog/your-post-title.md`

2. **Add frontmatter**:
```yaml
---
title: 'Your Post Title'
description: 'A brief description for SEO'
pubDate: '2026-04-21'
category: 'WordPress'  # or: AI & Automation, Security, Accessibility, etc.
author: 'Carlos Cabrales'
authorUrl: 'https://www.linkedin.com/in/carloscabrales'
heroImage: 'https://images.unsplash.com/photo-xxx?w=1200&q=80'
---

Your content here in Markdown...
```

3. **Commit and push**:
```bash
git add src/content/blog/your-post-title.md
git commit -m "Add new post: Your Post Title"
git push
```

4. **Netlify auto-deploys** in ~30 seconds

### Available Categories

- WordPress
- AI & Automation
- Security
- Accessibility
- Hosting
- Maintenance
- Consulting
- Nonprofit
- Music

### Finding Hero Images

Use Unsplash:
```
https://images.unsplash.com/photo-[ID]?w=1200&q=80
```

Search at: https://unsplash.com

## Project Structure

```
insights-cc3po-astro/
├── src/
│   ├── content/
│   │   └── blog/           # All blog posts (Markdown)
│   ├── layouts/
│   │   └── BlogPost.astro  # Post template
│   ├── pages/
│   │   ├── blog/
│   │   │   ├── index.astro # Blog listing
│   │   │   └── [...slug].astro # Post pages
│   │   └── index.astro    # Redirects to /blog
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── BaseHead.astro
│   └── styles/
│       └── global.css
├── public/
│   └── favicon.svg
├── netlify.toml            # Netlify config
├── astro.config.mjs        # Astro config
└── package.json
```

## Development Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## Notes

- No SSH required for updates - just git push
- No cache purging - Netlify handles everything
- Newsletter still uses existing Mailchimp API at insights.cc3po.com
- Dark theme with purple accents matches cc3po.com
- SEO optimized with schema.org markup
- RSS feed auto-generated at /rss.xml
- Sitemap auto-generated at /sitemap-index.xml

## Migration Details

- **Source**: 29 HTML files in SiteGround
- **Method**: SSH download + HTML-to-Markdown conversion
- **Preserved**: Titles, descriptions, dates, categories, images
- **Added**: Schema.org JSON-LD, OG tags, Twitter cards
- **URL format**: Changed from `/slug/` to `/blog/slug/`
  - Redirects configured in `netlify.toml` and `public/_redirects`