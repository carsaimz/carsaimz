/**
 * Carsai Mozambique — Ad Placement Constants
 *
 * Defines all available ad placements across the platform.
 * Each placement has a name, type, description, and i18nKey for translation.
 *
 * Use getPlacementName() to get the translated name for a placement.
 */

export const AD_PLACEMENTS = {
  home_top: { name: 'Home Top Banner', type: 'banner', description: 'Top banner on homepage', i18nKey: 'ads.placementHomeTop' },
  home_sidebar: { name: 'Home Sidebar', type: 'sidebar', description: 'Sidebar on homepage', i18nKey: 'ads.placementHomeSidebar' },
  services_top: { name: 'Services Top Banner', type: 'banner', description: 'Top banner on services page', i18nKey: 'ads.placementServicesTop' },
  services_sidebar: { name: 'Services Sidebar', type: 'sidebar', description: 'Sidebar on services page', i18nKey: 'ads.placementServicesSidebar' },
  projects_top: { name: 'Projects Top Banner', type: 'banner', description: 'Top banner on projects page', i18nKey: 'ads.placementProjectsTop' },
  blog_between: { name: 'Blog Between Posts', type: 'native', description: 'Between blog posts', i18nKey: 'ads.placementBlogBetween' },
  blog_sidebar: { name: 'Blog Sidebar', type: 'sidebar', description: 'Sidebar on blog page', i18nKey: 'ads.placementBlogSidebar' },
  forum_between: { name: 'Forum Between Topics', type: 'native', description: 'Between forum topics', i18nKey: 'ads.placementForumBetween' },
  forum_sidebar: { name: 'Forum Sidebar', type: 'sidebar', description: 'Sidebar on forum page', i18nKey: 'ads.placementForumSidebar' },
  global_interstitial: { name: 'Global Interstitial', type: 'interstitial', description: 'Full-screen interstitial (30 min cooldown)', i18nKey: 'ads.placementGlobalInterstitial' },
  global_banner: { name: 'Global Banner', type: 'banner', description: 'Banner shown on all pages', i18nKey: 'ads.placementGlobalBanner' },
  footer: { name: 'Footer Banner', type: 'banner', description: 'Banner in the footer', i18nKey: 'ads.placementFooter' },
} as const;

export type AdPlacementId = keyof typeof AD_PLACEMENTS;

/**
 * Get the translated name for an ad placement.
 * Falls back to the English name if translation is not available.
 */
export function getPlacementName(placementId: AdPlacementId | string, t: (key: string) => string): string {
  const config = AD_PLACEMENTS[placementId as AdPlacementId];
  if (!config) return placementId;
  const translated = t(config.i18nKey);
  // If translation returns the key itself (missing), fall back to English name
  return translated === config.i18nKey ? config.name : translated;
}
