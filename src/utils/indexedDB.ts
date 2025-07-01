
// Stub implementation for IndexedDB utilities
// This is a placeholder since we're migrating away from local storage to Firebase

export interface IndexedDBResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SyncMetadata {
  lastSynced: string;
  deviceId: string;
}

export const loadFromIndexedDB = async <T>(
  storeName: string, 
  userId: string
): Promise<IndexedDBResult<T[]>> => {
  // Return empty data since we're no longer using IndexedDB
  console.log(`IndexedDB load requested for ${storeName} (user: ${userId}) - returning empty data`);
  return {
    success: true,
    data: [] as T[]
  };
};

export const saveToIndexedDB = async <T>(
  storeName: string,
  data: T[],
  userId: string
): Promise<IndexedDBResult<void>> => {
  // No-op since we're using Firebase now
  console.log(`IndexedDB save requested for ${storeName} (user: ${userId}) - ignoring`);
  return {
    success: true
  };
};

export const clearIndexedDB = async (userId: string): Promise<IndexedDBResult<void>> => {
  // No-op since we're using Firebase now
  console.log(`IndexedDB clear requested for user: ${userId} - ignoring`);
  return {
    success: true
  };
};

export const clearUserData = async (userId: string): Promise<IndexedDBResult<void>> => {
  // No-op since we're using Firebase now
  console.log(`IndexedDB clear user data requested for user: ${userId} - ignoring`);
  return {
    success: true
  };
};

export const getSyncMetadata = async (userId: string): Promise<SyncMetadata> => {
  // Return default sync metadata
  console.log(`IndexedDB sync metadata requested for user: ${userId} - returning default`);
  return {
    lastSynced: new Date().toISOString(),
    deviceId: getDeviceId()
  };
};

export const displaySyncStatus = (lastSyncedDate: string): string => {
  if (!lastSyncedDate) return 'Not synced yet';
  
  const syncDate = new Date(lastSyncedDate);
  const now = new Date();
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) {
    return 'Synced just now';
  } else if (diffMins < 60) {
    return `Synced ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) {
      return `Synced ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `Synced ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }
};

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('finance_device_id');
  
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('finance_device_id', deviceId);
  }
  
  return deviceId;
};
