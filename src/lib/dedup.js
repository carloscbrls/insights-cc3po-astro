/**
 * dedup.js — CC3PO Shelf Shared Library
 * 
 * Deduplication logic to prevent double-billing and duplicate webhook processing.
 * Uses Stripe idempotency keys, KV store, and database constraints.
 * 
 * Usage:
 *   import { isDuplicateEvent, createIdempotencyKey, checkActiveSubscription, dedupCheckout } from './lib/dedup.js';
 */

/**
 * In-memory event tracking for webhook dedup.
 * In production, use Cloudflare KV, Redis, or Supabase.
 * @private
 */
const processedEvents = new Map();

/**
 * Check if a Stripe webhook event has already been processed.
 * Prevents duplicate fulfillment on webhook retries.
 * 
 * @param {Object} opts
 * @param {string} opts.eventId - Stripe event ID (evt_...)
 * @param {number} [opts.ttlMs=300000] - Time-to-live for dedup record (5 min default)
 * @param {Object} [opts.kv] - External KV store (Cloudflare KV, Redis, etc.)
 * @returns {Promise<boolean>} true if duplicate, false if new
 */
export async function isDuplicateEvent({ eventId, ttlMs = 300000, kv } = {}) {
  // Check external KV first (production)
  if (kv) {
    const existing = await kv.get(`dedup:event:${eventId}`);
    if (existing) return true;
    await kv.put(`dedup:event:${eventId}`, Date.now().toString(), { expirationTtl: Math.ceil(ttlMs / 1000) });
    return false;
  }

  // Fallback to in-memory (development/preview)
  if (processedEvents.has(eventId)) return true;

  processedEvents.set(eventId, Date.now());

  // Cleanup expired entries
  const now = Date.now();
  for (const [id, ts] of processedEvents) {
    if (now - ts > ttlMs) processedEvents.delete(id);
  }

  return false;
}

/**
 * Generate an idempotency key for Stripe operations.
 * Prevents duplicate charges on retries.
 * 
 * @param {Object} opts
 * @param {string} opts.userId - User ID
 * @param {string} opts.tier - Subscription tier
 * @param {string} opts.operation - Operation type (e.g., 'checkout', 'upgrade')
 * @returns {string} Idempotency key
 */
export function createIdempotencyKey({ userId, tier, operation }) {
  // Format: shelf_{operation}_{tier}_{userId}_{date}
  const date = new Date().toISOString().split('T')[0];
  return `shelf_${operation}_${tier}_${userId}_${date}`;
}

/**
 * Check if a user already has an active subscription for a given tier.
 * Prevents duplicate subscriptions.
 * 
 * @param {Object} opts
 * @param {string} opts.email - Customer email
 * @param {string} opts.tier - Subscription tier
 * @param {Object} opts.stripe - Stripe client
 * @returns {Promise<{ hasActive: boolean, subscriptionId: string|null }>}
 */
export async function checkActiveSubscription({ email, tier, stripe }) {
  const PRICE_MAP = {
    'local': process.env.STRIPE_PRICE_LOCAL,
    'it-owner': process.env.STRIPE_PRICE_IT_OWNER,
    'digital-growth': process.env.STRIPE_PRICE_DIGITAL_GROWTH,
  };

  const targetPrice = PRICE_MAP[tier];
  if (!targetPrice) return { hasActive: false, subscriptionId: null };

  // Check by email
  const customers = await stripe.customers.list({ email, limit: 1 });

  if (customers.data.length === 0) return { hasActive: false, subscriptionId: null };

  const customerId = customers.data[0].id;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 100,
  });

  // Check if any active sub matches the tier price
  const existing = subscriptions.data.find(sub =>
    sub.items.data.some(item => item.price.id === targetPrice)
  );

  if (existing) {
    return { hasActive: true, subscriptionId: existing.id };
  }

  return { hasActive: false, subscriptionId: null };
}

