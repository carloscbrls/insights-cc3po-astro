import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/**
 * The ONE topic taxonomy (Insights Shift Change, 2026-11-25). Pills,
 * topic pages, and article headers all render from `category` (+ the
 * optional `audience`) so the surfaces can never drift again. Colors are
 * Nightshift token values (see src/styles/tokens.css): every pair below
 * passes WCAG AA contrast for small text on the dark card surfaces.
 * Keep the keys in sync with `CATEGORIES` in src/content.config.ts.
 */
export const tagConfig: Record<string, { label: string; bg: string; color: string }> = {
  security: { label: 'Security', bg: '#271626', color: '#ef6a87' },
  compliance: { label: 'Compliance', bg: '#11111f', color: '#00e676' },
  'ai-automation': { label: 'AI & Automation', bg: '#11111f', color: '#4fc3f7' },
  strategy: { label: 'Strategy', bg: '#11111f', color: '#e6a50f' },
  technical: { label: 'Technical', bg: '#11111f', color: '#f0617a' },
  story: { label: 'Story', bg: '#11111f', color: '#ffd700' },
};

export interface SeriesDef {
  slug: string;
  name: string;
  description: string;
  cadence?: string;
}

/** Named franchise series (Insights Shift Change, pattern 3). */
export const SERIES_DEFS: Record<string, SeriesDef> = {
  'audit-the-agent': {
    slug: 'audit-the-agent',
    name: 'Audit the Agent',
    description:
      'The Village\u2019s Daily News briefing \u2014 Quill researches, Tinta edits, and every claim links to its source. AI agents, security, and the stories moving under the headlines.',
    cadence: 'Weekdays, from the Village news desk.',
  },
  'compliance-explained': {
    slug: 'compliance-explained',
    name: 'Compliance, Explained',
    description:
      'ADA and WCAG compliance in plain language \u2014 the lawsuits, the rules, and what a small business actually has to do about them.',
  },
  'village-builds': {
    slug: 'village-builds',
    name: 'Village Builds',
    description:
      'Build stories from inside the Village \u2014 the systems we ship, what broke along the way, and what we learned from it.',
  },
};

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;

/** "July 4, 2026" — dates are calendar dates, so format in UTC. */
export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** The header line for a post: `Topic` or `Topic · Audience`, from frontmatter only. */
export const topicLine = (post: Post) => {
  const label = tagConfig[post.data.category]?.label ?? post.data.category;
  return post.data.audience ? `${label} · ${post.data.audience}` : label;
};

/** Posts in a series, in series order (seriesOrder, falling back to date). */
export function seriesPosts(posts: Post[], series: string): Post[] {
  return posts
    .filter((p) => p.data.series === series)
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0) || a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
}

/** A post's position label inside its series, e.g. "No. 2" (null when not in a series). */
export function seriesNumber(posts: Post[], post: Post): number | null {
  if (!post.data.series) return null;
  const idx = seriesPosts(posts, post.data.series).findIndex((p) => p.id === post.id);
  return idx >= 0 ? idx + 1 : null;
}

/** Previous / next post inside the same series (by series order). */
export function seriesNeighbors(posts: Post[], post: Post): { prev?: Post; next?: Post } {
  if (!post.data.series) return {};
  const inSeries = seriesPosts(posts, post.data.series);
  const idx = inSeries.findIndex((p) => p.id === post.id);
  if (idx < 0) return {};
  return { prev: inSeries[idx - 1], next: inSeries[idx + 1] };
}

/** Related posts: same topic first, then same series, newest first, excluding self. */
export function relatedPosts(posts: Post[], post: Post, count = 3): Post[] {
  const others = posts.filter((p) => p.id !== post.id);
  const score = (p: Post) =>
    (p.data.category === post.data.category ? 2 : 0) + (post.data.series && p.data.series === post.data.series ? 1 : 0);
  return others
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || b.p.data.pubDate.valueOf() - a.p.data.pubDate.valueOf())
    .slice(0, count)
    .map(({ p }) => p);
}

/** Chronological neighbors in the full archive (posts are newest-first). */
export function archiveNeighbors(posts: Post[], post: Post): { newer?: Post; older?: Post } {
  const idx = posts.findIndex((p) => p.id === post.id);
  if (idx < 0) return {};
  return { newer: posts[idx - 1], older: posts[idx + 1] };
}

/** Reading time from the raw body: word count / 200, rounded, minimum 1. */
export function readingTime(post: Post): { minutes: number; words: number } {
  const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
  return { minutes: Math.max(1, Math.round(words / 200)), words };
}

/** Author display name with the emoji suffix stripped ("Tinta 🖋️" → "Tinta"). */
export const authorName = (raw: string) => raw.replace(/\s*[^\w\s&'’.-].*$/u, '').trim() || raw;

/** URL slug for an author page ("Carlos Cabrales" → "carlos-cabrales"). */
export const authorSlug = (raw: string) =>
  authorName(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Distinct authors across posts, with their posts attached. */
export function authorsWithPosts(posts: Post[]): { name: string; slug: string; role?: string; posts: Post[] }[] {
  const map = new Map<string, { name: string; slug: string; role?: string; posts: Post[] }>();
  for (const post of posts) {
    for (const raw of post.data.authors) {
      const slug = authorSlug(raw);
      if (!map.has(slug)) map.set(slug, { name: authorName(raw), slug, role: post.data.role, posts: [] });
      map.get(slug)!.posts.push(post);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
