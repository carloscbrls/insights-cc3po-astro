/**
 * ttl-cancel.js — CC3PO Shelf Shared Library
 * 
 * 30-day TTL auto-cancel logic for shelf contract subscriptions.
 * Monitors subscriber engagement and auto-cancels dormant subscriptions.
 * 
 * Usage:
 *   import { runTTLCancel, checkSubscriptionTTL } from './lib/ttl-cancel.js';
 *   await runTTLCancel({ stripe, supabase });
 */

const TTL_DAYS = 30;
const ENGAGEMENT_WINDOW_DAYS = 14;
const WARNING_DAYS_BEFORE_CANCEL = 3;

/**
 * Run the TTL cancel check across all active subscriptions.
 * Should be called by a cron job (daily recommended).
 * 
 * @param {Object} opts
 * @param {Object} opts.stripe - Stripe client instance
 * @param {Object} opts.supabase - Supabase client instance
 * @param {number} [opts.ttlDays=30] - Days before auto-cancel
 * @param {number} [opts.engagementWindowDays=14] - Days of engagement lookback
 * @returns {Promise<{ checked: number, cancelled: number, warned: number, kept: number, errors: string[] }>}
 */
export async function runTTLCancel({ stripe, supabase, ttlDays = TTL_DAYS, engagementWindowDays = ENGAGEMENT_WINDOW_DAYS }) {
  const results = {
    checked: 0,
    cancelled: 0,
    warned: 0,
    kept: 0,
    errors: [],
  };

  let hasMore = true;
  let startingAfter;

  while (hasMore) {
    const listParams = {
      status: 'active',
      limit: 100,
    };
    if (startingAfter) listParams.starting_after = startingAfter;

    let subscriptions;
    try {
      subscriptions = await stripe.subscriptions.list(listParams);
    } catch (err) {
      results.errors.push(`Stripe list error: ${err.message}`);
      break;
    }

    for (const sub of subscriptions.data) {
      results.checked++;
      try {
        const action = await checkSubscriptionTTL({
          subscription: sub,
          stripe,
          supabase,
          ttlDays,
          engagementWindowDays,
        });

        if (action === 'cancelled') results.cancelled++;
        else if (action === 'warned') results.warned++;
        else if (action === 'kept') results.kept++;
      } catch (err) {
        results.errors.push(`Sub ${sub.id}: ${err.message}`);
      }
    }

    hasMore = subscriptions.has_more;
    if (subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    }
  }

  return results;
}

/**
 * Check a single subscription's TTL and decide action.
 * 
 * @param {Object} opts
 * @param {Object} opts.subscription - Stripe subscription object
 * @param {Object} opts.stripe - Stripe client
 * @param {Object} opts.supabase - Supabase client
 * @param {number} opts.ttlDays - Days before auto-cancel
 * @param {number} opts.engagementWindowDays - Days for engagement lookback
 * @returns {Promise<'cancelled'|'warned'|'kept'|'skip'>}
 */
export async function checkSubscriptionTTL({
  subscription,
  stripe,
  supabase,
  ttlDays = TTL_DAYS,
  engagementWindowDays = ENGAGEMENT_WINDOW_DAYS,
}) {
  const { id: subId, created, metadata, cancel_at_period_end } = subscription;

  // Skip if already marked for cancellation
  if (cancel_at_period_end) return 'skip';

  // Skip if no TTL metadata (not a shelf contract)
  if (!metadata?.ttl_days && !metadata?.tier) return 'skip';

  const createdAt = new Date(created * 1000);
  const now = new Date();
  const daysSinceCreation = (now - createdAt) / 86400000;

  // Not yet in TTL window
  if (daysSinceCreation < ttlDays - WARNING_DAYS_BEFORE_CANCEL) return 'kept';

  // Check engagement
  const userId = metadata?.userId || metadata?.user_id;
  const hasEngagement = await checkEngagement({ userId, supabase, engagementWindowDays });

  if (hasEngagement) {
    // Active user — keep subscription, log the check
    await logTTLCheck({ subId, userId, action: 'kept', reason: 'active_engagement', supabase });
    return 'kept';
  }

  // No engagement — in danger zone
  if (daysSinceCreation >= ttlDays) {
    // TTL exceeded — auto-cancel
    await stripe.subscriptions.update(subId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: `Auto-cancelled: ${ttlDays}-day TTL with no engagement`,
        feedback: 'other',
      },
    });

    await logTTLCheck({ subId, userId, action: 'cancelled', reason: 'ttl_exceeded_no_engagement', supabase });

    // Notify subscriber
    await sendCancelNotification({ subId, userId, email: subscription.customer_email, tier: metadata?.tier, supabase });

    return 'cancelled';
  }

  // Approaching TTL — send warning
  await sendWarningNotification({ subId, userId, email: subscription.customer_email, tier: metadata?.tier, daysLeft: Math.ceil(ttlDays - daysSinceCreation), supabase });

  await logTTLCheck({ subId, userId, action: 'warned', reason: 'approaching_ttl_no_engagement', supabase });

  return 'warned';
}

