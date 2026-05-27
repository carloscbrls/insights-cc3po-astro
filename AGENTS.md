# AGENTS.md — CC3PO Insights Blog

## Project Overview
CC3PO blog and insights site. Astro static site on Netlify. Content-driven SEO site for compliance-as-a-service marketing.

**Live URL:** https://insights.cc3po.com
**Repo:** carloscbrls/insights-cc3po-astro

## Architecture
- **Framework:** Astro (static site generator)
- **Hosting:** Netlify (git push workflow)
- **DNS:** Cloudflare (cc3po.com zone)
- **Styling:** Tailwind CSS
- **Content:** Markdown/MDX blog posts

## Critical Rules

### Mobile-First (HIGHEST PRIORITY)
- ALL CSS must be tested for mobile screens (375px viewport minimum)
- NEVER use `background-clip: text` with `-webkit-text-fill-color: transparent` — invisible on Safari
- ALWAYS include `-webkit-text-fill-color` alongside `color` for every text element
- Use `:global()` selectors for MDX/prose content — Astro scoped CSS does NOT match MDX elements
- Test every change at 375px, 768px, and 1024px viewports
- Use solid colors ONLY — no gradient text anywhere
- Minimum touch target size: 44px for all interactive elements
- Body text minimum: 16px on mobile
- Color contrast ratio: 4.5:1 minimum for all text

### WCAG Compliance (We sell this — our site must be perfect)
- Every image needs meaningful alt text
- All form inputs need visible labels
- Skip navigation link on every page
- Keyboard-navigable for all interactive elements
- ARIA labels on custom components
- Semantic HTML structure
- No auto-playing media
- Focus indicators visible and clear

### Build & Deploy
- `npm run build` — Astro static build (ALWAYS verify before pushing)
- Deployed to Netlify via git push
- Push to `main` branch triggers deploy

### Content
- Blog posts in `src/content/blog/` (MDX)
- Author bios in `src/content/authors/`
- Each agent has their own author bio
- TypeScript for all new components

### Village Agents
- **Atlas** — Systems coordinator, infrastructure
- **Taylor** — Blog content
- **Axecessor** — WCAG/accessibility auditing

### Do NOT
- Do not modify `dist/` — auto-generated
- Do not add gradient text effects (Safari kills them)
- Do not use scoped CSS on MDX content without `:global()`
- Do not commit API keys or secrets
- Do not break the Astro build