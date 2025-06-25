
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const isMobile = () => {
  return Capacitor.isNativePlatform();
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

export const requestNotificationPermission = async () => {
  if (!isMobile()) return true;
  
  try {
    const permission = await LocalNotifications.requestPermissions();
    console.log('Notification permission:', permission.display);
    return permission.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const requestStoragePermission = async () => {
  if (!isMobile()) return true;
  
  try {
    const permission = await Filesystem.requestPermissions();
    console.log('Storage permission:', permission.publicStorage);
    return permission.publicStorage === 'granted';
  } catch (error) {
    console.error('Error requesting storage permission:', error);
    return false;
  }
};

export const initializeMobileApp = async () => {
  if (isMobile()) {
    console.log('Running on mobile platform:', Capacitor.getPlatform());
    
    try {
      // Request notification permissions for voice commands
      const notificationGranted = await requestNotificationPermission();
      if (notificationGranted) {
        console.log('Notification permissions granted');
      } else {
        console.warn('Notification permissions denied');
      }
      
      // Request storage permissions for PDF downloads
      const storageGranted = await requestStoragePermission();
      if (storageGranted) {
        console.log('Storage permissions granted');
      } else {
        console.warn('Storage permissions denied');
      }
      
      console.log('Mobile app initialized successfully');
    } catch (error) {
      console.error('Error initializing mobile app:', error);
    }
  }
};
