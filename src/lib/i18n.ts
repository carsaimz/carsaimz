/**
 * Carsai Mozambique - Internationalization (i18n) Utility
 * 
 * Provides translation function, language detection, and type definitions
 * for the multilingual platform supporting Portuguese (Mozambique), 
 * English, and Portuguese (Brazil).
 */

// ============================================================================
// Type Definitions
// ============================================================================

/** Supported language codes for the Carsai Mozambique platform */
export type LanguageCode = 'pt-pt' | 'en-us' | 'pt-br' | 'fr-fr' | 'es-es' | 'zh-cn' | 'de-de' | 'sw-tz';

/** Configuration for each supported language */
export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  currencySymbol: string;
  currencyCode: string;
  locale: string;
}

/** Deep nested translation object type */
export type TranslationValue = string | TranslationObject;
export interface TranslationObject {
  [key: string]: TranslationValue;
}

/** Parameters for interpolation in translation strings */
export type TranslationParams = Record<string, string | number>;

/** Translation function signature */
export type TranslateFunction = (
  key: string,
  params?: TranslationParams
) => string;

// ============================================================================
// Language Configurations
// ============================================================================

export const LANGUAGE_CONFIGS: Record<LanguageCode, LanguageConfig> = {
  'pt-pt': {
    code: 'pt-pt',
    name: 'Portuguese (Mozambique)',
    nativeName: 'Português (Mozambique)',
    flag: '🇲🇿',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    currencySymbol: 'MT',
    currencyCode: 'MZN',
    locale: 'pt-MZ',
  },
  'en-us': {
    code: 'en-us',
    name: 'English (US)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    direction: 'ltr',
    dateFormat: 'MM/dd/yyyy',
    currencySymbol: 'MT',
    currencyCode: 'MZN',
    locale: 'en-US',
  },
  'pt-br': {
    code: 'pt-br',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    flag: '🇧🇷',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    currencySymbol: 'MT',
    currencyCode: 'MZN',
    locale: 'pt-BR',
  },
  'fr-fr': {
    code: 'fr-fr',
    name: 'French (France)',
    nativeName: 'Français (France)',
    flag: '🇫🇷',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    currencySymbol: 'MT',
    currencyCode: 'MZN',
    locale: 'fr-FR',
  },
  'es-es': {
    code: 'es-es',
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    flag: '🇪🇸',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    currencySymbol: 'MT',
    currencyCode: 'MZN',
    locale: 'es-ES',
  },
  'zh-cn': {
    code: 'zh-cn',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    direction: 'ltr',
    dateFormat: 'yyyy/MM/dd',
    currencySymbol: 'MT',
    currencyCode: 'MZN',
    locale: 'zh-CN',
  },
  'de-de': {
    code: 'de-de',
    name: 'German (Germany)',
    nativeName: 'Deutsch (Deutschland)',
    flag: '🇩🇪',
    direction: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    currencySymbol: 'MT',
    currencyCode: 'MZN',
    locale: 'de-DE',
  },
  'sw-tz': {
    code: 'sw-tz',
    name: 'Swahili (Tanzania)',
    nativeName: 'Kiswahili (Tanzania)',
    flag: '🇹🇿',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    currencySymbol: 'MT',
    currencyCode: 'MZN',
    locale: 'sw-TZ',
  },
};

/** Default language for the platform */
export const DEFAULT_LANGUAGE: LanguageCode = 'pt-pt';

/** All available language codes */
export const AVAILABLE_LANGUAGES: LanguageCode[] = ['pt-pt', 'en-us', 'pt-br', 'fr-fr', 'es-es', 'zh-cn', 'de-de', 'sw-tz'];

/** Cookie key for persisting language preference */
export const LANGUAGE_COOKIE_KEY = 'carsai-language';

/** localStorage key for persisting language preference */
export const LANGUAGE_STORAGE_KEY = 'carsai-language';

// ============================================================================
// Language Detection
// ============================================================================

/**
 * Detects the preferred language from various sources in priority order:
 * 1. Cookie storage
 * 2. localStorage
 * 3. Browser navigator language
 * 4. Default language fallback
 */
export function detectLanguage(): LanguageCode {
  // Try cookie first (for SSR/hydration consistency)
  if (typeof document !== 'undefined') {
    const cookieMatch = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${LANGUAGE_COOKIE_KEY}=`));
    if (cookieMatch) {
      const cookieValue = cookieMatch.split('=')[1] as LanguageCode;
      if (AVAILABLE_LANGUAGES.includes(cookieValue)) {
        return cookieValue;
      }
    }
  }

  // Try localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode;
    if (storedLang && AVAILABLE_LANGUAGES.includes(storedLang)) {
      return storedLang;
    }
  }

  // Try browser language detection
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language?.toLowerCase() || '';

    // Direct match
    if (AVAILABLE_LANGUAGES.includes(browserLang as LanguageCode)) {
      return browserLang as LanguageCode;
    }

    // Prefix match
    const prefix = browserLang.split('-')[0];
    if (prefix === 'pt') {
      return 'pt-pt';
    }
    if (prefix === 'en') {
      return 'en-us';
    }
    if (prefix === 'fr') {
      return 'fr-fr';
    }
    if (prefix === 'es') {
      return 'es-es';
    }
    if (prefix === 'zh') {
      return 'zh-cn';
    }
    if (prefix === 'de') {
      return 'de-de';
    }
    if (prefix === 'sw') {
      return 'sw-tz';
    }
  }

  // Fallback to default
  return DEFAULT_LANGUAGE;
}

// ============================================================================
// Language Persistence
// ============================================================================

/**
 * Persist language preference to both cookie and localStorage
 */
export function persistLanguage(language: LanguageCode): void {
  // Set cookie (expires in 1 year)
  if (typeof document !== 'undefined') {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${language};expires=${expiryDate.toUTCString()};path=/;SameSite=Lax`;
  }

  // Set localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
}

