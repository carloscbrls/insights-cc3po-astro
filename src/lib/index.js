/**
 * CC3PO Shelf Shared Library
 * 
 * Reusable modules for shelf contract products.
 */

export { generateDailyTelegram, generateDailyTelegramBatch, formatTelegramPayload } from './daily-telegram.js';
export { generateMonthlyPDF, generateReportHTML } from './monthly-pdf.js';
export { toggleLanguage, getLocalizedContent, t, getToggleProps, detectLocale } from './spanish-toggle.js';
export { grantFreeAccess, checkFreeAccess, trackFreeUsage, upgradeFromFree, cleanupExpiredFreeAccess } from './free-gate.js';
export { runTTLCancel, checkSubscriptionTTL, checkEngagement, getTTLStatus } from './ttl-cancel.js';
export { isDuplicateEvent, createIdempotencyKey, checkActiveSubscription, dedupCheckout, upsertSubscription } from './dedup.js';