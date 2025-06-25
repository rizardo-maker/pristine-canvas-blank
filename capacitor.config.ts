
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.40f8d75ce7e44e8dbbb932582ca952ac',
  appName: 'Collectify Manager',
  webDir: 'dist',
  server: {
    url: "https://40f8d75c-e7e4-4e8d-bbb9-32582ca952ac.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff'
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    }
  },
  android: {
    permissions: [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.RECORD_AUDIO',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.MANAGE_EXTERNAL_STORAGE'
    ]
  }
};

export default config;
