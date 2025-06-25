
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { firebaseDataService, FirebaseCustomer, FirebasePayment, FirebaseArea } from '@/services/FirebaseDataService';
import { useToast } from '@/hooks/use-toast';

interface FirebaseDataContextType {
  customers: FirebaseCustomer[];
  payments: FirebasePayment[];
  areas: FirebaseArea[];
  isLoading: boolean;
  isDataSynced: boolean;
  saveCustomer: (customer: Omit<FirebaseCustomer, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateCustomer: (customerId: string, updates: Partial<FirebaseCustomer>) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  savePayment: (payment: Omit<FirebasePayment, 'userId' | 'createdAt'>) => Promise<boolean>;
  updatePayment: (paymentId: string, updates: Partial<FirebasePayment>) => Promise<boolean>;
  deletePayment: (paymentId: string) => Promise<boolean>;
  saveArea: (area: Omit<FirebaseArea, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateArea: (areaId: string, updates: Partial<FirebaseArea>) => Promise<boolean>;
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
  const [customers, setCustomers] = useState<FirebaseCustomer[]>([]);
  const [payments, setPayments] = useState<FirebasePayment[]>([]);
  const [areas, setAreas] = useState<FirebaseArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataSynced, setIsDataSynced] = useState(false);
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
    console.log('Setting up Firebase real-time subscriptions for user:', user.id);

    // Subscribe to customers
    const unsubscribeCustomers = firebaseDataService.subscribeToCustomers(user.id, (newCustomers) => {
      console.log('Received customers update:', newCustomers.length);
      setCustomers(newCustomers);
    });

    // Subscribe to payments
    const unsubscribePayments = firebaseDataService.subscribeToPayments(user.id, (newPayments) => {
      console.log('Received payments update:', newPayments.length);
      setPayments(newPayments);
    });

    // Subscribe to areas
    const unsubscribeAreas = firebaseDataService.subscribeToAreas(user.id, (newAreas) => {
      console.log('Received areas update:', newAreas.length);
      setAreas(newAreas);
    });

    // Mark as synced after initial load
    setTimeout(() => {
      setIsLoading(false);
      setIsDataSynced(true);
    }, 1000);

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up Firebase subscriptions');
      unsubscribeCustomers();
      unsubscribePayments();
      unsubscribeAreas();
    };
  }, [user, firebaseUser]);

  const saveCustomer = async (customer: Omit<FirebaseCustomer, 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseDataService.saveCustomer(user.id, customer);
    if (result.success) {
      toast({
        title: "Customer saved",
        description: "Customer data has been saved successfully",
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

  const updateCustomer = async (customerId: string, updates: Partial<FirebaseCustomer>): Promise<boolean> => {
    const result = await firebaseDataService.updateCustomer(customerId, updates);
    if (result.success) {
      toast({
        title: "Customer updated",
        description: "Customer data has been updated successfully",
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
    const result = await firebaseDataService.deleteCustomer(customerId);
    if (result.success) {
      toast({
        title: "Customer deleted",
        description: "Customer has been deleted successfully",
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

  const savePayment = async (payment: Omit<FirebasePayment, 'userId' | 'createdAt'>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseDataService.savePayment(user.id, payment);
    if (result.success) {
      toast({
        title: "Payment saved",
        description: "Payment has been recorded successfully",
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

  const updatePayment = async (paymentId: string, updates: Partial<FirebasePayment>): Promise<boolean> => {
    const result = await firebaseDataService.updatePayment(paymentId, updates);
    if (result.success) {
      toast({
        title: "Payment updated",
        description: "Payment has been updated successfully",
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
    const result = await firebaseDataService.deletePayment(paymentId);
    if (result.success) {
      toast({
        title: "Payment deleted",
        description: "Payment has been deleted successfully",
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

  const saveArea = async (area: Omit<FirebaseArea, 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseDataService.saveArea(user.id, area);
    if (result.success) {
      toast({
        title: "Area saved",
        description: "Area has been saved successfully",
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

  const updateArea = async (areaId: string, updates: Partial<FirebaseArea>): Promise<boolean> => {
    const result = await firebaseDataService.updateArea(areaId, updates);
    if (result.success) {
      toast({
        title: "Area updated",
        description: "Area has been updated successfully",
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
    const result = await firebaseDataService.deleteArea(areaId);
    if (result.success) {
      toast({
        title: "Area deleted",
        description: "Area has been deleted successfully",
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
    const result = await firebaseDataService.migrateLocalData(user.id, localData);
    setIsLoading(false);
    
    if (result.success) {
      toast({
        title: "Data migration successful",
        description: "Your local data has been migrated to the cloud",
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
