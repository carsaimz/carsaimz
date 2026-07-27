/**
 * Carsai Mozambique - App Configuration
 *
 * Central config for version, package name, app metadata.
 * Version is synced from package.json via build scripts.
 */

export const APP_CONFIG = {
  name: 'Carsai Mozambique',
  packageName: 'com.carsaimz',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '0.2.1',
  buildNumber: process.env.NEXT_PUBLIC_APP_BUILD || '2',
  description: 'Soluções Digitais e Hospedagem Web Gratuita',
  website: 'https://carsai.mz',
  contactEmail: 'info@carsai.mz',
  contactPhone: '+258 21 000 000',
  primaryColor: '#D32F2F',   // Red
  secondaryColor: '#1976D2',  // Blue
};
