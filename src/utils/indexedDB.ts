interface DBOperationResult {
  success: boolean;
  error?: string;
}

// Use a higher version number to avoid version conflicts
const DB_VERSION = 3;

// Initialize the IndexedDB database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('financeAppDB', DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB initialization error:', event);
      reject('Error opening IndexedDB');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
      
      // Create object stores for customers and payments
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
        customerStore.createIndex('userId', 'userId', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('payments')) {
        const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
        paymentStore.createIndex('userId', 'userId', { unique: false });
      }
      
      // Create an object store for user data
      if (!db.objectStoreNames.contains('userData')) {
        db.createObjectStore('userData', { keyPath: 'userId' });
      }

      // Create an object store for sync metadata
      if (!db.objectStoreNames.contains('syncMeta')) {
        db.createObjectStore('syncMeta', { keyPath: 'userId' });
      }

      // Create areas store if it doesn't exist (for version 2+)
      if (!db.objectStoreNames.contains('areas')) {
        const areaStore = db.createObjectStore('areas', { keyPath: 'id' });
        areaStore.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };
  });
};

// Save data to IndexedDB
export const saveToIndexedDB = <T>(
  storeName: string, 
  data: T, 
  userId: string
): Promise<DBOperationResult> => {
  return new Promise(async (resolve) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([storeName, 'syncMeta'], 'readwrite');
      const store = transaction.objectStore(storeName);
      const syncStore = transaction.objectStore('syncMeta');
      
      // For userData store, we save with the userId as the key
      if (storeName === 'userData') {
        const request = store.put({ userId, data });
        
        request.onsuccess = () => {
          // Update sync metadata
          updateSyncMetadata(userId, syncStore);
          resolve({ success: true });
        };
        
        request.onerror = () => {
          resolve({ success: false, error: 'Failed to save data' });
        };
      } else {
        // For other stores like customers or payments, ensure each item has userId
        if (Array.isArray(data)) {
          // If data is an array (like customers or payments collection)
          const addRequests = (data as any[]).map(item => {
            // Ensure each item has the userId
            if (!item.userId) {
              item.userId = userId;
            }
            return store.put(item);
          });
          
          Promise.all(addRequests.map(request => 
            new Promise<void>(resolve => {
              request.onsuccess = () => resolve();
              request.onerror = () => resolve();
            })
          )).then(() => {
            // Update sync metadata
            updateSyncMetadata(userId, syncStore);
            resolve({ success: true });
          });
        } else {
          // Single object case
          const dataWithUserId = { ...(data as object), userId } as any;
          const request = store.put(dataWithUserId);
          
          request.onsuccess = () => {
            // Update sync metadata
            updateSyncMetadata(userId, syncStore);
            resolve({ success: true });
          };
          
          request.onerror = () => {
            resolve({ success: false, error: 'Failed to save data' });
          };
        }
      }
      
      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      resolve({ success: false, error: 'IndexedDB operation failed' });
    }
  });
};

// Helper to update sync metadata
const updateSyncMetadata = (userId: string, syncStore: IDBObjectStore) => {
  const syncMetadata = {
    userId,
    lastSynced: new Date().toISOString(),
    deviceId: getDeviceId()
  };
  
  syncStore.put(syncMetadata);
};

// Generate or retrieve a unique device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('finance_device_id');
  
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('finance_device_id', deviceId);
  }
  
  return deviceId;
};

// Load data from IndexedDB
export const loadFromIndexedDB = <T>(
  storeName: string, 
  userId: string
): Promise<{ data?: T, error?: string, lastSynced?: string }> => {
  return new Promise(async (resolve) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([storeName, 'syncMeta'], 'readonly');
      const store = transaction.objectStore(storeName);
      const syncStore = transaction.objectStore('syncMeta');
      
      // Get sync metadata
      const syncRequest = syncStore.get(userId);
      let lastSynced: string | undefined;
      
      syncRequest.onsuccess = () => {
        if (syncRequest.result) {
          lastSynced = syncRequest.result.lastSynced;
        }
      };
      
      let request;
      
      if (storeName === 'userData') {
        request = store.get(userId);
      } else {
        // For customers and payments, get items by userId
        if (store.indexNames.contains('userId')) {
          const index = store.index('userId');
          request = index.getAll(userId);
        } else {
          // Fallback to getting all items (might be a bit inefficient)
          request = store.getAll();
        }
      }
      
      request.onsuccess = () => {
        if (storeName === 'userData') {
          if (request.result) {
            resolve({ 
              data: request.result.data as T,
              lastSynced
            });
          } else {
            resolve({ 
              data: undefined,
              lastSynced 
            });
          }
        } else {
          // For other stores, filter by userId if index not available
          if (!store.indexNames.contains('userId')) {
            const allItems = request.result;
            const userItems = allItems.filter((item: any) => item.userId === userId);
            resolve({ 
              data: userItems as T,
              lastSynced
            });
          } else {
            resolve({ 
              data: request.result as T,
              lastSynced
            });
          }
        }
      };
      
      request.onerror = () => {
        resolve({ error: 'Failed to load data' });
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      resolve({ error: 'IndexedDB operation failed' });
    }
  });
};

