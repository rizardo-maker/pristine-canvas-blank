import React, { createContext, useContext, useState } from 'react';
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
  
  // Additional properties expected by components
  serialNumber: string;
  deadlineDate?: string;
  issuedDate: string;
  isFullyPaid: boolean;
  totalAmountToBePaid: number;
  penaltyAmount?: number;
  totalPaid: number;
  totalAmountGiven: number;
  dailyAmount?: number;
  interestAmount?: number;
  
  // Properties from old local storage system
  paymentCategory?: 'daily' | 'weekly' | 'monthly';
  numberOfDays?: number;
  numberOfWeeks?: number;
  numberOfMonths?: number;
  interestPercentage?: number;
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
  agentName?: string;
  
  // Additional properties for Firebase compatibility
  area?: string;
  paymentMethod?: 'cash' | 'online' | 'check';
  notes?: string;
  receiptNumber?: string;
}

export interface Area {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  
  // Additional properties for Firebase compatibility
  description?: string;
  totalCustomers?: number;
  totalAmount?: number;
  collectedAmount?: number;
  pendingAmount?: number;
}

interface FinanceContextType {
  customers: Customer[];
  payments: Payment[];
  areas: Area[];
  isLoading: boolean;
  isConnected: boolean;
  currentAreaId: string | null;
  addCustomer: (customer: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  addPayment: (payment: Omit<Payment, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => Promise<boolean>;
  deletePayment: (paymentId: string) => Promise<boolean>;
  addArea: (area: Omit<Area, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateArea: (areaId: string, updates: Partial<Area>) => Promise<boolean>;
  deleteArea: (areaId: string) => Promise<boolean>;
  
  // Area management methods
  getCurrentAreaCustomers: () => Customer[];
  getAreaById: (areaId: string) => Area | undefined;
  setCurrentAreaId: (areaId: string | null) => void;
  
  // Additional missing methods
  setCurrentArea: (areaId: string | null) => void;
  getAreaCustomers: (areaId: string) => Customer[];
  getAreaPayments: (areaId: string) => Payment[];
  getCurrentAreaPayments: () => Payment[];
  getCustomerPayments: (customerId: string) => Payment[];
  updateCustomerPaymentStatus: (customerId: string, status: string) => Promise<boolean>;
  calculateAllPenalties: () => void;
  calculateTotalEarnings: () => number;
  getCurrentAreaDailyEarnings: (date?: string) => any[];
  deleteDailyInterestEarning: (earningId: string) => Promise<boolean>;
  
  // Interest calculation methods
  calculateDailyInterestEarnings: (date: string) => number;
  calculateWeeklyInterestEarnings: (weekStartDate: string) => number;
  calculateMonthlyInterestEarnings: (month: string, year: string) => number;
  
  // Missing methods from Posting page
  addPaymentBatch: (payments: Payment[]) => Promise<{ success: boolean; errors: string[] }>;
  getCustomerBySerialNumber: (serialNumber: string) => Customer | undefined;
  recalculateAllCustomerPayments: () => void;
  
  // Missing methods from Collections
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
  const {
    customers: firebaseCustomers,
    payments: firebasePayments,
    areas: firebaseAreas,
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

  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null);

  // Convert Firebase types to local types with proper mapping
  const customers: Customer[] = firebaseCustomers.map(customer => ({
    ...customer,
    serialNumber: customer.id || '',
    issuedDate: customer.startDate || customer.createdAt,
    isFullyPaid: customer.status === 'completed',
    totalAmountToBePaid: customer.loanAmount + (customer.loanAmount * 0.1), // Simple interest calculation
    penaltyAmount: 0,
    totalPaid: customer.loanAmount - customer.balanceAmount,
    totalAmountGiven: customer.loanAmount,
    dailyAmount: customer.installmentAmount,
    interestAmount: customer.loanAmount * 0.1,
    paymentCategory: customer.collectionType,
    numberOfDays: customer.collectionType === 'daily' ? customer.totalInstallments : undefined,
    numberOfWeeks: customer.collectionType === 'weekly' ? Math.ceil(customer.totalInstallments / 7) : undefined,
    numberOfMonths: customer.collectionType === 'monthly' ? Math.ceil(customer.totalInstallments / 30) : undefined,
    interestPercentage: 10
  }));

  const payments: Payment[] = firebasePayments.map(payment => ({
    ...payment,
    serialNumber: payment.customerId || payment.id,
    area: payment.area || '',
    paymentMethod: payment.paymentMethod || 'cash'
  }));

  const areas: Area[] = firebaseAreas.map(area => ({
    ...area,
    description: area.description || '',
    totalCustomers: area.totalCustomers || 0,
    totalAmount: area.totalAmount || 0,
    collectedAmount: area.collectedAmount || 0,
    pendingAmount: area.pendingAmount || 0
  }));

  const addCustomer = async (customer: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    // Map to Firebase format
    const firebaseCustomer = {
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
    };
    
    return await saveCustomer(firebaseCustomer);
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'userId' | 'createdAt'>): Promise<boolean> => {
    // Map to Firebase format
    const firebasePayment = {
      customerId: payment.customerId,
      customerName: payment.customerName,
      amount: payment.amount,
      date: payment.date,
      area: payment.area || '',
      collectionType: payment.collectionType,
      paymentMethod: payment.paymentMethod || 'cash',
      notes: payment.notes,
      receiptNumber: payment.receiptNumber
    };
    
    return await savePayment(firebasePayment);
  };

  const addArea = async (area: Omit<Area, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    // Map to Firebase format
    const firebaseArea = {
      name: area.name,
      description: area.description || '',
      totalCustomers: area.totalCustomers || 0,
      totalAmount: area.totalAmount || 0,
      collectedAmount: area.collectedAmount || 0,
      pendingAmount: area.pendingAmount || 0
    };
    
    return await saveArea(firebaseArea);
  };

  // Area management methods
  const getCurrentAreaCustomers = (): Customer[] => {
    if (!currentAreaId) return customers;
    return customers.filter(customer => customer.area === currentAreaId);
  };

  const getAreaById = (areaId: string): Area | undefined => {
    return areas.find(area => area.id === areaId);
  };

  const setCurrentArea = (areaId: string | null) => {
    setCurrentAreaId(areaId);
  };

  const getAreaCustomers = (areaId: string): Customer[] => {
    return customers.filter(customer => customer.area === areaId);
  };

  const getAreaPayments = (areaId: string): Payment[] => {
    const areaCustomers = getAreaCustomers(areaId);
    const areaCustomerIds = areaCustomers.map(c => c.id);
    return payments.filter(payment => areaCustomerIds.includes(payment.customerId));
  };

  const getCurrentAreaPayments = (): Payment[] => {
    if (!currentAreaId) return payments;
    return getAreaPayments(currentAreaId);
  };

  const getCustomerPayments = (customerId: string): Payment[] => {
    return payments.filter(payment => payment.customerId === customerId);
  };

  const updateCustomerPaymentStatus = async (customerId: string, status: string): Promise<boolean> => {
    return await updateCustomer(customerId, { status: status as any });
  };

  const calculateAllPenalties = () => {
    // Placeholder implementation
    console.log('Calculating all penalties...');
  };

  const calculateTotalEarnings = (): number => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getCurrentAreaDailyEarnings = (date?: string): any[] => {
    // Return empty array for now since this is a complex calculation
    console.log('Getting current area daily earnings for date:', date);
    return [];
  };

  const deleteDailyInterestEarning = async (earningId: string): Promise<boolean> => {
    // This would delete a specific earning record
    return await deletePayment(earningId);
  };

  // Interest calculation methods
  const calculateDailyInterestEarnings = (date: string): number => {
    const dayPayments = payments.filter(payment => payment.date === date);
    if (currentAreaId) {
      const areaCustomers = getCurrentAreaCustomers();
      const areaCustomerIds = areaCustomers.map(c => c.id);
      return dayPayments
        .filter(payment => areaCustomerIds.includes(payment.customerId))
        .reduce((sum, payment) => {
          const customer = areaCustomers.find(c => c.id === payment.customerId);
          return sum + ((customer?.interestAmount || 0) / (customer?.totalInstallments || 1));
        }, 0);
    }
    return dayPayments.reduce((sum, payment) => {
      const customer = customers.find(c => c.id === payment.customerId);
      return sum + ((customer?.interestAmount || 0) / (customer?.totalInstallments || 1));
    }, 0);
  };

  const calculateWeeklyInterestEarnings = (weekStartDate: string): number => {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    let totalInterest = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      totalInterest += calculateDailyInterestEarnings(dateStr);
    }
    return totalInterest;
  };

  const calculateMonthlyInterestEarnings = (month: string, year: string): number => {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    
    let totalInterest = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      totalInterest += calculateDailyInterestEarnings(dateStr);
    }
    return totalInterest;
  };

  // Missing methods from Posting page
  const addPaymentBatch = async (payments: Payment[]): Promise<{ success: boolean; errors: string[] }> => {
    const errors: string[] = [];
    let successCount = 0;
    
    try {
      for (const payment of payments) {
        const success = await addPayment(payment);
        if (success) {
          successCount++;
        } else {
          errors.push(`Failed to add payment for ${payment.customerName}`);
        }
      }
      
      return {
        success: successCount > 0,
        errors
      };
    } catch (error) {
      console.error('Error adding payment batch:', error);
      return {
        success: false,
        errors: ['Unexpected error occurred while adding payments']
      };
    }
  };

  const getCustomerBySerialNumber = (serialNumber: string): Customer | undefined => {
    return customers.find(customer => customer.serialNumber === serialNumber);
  };

  const recalculateAllCustomerPayments = () => {
    console.log('Recalculating all customer payments...');
    // Placeholder implementation
  };

  // Missing methods from Collections
  const getDailyCollections = (date: string): Payment[] => {
    return payments.filter(payment => payment.date === date);
  };

  return (
    <FinanceContext.Provider value={{
      customers,
      payments,
      areas,
      isLoading,
      isConnected,
      currentAreaId,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addPayment,
      updatePayment,
      deletePayment,
      addArea,
      updateArea,
      deleteArea,
      getCurrentAreaCustomers,
      getAreaById,
      setCurrentAreaId,
      setCurrentArea,
      getAreaCustomers,
      getAreaPayments,
      getCurrentAreaPayments,
      getCustomerPayments,
      updateCustomerPaymentStatus,
      calculateAllPenalties,
      calculateTotalEarnings,
      getCurrentAreaDailyEarnings,
      deleteDailyInterestEarning,
      calculateDailyInterestEarnings,
      calculateWeeklyInterestEarnings,
      calculateMonthlyInterestEarnings,
      addPaymentBatch,
      getCustomerBySerialNumber,
      recalculateAllCustomerPayments,
      getDailyCollections
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
