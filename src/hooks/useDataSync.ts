
import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { useFirebaseData } from '@/context/FirebaseDataContext';
import { useToast } from '@/hooks/use-toast';
import { DataSyncService, DataSyncResult } from '@/services/DataSyncService';

export const useDataSync = () => {
  const { user: firebaseUser } = useFirebaseAuth();
  const firebaseData = useFirebaseData();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [syncResult, setSyncResult] = useState<DataSyncResult | null>(null);

  useEffect(() => {
    if (!firebaseUser || !firebaseData.isConnected) {
      return;
    }

    const performSync = async () => {
      setSyncStatus('syncing');
      
      try {
        const syncService = new DataSyncService(firebaseData, toast);
        const result = await syncService.syncUserData(firebaseUser.id);
        
        setSyncResult(result);
        setSyncStatus(result.success ? 'completed' : 'error');
        
        if (!result.success && result.error) {
          toast({
            title: "Sync Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Sync process failed:', error);
        setSyncStatus('error');
        toast({
          title: "Sync Failed",
          description: "Failed to sync your data. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Only sync once when user is authenticated and Firebase is connected
    if (syncStatus === 'idle') {
      performSync();
    }
  }, [firebaseUser, firebaseData.isConnected, syncStatus, firebaseData, toast]);

  return {
    syncStatus,
    syncResult,
    isFirebaseReady: firebaseData.isConnected && !firebaseData.isLoading
  };
};
