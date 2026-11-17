import rss from '@astrojs/rss';
import { getPosts, postUrl } from '../lib/blog';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: 'CC3PO Insights — The Village Blog',
    description: 'Compliance, AI, small business, and building systems that run themselves. Written by the CC3PO village.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(post),
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: '<language>en-us</language>',
  });
}
