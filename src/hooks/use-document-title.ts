'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';

/**
 * Sets the browser tab title dynamically.
 *
 * Pattern:
 * - Home page: "CarsaiMz - Transformação Digital" (subtitle)
 * - Other pages: "CarsaiMz - {pageTitle}" (e.g., "CarsaiMz - Blog")
 * - Content pages: "CarsaiMz - {contentTitle}" (e.g., "CarsaiMz - Como criar um site")
 *
 * @param titleKey - i18n key for the page title (e.g., 'nav.blog', 'nav.services')
 * @param fallback - Fallback title if key not found
 * @param isHome - Whether this is the home page (uses subtitle)
 * @param customTitle - Custom title that overrides the i18n key (for dynamic content)
 */
export function useDocumentTitle(
  titleKey?: string,
  fallback?: string,
  isHome?: boolean,
  customTitle?: string
) {
  const { t } = useLanguage();

  useEffect(() => {
    const appName = 'CarsaiMz';
    let title = '';

    if (customTitle) {
      title = `${appName} - ${customTitle}`;
    } else if (isHome) {
      title = `${appName} - Transformação Digital`;
    } else if (titleKey) {
      const translated = t(titleKey);
      title = `${appName} - ${translated}`;
    } else if (fallback) {
      title = `${appName} - ${fallback}`;
    } else {
      title = appName;
    }

    document.title = title;

    // Cleanup: restore default title on unmount
    return () => {
      document.title = `${appName} - Transformação Digital`;
    };
  }, [titleKey, fallback, isHome, customTitle, t]);
}
