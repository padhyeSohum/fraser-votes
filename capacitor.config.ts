
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6a43dc77f4c34b0ca76b201b15f7ac81',
  appName: 'fraser-votes-beacon',
  webDir: 'dist',
  server: {
    url: 'https://6a43dc77-f4c3-4b0c-a76b-201b15f7ac81.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      spinnerColor: "#3478F6",
    },
  }
};

export default config;
