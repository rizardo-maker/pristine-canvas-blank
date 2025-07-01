
import React, { createContext, useContext } from 'react';
import { useFirebaseData } from './FirebaseDataContext';

// Types for the finance data
export interface Customer {
  id: string;
  name: string;
  area: string;
  mobile: string;
  loanAmount: number;
  installmentAmount: number;
  collectionType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  address: string;
  guarantor: string;
  guarantorMobile: string;
  totalInstallments: number;
  paidInstallments: number;
  balanceAmount: number;
  status: 'active' | 'completed' | 'defaulted';
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  serialNumber: string;
  amount: number;
  date: string;
  collectionType: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  userId: string;
}

export interface Area {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface FinanceContextType {
  customers: Customer[];
  payments: Payment[];
  areas: Area[];
  isLoading: boolean;
  isConnected: boolean;
  addCustomer: (customer: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  addPayment: (payment: Omit<Payment, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => Promise<boolean>;
  deletePayment: (paymentId: string) => Promise<boolean>;
  addArea: (area: Omit<Area, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateArea: (areaId: string, updates: Partial<Area>) => Promise<boolean>;
  deleteArea: (areaId: string) => Promise<boolean>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    customers,
    payments,
    areas,
    isLoading,
    isConnected,
    saveCustomer,
    updateCustomer,
    deleteCustomer,
    savePayment,
    updatePayment,
    deletePayment,
    saveArea,
    updateArea,
    deleteArea
  } = useFirebaseData();

  const addCustomer = async (customer: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    return await saveCustomer(customer);
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'userId' | 'createdAt'>): Promise<boolean> => {
    return await savePayment(payment);
  };

  const addArea = async (area: Omit<Area, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    return await saveArea(area);
  };

  return (
    <FinanceContext.Provider value={{
      customers,
      payments,
      areas,
      isLoading,
      isConnected,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addPayment,
      updatePayment,
      deletePayment,
      addArea,
      updateArea,
      deleteArea
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