/**
 * Check if a user has had any engagement in the lookback window.
 * 
 * @param {Object} opts
 * @param {string} opts.userId - User ID
 * @param {Object} opts.supabase - Supabase client
 * @param {number} opts.engagementWindowDays - Lookback days
 * @returns {Promise<boolean>}
 */
export async function checkEngagement({ userId, supabase, engagementWindowDays }) {
  if (!userId) return false;

  const cutoff = new Date(Date.now() - engagementWindowDays * 86400000).toISOString();

  const { data } = await supabase
    .from('user_activity')
    .select('last_login, last_pdf_download, last_telegram_interaction')
    .eq('user_id', userId)
    .single();

  if (!data) return false;

  return (
    (data.last_login && data.last_login > cutoff) ||
    (data.last_pdf_download && data.last_pdf_download > cutoff) ||
    (data.last_telegram_interaction && data.last_telegram_interaction > cutoff)
  );
}

/**
 * Log a TTL check result to the database.
 * @private
 */
async function logTTLCheck({ subId, userId, action, reason, supabase }) {
  if (!supabase) return;

  await supabase.from('ttl_cancel_log').insert({
    subscription_id: subId,
    user_id: userId,
    action,
    reason,
    checked_at: new Date().toISOString(),
  });
}

/**
 * Send warning notification (email + Telegram).
 * @private
 */
async function sendWarningNotification({ subId, userId, email, tier, daysLeft, supabase }) {
  console.log(`[ttl-cancel] Warning: ${email} (${tier}) has ${daysLeft} days left before auto-cancel`);

  // In production: send via SendGrid/Resend + Telegram Bot API
  if (supabase) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'ttl_warning',
      message: `Your subscription will auto-cancel in ${daysLeft} days due to inactivity. Login or use any feature to keep it active.`,
      subscription_id: subId,
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Send cancellation notification.
 * @private
 */
async function sendCancelNotification({ subId, userId, email, tier, supabase }) {
  console.log(`[ttl-cancel] Cancelled: ${email} (${tier}) — TTL exceeded with no engagement`);

  if (supabase) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'ttl_cancelled',
      message: `Your ${tier} subscription has been auto-cancelled after 30 days of inactivity. You can resubscribe anytime.`,
      subscription_id: subId,
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Get TTL status for a specific subscription.
 * Useful for displaying remaining days in the UI.
 * 
 * @param {Object} opts
 * @param {string} opts.subscriptionId - Stripe subscription ID
 * @param {Object} opts.stripe - Stripe client
 * @param {Object} opts.supabase - Supabase client
 * @returns {Promise<{ daysSinceCreation: number, daysUntilTTL: number, hasEngagement: boolean, status: string }>}
 */
export async function getTTLStatus({ subscriptionId, stripe, supabase }) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const createdAt = new Date(sub.created * 1000);
  const daysSinceCreation = (Date.now() - createdAt) / 86400000;
  const daysUntilTTL = Math.max(0, TTL_DAYS - daysSinceCreation);
  const hasEngagement = await checkEngagement({
    userId: sub.metadata?.userId,
    supabase,
    engagementWindowDays: ENGAGEMENT_WINDOW_DAYS,
  });

  let status = 'active';
  if (sub.cancel_at_period_end) status = 'cancelling';
  else if (daysUntilTTL <= WARNING_DAYS_BEFORE_CANCEL && !hasEngagement) status = 'warning';
  else if (daysUntilTTL <= 0 && !hasEngagement) status = 'pending_cancel';

  return {
    daysSinceCreation: Math.floor(daysSinceCreation),
    daysUntilTTL: Math.ceil(daysUntilTTL),
    hasEngagement,
    status,
  };
}

export { TTL_DAYS, ENGAGEMENT_WINDOW_DAYS, WARNING_DAYS_BEFORE_CANCEL };