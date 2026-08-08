'use client';

/**
 * Carsai Mozambique — i18n Field Tabs
 *
 * A convenience wrapper around LanguageTabs for i18n text fields.
 * Automatically converts between JSON i18n objects and per-language values.
 *
 * Usage:
 * <I18nFieldTabs
 *   defaultValue={planForm.description}
 *   i18nValue={planForm.descriptionI18n}
 *   onDefaultChange={(v) => setPlanForm(p => ({ ...p, description: v }))}
 *   onI18nChange={(v) => setPlanForm(p => ({ ...p, descriptionI18n: v }))}
 *   label="Description"
 *   richText
 * />
 */

import { useCallback } from 'react';
import { LanguageTabs } from '@/components/common/language-tabs';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_CONFIGS, type LanguageCode } from '@/lib/i18n';

// ── JSON ↔ Object helpers ──

/** Parse a JSON i18n string into an object, or return empty object */
export function parseI18nJson(i18nJson: string | null | undefined): Record<string, string> {
  if (!i18nJson || typeof i18nJson !== 'string') return {};
  try {
    const parsed = JSON.parse(i18nJson);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {
    // Invalid JSON — return empty
  }
  return {};
}

/** Convert an i18n object to a JSON string (or empty string if all values empty) */
export function stringifyI18nJson(obj: Record<string, string>): string {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && value.trim()) cleaned[key] = value;
  }
  return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : '';
}

/** Get a specific language value from an i18n JSON string */
export function getI18nValue(i18nJson: string | null | undefined, lang: string): string {
  return parseI18nJson(i18nJson)[lang] || '';
}

/** Set a specific language value in an i18n JSON string, returning the updated JSON string */
export function setI18nValue(i18nJson: string | null | undefined, lang: string, value: string): string {
  const obj = parseI18nJson(i18nJson);
  if (value && value.trim()) {
    obj[lang] = value;
  } else {
    delete obj[lang];
  }
  return stringifyI18nJson(obj);
}

// ── Field Renderer ──

function FieldInput({
  value,
  onChange,
  placeholder,
  richText,
  editorLevel,
  rows,
  singleLine,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  richText: boolean;
  editorLevel: 'full' | 'basic' | 'minimal';
  rows: number;
  singleLine: boolean;
}) {
  if (richText) {
    return (
      <RichTextEditor
        value={value}
        onChange={onChange}
        level={editorLevel}
        placeholder={placeholder}
      />
    );
  }

  if (singleLine) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

// ── Props ──

interface I18nFieldTabsProps {
  /** Value for the default language (pt-pt) */
  defaultValue: string;
  /** JSON string for i18n values, e.g. '{"en-us":"Hello","fr-fr":"Bonjour"}' */
  i18nValue: string;
  /** Called when the default language value changes */
  onDefaultChange: (value: string) => void;
  /** Called when the i18n JSON changes (full JSON string) */
  onI18nChange: (value: string) => void;
  /** Field label */
  label?: string;
  /** Placeholder for the default language */
  placeholder?: string;
  /** Use rich text editor (QuillJS) instead of plain textarea */
  richText?: boolean;
  /** RichText editor level (default: 'basic') */
  editorLevel?: 'full' | 'basic' | 'minimal';
  /** Textarea rows (only for non-richText mode) */
  rows?: number;
  /** Whether to use a single-line Input instead of Textarea */
  singleLine?: boolean;
  /** Additional className for the field wrapper */
  className?: string;
}

// ── Component ──

export function I18nFieldTabs({
  defaultValue,
  i18nValue,
  onDefaultChange,
  onI18nChange,
  label,
  placeholder,
  richText = false,
  editorLevel = 'basic',
  rows = 3,
  singleLine = false,
  className,
}: I18nFieldTabsProps) {
  // Handle change for a non-default language field
  const handleI18nChange = useCallback(
    (lang: string, value: string) => {
      const updated = setI18nValue(i18nValue, lang, value);
      onI18nChange(updated);
    },
    [i18nValue, onI18nChange]
  );

  // Build i18n language fields for each non-default language
  const i18nLanguageFields: Record<string, React.ReactNode> = {};

  for (const code of AVAILABLE_LANGUAGES) {
    if (code === DEFAULT_LANGUAGE) continue;

    const langConfig = LANGUAGE_CONFIGS[code];
    const langValue = getI18nValue(i18nValue, code);
    const langPlaceholder = placeholder ? `${placeholder} (${langConfig.nativeName})` : undefined;

    i18nLanguageFields[code] = (
      <div className="mt-2">
        <FieldInput
          value={langValue}
          onChange={(v) => handleI18nChange(code, v)}
          placeholder={langPlaceholder}
          richText={richText}
          editorLevel={editorLevel}
          rows={rows}
          singleLine={singleLine}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {label && <Label className="mb-1.5 block">{label}</Label>}
      <LanguageTabs
        defaultLanguageFields={
          <div className="mt-2">
            <FieldInput
              value={defaultValue}
              onChange={onDefaultChange}
              placeholder={placeholder}
              richText={richText}
              editorLevel={editorLevel}
              rows={rows}
              singleLine={singleLine}
            />
          </div>
        }
        i18nLanguageFields={i18nLanguageFields}
      />
    </div>
  );
}
