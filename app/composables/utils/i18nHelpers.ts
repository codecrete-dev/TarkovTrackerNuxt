import { computed, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { logger } from '@/utils/logger';
// Global flag to track i18n readiness
let i18nReady = false;
/**
 * Mark i18n as ready (called from main.ts after setup)
 */
export function markI18nReady() {
  i18nReady = true;
}
/**
 * Get saved locale from localStorage
 */
function getSavedLocale(): string | null {
  if (typeof window !== 'undefined' && localStorage) {
    try {
      const savedPrefs = localStorage.getItem('preferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        return prefs.localeOverride || null;
      }
    } catch (error) {
      console.warn('[i18nHelpers] Failed to read locale from localStorage:', error);
    }
  }
  return null;
}
/**
 * Safely gets the current locale from i18n, falling back to saved preference or browser language
 */
export function useSafeLocale() {
  const instance = getCurrentInstance();
  logger.debug('[useSafeLocale] instance:', !!instance, 'i18nReady:', i18nReady);
  if (instance && i18nReady) {
    try {
      // Use useI18n with explicit global scope to avoid parent scope warnings
      const { locale } = useI18n({
        useScope: 'global',
        inheritLocale: true,
      });
      return computed(() => locale.value);
    } catch (error) {
      logger.warn('[useSafeLocale] Could not access i18n context:', error);
    }
  }
  // When i18n is ready but no component context (e.g., plugin initialization),
  // read from localStorage preference first, then fallback to browser language
  if (i18nReady) {
    const savedLocale = getSavedLocale();
    if (savedLocale) {
      logger.debug('[useSafeLocale] Using saved locale:', savedLocale);
      return computed(() => savedLocale);
    }
  }
  // Final fallback to browser language or English if i18n not ready
  const browserLang = getBrowserLanguage();
  return computed(() => browserLang);
}
/**
 * Extracts language code from locale, falling back to 'en'
 */
export function extractLanguageCode(locale: string, availableLanguages: string[] = ['en']): string {
  const browserLocale = locale.split(/[-_]/)[0];
  return browserLocale && availableLanguages.includes(browserLocale) ? browserLocale : 'en';
}
/**
 * Gets the browser's language preference as a fallback
 */
export function getBrowserLanguage(): string {
  return navigator.language.split(/[-_]/)[0] || 'en';
}
