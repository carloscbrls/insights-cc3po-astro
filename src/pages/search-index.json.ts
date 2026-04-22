import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog');
  
  const searchIndex = posts.map(post => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    category: post.data.category,
    date: post.data.pubDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    url: `/blog/${post.id}/`
  }));
  
  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}