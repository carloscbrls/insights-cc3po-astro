# Village Workflow — Adding Blog Posts

## Quick Steps

1. **Create new file**: `src/content/blog/post-title.md`

2. **Add frontmatter and content**:
```markdown
---
title: 'Your Post Title'
description: 'Brief description for SEO (150 chars max)'
pubDate: '2026-04-21'
category: 'WordPress'
author: 'Carlos Cabrales'
authorUrl: 'https://www.linkedin.com/in/carloscabrales'
heroImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80'
---

Your content here in Markdown format...

## Section Header

More content...

- Bullet points
- Work great

1. Numbered lists
2. Also supported

**Bold** and *italic* text.

[Links](https://example.com) work too.
```

3. **Commit and push**:
```bash
git add .
git commit -m "Add: Your Post Title"
git push
```

4. **Done!** Netlify deploys in ~30 seconds

## Categories

Choose one of these categories:

| Category | When to Use |
|----------|-------------|
| WordPress | WordPress topics, Elementor |
| AI & Automation | AI tools, automation |
| Security | Website security |
| Accessibility | ADA, WCAG topics |
| Hosting | Hosting, performance |
| Maintenance | Site maintenance |
| Consulting | Consulting services |
| Nonprofit | Nonprofit, grants |
| Music | Music distribution |

## Finding Hero Images

1. Go to https://unsplash.com
2. Search for relevant image
3. Right-click image → "Copy image address"
4. Add `?w=1200&q=80` to the URL

Example:
```
https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80
```

## Markdown Reference

```markdown
# H1 (use for title in frontmatter, not body)

## H2 Section Header

### H3 Subsection

**Bold text**
*Italic text*

[Bullet list item]

1. Numbered list

> Blockquote

`inline code`

```
code block
```

[Link text](https://url.com)

![Image alt text](https://image-url.com)
```

## Common Tasks

### Edit a post
1. Find file in `src/content/blog/`
2. Edit content
3. Commit and push

### Delete a post
1. Delete file from `src/content/blog/`
2. Commit and push

### Change category
1. Edit frontmatter `category:` field
2. Commit and push

## Preview Before Push

Run locally to preview:
```bash
npm run dev
```
Open http://localhost:4321

## Need Help?

- Astro docs: https://docs.astro.build
- Markdown guide: https://www.markdownguide.org