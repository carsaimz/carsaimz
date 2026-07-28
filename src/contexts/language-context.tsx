'use client';

/**
 * Carsai Mozambique - Language Context Provider
 * 
 * React context for managing the application's language state.
 * Provides translation function, language switching, and persistence
 * via both cookies and localStorage.
 * 
 * Uses useSyncExternalStore for hydration-safe language detection,
 * ensuring SSR and client renders stay consistent.
 * 
 * Usage:
 *   Wrap your app with <LanguageProvider>:
 *     <LanguageProvider>
 *       <App />
 *     </LanguageProvider>
 * 
 *   Then use the hook in any client component:
 *     const { t, language, setLanguage, languages } = useLanguage();
 *     <h1>{t('home.heroTitle')}</h1>
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  type LanguageCode,
  type TranslateFunction,
  DEFAULT_LANGUAGE,
  AVAILABLE_LANGUAGES,
  LANGUAGE_COOKIE_KEY,
  detectLanguage,
  persistLanguage,
  getLanguageConfig,
  createTranslateFunction,
  formatCurrency as i18nFormatCurrency,
  formatDate as i18nFormatDate,
  formatRelativeTime as i18nFormatRelativeTime,
} from '@/lib/i18n';

import {
  getTranslations,
  getFallbackTranslations,
} from '@/lib/translations';

// ============================================================================
// External Store for Language State
// ============================================================================

/**
 * Language store managed externally via useSyncExternalStore.
 * This avoids hydration mismatches and the React 19 "setState in effect" lint rule.
 */

// Language state
let currentLanguage: LanguageCode = DEFAULT_LANGUAGE;
let languageListeners: Array<() => void> = [];

// Hydration state
let hydrationComplete: boolean = false;
let hydrationListeners: Array<() => void> = [];

// --- Language Store API ---

function subscribeLanguage(listener: () => void): () => void {
  languageListeners = [...languageListeners, listener];
  return () => {
    languageListeners = languageListeners.filter((l) => l !== listener);
  };
}

function getLanguageSnapshot(): LanguageCode {
  return currentLanguage;
}

function getLanguageServerSnapshot(): LanguageCode {
  return DEFAULT_LANGUAGE;
}

function emitLanguageChange(): void {
  for (const listener of languageListeners) {
    listener();
  }
}

// --- Hydration Store API ---

function subscribeHydration(listener: () => void): () => void {
  hydrationListeners = [...hydrationListeners, listener];
  return () => {
    hydrationListeners = hydrationListeners.filter((l) => l !== listener);
  };
}

function getHydrationSnapshot(): boolean {
  return hydrationComplete;
}

function getHydrationServerSnapshot(): boolean {
  // Server never has hydration complete — it's a client-side concept
  return false;
}

function emitHydrationChange(): void {
  for (const listener of hydrationListeners) {
    listener();
  }
}

// --- Store Mutation Functions (called in effects/callbacks) ---

/**
 * Initialize language from persisted storage (called in mount effect).
 * This mutates the external store and emits changes to subscribers.
 */
function initializeLanguageStore(): void {
  const detected = detectLanguage();
  if (detected !== currentLanguage) {
    currentLanguage = detected;
    emitLanguageChange();
  }
  // Mark hydration as complete
  hydrationComplete = true;
  emitHydrationChange();
}

/**
 * Switch language and persist to storage.
 * This mutates the external store and emits changes to subscribers.
 */
function switchLanguageStore(newLanguage: LanguageCode): void {
  if (AVAILABLE_LANGUAGES.includes(newLanguage) && newLanguage !== currentLanguage) {
    currentLanguage = newLanguage;
    persistLanguage(newLanguage);
    emitLanguageChange();
  }
}

// ============================================================================
// Context Types
// ============================================================================

/** Language option for switcher UI */
export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

/** Shape of the Language Context value */
export interface LanguageContextValue {
  /** Current active language code */
  language: LanguageCode;

  /** Translation function - resolves dot-notation keys with optional interpolation */
  t: TranslateFunction;

  /** Switch to a different language and persist the choice */
  setLanguage: (language: LanguageCode) => void;

  /** Available language options for the language switcher UI */
  languages: LanguageOption[];

  /** Whether the language context has been hydrated from storage */
  isHydrated: boolean;

  /** Format a number as currency in the current language */
  formatCurrency: (amount: number) => string;

  /** Format a date in the current language */
  formatDate: (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ) => string;

  /** Format a relative time (e.g., "2 hours ago") in the current language */
  formatRelativeTime: (date: Date | string) => string;

  /** Get the current language configuration */
  languageConfig: ReturnType<typeof getLanguageConfig>;
}

// ============================================================================
// Context Creation
// ============================================================================

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

// ============================================================================
// Provider Props
// ============================================================================

export interface LanguageProviderProps {
  children: ReactNode;
  /** Initial language (for SSR/hydration consistency). Defaults to pt-pt. */
  initialLanguage?: LanguageCode;
}

