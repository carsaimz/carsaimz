'use client';

import { useState } from 'react';
import { type LanguageCode, DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES, LANGUAGE_CONFIGS } from '@/lib/i18n';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ============================================================================
// Types
// ============================================================================

interface LanguageTabsProps {
  /** Form fields for the default language (pt-pt) */
  defaultLanguageFields: React.ReactNode;
  /** Form fields for each non-default language, keyed by language code */
  i18nLanguageFields: Record<string, React.ReactNode>;
  /** Currently active language tab (controlled or internal) */
  activeLanguage?: LanguageCode;
  /** Callback when language tab changes */
  onLanguageChange?: (language: LanguageCode) => void;
}

// ============================================================================
// LanguageTabs Component
// ============================================================================

export function LanguageTabs({
  defaultLanguageFields,
  i18nLanguageFields,
  activeLanguage,
  onLanguageChange,
}: LanguageTabsProps) {
  const [internalLanguage, setInternalLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const currentLanguage = activeLanguage ?? internalLanguage;

  const handleLanguageChange = (lang: LanguageCode) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    } else {
      setInternalLanguage(lang);
    }
  };

  // Build the list of languages that should show as tabs:
  // Always show default language + any language that has i18n fields provided
  const visibleLanguages = AVAILABLE_LANGUAGES.filter(
    (code) => code === DEFAULT_LANGUAGE || code in i18nLanguageFields
  );

  return (
    <Tabs
      value={currentLanguage}
      onValueChange={(val) => handleLanguageChange(val as LanguageCode)}
      className="w-full"
    >
      <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
        {visibleLanguages.map((code) => {
          const config = LANGUAGE_CONFIGS[code];
          const isDefault = code === DEFAULT_LANGUAGE;
          return (
            <TabsTrigger
              key={code}
              value={code}
              className="gap-1.5 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <span className="text-base leading-none">{config.flag}</span>
              <span>{isDefault ? `${config.nativeName} (padrão)` : config.nativeName}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Default language content */}
      <TabsContent value={DEFAULT_LANGUAGE}>
        {defaultLanguageFields}
      </TabsContent>

      {/* Non-default language content */}
      {AVAILABLE_LANGUAGES.filter((code) => code !== DEFAULT_LANGUAGE).map((code) => {
        if (!(code in i18nLanguageFields)) return null;
        return (
          <TabsContent key={code} value={code}>
            {i18nLanguageFields[code]}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
