import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, DEFAULT_STATS, type DashboardStats } from '../lib/supabase';

function useAnimatedCounter(target: number, duration = 2000, decimals = 0): number {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(parseFloat((eased * target).toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return value;
}

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

function StatCard({ label, value, prefix = '', suffix = '', decimals = 0 }: StatCardProps) {
  const animatedValue = useAnimatedCounter(value, 2000, decimals);

  return (
    <div style={styles.card} role="status" aria-label={`${label}: ${prefix}${value}${suffix}`}>
      <span style={styles.value}>
        {prefix}{animatedValue}{suffix}
      </span>
      <span style={styles.label}>{label}</span>
      <div style={styles.glow} aria-hidden="true" />
    </div>
  );
}

export default function LiveDashboard() {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setStats({
          leads_analyzed: data.leads_analyzed ?? DEFAULT_STATS.leads_analyzed,
          agent_uptime: data.agent_uptime ?? DEFAULT_STATS.agent_uptime,
          projected_arr: data.projected_arr ?? DEFAULT_STATS.projected_arr,
          task_completion_rate: data.task_completion_rate ?? DEFAULT_STATS.task_completion_rate,
        });
      }
    } catch {
      // Fallback to defaults silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('dashboard_stats_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dashboard_stats' },
        () => { fetchStats(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  if (isLoading) {
    return (
      <section style={styles.container} aria-label="Live Dashboard" aria-busy="true">
        <h2 style={styles.heading}>Live Dashboard</h2>
        <div style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ ...styles.card, ...styles.skeleton }} role="presentation" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section style={styles.container} aria-label="Live Dashboard">
      <h2 style={styles.heading}>Live Dashboard</h2>
      <p style={styles.subheading}>Real-time performance metrics</p>
      <div style={styles.grid}>
        <StatCard label="Leads Analyzed" value={stats.leads_analyzed} suffix="+" />
        <StatCard label="Agent Uptime" value={stats.agent_uptime} suffix="%" decimals={1} />
        <StatCard label="Projected ARR" value={stats.projected_arr} prefix="$" suffix="K" />
        <StatCard label="Task Completion" value={stats.task_completion_rate} suffix="%" />
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '48px 24px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 800,
    textAlign: 'center' as const,
    background: 'linear-gradient(135deg, #6b35ff, #00d2ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subheading: {
    textAlign: 'center' as const,
    color: '#71717a',
    fontSize: '14px',
    marginBottom: '32px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  card: {
    position: 'relative' as const,
    overflow: 'hidden',
    background: '#141418',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '32px 24px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  value: {
    fontSize: '36px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #6b35ff, #00d2ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1.2,
  },
  label: {
    fontSize: '14px',
    color: '#a1a1aa',
    fontWeight: 500,
  },
  glow: {
    position: 'absolute' as const,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #6b35ff, #00d2ff, transparent)',
    opacity: 0.5,
  },
  skeleton: {
    minHeight: '120px',
    background: 'linear-gradient(90deg, #141418 25%, #1a1a20 50%, #141418 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
};
