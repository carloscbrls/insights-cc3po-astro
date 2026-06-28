/**
 * free-gate.js — CC3PO Shelf Shared Library
 * 
 * Email-gated free tier access for shelf contract products.
 * Allows users to try the product before subscribing.
 * Manages free tier state, rate limits, and upgrade prompts.
 * 
 * Usage:
 *   import { grantFreeAccess, checkFreeAccess, upgradeFromFree } from './lib/free-gate.js';
 */

const FREE_TIER_CONFIG = {
  'local': {
    maxDays: 7,
    maxAlerts: 5,
    maxPdfs: 1,
    features: ['daily_telegram', 'monthly_pdf_preview'],
  },
  'it-owner': {
    maxDays: 7,
    maxAlerts: 5,
    maxPdfs: 1,
    features: ['daily_telegram', 'monthly_pdf_preview', 'compliance_matrix_preview'],
  },
  'digital-growth': {
    maxDays: 7,
    maxAlerts: 5,
    maxPdfs: 1,
    features: ['daily_telegram', 'monthly_pdf_preview', 'seo_metrics_preview'],
  },
};

/**
 * Grant free tier access to a user.
 * Creates a free access record with TTL.
 * 
 * @param {Object} opts
 * @param {string} opts.email - User email
 * @param {string} opts.tier - Product tier to try
 * @param {string} [opts.userId] - Optional user ID (creates if not provided)
 * @param {Object} opts.supabase - Supabase client
 * @returns {Promise<{ success: boolean, accessId: string, expiresAt: string, upgradeUrl: string }>}
 */
