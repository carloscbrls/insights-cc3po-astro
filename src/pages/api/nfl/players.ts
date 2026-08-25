import type { APIRoute } from 'astro';

// BALLDONTLIE API configuration
const API_BASE = 'https://api.balldontlie.io/nfl/v1';
const API_KEY = import.meta.env.NFL_API_KEY || '';

// Cache for 6 hours (in milliseconds)
const CACHE_TTL = 6 * 60 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const position = url.searchParams.get('position') || 'all';
  const category = url.searchParams.get('category') || 'fantasy';
  
  const cacheKey = `players-${position}-${category}`;
  const cached = cache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Fetch player stats from BALLDONTLIE
    const season = new Date().getFullYear();
    const statsUrl = `${API_BASE}/season_stats?season=${season}&per_page=100`;
    
    const headers: HeadersInit = {
      'Authorization': API_KEY,
      'Content-Type': 'application/json'
    };

    const response = await fetch(statsUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    let players = result.data || [];

    // Filter by position if specified
    if (position !== 'all') {
      players = players.filter((p: any) => p.position === position);
    }

    // Sort by selected category
    players.sort((a: any, b: any) => {
      const statsA = a.stats?.[0] || {};
      const statsB = b.stats?.[0] || {};
      
      switch(category) {
        case 'passing':
          return (statsB.passing_yards || 0) - (statsA.passing_yards || 0);
        case 'rushing':
          return (statsB.rushing_yards || 0) - (statsA.rushing_yards || 0);
        case 'receiving':
          return (statsB.receiving_yards || 0) - (statsA.receiving_yards || 0);
        case 'fantasy':
        default:
          return (statsB.fantasy_points || 0) - (statsA.fantasy_points || 0);
      }
    });

    // Format for frontend
    const formattedPlayers = players.map((player: any) => ({
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      position: player.position,
      team: player.team,
      games_played: player.games_played,
      stats: player.stats
    }));

    // Cache the result
    cache.set(cacheKey, {
      data: formattedPlayers,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify(formattedPlayers), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Cache': cached ? 'HIT' : 'MISS',
        'X-Cache-TTL': CACHE_TTL.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching NFL players:', error);
    
    // Return mock data if API fails
    const mockPlayers = [
      {
        id: 1,
        first_name: 'Patrick',
        last_name: 'Mahomes',
        position: 'QB',
        team: { abbreviation: 'KC', full_name: 'Kansas City Chiefs' },
        games_played: 14,
        stats: [{ passing_yards: 3928, passing_tds: 28, fantasy_points: 312 }]
      },
      {
        id: 2,
        first_name: 'Josh',
        last_name: 'Allen',
        position: 'QB',
        team: { abbreviation: 'BUF', full_name: 'Buffalo Bills' },
        games_played: 14,
        stats: [{ passing_yards: 3542, passing_tds: 26, fantasy_points: 298 }]
      },
      {
        id: 3,
        first_name: 'Christian',
        last_name: 'McCaffrey',
        position: 'RB',
        team: { abbreviation: 'SF', full_name: 'San Francisco 49ers' },
        games_played: 12,
        stats: [{ rushing_yards: 1245, rushing_tds: 14, receptions: 68, fantasy_points: 285 }]
      }
    ];

    return new Response(JSON.stringify(mockPlayers), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
