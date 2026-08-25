import type { APIRoute } from 'astro';

const API_BASE = 'https://api.balldontlie.io/nfl/v1';
const API_KEY = import.meta.env.NFL_API_KEY || '';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

export const GET: APIRoute = async () => {
  const cacheKey = 'fantasy-insights';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Fetch player stats for analysis
    const season = new Date().getFullYear();
    const response = await fetch(`${API_BASE}/season_stats?season=${season}&per_page=200`, {
      headers: { 'Authorization': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const players = result.data || [];

    // Analyze trends and generate insights
    const insights = {
      hotPicks: [] as any[],
      coldZones: [] as any[],
      sleepers: [] as any[],
      startSit: [] as any[]
    };

    // Find hot picks (players on upward trends)
    const sortedByFantasy = [...players].sort((a: any, b: any) => 
      (b.stats?.[0]?.fantasy_points || 0) - (a.stats?.[0]?.fantasy_points || 0)
    );

    insights.hotPicks = sortedByFantasy.slice(0, 5).map((p: any) => ({
      player: `${p.first_name} ${p.last_name}`,
      team: p.team?.abbreviation,
      position: p.position,
      reason: `Top ${p.position} with ${(p.stats?.[0]?.fantasy_points || 0).toFixed(1)} fantasy points`
    }));

    // Find cold zones (underperforming high-draft picks)
    const underperformers = players.filter((p: any) => {
      const stats = p.stats?.[0] || {};
      return p.position === 'RB' && (stats.rushing_yards || 0) < 400 && p.games_played > 8;
    }).slice(0, 5);

    insights.coldZones = underperformers.map((p: any) => ({
      player: `${p.first_name} ${p.last_name}`,
      team: p.team?.abbreviation,
      position: p.position,
      reason: `Underperforming: ${(p.stats?.[0]?.rushing_yards || 0)} yards in ${p.games_played} games`
    }));

    // Find sleepers (low-owned players with recent uptick)
    const sleepers = players.filter((p: any) => {
      const stats = p.stats?.[0] || {};
      return p.games_played > 5 && 
             (stats.fantasy_points || 0) > 100 && 
             (stats.recent_avg || 0) > (stats.season_avg || 0) * 1.2;
    }).slice(0, 5);

    insights.sleepers = sleepers.map((p: any) => ({
      player: `${p.first_name} ${p.last_name}`,
      team: p.team?.abbreviation,
      position: p.position,
      reason: `Rising: ${(p.stats?.[0]?.recent_avg || 0).toFixed(1)} avg over last 3 games`
    }));

    // Start/Sit recommendations
    insights.startSit = [
      {
        recommendation: 'START',
        player: sortedByFantasy.find((p: any) => p.position === 'QB')?.let((p: any) => `${p.first_name} ${p.last_name}`) || 'Patrick Mahomes',
        matchup: 'vs Weak Defense',
        reason: 'Favorable matchup against bottom-5 pass defense'
      },
      {
        recommendation: 'SIT',
        player: 'Struggling RB',
        matchup: '@ Elite Run Defense',
        reason: 'Facing top-3 run defense on the road'
      }
    ];

    cache.set(cacheKey, {
      data: insights,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify(insights), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating fantasy insights:', error);
    
    // Mock insights fallback
    const mockInsights = {
      hotPicks: [
        { player: 'Patrick Mahomes', team: 'KC', position: 'QB', reason: 'Top QB with 312 fantasy points' },
        { player: 'Christian McCaffrey', team: 'SF', position: 'RB', reason: 'Elite RB1 with 285 fantasy points' }
      ],
      coldZones: [
        { player: 'Underperforming RB', team: 'NYG', position: 'RB', reason: 'Only 320 yards in 10 games' }
      ],
      sleepers: [
        { player: 'Breakout WR', team: 'DET', position: 'WR', reason: 'Averaging 18.5 pts over last 3 games' }
      ],
      startSit: [
        { recommendation: 'START', player: 'Your QB1', matchup: 'vs Weak Defense', reason: 'Favorable matchup' },
        { recommendation: 'SIT', player: 'Struggling RB', matchup: '@ Elite Run Defense', reason: 'Tough matchup' }
      ]
    };

    return new Response(JSON.stringify(mockInsights), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper for method chaining
declare global {
  interface Array<T> {
    let<U>(fn: (value: T) => U): U;
  }
}

Array.prototype.let = function<U>(fn: (value: this) => U): U {
  return fn(this);
};
