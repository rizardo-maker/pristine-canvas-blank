
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { 
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
  const { firebaseUser } = useFirebaseAuth();
  const { toast } = useToast();

  // Enable real-time listeners as soon as Firebase user is authenticated
  const isFirebaseEnabled = !!firebaseUser;

  console.log('FirebaseDataProvider - Firebase user:', firebaseUser?.uid);
  console.log('FirebaseDataProvider - Real-time enabled:', isFirebaseEnabled);

  // Use the Firebase Realtime Database hooks
  const {
    data: customersData,
    loading: customersLoading,
    connected: customersConnected,
    pushData: pushCustomer,
    updateData: updateCustomerData,
    deleteData: deleteCustomerData
  } = useFirebaseRealtime<Record<string, RealtimeCustomer>>({
    path: 'customers',
    enabled: isFirebaseEnabled
  });

  const {
    data: paymentsData,
    loading: paymentsLoading,
    connected: paymentsConnected,
    pushData: pushPayment,
    updateData: updatePaymentData,
    deleteData: deletePaymentData
  } = useFirebaseRealtime<Record<string, RealtimePayment>>({
    path: 'payments',
    enabled: isFirebaseEnabled
  });

  const {
    data: areasData,
    loading: areasLoading,
    connected: areasConnected,
    pushData: pushArea,
    updateData: updateAreaData,
    deleteData: deleteAreaData
  } = useFirebaseRealtime<Record<string, RealtimeArea>>({
    path: 'areas',
    enabled: isFirebaseEnabled
  });

  // Convert Firebase objects to arrays
  const [customers, setCustomers] = useState<RealtimeCustomer[]>([]);
  const [payments, setPayments] = useState<RealtimePayment[]>([]);
  const [areas, setAreas] = useState<RealtimeArea[]>([]);

  useEffect(() => {
    if (customersData) {
      const customersList = Object.keys(customersData).map(key => ({
        id: key,
        ...customersData[key]
      }));
      console.log('Firebase customers data updated:', customersList.length);
      setCustomers(customersList);
    } else if (isFirebaseEnabled) {
      console.log('No customers data, setting empty array');
      setCustomers([]);
    }
  }, [customersData, isFirebaseEnabled]);

  useEffect(() => {
    if (paymentsData) {
      const paymentsList = Object.keys(paymentsData).map(key => ({
        id: key,
        ...paymentsData[key]
      }));
      console.log('Firebase payments data updated:', paymentsList.length);
      setPayments(paymentsList);
    } else if (isFirebaseEnabled) {
      console.log('No payments data, setting empty array');
      setPayments([]);
    }
  }, [paymentsData, isFirebaseEnabled]);

  useEffect(() => {
    if (areasData) {
      const areasList = Object.keys(areasData).map(key => ({
        id: key,
        ...areasData[key]
      }));
      console.log('Firebase areas data updated:', areasList.length);
      setAreas(areasList);
    } else if (isFirebaseEnabled) {
      console.log('No areas data, setting empty array');
      setAreas([]);
    }
  }, [areasData, isFirebaseEnabled]);

  const isLoading = customersLoading || paymentsLoading || areasLoading;
  const isConnected = customersConnected && paymentsConnected && areasConnected;
  const isDataSynced = !isLoading && isFirebaseEnabled;

  // Customer operations
  const saveCustomer = async (customer: Omit<RealtimeCustomer, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<boolean> => {
    if (!firebaseUser) {
      console.error('No Firebase user for saving customer');
      return false;
    }
    
    try {
      const customerWithUserId = { ...customer, userId: firebaseUser.uid };
      console.log('Saving customer to Firebase:', customerWithUserId.name);
      await pushCustomer(customerWithUserId);
      
      toast({
        title: "Customer saved",
        description: "Customer data synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error saving customer:', error);
      return false;
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<RealtimeCustomer>): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      console.log('Updating customer in Firebase:', customerId);
      await updateCustomerData(updates, customerId);
      
      toast({
        title: "Customer updated",
        description: "Changes synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  };

  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      console.log('Deleting customer from Firebase:', customerId);
      await deleteCustomerData(customerId);
      
      toast({
        title: "Customer deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  };

  // Payment operations
  const savePayment = async (payment: Omit<RealtimePayment, 'userId' | 'createdAt' | 'id'>): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      const paymentWithUserId = { ...payment, userId: firebaseUser.uid };
      console.log('Saving payment to Firebase:', paymentWithUserId.amount);
      await pushPayment(paymentWithUserId);
      
      toast({
        title: "Payment recorded",
        description: "Payment synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error saving payment:', error);
      return false;
    }
  };

  const updatePayment = async (paymentId: string, updates: Partial<RealtimePayment>): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      await updatePaymentData(updates, paymentId);
      
      toast({
        title: "Payment updated",
        description: "Changes synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error updating payment:', error);
      return false;
    }
  };

  const deletePayment = async (paymentId: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      await deletePaymentData(paymentId);
      
      toast({
        title: "Payment deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      return false;
    }
  };

  // Area operations
  const saveArea = async (area: Omit<RealtimeArea, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      const areaWithUserId = { ...area, userId: firebaseUser.uid };
      console.log('Saving area to Firebase:', areaWithUserId.name);
      await pushArea(areaWithUserId);
      
      toast({
        title: "Area saved",
        description: "Area synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error saving area:', error);
      return false;
    }
  };

  const updateArea = async (areaId: string, updates: Partial<RealtimeArea>): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      await updateAreaData(updates, areaId);
      
      toast({
        title: "Area updated",
        description: "Changes synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error updating area:', error);
      return false;
    }
  };

  const deleteArea = async (areaId: string): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      await deleteAreaData(areaId);
      
      toast({
        title: "Area deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } catch (error) {
      console.error('Error deleting area:', error);
      return false;
    }
  };

  const migrateLocalData = async (localData: any): Promise<boolean> => {
    if (!firebaseUser) return false;
    
    try {
      console.log('Starting data migration to Firebase Realtime Database...');

      // Migrate customers
      if (localData.customers && localData.customers.length > 0) {
        for (const customer of localData.customers) {
          await pushCustomer({ ...customer, userId: firebaseUser.uid });
        }
        console.log(`Migrated ${localData.customers.length} customers`);
      }

      // Migrate payments
      if (localData.payments && localData.payments.length > 0) {
        for (const payment of localData.payments) {
          await pushPayment({ ...payment, userId: firebaseUser.uid });
        }
        console.log(`Migrated ${localData.payments.length} payments`);
      }

      // Migrate areas
      if (localData.areas && localData.areas.length > 0) {
        for (const area of localData.areas) {
          await pushArea({ ...area, userId: firebaseUser.uid });
        }
        console.log(`Migrated ${localData.areas.length} areas`);
      }

      toast({
        title: "Data migration successful",
        description: "Your local data is now synced across all devices",
      });
      
      console.log('Data migration to Realtime Database completed successfully');
      return true;
    } catch (error) {
      console.error('Error during data migration:', error);
      toast({
        title: "Data migration failed",
        description: "Some data may not have been migrated successfully",
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