// ============================================================================
// Language Provider Component
// ============================================================================

export function LanguageProvider({
  children,
  initialLanguage,
}: LanguageProviderProps) {
  // Use useSyncExternalStore for hydration-safe language and hydration state
  const language = useSyncExternalStore(
    subscribeLanguage,
    getLanguageSnapshot,
    getLanguageServerSnapshot
  );

  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot
  );

  // Initialize language from persisted storage or initial prop on mount
  useEffect(() => {
    // If an initialLanguage was provided (e.g., from SSR cookie detection),
    // apply it before detecting from localStorage
    if (initialLanguage && initialLanguage !== currentLanguage) {
      switchLanguageStore(initialLanguage);
    }
    // Then detect from browser/storage preferences
    initializeLanguageStore();
  }, [initialLanguage]);

  // Set the HTML lang attribute and Firebase Auth language when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const config = getLanguageConfig(language);
      document.documentElement.lang = config.locale;
    }
    // Sync Firebase Auth language so its own UI (Google/GitHub popups) matches
    if (typeof window !== 'undefined') {
      import('@/lib/firebase-client').then(({ auth }) => {
        if (auth && auth.languageCode !== language.split('-')[0]) {
          auth.languageCode = language.split('-')[0]; // e.g. 'pt-pt' → 'pt', 'en-us' → 'en'
        }
      }).catch(() => {}); // Firebase may not be configured
    }
  }, [language]);

  // Build available language options
  const languages: LanguageOption[] = useMemo(() => {
    return AVAILABLE_LANGUAGES.map((code) => {
      const config = getLanguageConfig(code);
      return {
        code,
        name: config.name,
        nativeName: config.nativeName,
        flag: config.flag,
      };
    });
  }, []);

  // Create the translation function bound to the current language
  const t: TranslateFunction = useMemo(() => {
    const translations = getTranslations(language);
    const fallback = getFallbackTranslations();
    return createTranslateFunction(translations, fallback);
  }, [language]);

  // Language switcher function
  const setLanguage = useCallback((newLanguage: LanguageCode) => {
    if (AVAILABLE_LANGUAGES.includes(newLanguage)) {
      switchLanguageStore(newLanguage);
    } else {
      console.warn(
        `[Carsai i18n] Unsupported language: "${newLanguage}". Available: ${AVAILABLE_LANGUAGES.join(', ')}`
      );
    }
  }, []);

  // Bound formatting functions
  const formatCurrency = useCallback(
    (amount: number) => i18nFormatCurrency(amount, language),
    [language]
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      i18nFormatDate(date, language, options),
    [language]
  );

  const formatRelativeTime = useCallback(
    (date: Date | string) => i18nFormatRelativeTime(date, language),
    [language]
  );

  // Current language config
  const languageConfig = useMemo(() => getLanguageConfig(language), [language]);

  // Context value (memoized to prevent unnecessary re-renders)
  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      language,
      t,
      setLanguage,
      languages,
      isHydrated,
      formatCurrency,
      formatDate,
      formatRelativeTime,
      languageConfig,
    }),
    [
      language,
      t,
      setLanguage,
      languages,
      isHydrated,
      formatCurrency,
      formatDate,
      formatRelativeTime,
      languageConfig,
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// ============================================================================
// useLanguage Hook
// ============================================================================

/**
 * Hook to access the language context.
 * Must be used within a <LanguageProvider>.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, language, setLanguage, languages } = useLanguage();
 *   
 *   return (
 *     <div>
 *       <h1>{t('home.heroTitle')}</h1>
 *       <p>{t('dashboard.welcome', { name: 'João' })}</p>
 *       <select
 *         value={language}
 *         onChange={(e) => setLanguage(e.target.value as LanguageCode)}
 *       >
 *         {languages.map((lang) => (
 *           <option key={lang.code} value={lang.code}>
 *             {lang.flag} {lang.nativeName}
 *           </option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error(
      '[Carsai i18n] useLanguage must be used within a <LanguageProvider>. ' +
      'Make sure to wrap your app or layout with <LanguageProvider>.'
    );
  }

  return context;
}

// ============================================================================
// Utility: Server-side language detection helper
// ============================================================================

/**
 * Detect language from a cookie string (for server components/middleware).
 * This can be used in Next.js middleware or server components to determine
 * the initial language before hydration.
 */
export function detectLanguageFromCookies(
  cookieString: string
): LanguageCode {
  const cookieMatch = cookieString
    .split('; ')
    .find((row) => row.startsWith(`${LANGUAGE_COOKIE_KEY}=`));

  if (cookieMatch) {
    const cookieValue = cookieMatch.split('=')[1] as LanguageCode;
    if (AVAILABLE_LANGUAGES.includes(cookieValue)) {
      return cookieValue;
    }
  }

  return DEFAULT_LANGUAGE;
}

// ============================================================================
// Default export
// ============================================================================

export default LanguageContext;
