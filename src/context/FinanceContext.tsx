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
  // Additional properties for compatibility
  totalAmountGiven: number;
  totalAmountToBePaid: number;
  totalPaid: number;
  interestAmount?: number;
  interestPercentage?: number;
  penaltyAmount?: number;
  dailyAmount?: number;
  paymentCategory?: 'daily' | 'weekly' | 'monthly';
  issuedDate: string;
  deadlineDate?: string;
  isFullyPaid: boolean;
  areaId?: string;
  numberOfDays: number;
  numberOfWeeks?: number;
  numberOfMonths?: number;
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

export interface DailyEarning {
  id: string;
  date: string;
  totalInterestEarned: number;
  totalPrincipleEarned: number;
  isWeeklyTotal?: boolean;
  isMonthlyTotal?: boolean;
  weekStartDate?: string;
  monthYear?: string;
  areaId?: string;
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
  addArea: (area: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>) => Area;
  updateArea: (id: string, updates: Partial<Area>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  getCustomerBySerialNumber: (serialNumber: string) => Customer | undefined;
  setCurrentAreaId: (areaId: string | null) => void;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'error';
  // Additional methods
  getCurrentAreaCustomers: () => Customer[];
  getAreaById: (id: string) => Area | undefined;
  setCurrentArea: (area: Area | null) => void;
  calculateDailyInterestEarnings: (date?: string) => number;
  calculateWeeklyInterestEarnings: (date?: string) => number;
  calculateMonthlyInterestEarnings: (month?: string, year?: string) => number;
  getCurrentAreaDailyEarnings: () => DailyEarning[];
  deleteDailyInterestEarning: (id: string) => void;
  getAreaCustomers: (areaId: string) => Customer[];
  getAreaPayments: (areaId: string) => Payment[];
  getCurrentAreaPayments: () => Payment[];
  getCustomerPayments: (customerId: string) => Payment[];
  updateCustomerPaymentStatus: (customerId: string) => Promise<void>;
  calculateAllPenalties: () => void;
  calculateTotalEarnings: () => number;
  addPaymentBatch: (payments: Omit<Payment, 'id'>[]) => Promise<{ success: boolean; errors: string[] }>;
  recalculateAllCustomerPayments: () => void;
  getDailyCollections: (date: string) => Payment[];
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
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);

  // Convert Firebase data to local interfaces
  const customers: Customer[] = firebaseData.customers.map(customer => {
    const totalAmountGiven = customer.loanAmount || 0;
    const interestAmount = (customer.loanAmount || 0) * 0.1; // 10% default interest
    const totalAmountToBePaid = totalAmountGiven + interestAmount;
    const totalPaid = customer.paidInstallments * (customer.installmentAmount || 0);
    const defaultNumberOfDays = 30; // Default loan period
    
    return {
      id: customer.id,
      name: customer.name,
      serialNumber: customer.id.slice(-8), // Use last 8 chars of ID as serial
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
      updatedAt: customer.updatedAt,
      // Additional calculated properties
      totalAmountGiven,
      totalAmountToBePaid,
      totalPaid,
      interestAmount,
      interestPercentage: 10,
      penaltyAmount: 0,
      dailyAmount: customer.installmentAmount,
      paymentCategory: customer.collectionType,
      issuedDate: customer.startDate,
      deadlineDate: customer.endDate,
      isFullyPaid: totalPaid >= totalAmountToBePaid,
      areaId: customer.area,
      numberOfDays: defaultNumberOfDays,
      numberOfWeeks: Math.ceil(defaultNumberOfDays / 7),
      numberOfMonths: Math.ceil(defaultNumberOfDays / 30)
    };
  });

