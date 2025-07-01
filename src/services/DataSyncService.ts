
import { loadFromIndexedDB, clearUserData } from '@/utils/indexedDB';
import { useFirebaseData } from '@/context/FirebaseDataContext';
import { useToast } from '@/hooks/use-toast';

export interface DataSyncResult {
  success: boolean;
  migrated: boolean;
  error?: string;
  localDataFound: boolean;
}

export class DataSyncService {
  private firebaseData: ReturnType<typeof useFirebaseData>;
  private toast: ReturnType<typeof useToast>['toast'];

  constructor(firebaseData: ReturnType<typeof useFirebaseData>, toast: ReturnType<typeof useToast>['toast']) {
    this.firebaseData = firebaseData;
    this.toast = toast;
  }

  async syncUserData(userId: string): Promise<DataSyncResult> {
    console.log('Starting data sync for user:', userId);
    
    try {
      // Check if user has data in Firebase first
      const hasFirebaseData = this.firebaseData.customers.length > 0 || 
                             this.firebaseData.payments.length > 0 || 
                             this.firebaseData.areas.length > 0;

      if (hasFirebaseData) {
        console.log('User has existing Firebase data, skipping migration');
        return {
          success: true,
          migrated: false,
          localDataFound: false
        };
      }

      // Check for local IndexedDB data
      const [customersResult, paymentsResult, areasResult] = await Promise.all([
        loadFromIndexedDB('customers', userId),
        loadFromIndexedDB('payments', userId),
        loadFromIndexedDB('areas', userId)
      ]);

      const hasLocalData = (customersResult.data && Array.isArray(customersResult.data) && customersResult.data.length > 0) ||
                          (paymentsResult.data && Array.isArray(paymentsResult.data) && paymentsResult.data.length > 0) ||
                          (areasResult.data && Array.isArray(areasResult.data) && areasResult.data.length > 0);

      if (!hasLocalData) {
        console.log('No local data found to migrate');
        return {
          success: true,
          migrated: false,
          localDataFound: false
        };
      }

      console.log('Local data found, starting migration to Firebase');

      // Prepare data for migration
      const localData = {
        customers: Array.isArray(customersResult.data) ? customersResult.data : [],
        payments: Array.isArray(paymentsResult.data) ? paymentsResult.data : [],
        areas: Array.isArray(areasResult.data) ? areasResult.data : []
      };

      // Migrate to Firebase
      const migrationSuccess = await this.firebaseData.migrateLocalData(localData);

      if (migrationSuccess) {
        // Clear local IndexedDB data after successful migration
        await clearUserData(userId);
        
        this.toast({
          title: "Data Migration Complete",
          description: "Your data is now synced across all devices in real-time",
        });

        console.log('Data migration completed successfully');
        return {
          success: true,
          migrated: true,
          localDataFound: true
        };
      } else {
        console.error('Data migration failed');
        return {
          success: false,
          migrated: false,
          localDataFound: true,
          error: 'Failed to migrate data to Firebase'
        };
      }
    } catch (error) {
      console.error('Error during data sync:', error);
      return {
        success: false,
        migrated: false,
        localDataFound: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
