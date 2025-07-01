
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
  
  // Interest calculation methods
  calculateDailyInterestEarnings: (date: string) => number;
  calculateWeeklyInterestEarnings: (weekStartDate: string) => number;
  calculateMonthlyInterestEarnings: (month: string, year: string) => number;
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

  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null);

  const addCustomer = async (customer: Omit<Customer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    return await saveCustomer(customer);
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'userId' | 'createdAt'>): Promise<boolean> => {
    return await savePayment(payment);
  };

  const addArea = async (area: Omit<Area, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    return await saveArea(area);
  };

  // Area management methods
  const getCurrentAreaCustomers = (): Customer[] => {
    if (!currentAreaId) return customers;
    return customers.filter(customer => customer.area === currentAreaId);
  };

  const getAreaById = (areaId: string): Area | undefined => {
    return areas.find(area => area.id === areaId);
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
      calculateDailyInterestEarnings,
      calculateWeeklyInterestEarnings,
      calculateMonthlyInterestEarnings
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