  const payments: Payment[] = firebaseData.payments.map(payment => ({
    id: payment.id,
    customerId: payment.customerId,
    customerName: payment.customerName,
    serialNumber: payment.customerId.slice(-8), // Use last 8 chars of customer ID
    amount: payment.amount,
    date: payment.date,
    collectionType: payment.collectionType,
    agentName: payment.area || 'Not specified', // Use area as agent name temporarily
    areaId: payment.area
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
      status: customer.status
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
      paymentMethod: 'cash'
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

  const addArea = (area: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>): Area => {
    const newArea: Area = {
      id: `area_${Date.now()}`,
      name: area.name,
      description: area.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (firebaseUser) {
      firebaseData.saveArea({
        name: area.name,
        description: area.description,
        totalCustomers: 0,
        totalAmount: 0,
        collectedAmount: 0,
        pendingAmount: 0
      });
    }

    return newArea;
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

  // Additional helper methods
  const getCurrentAreaCustomers = (): Customer[] => {
    if (!currentAreaId) return customers;
    return customers.filter(customer => customer.areaId === currentAreaId || customer.area === currentAreaId);
  };

  const getAreaById = (id: string): Area | undefined => {
    return areas.find(area => area.id === id);
  };

  const setCurrentArea = (area: Area | null) => {
    setCurrentAreaId(area ? area.id : null);
  };

  const calculateDailyInterestEarnings = (date?: string): number => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter(p => p.date === targetDate);
    return todayPayments.reduce((sum, p) => sum + (p.amount * 0.1), 0);
  };

  const calculateWeeklyInterestEarnings = (date?: string): number => {
    const targetDate = date ? new Date(date) : new Date();
    const weekStart = new Date(targetDate.setDate(targetDate.getDate() - targetDate.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekPayments = payments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= weekStart && paymentDate <= weekEnd;
    });
    
    return weekPayments.reduce((sum, p) => sum + (p.amount * 0.1), 0);
  };

  const calculateMonthlyInterestEarnings = (month?: string, year?: string): number => {
    const targetMonth = month || (new Date().getMonth() + 1).toString();
    const targetYear = year || new Date().getFullYear().toString();
    
    const monthPayments = payments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate.getMonth() + 1 === parseInt(targetMonth) && 
             paymentDate.getFullYear() === parseInt(targetYear);
    });
    
    return monthPayments.reduce((sum, p) => sum + (p.amount * 0.1), 0);
  };

  const getCurrentAreaDailyEarnings = (): DailyEarning[] => {
    return dailyEarnings.filter(earning => 
      !currentAreaId || earning.areaId === currentAreaId
    );
  };

  const deleteDailyInterestEarning = (id: string) => {
    setDailyEarnings(prev => prev.filter(earning => earning.id !== id));
  };

  const getAreaCustomers = (areaId: string): Customer[] => {
    return customers.filter(customer => customer.areaId === areaId || customer.area === areaId);
  };

  const getAreaPayments = (areaId: string): Payment[] => {
    return payments.filter(payment => payment.areaId === areaId);
  };

  const getCurrentAreaPayments = (): Payment[] => {
    if (!currentAreaId) return payments;
    return payments.filter(payment => payment.areaId === currentAreaId);
  };

  const getCustomerPayments = (customerId: string): Payment[] => {
    return payments.filter(payment => payment.customerId === customerId);
  };

  const updateCustomerPaymentStatus = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerPayments = getCustomerPayments(customerId);
    const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const isFullyPaid = totalPaid >= customer.totalAmountToBePaid;
    
    await updateCustomer(customerId, { 
      totalPaid,
      isFullyPaid,
      paidInstallments: customerPayments.length,
      balanceAmount: customer.totalAmountToBePaid - totalPaid
    });
  };

  const calculateAllPenalties = () => {
    // Implementation for calculating penalties
    console.log('Calculating penalties for all customers');
  };

  const calculateTotalEarnings = (): number => {
    return payments.reduce((sum, payment) => sum + (payment.amount * 0.1), 0);
  };

  const addPaymentBatch = async (batchPayments: Omit<Payment, 'id'>[]): Promise<{ success: boolean; errors: string[] }> => {
    const errors: string[] = [];
    let successCount = 0;
    
    for (const payment of batchPayments) {
      try {
        await addPayment(payment);
        successCount++;
      } catch (error) {
        console.error('Error adding payment:', error);
        errors.push(`Failed to add payment for ${payment.customerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      success: successCount === batchPayments.length,
      errors
    };
  };

  const recalculateAllCustomerPayments = () => {
    // Implementation for recalculating customer payments
    console.log('Recalculating all customer payments');
  };

  const getDailyCollections = (date: string): Payment[] => {
    return payments.filter(payment => payment.date === date);
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
    syncStatus,
    getCurrentAreaCustomers,
    getAreaById,
    setCurrentArea,
    calculateDailyInterestEarnings,
    calculateWeeklyInterestEarnings,
    calculateMonthlyInterestEarnings,
    getCurrentAreaDailyEarnings,
    deleteDailyInterestEarning,
    getAreaCustomers,
    getAreaPayments,
    getCurrentAreaPayments,
    getCustomerPayments,
    updateCustomerPaymentStatus,
    calculateAllPenalties,
    calculateTotalEarnings,
    addPaymentBatch,
    recalculateAllCustomerPayments,
    getDailyCollections
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
