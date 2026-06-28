/**
 * spanish-toggle.js — CC3PO Shelf Shared Library
 * 
 * Provides Spanish/English language toggle for all subscriber content.
 * Supports content translation, locale-aware formatting, and persistent preference.
 * 
 * Usage:
 *   import { toggleLanguage, getLocalizedContent } from './lib/spanish-toggle.js';
 *   const es = await toggleLanguage({ userId: 'usr_123', targetLang: 'es' });
 *   const content = getLocalizedContent('local', 'es');
 */

const TRANSLATIONS = {
  'local': {
    'es': {
      title: 'Paquete de Negocio Local',
      subtitle: 'Cumplimiento y conformidad para negocios locales',
      features: [
        'Alertas diarias por Telegram',
        'Informes mensuales en PDF',
        'Soporte en español',
        'Acceso gratuito con email',
        'Cancelación automática si no estás satisfecho',
      ],
      cta: 'Comenzar Ahora',
      price: '$247/mes',
      complianceChecklist: 'Lista de verificación de cumplimiento',
      permitStatus: 'Estado de permisos y licencias',
      upcomingDeadlines: 'Próximos plazos',
      recommendations: 'Recomendaciones',
    },
    'en': {
      title: 'Local Business Bundle',
      subtitle: 'Compliance and conformity for local businesses',
      features: [
        'Daily Telegram alerts',
        'Monthly PDF reports',
        'Spanish language support',
        'Email-gated free tier',
        'Auto-cancel if you\'re not satisfied',
      ],
      cta: 'Get Started',
      price: '$247/mo',
      complianceChecklist: 'Compliance checklist',
      permitStatus: 'Permit & license status',
      upcomingDeadlines: 'Upcoming deadlines',
      recommendations: 'Recommendations',
    },
  },
  'it-owner': {
    'es': {
      title: 'Paquete para Propietarios de TI',
      subtitle: 'Suite completa de cumplimiento y seguridad',
      features: [
        'Alertas diarias por Telegram',
        'Informes mensuales en PDF',
        'Soporte en español',
        'Acceso gratuito con email',
        'Cancelación automática a los 30 días',
        'Soporte prioritario',
      ],
      cta: 'Comenzar Ahora',
      price: '$397/mes',
    },
    'en': {
      title: 'IT Owner Bundle',
      subtitle: 'Full compliance and security suite',
      features: [
        'Daily Telegram alerts',
        'Monthly PDF reports',
        'Spanish language support',
        'Email-gated free tier',
        '30-day auto-cancel',
        'Priority support',
      ],
      cta: 'Get Started',
      price: '$397/mo',
    },
  },
  'digital-growth': {
    'es': {
      title: 'Paquete de Crecimiento Digital',
      subtitle: 'Crecimiento enfocado y cumplimiento para tu negocio',
      features: [
        'Alertas diarias por Telegram',
        'Informes mensuales en PDF',
        'Soporte en español',
        'Acceso gratuito con email',
        'Cancelación automática a los 30 días',
      ],
      cta: 'Comenzar Ahora',
      price: '$297/mes',
    },
    'en': {
      title: 'Digital Growth Bundle',
      subtitle: 'Growth-focused compliance for your business',
      features: [
        'Daily Telegram alerts',
        'Monthly PDF reports',
        'Spanish language support',
        'Email-gated free tier',
        '30-day auto-cancel',
      ],
      cta: 'Get Started',
      price: '$297/mo',
    },
  },
};

