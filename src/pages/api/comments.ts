import type { APIRoute } from 'astro';

// Simple in-memory comments store (will be replaced with proper storage)
interface Comment {
  id: string;
  slug: string;
  name: string;
  email: string;
  comment: string;
  createdAt: string;
  approved: boolean;
}

const commentsStore: Map<string, Comment[]> = new Map();

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { slug, name, email, comment } = data;
    
    // Validate inputs
    if (!slug || !name || !email || !comment) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'All fields are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Please provide a valid email address' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Sanitize inputs (basic)
    const sanitizedComment = comment.trim().replace(/<script>/gi, '').substring(0, 2000);
    
    // Create comment
    const newComment: Comment = {
      id: crypto.randomUUID(),
      slug,
      name: name.trim().substring(0, 100),
      email: email.trim().toLowerCase(),
      comment: sanitizedComment,
      createdAt: new Date().toISOString(),
      approved: false // All comments require moderation
    };
    
    // Store comment
    if (!commentsStore.has(slug)) {
      commentsStore.set(slug, []);
    }
    commentsStore.get(slug)?.push(newComment);
    
    // Log for moderation notification (in production, send email)
    console.log('New comment submitted for moderation:', newComment);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Comment submitted for moderation.',
      commentId: newComment.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Error submitting comment:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to submit comment. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  const adminKey = url.searchParams.get('admin');
  
  if (!slug) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Post slug required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const postComments = commentsStore.get(slug) || [];
  
  // If admin key provided, return all comments including pending
  // Otherwise only return approved comments
  const isAdmin = adminKey === 'cc3po-admin-2026'; // Simple check, replace with proper auth
  
  const visibleComments = isAdmin 
    ? postComments 
    : postComments.filter(c => c.approved);
  
  return new Response(JSON.stringify({ 
    success: true, 
    comments: visibleComments,
    total: visibleComments.length,
    pending: isAdmin ? postComments.filter(c => !c.approved).length : 0
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};