export async function grantFreeAccess({ email, tier, userId, supabase }) {
  const config = FREE_TIER_CONFIG[tier] || FREE_TIER_CONFIG['local'];
  const expiresAt = new Date(Date.now() + config.maxDays * 86400000).toISOString();

  // Check if email already has free access (prevent abuse)
  const { data: existing } = await supabase
    .from('free_access')
    .select('id, expires_at, tier')
    .eq('email', email)
    .eq('tier', tier)
    .single();

  if (existing) {
    const isExpired = new Date(existing.expires_at) < new Date();
    if (!isExpired) {
      // Still active — return existing
      return {
        success: true,
        accessId: existing.id,
        expiresAt: existing.expires_at,
        upgradeUrl: `/pricing?tier=${tier}&email=${encodeURIComponent(email)}`,
        message: 'Free access already active',
      };
    }
    // Expired — delete old record
    await supabase.from('free_access').delete().eq('id', existing.id);
  }

  // Create new free access record
  const { data, error } = await supabase
    .from('free_access')
    .insert({
      email,
      tier,
      user_id: userId || null,
      expires_at: expiresAt,
      alerts_sent: 0,
      pdfs_downloaded: 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Free access creation failed: ${error.message}`);

  // Send welcome email (fire and forget)
  await sendFreeWelcomeEmail({ email, tier, expiresAt });

  return {
    success: true,
    accessId: data.id,
    expiresAt,
    upgradeUrl: `/pricing?tier=${tier}&email=${encodeURIComponent(email)}`,
  };
}

/**
 * Check if a user has free tier access.
 * 
 * @param {Object} opts
 * @param {string} opts.email - User email
 * @param {string} opts.tier - Product tier
 * @param {Object} opts.supabase - Supabase client
 * @returns {Promise<{ hasAccess: boolean, expired: boolean, daysLeft: number, upgradeUrl: string }>}
 */
export async function checkFreeAccess({ email, tier, supabase }) {
  const { data } = await supabase
    .from('free_access')
    .select('id, expires_at, alerts_sent, pdfs_downloaded')
    .eq('email', email)
    .eq('tier', tier)
    .single();

  if (!data) {
    return { hasAccess: false, expired: false, daysLeft: 0, upgradeUrl: `/pricing?tier=${tier}` };
  }

  const expiresAt = new Date(data.expires_at);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((expiresAt - now) / 86400000));
  const expired = now >= expiresAt;

  return {
    hasAccess: !expired,
    expired,
    daysLeft,
    upgradeUrl: `/pricing?tier=${tier}&email=${encodeURIComponent(email)}`,
    alertsSent: data.alerts_sent,
    pdfsDownloaded: data.pdfs_downloaded,
  };
}

/**
 * Track usage of a free tier feature.
 * Increments counters and checks limits.
 * 
 * @param {Object} opts
 * @param {string} opts.email - User email
 * @param {string} opts.tier - Product tier
 * @param {'alert'|'pdf'} opts.featureType - Feature type
 * @param {Object} opts.supabase - Supabase client
 * @returns {Promise<{ allowed: boolean, remaining: number, upgradeUrl: string }>}
 */
export async function trackFreeUsage({ email, tier, featureType, supabase }) {
  const config = FREE_TIER_CONFIG[tier] || FREE_TIER_CONFIG['local'];
  const { data } = await supabase
    .from('free_access')
    .select('id, alerts_sent, pdfs_downloaded')
    .eq('email', email)
    .eq('tier', tier)
    .single();

  if (!data) {
    return { allowed: false, remaining: 0, upgradeUrl: `/pricing?tier=${tier}` };
  }

  const field = featureType === 'alert' ? 'alerts_sent' : 'pdfs_downloaded';
  const maxField = featureType === 'alert' ? 'maxAlerts' : 'maxPdfs';
  const current = data[field];
  const max = config[maxField];

  if (current >= max) {
    return {
      allowed: false,
      remaining: 0,
      upgradeUrl: `/pricing?tier=${tier}&email=${encodeURIComponent(email)}`,
    };
  }

  // Increment
  await supabase
    .from('free_access')
    .update({ [field]: current + 1 })
    .eq('id', data.id);

  return {
    allowed: true,
    remaining: max - current - 1,
    upgradeUrl: `/pricing?tier=${tier}&email=${encodeURIComponent(email)}`,
  };
}

/**
 * Upgrade from free tier to paid subscription.
 * Creates a Stripe Checkout Session for the given tier.
 * 
 * @param {Object} opts
 * @param {string} opts.email - User email
 * @param {string} opts.tier - Product tier
 * @param {Object} opts.supabase - Supabase client
 * @param {Object} opts.stripe - Stripe client
 * @returns {Promise<{ checkoutUrl: string }>}
 */
export async function upgradeFromFree({ email, tier, supabase, stripe }) {
  const PRICE_MAP = {
    'local': process.env.STRIPE_PRICE_LOCAL,
    'it-owner': process.env.STRIPE_PRICE_IT_OWNER,
    'digital-growth': process.env.STRIPE_PRICE_DIGITAL_GROWTH,
  };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_MAP[tier], quantity: 1 }],
    customer_email: email,
    success_url: `${process.env.SITE_URL}/success?upgraded=true`,
    cancel_url: `${process.env.SITE_URL}/pricing`,
    subscription_data: {
      metadata: { tier, upgraded_from_free: 'true' },
    },
  });

  // Mark free access as upgraded
  await supabase
    .from('free_access')
    .update({ upgraded_at: new Date().toISOString() })
    .eq('email', email)
    .eq('tier', tier);

  return { checkoutUrl: session.url };
}

/**
 * Send free tier welcome email.
 * @private
 */
async function sendFreeWelcomeEmail({ email, tier, expiresAt }) {
  // In production: send via SendGrid, Resend, or similar
  console.log(`[free-gate] Welcome email sent to ${email} for ${tier} tier, expires ${expiresAt}`);
  return true;
}

/**
 * Clean up expired free access records.
 * Should be called by a cron job.
 * 
 * @param {Object} opts
 * @param {Object} opts.supabase - Supabase client
 * @returns {Promise<{ deleted: number }>}
 */
export async function cleanupExpiredFreeAccess({ supabase }) {
  const { data, error } = await supabase
    .from('free_access')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .is('upgraded_at', null)
    .select('id');

  return { deleted: data?.length || 0 };
}

export { FREE_TIER_CONFIG };