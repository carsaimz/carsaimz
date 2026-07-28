import type { CapacitorConfig } from '@capacitor/cli';

// Read version from package.json via require (config file runs in Node context)
const pkg = require('./package.json');

const config: CapacitorConfig = {
  appId: 'com.carsaimz',
  appName: 'Carsai Mozambique',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // In Capacitor static export, API calls need to go to the external server
    // This allows the app to call the real backend instead of local non-existent routes
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: true, // Allow non-HTTPS for local development
  },
  android: {
    buildOptions: {
      keystorePath: 'upload/release.jks',
      keystoreAlias: process.env.KEYSTORE_ALIAS || 'carsai',
      keystorePassword: process.env.KEYSTORE_PASSWORD || '',
      releaseType: 'AAB',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#D32F2F', // Red (matches primary color)
      showSpinner: true,
      spinnerColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#D32F2F',
    },
  },
};

export default config;