/**
 * Get language preference from cookie (for server-side/initial load)
 */
export function getLanguageFromCookie(cookieString?: string): LanguageCode | null {
  if (!cookieString) return null;

  const cookieMatch = cookieString
    .split('; ')
    .find((row) => row.startsWith(`${LANGUAGE_COOKIE_KEY}=`));

  if (cookieMatch) {
    const cookieValue = cookieMatch.split('=')[1] as LanguageCode;
    if (AVAILABLE_LANGUAGES.includes(cookieValue)) {
      return cookieValue;
    }
  }

  return null;
}

// ============================================================================
// Translation Function
// ============================================================================

/**
 * Resolve a nested key from a translation object.
 * Supports dot notation: "nav.home" resolves translations.nav.home
 */
function resolveKey(obj: TranslationObject, key: string): string | undefined {
  const keys = key.split('.');
  let current: TranslationValue = obj;

  for (const k of keys) {
    if (typeof current === 'object' && current !== null && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Interpolate parameters into a translation string.
 * Supports both {{param}} and {param} syntax:
 *   "Hello {{name}}" with {name: "World"} => "Hello World"
 *   "{count} activos" with {count: 5} => "5 activos"
 *
 * Double-brace {{param}} is checked first (higher priority),
 * then single-brace {param} as fallback for convenience.
 */
function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return Object.entries(params).reduce(
    (result, [key, value]) => {
      const strValue = String(value);
      // Replace double-brace {{key}} first (standard i18n syntax)
      const doublePattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const afterDouble = result.replace(doublePattern, strValue);
      // Then replace single-brace {key} (convenience / legacy)
      // Only match {key} that is NOT inside {{...}} to avoid partial replacements
      const singlePattern = new RegExp(`(?<!\\{)\\{${key}\\}(?!\\})`, 'g');
      return afterDouble.replace(singlePattern, strValue);
    },
    template
  );
}

/**
 * Create a translation function bound to a specific language's translations
 */
export function createTranslateFunction(
  translations: TranslationObject,
  fallbackTranslations?: TranslationObject
): TranslateFunction {
  return (key: string, params?: TranslationParams): string => {
    // Try primary translations
    let value = resolveKey(translations, key);

    // Fall back to fallback translations if key not found
    if (value === undefined && fallbackTranslations) {
      value = resolveKey(fallbackTranslations, key);
    }

    // If still not found, return the key itself as last resort
    if (value === undefined) {
      return key;
    }

    // Interpolate parameters
    return interpolate(value, params);
  };
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format a number as currency.
 * 
 * IMPORTANT: All prices in the platform are in MZN (Metical moçambicano).
 * The currency symbol is ALWAYS MT (MZN), regardless of the user's language.
 * Only the number formatting (thousands separator, decimal separator) follows
 * the locale convention.
 * 
 * This avoids the nonsensical situation where changing language changes
 * the currency symbol but not the value (e.g., 50 MT → 50 $).
 */
export function formatCurrency(
  amount: number,
  language: LanguageCode
): string {
  const config = LANGUAGE_CONFIGS[language];
  // Always use MZN (Metical) — the business operates in Mozambique
  const formatted = amount.toLocaleString(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `MT ${formatted}`;
}

/**
 * Format a date based on language configuration
 */
export function formatDate(
  date: Date | string,
  language: LanguageCode,
  options?: Intl.DateTimeFormatOptions
): string {
  const config = LANGUAGE_CONFIGS[language];
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return dateObj.toLocaleDateString(config.locale, options || defaultOptions);
}

/**
 * Format a relative time (e.g., "2 hours ago", "há 2 horas")
 */
export function formatRelativeTime(
  date: Date | string,
  language: LanguageCode
): string {
  const config = LANGUAGE_CONFIGS[language];
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(config.locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }
  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  }
  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  }
  if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  }
  if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  }
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
}

/**
 * Get the language config for a given language code
 */
export function getLanguageConfig(language: LanguageCode): LanguageConfig {
  return LANGUAGE_CONFIGS[language];
}

/**
 * Get the display name for a language in its own native name
 */
export function getLanguageDisplayName(language: LanguageCode): string {
  return LANGUAGE_CONFIGS[language].nativeName;
}

/**
 * Get all language options for a language switcher UI
 */
export function getLanguageOptions(): Array<{
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}> {
  return AVAILABLE_LANGUAGES.map((code) => ({
    code,
    name: LANGUAGE_CONFIGS[code].name,
    nativeName: LANGUAGE_CONFIGS[code].nativeName,
    flag: LANGUAGE_CONFIGS[code].flag,
  }));
}
