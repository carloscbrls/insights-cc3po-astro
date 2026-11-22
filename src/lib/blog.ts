import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const tagConfig: Record<string, { label: string; bg: string; color: string }> = {
  compliance: { label: 'Compliance', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  strategy: { label: 'Strategy', bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  story: { label: 'Story', bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' },
  technical: { label: 'Technical', bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316' },
  briefing: { label: 'Briefing', bg: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' },
  'building-in-public': { label: 'Building in Public', bg: 'rgba(251, 113, 133, 0.1)', color: '#fb7185' },
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

