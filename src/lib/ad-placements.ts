/**
 * Carsai Mozambique — Ad Placement Constants
 *
 * Defines all available ad placements across the platform.
 * Each placement has a name, type, and description.
 */

export const AD_PLACEMENTS = {
  home_top: { name: 'Home Top Banner', type: 'banner', description: 'Top banner on homepage' },
  home_sidebar: { name: 'Home Sidebar', type: 'sidebar', description: 'Sidebar on homepage' },
  services_top: { name: 'Services Top Banner', type: 'banner', description: 'Top banner on services page' },
  services_sidebar: { name: 'Services Sidebar', type: 'sidebar', description: 'Sidebar on services page' },
  projects_top: { name: 'Projects Top Banner', type: 'banner', description: 'Top banner on projects page' },
  blog_between: { name: 'Blog Between Posts', type: 'native', description: 'Between blog posts' },
  blog_sidebar: { name: 'Blog Sidebar', type: 'sidebar', description: 'Sidebar on blog page' },
  forum_between: { name: 'Forum Between Topics', type: 'native', description: 'Between forum topics' },
  forum_sidebar: { name: 'Forum Sidebar', type: 'sidebar', description: 'Sidebar on forum page' },
  global_interstitial: { name: 'Global Interstitial', type: 'interstitial', description: 'Full-screen interstitial (30 min cooldown)' },
  global_banner: { name: 'Global Banner', type: 'banner', description: 'Banner shown on all pages' },
  footer: { name: 'Footer Banner', type: 'banner', description: 'Banner in the footer' },
} as const;

export type AdPlacementId = keyof typeof AD_PLACEMENTS;
