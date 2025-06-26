
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { 
  firebaseRealtimeService, 
  RealtimeCustomer, 
  RealtimePayment, 
  RealtimeArea 
} from '@/services/FirebaseRealtimeService';
import { useToast } from '@/hooks/use-toast';

interface FirebaseDataContextType {
  customers: RealtimeCustomer[];
  payments: RealtimePayment[];
  areas: RealtimeArea[];
  isLoading: boolean;
  isDataSynced: boolean;
  isConnected: boolean;
  saveCustomer: (customer: Omit<RealtimeCustomer, 'userId' | 'createdAt' | 'updatedAt' | 'id'>) => Promise<boolean>;
  updateCustomer: (customerId: string, updates: Partial<RealtimeCustomer>) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  savePayment: (payment: Omit<RealtimePayment, 'userId' | 'createdAt' | 'id'>) => Promise<boolean>;
  updatePayment: (paymentId: string, updates: Partial<RealtimePayment>) => Promise<boolean>;
  deletePayment: (paymentId: string) => Promise<boolean>;
  saveArea: (area: Omit<RealtimeArea, 'userId' | 'createdAt' | 'updatedAt' | 'id'>) => Promise<boolean>;
  updateArea: (areaId: string, updates: Partial<RealtimeArea>) => Promise<boolean>;
  deleteArea: (areaId: string) => Promise<boolean>;
  migrateLocalData: (localData: any) => Promise<boolean>;
}

const FirebaseDataContext = createContext<FirebaseDataContextType | undefined>(undefined);

export const useFirebaseData = () => {
  const context = useContext(FirebaseDataContext);
  if (!context) {
    throw new Error('useFirebaseData must be used within a FirebaseDataProvider');
  }
  return context;
};

export const FirebaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser } = useFirebaseAuth();
  const [customers, setCustomers] = useState<RealtimeCustomer[]>([]);
  const [payments, setPayments] = useState<RealtimePayment[]>([]);
  const [areas, setAreas] = useState<RealtimeArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataSynced, setIsDataSynced] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const { toast } = useToast();

  // Set up real-time subscriptions when user is authenticated
  useEffect(() => {
    if (!user || !firebaseUser) {
      setCustomers([]);
      setPayments([]);
      setAreas([]);
      setIsDataSynced(false);
      return;
    }

    setIsLoading(true);
    console.log('Setting up Firebase Realtime Database subscriptions for user:', user.id);

    // Subscribe to connection status
    const unsubscribeConnection = firebaseRealtimeService.subscribeToConnectionStatus((connected) => {
      setIsConnected(connected);
      if (!connected) {
        toast({
          title: "Connection Lost",
          description: "Attempting to reconnect to sync data...",
          variant: "destructive",
        });
      } else if (isDataSynced) {
        toast({
          title: "Connected",
          description: "Data sync restored",
        });
      }
    });

    // Subscribe to customers
    const unsubscribeCustomers = firebaseRealtimeService.subscribeToCustomers(user.id, (newCustomers) => {
      console.log('Received real-time customers update:', newCustomers.length);
      setCustomers(newCustomers);
    });

    // Subscribe to payments
    const unsubscribePayments = firebaseRealtimeService.subscribeToPayments(user.id, (newPayments) => {
      console.log('Received real-time payments update:', newPayments.length);
      setPayments(newPayments);
    });

    // Subscribe to areas
    const unsubscribeAreas = firebaseRealtimeService.subscribeToAreas(user.id, (newAreas) => {
      console.log('Received real-time areas update:', newAreas.length);
      setAreas(newAreas);
    });

    // Mark as synced after initial load
    setTimeout(() => {
      setIsLoading(false);
      setIsDataSynced(true);
      console.log('Real-time data sync established');
    }, 1500);

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up Firebase Realtime Database subscriptions');
      unsubscribeConnection();
      unsubscribeCustomers();
      unsubscribePayments();
      unsubscribeAreas();
    };
  }, [user, firebaseUser]);

  const saveCustomer = async (customer: Omit<RealtimeCustomer, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.saveCustomer(user.id, customer);
    if (result.success) {
      toast({
        title: "Customer saved",
        description: "Customer data synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error saving customer",
        description: result.error || "Failed to save customer",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<RealtimeCustomer>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.updateCustomer(user.id, customerId, updates);
    if (result.success) {
      toast({
        title: "Customer updated",
        description: "Changes synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error updating customer",
        description: result.error || "Failed to update customer",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.deleteCustomer(user.id, customerId);
    if (result.success) {
      toast({
        title: "Customer deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error deleting customer",
        description: result.error || "Failed to delete customer",
        variant: "destructive",
      });
      return false;
    }
  };

  const savePayment = async (payment: Omit<RealtimePayment, 'userId' | 'createdAt' | 'id'>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.savePayment(user.id, payment);
    if (result.success) {
      toast({
        title: "Payment recorded",
        description: "Payment synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error saving payment",
        description: result.error || "Failed to save payment",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePayment = async (paymentId: string, updates: Partial<RealtimePayment>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.updatePayment(user.id, paymentId, updates);
    if (result.success) {
      toast({
        title: "Payment updated",
        description: "Changes synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error updating payment",
        description: result.error || "Failed to update payment",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePayment = async (paymentId: string): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.deletePayment(user.id, paymentId);
    if (result.success) {
      toast({
        title: "Payment deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error deleting payment",
        description: result.error || "Failed to delete payment",
        variant: "destructive",
      });
      return false;
    }
  };

  const saveArea = async (area: Omit<RealtimeArea, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.saveArea(user.id, area);
    if (result.success) {
      toast({
        title: "Area saved",
        description: "Area synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error saving area",
        description: result.error || "Failed to save area",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateArea = async (areaId: string, updates: Partial<RealtimeArea>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.updateArea(user.id, areaId, updates);
    if (result.success) {
      toast({
        title: "Area updated",
        description: "Changes synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error updating area",
        description: result.error || "Failed to update area",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteArea = async (areaId: string): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseRealtimeService.deleteArea(user.id, areaId);
    if (result.success) {
      toast({
        title: "Area deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Error deleting area",
        description: result.error || "Failed to delete area",
        variant: "destructive",
      });
      return false;
    }
  };

  const migrateLocalData = async (localData: any): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    const result = await firebaseRealtimeService.migrateLocalData(user.id, localData);
    setIsLoading(false);
    
    if (result.success) {
      toast({
        title: "Data migration successful",
        description: "Your local data is now synced across all devices",
      });
      return true;
    } else {
      toast({
        title: "Data migration failed",
        description: result.error || "Failed to migrate data",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <FirebaseDataContext.Provider value={{
      customers,
      payments,
      areas,
      isLoading,
      isDataSynced,
      isConnected,
      saveCustomer,
      updateCustomer,
      deleteCustomer,
      savePayment,
      updatePayment,
      deletePayment,
      saveArea,
      updateArea,
      deleteArea,
      migrateLocalData
    }}>
      {children}
    </FirebaseDataContext.Provider>
  );
};
