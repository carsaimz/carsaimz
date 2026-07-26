/**
 * Carsai Mozambique - Translations Index
 * 
 * Central export point for all language translations.
 * Maps language codes to their respective translation objects.
 */

import type { LanguageCode, TranslationObject } from '@/lib/i18n';
import { ptPT } from './pt-pt';
import { ptBR } from './pt-br';
import { enUS } from './en-us';
import { frFR } from './fr-fr';
import { esES } from './es-es';
import { zhCN } from './zh-cn';
import { deDE } from './de-de';

/**
 * All translation objects mapped by language code.
 * Each language code maps to its complete translation object.
 */
export const translations: Record<LanguageCode, TranslationObject> = {
  'pt-pt': ptPT,
  'en-us': enUS,
  'pt-br': ptBR,
  'fr-fr': frFR,
  'es-es': esES,
  'zh-cn': zhCN,
  'de-de': deDE,
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
export { ptBR } from './pt-br';
export { enUS } from './en-us';
export { frFR } from './fr-fr';
export { esES } from './es-es';
export { zhCN } from './zh-cn';
export { deDE } from './de-de';
