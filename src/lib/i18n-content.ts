/**
 * Carsai Mozambique - i18n Content Resolution Utility
 *
 * Helper functions for resolving multilingual content stored as JSON strings
 * in the database. Since SQLite doesn't have native JSON support, translations
 * are stored as JSON-encoded strings in columns like titleI18n, descriptionI18n.
 *
 * The pattern is:
 *   - Default language (pt-pt) content goes in the regular field (e.g., title)
 *   - Translations for other languages go in the i18n JSON field (e.g., titleI18n)
 *   - The i18n JSON includes ALL languages including the default one
 */

import { type LanguageCode, DEFAULT_LANGUAGE } from '@/lib/i18n';

// ============================================================================
// Core Resolution Functions
// ============================================================================

/**
 * Safely parses an i18n JSON string into a Record of language codes to strings.
 * Returns null if the input is null/undefined or if parsing fails.
 *
 * @param json - The raw JSON string from the database (or null/undefined)
 * @returns Record<string, string> mapping language codes to translations, or null
 */
export function parseI18nJson(
  json: string | null | undefined
): Record<string, string> | null {
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    // Validate that all values are strings
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Resolves content for a specific language from an i18n JSON string,
 * falling back to the provided default content if the language is not found.
 *
 * Resolution order:
 *   1. Try to get content for the specified language from the i18n JSON
 *   2. If not found, fall back to the provided fallback string (default language content)
 *   3. Always returns a string (never null/undefined)
 *
 * @param i18nJson - The raw JSON string from the database (or null/undefined)
 * @param fallback - The default content (usually from the regular field like title/description)
 * @param language - The target language code
 * @returns The resolved content string
 */
export function resolveI18nContent(
  i18nJson: string | null | undefined,
  fallback: string,
  language: LanguageCode
): string {
  const parsed = parseI18nJson(i18nJson);
  if (parsed && parsed[language]) {
    return parsed[language];
  }
  return fallback;
}

/**
 * Builds an i18n JSON string from a map of language codes to translated values.
 * This is used when creating/updating content via API endpoints.
 *
 * @param values - Record mapping language codes to translated strings
 * @returns JSON string encoding the translations
 */
export function buildI18nJson(values: Record<string, string>): string {
  return JSON.stringify(values);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Resolves i18n content for multiple fields at once.
 * Useful when you need to resolve title, description, etc. for the same language.
 *
 * @param fields - Object with field names as keys, each containing { i18nJson, fallback }
 * @param language - The target language code
 * @returns Object with field names as keys and resolved strings as values
 */
export function resolveI18nFields(
  fields: Record<string, { i18nJson: string | null | undefined; fallback: string }>,
  language: LanguageCode
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [fieldName, { i18nJson, fallback }] of Object.entries(fields)) {
    result[fieldName] = resolveI18nContent(i18nJson, fallback, language);
  }
  return result;
}

/**
 * Gets all available translations from an i18n JSON field.
 * Returns an object with language codes and their translations,
 * with the default language value filling in any missing entries.
 *
 * @param i18nJson - The raw JSON string from the database
 * @param fallback - The default content for the default language
 * @returns Record mapping language codes to available translations
 */
export function getAvailableTranslations(
  i18nJson: string | null | undefined,
  fallback: string
): Record<string, string> {
  const parsed = parseI18nJson(i18nJson);
  const result: Record<string, string> = { [DEFAULT_LANGUAGE]: fallback };

  if (parsed) {
    for (const [lang, value] of Object.entries(parsed)) {
      result[lang] = value;
    }
  }

  // Ensure default language has the fallback if not in JSON
  if (!result[DEFAULT_LANGUAGE]) {
    result[DEFAULT_LANGUAGE] = fallback;
  }

  return result;
}
