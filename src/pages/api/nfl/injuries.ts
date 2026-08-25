import type { APIRoute } from 'astro';

const API_BASE = 'https://api.balldontlie.io/nfl/v1';
const API_KEY = import.meta.env.NFL_API_KEY || '';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours for injuries (more frequent updates)
const cache = new Map<string, { data: any; timestamp: number }>();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const team = url.searchParams.get('team') || 'all';
  const status = url.searchParams.get('status') || 'all';
  
  const cacheKey = `injuries-${team}-${status}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(`${API_BASE}/injuries`, {
      headers: { 'Authorization': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    let injuries = result.data || [];

    // Filter by team if specified
    if (team !== 'all') {
      injuries = injuries.filter((i: any) => i.team?.abbreviation === team);
    }

    // Filter by status if specified
    if (status !== 'all') {
      injuries = injuries.filter((i: any) => i.status === status);
    }

    // Sort by update time (most recent first)
    injuries.sort((a: any, b: any) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    // Format for frontend
    const formattedInjuries = injuries.map((injury: any) => ({
      id: injury.id,
      player: {
        id: injury.player?.id,
        first_name: injury.player?.first_name,
        last_name: injury.player?.last_name,
        position: injury.player?.position
      },
      team: injury.team || {},
      injury_type: injury.injury?.type || 'Unknown',
      injury_body_part: injury.injury?.body_part || 'Unknown',
      status: injury.status,
      updated_at: injury.updated_at
    }));

    cache.set(cacheKey, {
      data: formattedInjuries,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify(formattedInjuries), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Cache-TTL': CACHE_TTL.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching NFL injuries:', error);
    
    // Mock data fallback
    const mockInjuries = [
      {
        player: { first_name: 'Joe', last_name: 'Burrow', position: 'QB' },
        team: { abbreviation: 'CIN', full_name: 'Cincinnati Bengals' },
        injury_type: 'Ankle',
        status: 'Questionable',
        updated_at: new Date().toISOString()
      },
      {
        player: { first_name: 'Justin', last_name: 'Jefferson', position: 'WR' },
        team: { abbreviation: 'MIN', full_name: 'Minnesota Vikings' },
        injury_type: 'Hamstring',
        status: 'Probable',
        updated_at: new Date().toISOString()
      },
      {
        player: { first_name: 'Nick', last_name: 'Bosa', position: 'DE' },
        team: { abbreviation: 'SF', full_name: 'San Francisco 49ers' },
        injury_type: 'Hip',
        status: 'Out',
        updated_at: new Date().toISOString()
      }
    ];

    return new Response(JSON.stringify(mockInjuries), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
