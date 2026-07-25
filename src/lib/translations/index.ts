/**
 * Carsai Mozambique - Translations Index
 * 
 * Central export point for all language translations.
 * Maps language codes to their respective translation objects.
 */

import type { LanguageCode, TranslationObject } from '@/lib/i18n';
import { ptPT } from './pt-pt';
import { enUS } from './en-us';

/**
 * All translation objects mapped by language code.
 * Each language code maps to its complete translation object.
 */
export const translations: Record<LanguageCode, TranslationObject> = {
  'pt-pt': ptPT,
  'en-us': enUS,
  // pt-br will be added when the Brazilian Portuguese translations file is created
  // For now, pt-br falls back to pt-pt with minor differences
  'pt-br': ptPT,
};

/**
 * Get translations for a specific language
 */
export function getTranslations(language: LanguageCode): TranslationObject {
  return translations[language] || translations['pt-pt'];
}

/**
 * Get the fallback (default) translations
 */
export function getFallbackTranslations(): TranslationObject {
  return translations['pt-pt'];
}

/**
 * Re-export individual translation modules for direct access
 */
export { ptPT } from './pt-pt';
export { enUS } from './en-us';
