import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const email = data.email;
  
  if (!email) {
    return new Response(JSON.stringify({ success: false, error: 'Email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Call the existing PHP API on the production server
  try {
    const res = await fetch('https://insights.cc3po.com/api/subscribe.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to connect to subscription service' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};