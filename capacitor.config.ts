import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.carsaimz',
  appName: 'Carsai Mozambique',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: 'upload/release.jks',
      keystoreAlias: process.env.KEYSTORE_ALIAS || 'carsai',
      keystorePassword: process.env.KEYSTORE_PASSWORD || '',
      releaseType: 'AAB',
    },
    versionCode: 2,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#D32F2F', // Red (matches primary color)
      showSpinner: true,
      spinnerColor: '#FFFFFF',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#D32F2F',
    },
  },
};

export default config;
