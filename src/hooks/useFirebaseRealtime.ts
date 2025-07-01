
import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, off, set, push, remove, update, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '@/config/firebase';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UseFirebaseRealtimeOptions {
  path: string;
  enabled?: boolean;
}

export function useFirebaseRealtime<T = any>(options: UseFirebaseRealtimeOptions) {
  const { firebaseUser } = useFirebaseAuth();
  const { toast } = useToast();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);

  const { path, enabled = true } = options;

  // Monitor connection status
  useEffect(() => {
    if (!enabled || !firebaseUser) return;

    const connectedRef = ref(realtimeDb, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      setConnected(isConnected);
      
      if (!isConnected) {
        console.log('Firebase Realtime Database disconnected');
      } else {
        console.log('Firebase Realtime Database connected');
      }
    });

    return () => off(connectedRef, 'value', unsubscribe);
  }, [enabled, firebaseUser]);

  // Subscribe to data changes
  useEffect(() => {
    if (!enabled || !firebaseUser || !path) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const userPath = `/users/${firebaseUser.uid}/${path}`;
    const dataRef = ref(realtimeDb, userPath);
    
    console.log(`Setting up Firebase listener for: ${userPath}`);

    const unsubscribe = onValue(
      dataRef, 
      (snapshot) => {
        try {
          const value = snapshot.val();
          console.log(`Firebase data received for ${userPath}:`, value ? Object.keys(value).length + ' items' : 'null');
          setData(value);
          setError(null);
        } catch (err) {
          console.error('Error processing Firebase data:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(`Firebase listener error for ${userPath}:`, error);
        setError(error.message);
        setLoading(false);
        
        toast({
          title: "Connection Error",
          description: "Failed to sync data. Changes will be saved locally.",
          variant: "destructive",
        });
      }
    );

    return () => {
      console.log(`Cleaning up Firebase listener for: ${userPath}`);
      off(dataRef, 'value', unsubscribe);
    };
  }, [enabled, firebaseUser, path, toast]);

  // Write operations
  const writeData = useCallback(async (newData: any, itemId?: string) => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      const userPath = `/users/${firebaseUser.uid}/${path}`;
      const targetRef = itemId ? ref(realtimeDb, `${userPath}/${itemId}`) : ref(realtimeDb, userPath);
      
      const dataWithTimestamp = {
        ...newData,
        lastModified: serverTimestamp(),
        updatedAt: new Date().toISOString()
      };

      console.log(`Writing to Firebase: ${userPath}${itemId ? `/${itemId}` : ''}`, dataWithTimestamp);
      await set(targetRef, dataWithTimestamp);
      
      console.log('Firebase write successful');
      return true;
    } catch (error) {
      console.error('Firebase write error:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync changes. Data saved locally.",
        variant: "destructive",
      });
      throw error;
    }
  }, [firebaseUser, path, toast]);

  const pushData = useCallback(async (newData: any) => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      const userPath = `/users/${firebaseUser.uid}/${path}`;
      const listRef = ref(realtimeDb, userPath);
      
      const dataWithTimestamp = {
        ...newData,
        lastModified: serverTimestamp(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`Pushing to Firebase: ${userPath}`, dataWithTimestamp);
      const newRef = push(listRef, dataWithTimestamp);
      
      console.log('Firebase push successful, new key:', newRef.key);
      return newRef.key;
    } catch (error) {
      console.error('Firebase push error:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync new item. Data saved locally.",
        variant: "destructive",
      });
      throw error;
    }
  }, [firebaseUser, path, toast]);

  const updateData = useCallback(async (updates: any, itemId?: string) => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      const userPath = `/users/${firebaseUser.uid}/${path}`;
      const targetRef = itemId ? ref(realtimeDb, `${userPath}/${itemId}`) : ref(realtimeDb, userPath);
      
      const updatesWithTimestamp = {
        ...updates,
        lastModified: serverTimestamp(),
        updatedAt: new Date().toISOString()
      };

      console.log(`Updating Firebase: ${userPath}${itemId ? `/${itemId}` : ''}`, updatesWithTimestamp);
      await update(targetRef, updatesWithTimestamp);
      
      console.log('Firebase update successful');
      return true;
    } catch (error) {
      console.error('Firebase update error:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync changes. Data saved locally.",
        variant: "destructive",
      });
      throw error;
    }
  }, [firebaseUser, path, toast]);

  const deleteData = useCallback(async (itemId: string) => {
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }

    try {
      const userPath = `/users/${firebaseUser.uid}/${path}/${itemId}`;
      const targetRef = ref(realtimeDb, userPath);
      
      console.log(`Deleting from Firebase: ${userPath}`);
      await remove(targetRef);
      
      console.log('Firebase delete successful');
      return true;
    } catch (error) {
      console.error('Firebase delete error:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync deletion. Change saved locally.",
        variant: "destructive",
      });
      throw error;
    }
  }, [firebaseUser, path, toast]);

  return {
    data,
    loading,
    error,
    connected,
    writeData,
    pushData,
    updateData,
    deleteData
  };
}
