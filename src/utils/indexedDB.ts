
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

export const displaySyncStatus = async (userId: string): Promise<string> => {
  const lastSync = localStorage.getItem(`last_sync_${userId}`);
  if (!lastSync) {
    return 'Never synced';
  }
  
  const syncDate = new Date(lastSync);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

export const clearUserData = async (userId: string): Promise<void> => {
  // Clear user-specific data from localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes(userId) || key.startsWith('user_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log(`Cleared data for user: ${userId}`);
};

export const saveUserData = async (userId: string, data: any): Promise<void> => {
  localStorage.setItem(`user_data_${userId}`, JSON.stringify(data));
  localStorage.setItem(`last_sync_${userId}`, new Date().toISOString());
};

export const getUserData = async (userId: string): Promise<any> => {
  const data = localStorage.getItem(`user_data_${userId}`);
  return data ? JSON.parse(data) : null;
};
