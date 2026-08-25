import type { APIRoute } from 'astro';

const API_BASE = 'https://api.balldontlie.io/nfl/v1';
const API_KEY = import.meta.env.NFL_API_KEY || '';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

export const GET: APIRoute = async () => {
  const cacheKey = 'standings';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const season = new Date().getFullYear();
    const response = await fetch(`${API_BASE}/standings?season=${season}`, {
      headers: { 'Authorization': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    let standings = result.data || [];

    // Format and add conference info
    const formattedStandings = standings.map((s: any) => {
      const team = s.team || {};
      const conference = team.conference || 'Unknown';
      
      return {
        id: s.id,
        team: {
          id: team.id,
          name: team.full_name || team.abbreviation || 'Unknown',
          abbreviation: team.abbreviation,
          city: team.city,
          logo: team.logo_url
        },
        conference: conference,
        division: s.division?.name || 'Unknown',
        wins: s.wins || 0,
        losses: s.losses || 0,
        ties: s.ties || 0,
        win_percentage: s.win_percentage || 0,
        points_for: s.points_for || 0,
        points_against: s.points_against || 0,
        point_differential: (s.points_for || 0) - (s.points_against || 0),
        conference_rank: s.conference_rank,
        division_rank: s.division_rank
      };
    });

    cache.set(cacheKey, {
      data: formattedStandings,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify(formattedStandings), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Error fetching NFL standings:', error);
    
    // Mock data fallback
    const mockStandings = [
      {
        team: { name: 'Buffalo Bills', abbreviation: 'BUF', city: 'Buffalo' },
        conference: 'AFC',
        division: 'East',
        wins: 11, losses: 3, ties: 0,
        win_percentage: 0.786,
        points_for: 412, points_against: 298,
        point_differential: 114,
        conference_rank: 2, division_rank: 1
      },
      {
        team: { name: 'Kansas City Chiefs', abbreviation: 'KC', city: 'Kansas City' },
        conference: 'AFC',
        division: 'West',
        wins: 12, losses: 2, ties: 0,
        win_percentage: 0.857,
        points_for: 389, points_against: 276,
        point_differential: 113,
        conference_rank: 1, division_rank: 1
      },
      {
        team: { name: 'Philadelphia Eagles', abbreviation: 'PHI', city: 'Philadelphia' },
        conference: 'NFC',
        division: 'East',
        wins: 11, losses: 3, ties: 0,
        win_percentage: 0.786,
        points_for: 398, points_against: 289,
        point_differential: 109,
        conference_rank: 2, division_rank: 1
      },
      {
        team: { name: 'San Francisco 49ers', abbreviation: 'SF', city: 'San Francisco' },
        conference: 'NFC',
        division: 'West',
        wins: 10, losses: 4, ties: 0,
        win_percentage: 0.714,
        points_for: 376, points_against: 267,
        point_differential: 109,
        conference_rank: 3, division_rank: 1
      }
    ];

    return new Response(JSON.stringify(mockStandings), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
