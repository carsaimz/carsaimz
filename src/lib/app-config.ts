/**
 * Carsai Mozambique - App Configuration
 *
 * Central config for version, package name, app metadata.
 * Version is synced from package.json via build scripts.
 * Config values sourced from client-config.ts for consistency.
 */

import { APP_VERSION, APP_BUILD, SITE_URL, GITHUB_URL } from '@/lib/client-config';

export const APP_CONFIG = {
  name: 'Carsai Mozambique',
  packageName: 'com.carsaimz',
  version: APP_VERSION,
  buildNumber: APP_BUILD,
  description: 'Soluções Digitais e Hospedagem Web Gratuita',
  website: SITE_URL,
  github: GITHUB_URL,
  contactEmail: 'info@carsai.mz',
  contactPhone: '+258 21 000 000',
  primaryColor: '#D32F2F',   // Red
  secondaryColor: '#1976D2',  // Blue
};
