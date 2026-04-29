import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export interface DashboardStats {
  leads_analyzed: number;
  agent_uptime: number;
  projected_arr: number;
  task_completion_rate: number;
}

export const DEFAULT_STATS: DashboardStats = {
  leads_analyzed: 60,
  agent_uptime: 99.9,
  projected_arr: 87,
  task_completion_rate: 76,
};
