
// Tauri API integration utilities
import { invoke } from '@tauri-apps/api/tauri';

// Check if running in Tauri environment
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Save file using Tauri's file dialog
export const saveFileWithDialog = async (content: string, filename: string): Promise<string> => {
  if (!isTauri()) {
    console.warn('Tauri is not available, using browser download fallback');
    // Browser fallback
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return filename;
  }
  
  try {
    const result = await invoke<string>('save_file_dialog', { 
      content, 
      filename 
    });
    return result;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Open file using Tauri's file dialog
export const openFileWithDialog = async (): Promise<string> => {
  if (!isTauri()) {
    throw new Error('File opening is only available in desktop mode');
  }
  
  try {
    const result = await invoke<string>('open_file_dialog');
    return result;
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
};

// Show system notification
export const showNotification = async (title: string, body: string): Promise<void> => {
  if (!isTauri()) {
    // Browser fallback
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
    return;
  }
  
  try {
    await invoke('show_notification', { title, body });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Get app version
export const getAppVersion = async (): Promise<string> => {
  if (!isTauri()) {
    return '1.0.0 (Web)';
  }
  
  try {
    const version = await invoke<string>('get_app_version');
    return `${version} (Desktop)`;
  } catch (error) {
    console.error('Error getting app version:', error);
    return '1.0.0 (Desktop)';
  }
};

// Greet function for testing Tauri integration
export const greet = async (name: string): Promise<string> => {
  if (!isTauri()) {
    return `Hello, ${name}! You've been greeted from the web!`;
  }
  
  try {
    const result = await invoke<string>('greet', { name });
    return result;
  } catch (error) {
    console.error('Error calling greet:', error);
    return `Hello, ${name}! (Error calling Tauri)`;
  }
};
