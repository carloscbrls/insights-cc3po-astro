/**
 * daily-telegram.js — CC3PO Shelf Shared Library
 * 
 * Generates daily one-liner alerts for Telegram delivery.
 * Pulls compliance reminders, deadlines, and regulatory updates
 * formatted as punchy Telegram messages.
 * 
 * Usage:
 *   import { generateDailyTelegram } from './lib/daily-telegram.js';
 *   const message = await generateDailyTelegram({ tier: 'local', userId: 'usr_123' });
 */

const COMPLIANCE_TOPICS = {
  'local': [
    'ADA website accessibility audit deadline approaching',
    'CalOSHA poster update required by end of month',
    'Local business license renewal window opens next week',
    'Fire inspection scheduling reminder',
    'Sales tax quarterly filing due in 14 days',
    'Employee handbook annual review required',
    'Privacy policy update needed for 2025',
    'Workers comp insurance renewal in 30 days',
    'Signage compliance check — ADA requirements',
    'Food safety certification expires soon',
  ],
  'it-owner': [
    'SOC 2 Type II audit preparation checklist',
    'GDPR data processing agreement updates',
    'Patch management SLA compliance review',
    'Penetration testing quarterly schedule',
    'Cloud security posture assessment due',
    'Vendor risk assessment — annual review',
    'Incident response plan tabletop exercise',
    'Backup verification — monthly drill',
    'Compliance training — employee certification',
    'Breach notification procedure update',
  ],
  'digital-growth': [
    'Google Business Profile optimization tips',
    'SEO content calendar — weekly alignment',
    'Social media advertising disclosure compliance',
    'Email marketing CAN-SPAM compliance check',
    'Review response template — negative feedback',
    'Local citation audit — NAP consistency',
    'Content repurposing — blog to social pipeline',
    'Customer testimonial release form reminder',
    'Analytics reporting — monthly KPI review',
    'A/B testing — landing page compliance',
  ],
};

const TEMPLATES = [
  '⚡ {topic}',
  '📋 {topic}',
  '🚨 {topic}',
  '✅ {topic}',
  '💡 {topic}',
  '📅 {topic}',
  '🔒 {topic}',
  '📊 {topic}',
];

/**
 * Generate a daily one-liner for Telegram delivery.
 * 
 * @param {Object} opts
 * @param {string} opts.tier - Subscription tier (local, it-owner, digital-growth)
 * @param {string} opts.userId - User identifier for personalization
 * @param {Date}   [opts.date] - Date override for deterministic output (testing)
 * @param {Object} [opts.topics] - Override topics map
 * @returns {Promise<{ text: string, topic: string, tier: string, date: string }>}
 */
export async function generateDailyTelegram({ tier, userId, date, topics } = {}) {
  const targetDate = date || new Date();
  const topicsMap = topics || COMPLIANCE_TOPICS;
  const tierTopics = topicsMap[tier] || topicsMap['local'];

  // Deterministic selection based on date — same day = same topic
  const dayOfYear = Math.floor(
    (targetDate - new Date(targetDate.getFullYear(), 0, 0)) / 86400000
  );
  const topicIndex = dayOfYear % tierTopics.length;
  const topic = tierTopics[topicIndex];

  // Select template — rotate based on day
  const templateIndex = dayOfYear % TEMPLATES.length;
  const template = TEMPLATES[templateIndex];

  const text = template.replace('{topic}', topic);

  return {
    text,
    topic,
    tier,
    date: targetDate.toISOString().split('T')[0],
  };
}

/**
 * Generate a batch of daily telegrams for all subscribers of a tier.
 * Useful for cron-triggered mass delivery.
 * 
 * @param {Object} opts
 * @param {string} opts.tier - Subscription tier
 * @param {string[]} opts.userIds - Array of user IDs
 * @param {Object} [opts.supabase] - Supabase client for personalization
 * @returns {Promise<Array<{ userId: string, text: string }>>}
 */
export async function generateDailyTelegramBatch({ tier, userIds, supabase }) {
  const result = await generateDailyTelegram({ tier });
  
  return userIds.map(userId => ({
    userId,
    text: result.text,
    tier: result.tier,
    date: result.date,
  }));
}

/**
 * Format a Telegram message with inline keyboard for engagement tracking.
 * 
 * @param {string} text - The one-liner text
 * @param {string} tier - Subscription tier
 * @returns {Object} Telegram Bot API message payload
 */
export function formatTelegramPayload(text, tier) {
  return {
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Got it', callback_data: `ack:${tier}` },
        { text: '📖 Details', callback_data: `details:${tier}` },
      ]],
    },
  };
}

export { COMPLIANCE_TOPICS, TEMPLATES };