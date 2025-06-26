
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFirebaseData } from '@/context/FirebaseDataContext';
import { useAuth } from '@/context/LocalAuthContext';
import { loadFromIndexedDB } from '@/utils/indexedDB';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, Wifi, WifiOff } from 'lucide-react';

interface DataMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DataMigrationDialog = ({ open, onOpenChange }: DataMigrationDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const { migrateLocalData, isConnected } = useFirebaseData();
  const { user } = useAuth();

  const handleMigration = async () => {
    if (!user) {
      setMigrationStatus('error');
      return;
    }

    setIsLoading(true);
    setMigrationStatus('migrating');
    setProgress(0);

    try {
      // Get all local data from IndexedDB
      setProgress(20);
      
      const customersResult = await loadFromIndexedDB('customers', user.id);
      const paymentsResult = await loadFromIndexedDB('payments', user.id);
      const areasResult = await loadFromIndexedDB('areas', user.id);

      setProgress(50);

      const localData = {
        customers: customersResult.data || [],
        payments: paymentsResult.data || [],
        areas: areasResult.data || []
      };

      setProgress(70);

      // Migrate to Firebase Realtime Database
      const success = await migrateLocalData(localData);

      setProgress(100);

      if (success) {
        setMigrationStatus('success');
        setTimeout(() => {
          onOpenChange(false);
          setMigrationStatus('idle');
          setProgress(0);
        }, 2000);
      } else {
        setMigrationStatus('error');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalLocalRecords = async () => {
    if (!user) return 0;
    
    try {
      const customersResult = await loadFromIndexedDB('customers', user.id);
      const paymentsResult = await loadFromIndexedDB('payments', user.id);
      
      const customersData = Array.isArray(customersResult.data) ? customersResult.data : [];
      const paymentsData = Array.isArray(paymentsResult.data) ? paymentsResult.data : [];
      
      return customersData.length + paymentsData.length;
    } catch (error) {
      console.error('Error getting local records count:', error);
      return 0;
    }
  };

  // For display purposes, we'll use a state to track the record count
  const [localRecordCount, setLocalRecordCount] = useState(0);

  // Load record count when dialog opens
  React.useEffect(() => {
    if (open && user) {
      getTotalLocalRecords().then(count => setLocalRecordCount(count));
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Migrate to Real-time Cloud Sync
          </DialogTitle>
          <DialogDescription>
            Migrate your existing local data to Firebase Realtime Database for instant synchronization across all your devices in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <div className={`p-3 rounded-lg flex items-center gap-2 ${isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {isConnected ? 'Connected to Firebase' : 'Connection lost - Please check internet'}
            </span>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Local Data Summary:</h4>
            <ul className="text-sm space-y-1">
              <li>• Ready to migrate local data</li>
              <li>• Total: {localRecordCount} records</li>
              <li>• Real-time sync across all devices</li>
              <li>• Instant updates when data changes</li>
            </ul>
          </div>

          {migrationStatus === 'migrating' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Migrating to real-time database...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {migrationStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Migration completed! Real-time sync is now active.</span>
            </div>
          )}

          {migrationStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Migration failed. Please check your connection and try again.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleMigration} 
            disabled={isLoading || localRecordCount === 0 || migrationStatus === 'success' || !isConnected}
          >
            {isLoading ? 'Migrating...' : 'Start Real-time Migration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataMigrationDialog;
