import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skygenesisenterprise.aethervault',
  appName: 'Aether Vault',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