const UI_STRINGS = {
  'es': {
    'nav.home': 'Inicio',
    'nav.pricing': 'Precios',
    'nav.account': 'Mi Cuenta',
    'nav.logout': 'Cerrar Sesión',
    'cta.subscribe': 'Suscribirse',
    'cta.login': 'Iniciar Sesión',
    'cta.freeAccess': 'Acceso Gratuito',
    'label.email': 'Correo Electrónico',
    'label.password': 'Contraseña',
    'label.tier': 'Plan',
    'label.status': 'Estado',
    'msg.subscribed': '¡Suscrito con éxito!',
    'msg.cancelled': 'Suscripción cancelada.',
    'msg.freeAccess': 'Se ha enviado un correo de acceso gratuito.',
    'msg.langToggle': 'Cambiar a English',
    'error.auth': 'Error de autenticación.',
    'error.subExists': 'Ya tienes una suscripción activa.',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.confidential': 'Confidencial — Solo para uso de suscriptores',
  },
  'en': {
    'nav.home': 'Home',
    'nav.pricing': 'Pricing',
    'nav.account': 'My Account',
    'nav.logout': 'Log Out',
    'cta.subscribe': 'Subscribe',
    'cta.login': 'Log In',
    'cta.freeAccess': 'Free Access',
    'label.email': 'Email',
    'label.password': 'Password',
    'label.tier': 'Plan',
    'label.status': 'Status',
    'msg.subscribed': 'Successfully subscribed!',
    'msg.cancelled': 'Subscription cancelled.',
    'msg.freeAccess': 'Free access email sent.',
    'msg.langToggle': 'Switch to Spanish',
    'error.auth': 'Authentication error.',
    'error.subExists': 'You already have an active subscription.',
    'footer.rights': 'All rights reserved.',
    'footer.confidential': 'Confidential — For subscriber use only',
  },
};

/**
 * Toggle language preference for a user.
 * Persists to Supabase and returns the new locale.
 * 
 * @param {Object} opts
 * @param {string} opts.userId - User identifier
 * @param {string} [opts.targetLang] - Target language ('es' or 'en'). If omitted, toggles.
 * @param {Object} [opts.supabase] - Supabase client
 * @returns {Promise<{ locale: string, toggled: boolean }>}
 */
export async function toggleLanguage({ userId, targetLang, supabase } = {}) {
  // Get current preference
  let currentLang = 'en';
  
  if (supabase) {
    const { data } = await supabase
      .from('user_preferences')
      .select('locale')
      .eq('user_id', userId)
      .single();
    currentLang = data?.locale || 'en';
  }

  // Toggle or set
  const newLang = targetLang || (currentLang === 'en' ? 'es' : 'en');
  const toggled = newLang !== currentLang;

  // Persist
  if (supabase) {
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        locale: newLang,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }

  return { locale: newLang, toggled };
}

/**
 * Get localized content for a tier and locale.
 * 
 * @param {string} tier - Subscription tier
 * @param {string} locale - Locale ('es' or 'en')
 * @returns {Object} Localized content object
 */
export function getLocalizedContent(tier, locale = 'en') {
  const tierContent = TRANSLATIONS[tier] || TRANSLATIONS['local'];
  return tierContent[locale] || tierContent['en'];
}

/**
 * Get a localized UI string.
 * 
 * @param {string} key - Dot-notation key (e.g., 'cta.subscribe')
 * @param {string} locale - Locale ('es' or 'en')
 * @returns {string} Localized string
 */
export function t(key, locale = 'en') {
  return UI_STRINGS[locale]?.[key] || UI_STRATIONS['en']?.[key] || key;
}

/**
 * Generate a language toggle URL or component props.
 * 
 * @param {string} currentPath - Current page path
 * @param {string} currentLocale - Current locale
 * @returns {{ targetLocale: string, label: string, href: string }}
 */
export function getToggleProps(currentPath, currentLocale = 'en') {
  const targetLocale = currentLocale === 'en' ? 'es' : 'en';
  return {
    targetLocale,
    label: UI_STRINGS[currentLocale]['msg.langToggle'],
    href: `${currentPath}?lang=${targetLocale}`,
  };
}

/**
 * Detect preferred language from Accept-Language header.
 * 
 * @param {string} acceptLanguage - Accept-Language header value
 * @returns {string} Detected locale ('es' or 'en')
 */
export function detectLocale(acceptLanguage = '') {
  if (!acceptLanguage) return 'en';
  const languages = acceptLanguage.split(',').map(l => l.trim().split(';')[0].toLowerCase());
  if (languages.some(l => l.startsWith('es'))) return 'es';
  return 'en';
}

export { TRANSLATIONS, UI_STRINGS };