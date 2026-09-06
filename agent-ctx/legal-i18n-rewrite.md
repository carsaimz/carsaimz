# Legal Pages i18n Rewrite - Task Completed

## Summary

Rewrote the legal pages (Terms, Privacy, Cookies) to use the i18n system properly instead of hardcoded Portuguese text.

## Changes Made

### Translation Files (6 files)
Added comprehensive `legal` section to each translation file with nested `terms`, `privacy`, and `cookies` subsections:
- `/home/z/my-project/src/lib/translations/pt-pt.ts` - Portuguese (Mozambique)
- `/home/z/my-project/src/lib/translations/en-us.ts` - English (US)
- `/home/z/my-project/src/lib/translations/fr-fr.ts` - French
- `/home/z/my-project/src/lib/translations/es-es.ts` - Spanish
- `/home/z/my-project/src/lib/translations/zh-cn.ts` - Chinese (Simplified)
- `/home/z/my-project/src/lib/translations/de-de.ts` - German

Each legal section includes:
- **terms**: pageTitle, pageSubtitle, lastUpdate, seeAlso, seeAlsoPrivacy, seeAlsoCookies, + 7 sections (general, services, obligations, intellectualProperty, liability, termination, law) each with title and content
- **privacy**: pageTitle, pageSubtitle, lastUpdate, seeAlso, seeAlsoTerms, seeAlsoCookies, + 7 sections (introduction, dataCollection, dataUsage, cookiesAndTracking, thirdPartySharing, userRights, contact) each with title and content
- **cookies**: pageTitle, pageSubtitle, lastUpdate, seeAlso, seeAlsoPrivacy, seeAlsoTerms, + 6 sections (whatAreCookies, types, howWeUse, management, thirdParty, updates) each with title and content

### Component Files (3 files)
Rewrote all three legal page components to use `t()` for all content:
- `/home/z/my-project/src/components/public/terms-page.tsx`
- `/home/z/my-project/src/components/public/privacy-page.tsx`
- `/home/z/my-project/src/components/public/cookies-page.tsx`

Key pattern: Instead of a `sections` array with hardcoded strings, each component now defines `sectionKeys` with just the icon and key name, then uses `t(`legal.terms.sections.${section.key}.title`)` and `t(`legal.terms.sections.${section.key}.content`)` to resolve content from the translation system.

The pt-br language code falls back to pt-pt (same translation file), so all 7 language codes are covered.

## Verification
- Lint check passes cleanly
- Dev server compiles successfully