/**
 * Dedup-safe checkout session creation.
 * Wraps Stripe Checkout creation with full dedup protection.
 * 
 * @param {Object} opts
 * @param {string} opts.email - Customer email
 * @param {string} opts.tier - Subscription tier
 * @param {string} opts.userId - User ID
 * @param {Object} opts.stripe - Stripe client
 * @param {Object} [opts.kv] - External KV store
 * @returns {Promise<{ url: string, sessionId: string }>}
 * @throws {Error} If active subscription exists
 */
export async function dedupCheckout({ email, tier, userId, stripe, kv }) {
  // 1. Check for existing active subscription
  const { hasActive, subscriptionId } = await checkActiveSubscription({ email, tier, stripe });
  if (hasActive) {
    throw new Error(`ACTIVE_SUBSCRIPTION_EXISTS: ${subscriptionId}`);
  }

  // 2. Check for recent checkout session (prevent rapid re-clicks)
  const checkoutKey = `checkout:${email}:${tier}`;
  if (kv) {
    const recentCheckout = await kv.get(checkoutKey);
    if (recentCheckout) {
      // Return existing session
      try {
        const session = await stripe.checkout.sessions.retrieve(recentCheckout);
        if (session.status === 'open') {
          return { url: session.url, sessionId: session.id };
        }
      } catch {
        // Session expired — proceed with new one
      }
    }
  }

  // 3. Create new checkout with idempotency key
  const idempotencyKey = createIdempotencyKey({ userId, tier, operation: 'checkout' });

  const PRICE_MAP = {
    'local': process.env.STRIPE_PRICE_LOCAL,
    'it-owner': process.env.STRIPE_PRICE_IT_OWNER,
    'digital-growth': process.env.STRIPE_PRICE_DIGITAL_GROWTH,
  };

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_MAP[tier], quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
      subscription_data: {
        metadata: { tier, userId, ttl_days: '30' },
      },
      metadata: { tier, userId },
    },
    { idempotencyKey }
  );

  // 4. Cache the session key (5 min TTL)
  if (kv) {
    await kv.put(checkoutKey, session.id, { expirationTtl: 300 });
  }

  return { url: session.url, sessionId: session.id };
}

/**
 * Database-level dedup constraint.
 * SQL to run during setup:
 * 
 * ```sql
 * CREATE UNIQUE INDEX idx_unique_active_sub
 * ON subscriptions (user_id, tier)
 * WHERE status = 'active';
 * ```
 * 
 * Application-level upsert pattern:
 * 
 * @param {Object} opts
 * @param {string} opts.userId - User ID
 * @param {string} opts.tier - Subscription tier
 * @param {string} opts.stripeSubscriptionId - Stripe subscription ID
 * @param {string} opts.stripeCustomerId - Stripe customer ID
 * @param {Object} opts.supabase - Supabase client
 * @returns {Promise<{ inserted: boolean, subscription: Object }>}
 */
export async function upsertSubscription({ userId, tier, stripeSubscriptionId, stripeCustomerId, supabase }) {
  // First, try to cancel any existing active sub for same user+tier
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('user_id', userId)
    .eq('tier', tier)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    // Already active — this shouldn't happen with proper dedup
    console.warn(`[dedup] Active subscription exists for ${userId}/${tier}: ${existing.id}`);
    return { inserted: false, subscription: existing };
  }

  // Insert new subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation — race condition
    if (error.code === '23505') {
      console.warn(`[dedup] Race condition: duplicate sub for ${userId}/${tier}`);
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select()
        .eq('user_id', userId)
        .eq('tier', tier)
        .eq('status', 'active')
        .single();
      return { inserted: false, subscription: existingSub };
    }
    throw error;
  }

  return { inserted: true, subscription: data };
}

/**
 * Clear all dedup state (for testing).
 * @private
 */
export function _clearDedupState() {
  processedEvents.clear();
}

export { processedEvents };