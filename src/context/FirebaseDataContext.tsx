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
  const { user, firebaseUser } = useFirebaseAuth();
  const { toast } = useToast();

  // Use the new hook for each data type
  const {
    data: customersData,
    loading: customersLoading,
    connected: customersConnected,
    pushData: pushCustomer,
    updateData: updateCustomerData,
    deleteData: deleteCustomerData
  } = useFirebaseRealtime<Record<string, RealtimeCustomer>>({
    path: 'customers',
    enabled: !!user && !!firebaseUser
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
    enabled: !!user && !!firebaseUser
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
    enabled: !!user && !!firebaseUser
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
      console.log('Customers data updated:', customersList.length);
      setCustomers(customersList);
    } else {
      setCustomers([]);
    }
  }, [customersData]);

  useEffect(() => {
    if (paymentsData) {
      const paymentsList = Object.keys(paymentsData).map(key => ({
        id: key,
        ...paymentsData[key]
      }));
      console.log('Payments data updated:', paymentsList.length);
      setPayments(paymentsList);
    } else {
      setPayments([]);
    }
  }, [paymentsData]);

  useEffect(() => {
    if (areasData) {
      const areasList = Object.keys(areasData).map(key => ({
        id: key,
        ...areasData[key]
      }));
      console.log('Areas data updated:', areasList.length);
      setAreas(areasList);
    } else {
      setAreas([]);
    }
  }, [areasData]);

  const isLoading = customersLoading || paymentsLoading || areasLoading;
  const isConnected = customersConnected && paymentsConnected && areasConnected;
  const isDataSynced = !isLoading && !!user && !!firebaseUser;

  // Customer operations
  const saveCustomer = async (customer: Omit<RealtimeCustomer, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const customerWithUserId = { ...customer, userId: user.id };
      await pushCustomer(customerWithUserId);
      
      toast({
        title: "Customer saved",
        description: "Customer data synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<RealtimeCustomer>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await updateCustomerData(updates, customerId);
      
      toast({
        title: "Customer updated",
        description: "Changes synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await deleteCustomerData(customerId);
      
      toast({
        title: "Customer deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const savePayment = async (payment: Omit<RealtimePayment, 'userId' | 'createdAt' | 'id'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const paymentWithUserId = { ...payment, userId: user.id };
      await pushPayment(paymentWithUserId);
      
      toast({
        title: "Payment recorded",
        description: "Payment synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const updatePayment = async (paymentId: string, updates: Partial<RealtimePayment>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await updatePaymentData(updates, paymentId);
      
      toast({
        title: "Payment updated",
        description: "Changes synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const deletePayment = async (paymentId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await deletePaymentData(paymentId);
      
      toast({
        title: "Payment deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const saveArea = async (area: Omit<RealtimeArea, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const areaWithUserId = { ...area, userId: user.id };
      await pushArea(areaWithUserId);
      
      toast({
        title: "Area saved",
        description: "Area synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateArea = async (areaId: string, updates: Partial<RealtimeArea>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await updateAreaData(updates, areaId);
      
      toast({
        title: "Area updated",
        description: "Changes synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const deleteArea = async (areaId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await deleteAreaData(areaId);
      
      toast({
        title: "Area deleted",
        description: "Deletion synced across all devices",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const migrateLocalData = async (localData: any): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log('Starting data migration to Firebase Realtime Database...');

      // Migrate customers
      if (localData.customers && localData.customers.length > 0) {
        for (const customer of localData.customers) {
          await pushCustomer({ ...customer, userId: user.id });
        }
        console.log(`Migrated ${localData.customers.length} customers`);
      }

      // Migrate payments
      if (localData.payments && localData.payments.length > 0) {
        for (const payment of localData.payments) {
          await pushPayment({ ...payment, userId: user.id });
        }
        console.log(`Migrated ${localData.payments.length} payments`);
      }

      // Migrate areas
      if (localData.areas && localData.areas.length > 0) {
        for (const area of localData.areas) {
          await pushArea({ ...area, userId: user.id });
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