// Delete a specific item from IndexedDB
export const deleteFromIndexedDB = (
  storeName: string,
  itemId: string,
  userId: string
): Promise<DBOperationResult> => {
  return new Promise(async (resolve) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([storeName, 'syncMeta'], 'readwrite');
      const store = transaction.objectStore(storeName);
      const syncStore = transaction.objectStore('syncMeta');
      
      // For direct deletion by ID
      const request = store.delete(itemId);
      
      request.onsuccess = () => {
        // Update sync metadata to reflect the change
        updateSyncMetadata(userId, syncStore);
        resolve({ success: true });
      };
      
      request.onerror = () => {
        resolve({ success: false, error: `Failed to delete item from ${storeName}` });
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      resolve({ success: false, error: 'IndexedDB delete operation failed' });
    }
  });
};

// Clear all user data from IndexedDB
export const clearUserData = (userId: string): Promise<DBOperationResult> => {
  return new Promise(async (resolve) => {
    try {
      const db = await initDB();
      const storeNames = ['customers', 'payments', 'userData', 'syncMeta'];
      
      for (const storeName of storeNames) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        if (storeName === 'userData' || storeName === 'syncMeta') {
          const request = store.delete(userId);
          
          request.onerror = () => {
            resolve({ success: false, error: `Failed to clear ${storeName}` });
            return;
          };
        } else if (store.indexNames.contains('userId')) {
          // If we have a userId index, use it to delete user's records
          const index = store.index('userId');
          const keyRange = IDBKeyRange.only(userId);
          
          // Get all keys by userId
          const keysRequest = index.getAllKeys(keyRange);
          
          keysRequest.onsuccess = () => {
            const keys = keysRequest.result;
            // Delete each key
            keys.forEach((key: IDBValidKey) => {
              store.delete(key);
            });
          };
          
          keysRequest.onerror = () => {
            resolve({ success: false, error: `Failed to clear ${storeName}` });
            return;
          };
        } else {
          // Fallback to clearing all if we don't have indexes
          const request = store.clear();
          
          request.onerror = () => {
            resolve({ success: false, error: `Failed to clear ${storeName}` });
            return;
          };
        }
        
        transaction.oncomplete = () => {
          db.close();
        };
      }
      
      resolve({ success: true });
    } catch (error) {
      resolve({ success: false, error: 'Failed to clear user data' });
    }
  });
};

// Get sync metadata for the current user
export const getSyncMetadata = (userId: string): Promise<{ lastSynced?: string, deviceId?: string, error?: string }> => {
  return new Promise(async (resolve) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(['syncMeta'], 'readonly');
      const store = transaction.objectStore('syncMeta');
      
      const request = store.get(userId);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve({
            lastSynced: request.result.lastSynced,
            deviceId: request.result.deviceId
          });
        } else {
          resolve({});
        }
      };
      
      request.onerror = () => {
        resolve({ error: 'Failed to load sync metadata' });
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    } catch (error) {
      resolve({ error: 'IndexedDB operation failed' });
    }
  });
};

// Now let's add a function to update the Layout component to show sync status
export const displaySyncStatus = async (userId: string): Promise<string> => {
  if (!userId) return '';
  
  try {
    const syncData = await getSyncMetadata(userId);
    
    if (syncData.lastSynced) {
      const lastSyncDate = new Date(syncData.lastSynced);
      const now = new Date();
      const diffMs = now.getTime() - lastSyncDate.getTime();
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
    }
    
    return 'Not synced yet';
  } catch (error) {
    console.error('Error getting sync status:', error);
    return 'Sync status unknown';
  }
};
