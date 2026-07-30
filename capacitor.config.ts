import type { CapacitorConfig } from '@capacitor/cli';
import { readFileSync } from 'fs';

// Read version from package.json (config file runs in Node context)
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// versionCode: 1000007integer for Android (Google Play requires incrementing versionCode)
// Computed as MAJOR * 1000000 + MINOR * 1000 + PATCH
const [major, minor, patch] = pkg.version.split('.').map(Number);
const versionCode = (major || 0) * 1000000 + (minor || 0) * 1000 + (patch || 0);

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
      launchAutoHide: true,
      backgroundColor: '#1565C0', // Blue (contrast with red logo)
      showSpinner: true,
      spinnerColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1565C0',
    },
    // @capacitor-firebase/authentication — must list providers for native auth
    FirebaseAuthentication: {
      providers: ['google.com', 'github.com', 'phone'],
    },
  },
};

export default config;
