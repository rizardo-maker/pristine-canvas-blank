
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { useFirebaseData } from './FirebaseDataContext';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useDataSync } from '@/hooks/useDataSync';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  serialNumber: string;
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
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  serialNumber: string;
  amount: number;
  date: string;
  collectionType: 'daily' | 'weekly' | 'monthly';
  agentName: string;
  areaId?: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface FinanceContextType {
  customers: Customer[];
  payments: Payment[];
  areas: Area[];
  currentAreaId: string | null;
  isLoading: boolean;
  isDataSynced: boolean;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addArea: (area: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateArea: (id: string, updates: Partial<Area>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  getCustomerBySerialNumber: (serialNumber: string) => Customer | undefined;
  setCurrentAreaId: (areaId: string | null) => void;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'error';
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
  const { user: firebaseUser } = useFirebaseAuth();
  const firebaseData = useFirebaseData();
  const { syncStatus, isFirebaseReady } = useDataSync();
  const { toast } = useToast();
  const [currentAreaId, setCurrentAreaId] = useLocalStorage<string | null>('currentAreaId', null);

  // Convert Firebase data to local interfaces
  const customers: Customer[] = firebaseData.customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    serialNumber: customer.serialNumber || '',
    area: customer.area,
    mobile: customer.mobile,
    loanAmount: customer.loanAmount,
    installmentAmount: customer.installmentAmount,
    collectionType: customer.collectionType,
    startDate: customer.startDate,
    endDate: customer.endDate,
    address: customer.address,
    guarantor: customer.guarantor,
    guarantorMobile: customer.guarantorMobile,
    totalInstallments: customer.totalInstallments,
    paidInstallments: customer.paidInstallments,
    balanceAmount: customer.balanceAmount,
    status: customer.status,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  }));

  const payments: Payment[] = firebaseData.payments.map(payment => ({
    id: payment.id,
    customerId: payment.customerId,
    customerName: payment.customerName,
    serialNumber: payment.serialNumber || '',
    amount: payment.amount,
    date: payment.date,
    collectionType: payment.collectionType,
    agentName: payment.agentName || 'Not specified',
    areaId: payment.areaId
  }));

  const areas: Area[] = firebaseData.areas.map(area => ({
    id: area.id,
    name: area.name,
    description: area.description,
    createdAt: area.createdAt,
    updatedAt: area.updatedAt
  }));

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add customers",
        variant: "destructive",
      });
      return;
    }

    const success = await firebaseData.saveCustomer({
      name: customer.name,
      area: customer.area,
      mobile: customer.mobile,
      loanAmount: customer.loanAmount,
      installmentAmount: customer.installmentAmount,
      collectionType: customer.collectionType,
      startDate: customer.startDate,
      endDate: customer.endDate,
      address: customer.address,
      guarantor: customer.guarantor,
      guarantorMobile: customer.guarantorMobile,
      totalInstallments: customer.totalInstallments,
      paidInstallments: customer.paidInstallments,
      balanceAmount: customer.balanceAmount,
      status: customer.status,
      serialNumber: customer.serialNumber
    });

    if (!success) {
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!firebaseUser) return;
    
    const success = await firebaseData.updateCustomer(id, updates);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!firebaseUser) return;
    
    const success = await firebaseData.deleteCustomer(id);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id'>) => {
    if (!firebaseUser) return;
    
    const success = await firebaseData.savePayment({
      customerId: payment.customerId,
      customerName: payment.customerName,
      amount: payment.amount,
      date: payment.date,
      area: payment.areaId || 'default',
      collectionType: payment.collectionType,
      paymentMethod: 'cash',
      serialNumber: payment.serialNumber,
      agentName: payment.agentName,
      areaId: payment.areaId
    });

    if (!success) {
      toast({
        title: "Error",
        description: "Failed to add payment",
        variant: "destructive",
      });
    }
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    if (!firebaseUser) return;
    
    const success = await firebaseData.updatePayment(id, updates);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    }
  };

  const deletePayment = async (id: string) => {
    if (!firebaseUser) return;
    
    const success = await firebaseData.deletePayment(id);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
  };

  const addArea = async (area: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseUser) return;
    
    const success = await firebaseData.saveArea({
      name: area.name,
      description: area.description,
      totalCustomers: 0,
      totalAmount: 0,
      collectedAmount: 0,
      pendingAmount: 0
    });

    if (!success) {
      toast({
        title: "Error",
        description: "Failed to add area",
        variant: "destructive",
      });
    }
  };

  const updateArea = async (id: string, updates: Partial<Area>) => {
    if (!firebaseUser) return;
    
    const success = await firebaseData.updateArea(id, updates);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to update area",
        variant: "destructive",
      });
    }
  };

  const deleteArea = async (id: string) => {
    if (!firebaseUser) return;
    
    const success = await firebaseData.deleteArea(id);
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to delete area",
        variant: "destructive",
      });
    }
  };

  const getCustomerBySerialNumber = (serialNumber: string): Customer | undefined => {
    return customers.find(customer => customer.serialNumber === serialNumber);
  };

  const value: FinanceContextType = {
    customers,
    payments,
    areas,
    currentAreaId,
    isLoading: firebaseData.isLoading,
    isDataSynced: firebaseData.isDataSynced && isFirebaseReady,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addPayment,
    updatePayment,
    deletePayment,
    addArea,
    updateArea,
    deleteArea,
    getCustomerBySerialNumber,
    setCurrentAreaId,
    syncStatus
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
