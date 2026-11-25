/**
 * The Village spine (cc3po-ops Supabase) — native form endpoints for
 * insights.cc3po.com (Insights Shift Change, 2026-11-25).
 *
 * Same pattern as music.cc3po.com's spine.ts (Carlos's forms ruling,
 * 2026-11-24: CC3PO's own sites use native forms on the Supabase spine).
 * Anon INSERT only, RLS on, no anon reads. The anon key is public by
 * design (it already ships in cc3po.com's page source); the tables'
 * policies do the protecting:
 *   - insights_subscribers (consent must be true, email validated,
 *     synced hourly to the MailerLite "Insights Readers" group by
 *     custom.mailerlite/bin/sync_blog_subscribers.py)
 *   - insights_responses   (reader replies; message 1..4000 chars;
 *     read by the Village on the service role — Vuelta's queue)
 */
const SPINE_URL = 'https://cdrcgmdvepxwsbqaifxv.supabase.co';
const SPINE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcmNnbWR2ZXB4d3NicWFpZnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDY4MDksImV4cCI6MjA4OTA4MjgwOX0.pKWLWvsSimTOMkpaXKKrLJESrQEMUayUU1c9ANzr1Dc';

async function insert(table: string, row: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${SPINE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SPINE_ANON_KEY,
        Authorization: `Bearer ${SPINE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function postBlogSubscriber(input: {
  email: string;
  firstName?: string;
  source: string;
}): Promise<boolean> {
  return insert('insights_subscribers', {
    email: input.email.trim().toLowerCase(),
    first_name: input.firstName?.trim() || null,
    source: input.source,
    consent: true,
  });
}

export function postBlogResponse(input: {
  name?: string;
  email: string;
  message: string;
  postSlug?: string;
}): Promise<boolean> {
  return insert('insights_responses', {
    name: input.name?.trim() || null,
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
    post_slug: input.postSlug || null,
  });
}
