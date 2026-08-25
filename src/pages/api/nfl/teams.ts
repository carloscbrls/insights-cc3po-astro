import type { APIRoute } from 'astro';

const API_BASE = 'https://api.balldontlie.io/nfl/v1';
const API_KEY = import.meta.env.NFL_API_KEY || '';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

export const GET: APIRoute = async () => {
  const cacheKey = 'teams';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const season = new Date().getFullYear();
    
    // Fetch team stats
    const [teamsResponse, standingsResponse] = await Promise.all([
      fetch(`${API_BASE}/teams`, {
        headers: { 'Authorization': API_KEY }
      }),
      fetch(`${API_BASE}/standings?season=${season}`, {
        headers: { 'Authorization': API_KEY }
      })
    ]);

    if (!teamsResponse.ok || !standingsResponse.ok) {
      throw new Error('API error');
    }

    const [teamsResult, standingsResult] = await Promise.all([
      teamsResponse.json(),
      standingsResponse.json()
    ]);

    const teams = teamsResult.data || [];
    const standings = standingsResult.data || [];

    // Calculate top offense (points per game)
    const topOffense = [...teams].sort((a, b) => 
      (b.points_per_game || 0) - (a.points_per_game || 0)
    ).slice(0, 5);

    // Calculate top defense (fewest points allowed)
    const topDefense = [...teams].sort((a, b) => 
      (a.points_against_per_game || 999) - (b.points_against_per_game || 999)
    ).slice(0, 5);

    // Top scoring teams
    const topScoring = [...standings].sort((a, b) => 
      (b.points_for || 0) - (a.points_for || 0)
    ).slice(0, 5);

    // Best records
    const bestRecord = [...standings].sort((a, b) => {
      const winPctA = a.wins / (a.wins + a.losses + a.ties) || 0;
      const winPctB = b.wins / (b.wins + b.losses + b.ties) || 0;
      return winPctB - winPctA;
    }).slice(0, 5);

    const formattedData = {
      offense: topOffense.map(t => ({
        name: t.full_name,
        abbreviation: t.abbreviation,
        points_per_game: t.points_per_game
      })),
      defense: topDefense.map(t => ({
        name: t.full_name,
        abbreviation: t.abbreviation,
        points_against_per_game: t.points_against_per_game
      })),
      scoring: topScoring.map(s => ({
        name: s.team.full_name,
        points_for: s.points_for
      })),
      record: bestRecord.map(s => ({
        name: s.team.full_name,
        wins: s.wins,
        losses: s.losses,
        win_percentage: s.win_percentage
      }))
    };

    cache.set(cacheKey, {
      data: formattedData,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify(formattedData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    
    // Mock data fallback
    const mockData = {
      offense: [{ name: 'Kansas City Chiefs', abbreviation: 'KC', points_per_game: 28.5 }],
      defense: [{ name: 'San Francisco 49ers', abbreviation: 'SF', points_against_per_game: 17.2 }],
      scoring: [{ name: 'Buffalo Bills', points_for: 412 }],
      record: [{ name: 'Philadelphia Eagles', wins: 11, losses: 3, win_percentage: 0.786 }]
    };

    return new Response(JSON.stringify(mockData), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
