
// Stub implementation for IndexedDB utilities
// This is a placeholder since we're migrating away from local storage to Firebase

export interface IndexedDBResult<T> {
  success: boolean;
  data?: T;
  error?: string;
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
