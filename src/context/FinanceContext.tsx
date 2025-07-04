import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from '@/hooks/use-local-storage';

// Define types for our data
export interface Customer {
  id: string;
  name: string;
  serialNumber: string;
  address: string;
  issuedDate: string;
  totalAmountGiven: number;
  interestAmount: number;
  numberOfDays: number;
  totalAmountToBePaid: number;
  totalPaid: number;
  isFullyPaid: boolean;
  areaId?: string;
  createdAt: string;
  installmentAmount?: number;
  deadlineDate?: string;
  dailyAmount?: number;
  interestPercentage?: number;
  paymentCategory: 'daily' | 'weekly' | 'monthly';
  numberOfWeeks?: number;
  numberOfMonths?: number;
  penaltyAmount?: number;
  lastPenaltyCalculated?: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  serialNumber: string;
  amount: number;
  date: string;
  collectionType: 'daily' | 'weekly' | 'monthly';
  agentName?: string;
  areaId?: string;
  customerInterestAmount?: number;
  customerTotalAmountToBePaid?: number;
  customerPaymentCategory?: 'daily' | 'weekly' | 'monthly';
  customerPenaltyAmount?: number;
  customerTotalAmountGiven?: number;
  isCustomerDeleted?: boolean;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// New interface for daily interest earnings
export interface DailyInterestEarning {
  id: string;
  date: string;
  totalInterestEarned: number;
  totalPrincipleEarned: number;
  areaId?: string;
  createdAt: string;
  isWeeklyTotal?: boolean;
  isMonthlyTotal?: boolean;
  weekStartDate?: string;
  monthYear?: string;
}

interface FinanceContextType {
  customers: Customer[];
  payments: Payment[];
  areas: Area[];
  dailyInterestEarnings: DailyInterestEarning[];
  currentAreaId: string | null;
  addCustomer: (customerData: Omit<Customer, 'id' | 'totalAmountToBePaid' | 'totalPaid' | 'isFullyPaid' | 'createdAt' | 'deadlineDate' | 'dailyAmount' | 'interestPercentage' | 'installmentAmount' | 'penaltyAmount' | 'lastPenaltyCalculated'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => Promise<void>;
  addPayment: (paymentData: Omit<Payment, 'id' | 'customerName'>, paymentId?: string) => void;
  addPaymentBatch: (payments: Payment[]) => Promise<{ success: boolean; errors: string[] }>;
  deletePayment: (id: string) => void;
  getCustomerPayments: (customerId: string) => Payment[];
  getCustomerBySerialNumber: (serialNumber: string) => Customer | undefined;
  updateCustomerPaymentStatus: (customerId: string) => void;
  recalculateAllCustomerPayments: () => void;
  getDailyCollections: (date: string) => Payment[];
  getCurrentAreaCustomers: () => Customer[];
  getCurrentAreaPayments: () => Payment[];
  addArea: (areaData: Omit<Area, 'id' | 'createdAt'>) => Area;
  deleteArea: (id: string) => void;
  setCurrentArea: (areaId: string | null) => void;
  getAreaById: (areaId: string) => Area | null;
  getAreaCustomers: (areaId: string) => Customer[];
  getAreaPayments: (areaId: string) => Payment[];
  calculatePenalty: (customerId: string) => void;
  calculateAllPenalties: () => void;
  calculateTotalEarnings: (filteredCustomers: Customer[], filteredPayments: Payment[]) => number;
  calculateDailyInterestEarnings: (date: string) => number;
  calculateWeeklyInterestEarnings: (weekStartDate: string) => number;
  calculateMonthlyInterestEarnings: (month: string, year: string) => number;
  getHistoricalPayments: (startDate: string, endDate: string) => Payment[];
  getPendingCustomers: () => Customer[];
  getPaidCustomers: () => Customer[];
  getOverdueCustomers: () => Customer[];
  addDailyInterestEarning: (date: string) => void;
  deleteDailyInterestEarning: (id: string) => void;
  getCurrentAreaDailyEarnings: () => DailyInterestEarning[];
}

// Create the context with a default value
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Create a custom hook to use the context
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

// Fixed interest calculation formula - CORRECTED VERSION
const calculateCorrectInterestEarning = (payment: Payment, customerData: any): number => {
  const principal = customerData.totalAmountGiven || customerData.customerTotalAmountGiven || 0;
  const totalInterest = customerData.interestAmount || customerData.customerInterestAmount || 0;
  
  console.log('CORRECTED Interest calculation debug:', {
    paymentAmount: payment.amount,
    principal,
    totalInterest,
    paymentId: payment.id,
    customerName: payment.customerName
  });
  
  if (principal <= 0 || totalInterest <= 0) {
    console.log('No interest to calculate: principal or interest is 0');
    return 0;
  }
  
  // CORRECTED: Calculate what portion of PRINCIPAL this payment represents
  const principalRatio = Math.min(payment.amount / principal, 1);
  const earnedInterest = principalRatio * totalInterest;
  
  console.log('CORRECTED Interest earned:', {
    principalRatio: principalRatio.toFixed(4),
    earnedInterest: earnedInterest.toFixed(2)
  });
  
  return Math.round(earnedInterest * 100) / 100;
};

// Calculate principle earned from payment
const calculatePrincipleEarning = (payment: Payment, customerData: any): number => {
  const principal = customerData.totalAmountGiven || customerData.customerTotalAmountGiven || 0;
  
  if (principal <= 0) {
    return 0;
  }
  
  // The principle earned is the minimum of payment amount or remaining principal
  return Math.min(payment.amount, principal);
};

// Create a provider component
export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // Use local storage to persist data
  const [customers, setCustomers] = useLocalStorage<Customer[]>('finance-customers', []);
  const [payments, setPayments] = useLocalStorage<Payment[]>('finance-payments', []);
  const [areas, setAreas] = useLocalStorage<Area[]>('finance-areas', []);
  const [dailyInterestEarnings, setDailyInterestEarnings] = useLocalStorage<DailyInterestEarning[]>('finance-daily-earnings', []);
  const [currentAreaId, setCurrentAreaId] = useLocalStorage<string | null>('finance-current-area', null);
  
  // Helper functions
  const getCustomerBySerialNumber = (serialNumber: string): Customer | undefined => {
    return customers.find(customer => customer.serialNumber === serialNumber);
  };
  
  const updateCustomerPaymentStatus = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerPayments = payments.filter(p => p.customerId === customerId);
    const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalWithPenalty = customer.totalAmountToBePaid + (customer.penaltyAmount || 0);
    
    // Cap totalPaid at the amount owed - excess goes to earnings
    const effectiveTotalPaid = Math.min(totalPaid, totalWithPenalty);
    const isFullyPaid = totalPaid >= totalWithPenalty;
    
    setCustomers(prevCustomers => 
      prevCustomers.map(c => 
        c.id === customerId 
          ? { ...c, totalPaid: effectiveTotalPaid, isFullyPaid } 
          : c
      )
    );
  };
  
  // Helper function to calculate total earnings including overpayments
  const calculateTotalEarnings = (filteredCustomers: Customer[], filteredPayments: Payment[]) => {
    let totalEarnings = 0;
    
    filteredCustomers.forEach(customer => {
      const customerPayments = filteredPayments.filter(p => p.customerId === customer.id);
      const totalPaidByCustomer = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalAmountOwed = customer.totalAmountToBePaid + (customer.penaltyAmount || 0);
      const interestAmount = customer.interestAmount || 0;
      
      if (totalPaidByCustomer > 0) {
        if (totalPaidByCustomer >= totalAmountOwed) {
          // Customer has fully paid or overpaid
          // Add all interest amount to earnings
          totalEarnings += interestAmount;
          
          // Add overpayment amount to earnings
          const overpayment = totalPaidByCustomer - totalAmountOwed;
          if (overpayment > 0) {
            totalEarnings += overpayment;
          }
        } else {
          // Customer has partially paid
          // Calculate proportional interest earned using correct formula
          const principalRatio = Math.min(totalPaidByCustomer / customer.totalAmountGiven, 1);
          const earnedInterest = interestAmount * principalRatio;
          totalEarnings += earnedInterest;
        }
      }
    });
    
    return totalEarnings;
  };

  // Advanced customer filtering functions
  const getPendingCustomers = (): Customer[] => {
    return getCurrentAreaCustomers().filter(customer => customer.totalPaid === 0);
  };

  const getPaidCustomers = (): Customer[] => {
    return getCurrentAreaCustomers().filter(customer => customer.isFullyPaid);
  };

  const getOverdueCustomers = (): Customer[] => {
    return getCurrentAreaCustomers().filter(customer => {
      if (!customer.deadlineDate || customer.isFullyPaid) return false;
      const currentDate = new Date();
      const deadlineDate = new Date(customer.deadlineDate);
      return currentDate > deadlineDate;
    });
  };
  
  const recalculateAllCustomerPayments = () => {
    customers.forEach(customer => {
      updateCustomerPaymentStatus(customer.id);
    });
  };
  
  // Calculate deadline date from issued date and number of periods
  const calculateDeadlineDate = (issuedDate: string, periods: number, category: 'daily' | 'weekly' | 'monthly'): string => {
    const date = new Date(issuedDate);
    
    if (category === 'daily') {
      date.setDate(date.getDate() + periods);
    } else if (category === 'weekly') {
      date.setDate(date.getDate() + (periods * 7));
    } else if (category === 'monthly') {
      // Use 30 days for a month for consistency across the app
      date.setDate(date.getDate() + (periods * 30));
    }
    
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Calculate penalty for overdue customers - SIMPLIFIED AND STANDARDIZED
  const calculatePenalty = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.deadlineDate || customer.isFullyPaid) return;

    const currentDate = new Date();
    const deadlineDate = new Date(customer.deadlineDate);
    
    // If not overdue or already paid, no penalty
    if (currentDate <= deadlineDate) return;

    const lastCalculated = customer.lastPenaltyCalculated ? new Date(customer.lastPenaltyCalculated) : deadlineDate;
    const daysToCalculateFor = Math.floor((currentDate.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToCalculateFor <= 0) return;

    let dailyPenaltyRate = 0;
    const interest = customer.interestAmount;

    if (customer.paymentCategory === 'daily') {
      const periods = customer.numberOfDays;
      if (periods > 0) dailyPenaltyRate = interest / periods;
    } else if (customer.paymentCategory === 'weekly') {
      const periods = customer.numberOfWeeks || Math.ceil(customer.numberOfDays / 7);
      if (periods > 0) dailyPenaltyRate = interest / periods / 7;
    } else if (customer.paymentCategory === 'monthly') {
      const periods = customer.numberOfMonths || Math.ceil(customer.numberOfDays / 30);
      if (periods > 0) dailyPenaltyRate = interest / periods / 30;
    }

    // Prevent NaN or Infinity from corrupting data
    if (isNaN(dailyPenaltyRate) || !isFinite(dailyPenaltyRate)) {
      dailyPenaltyRate = 0;
    }

    const penaltyToAdd = dailyPenaltyRate * daysToCalculateFor;

    if (penaltyToAdd > 0) {
      setCustomers(prevCustomers => 
        prevCustomers.map(c => 
          c.id === customerId 
            ? { 
                ...c, 
                penaltyAmount: (c.penaltyAmount || 0) + penaltyToAdd,
                // Record today's date to prevent double-counting
                lastPenaltyCalculated: currentDate.toISOString().split('T')[0]
              } 
            : c
        )
      );
    }
  };

  const calculateAllPenalties = () => {
    customers.forEach(customer => {
      calculatePenalty(customer.id);
    });
  };
  
  // Area-related functions
  const getCurrentAreaCustomers = (): Customer[] => {
    if (!currentAreaId) return customers;
    return customers.filter(customer => customer.areaId === currentAreaId);
  };
  
  const getCurrentAreaPayments = (): Payment[] => {
    if (!currentAreaId) return payments;
    return payments.filter(payment => payment.areaId === currentAreaId);
  };
  
  const getAreaCustomers = (areaId: string): Customer[] => {
    return customers.filter(customer => customer.areaId === areaId);
  };
  
  const getAreaPayments = (areaId: string): Payment[] => {
    return payments.filter(payment => payment.areaId === areaId);
  };
  
  const getAreaById = (areaId: string): Area | null => {
    return areas.find(area => area.id === areaId) || null;
  };
  
  // Enhanced deleteCustomer function to fully preserve payment history
  const deleteCustomer = async (id: string): Promise<void> => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    console.log('Deleting customer and preserving payment data:', customer.name);
    
    // Update all payments for this customer to preserve complete historical data
    setPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.customerId === id 
          ? { 
              ...payment,
              isCustomerDeleted: true,
              customerInterestAmount: customer.interestAmount,
              customerTotalAmountToBePaid: customer.totalAmountToBePaid,
              customerPaymentCategory: customer.paymentCategory,
              customerPenaltyAmount: customer.penaltyAmount || 0,
              customerTotalAmountGiven: customer.totalAmountGiven // CRITICAL for correct calculation
            } 
          : payment
      )
    );
    
    // Delete the customer
    setCustomers(prevCustomers => 
      prevCustomers.filter(customer => customer.id !== id)
    );
    
    toast({
      title: "Customer Deleted",
      description: "Customer deleted. Payment history preserved for accurate interest calculations.",
    });
  };
  
  // CRUD operations
  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalAmountToBePaid' | 'totalPaid' | 'isFullyPaid' | 'createdAt' | 'deadlineDate' | 'dailyAmount' | 'interestPercentage' | 'installmentAmount' | 'penaltyAmount' | 'lastPenaltyCalculated'>): Customer => {
    // Calculate the total amount to be paid with interest amount
    const principal = customerData.totalAmountGiven;
    const interestAmount = customerData.interestAmount || 0;
    const totalAmountToBePaid = principal + interestAmount;
    
    // Determine the number of periods based on payment category
    let periods: number;
    if (customerData.paymentCategory === 'daily') {
      periods = customerData.numberOfDays;
    } else if (customerData.paymentCategory === 'weekly') {
      // For weekly customers, use the provided numberOfWeeks directly
      periods = customerData.numberOfWeeks || Math.ceil(customerData.numberOfDays / 7);
    } else {
      // For monthly customers, use the provided numberOfMonths directly
      periods = customerData.numberOfMonths || Math.ceil(customerData.numberOfDays / 30);
    }
    
    // Calculate installment amount
    const installmentAmount = totalAmountToBePaid / periods;
    
    // Calculate daily amount (for display purposes)
    const dailyAmount = totalAmountToBePaid / customerData.numberOfDays;
    
    // Calculate interest percentage
    const interestPercentage = principal > 0 ? (interestAmount / principal) * 100 : 0;
    
    // Calculate deadline date
    const deadlineDate = calculateDeadlineDate(customerData.issuedDate, periods, customerData.paymentCategory);
    
    const newCustomer: Customer = {
      id: Date.now().toString(),
      ...customerData,
      totalAmountToBePaid,
      totalPaid: 0,
      isFullyPaid: false,
      deadlineDate,
      dailyAmount,
      interestPercentage,
      installmentAmount,
      penaltyAmount: 0,
      areaId: currentAreaId || undefined,
      createdAt: new Date().toISOString()
    };
    
    setCustomers(prev => [...prev, newCustomer]);
    
    toast({
      title: "Customer Added",
      description: `${newCustomer.name} has been added successfully.`,
    });
    
    return newCustomer;
  };
  
  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => {
        if (customer.id === id) {
          let updatedCustomer = { ...customer, ...data };
          
          // If any of these values were updated, recalculate derived values
          if (data.totalAmountGiven !== undefined || 
              data.interestAmount !== undefined || 
              data.numberOfDays !== undefined ||
              data.numberOfWeeks !== undefined ||
              data.numberOfMonths !== undefined ||
              data.paymentCategory !== undefined ||
              data.issuedDate !== undefined) {
                
            const principal = updatedCustomer.totalAmountGiven;
            const interestAmount = updatedCustomer.interestAmount || 0;
            const totalAmountToBePaid = principal + interestAmount;
            
            // Determine periods based on payment category
            let periods: number;
            if (updatedCustomer.paymentCategory === 'daily') {
              periods = updatedCustomer.numberOfDays;
            } else if (updatedCustomer.paymentCategory === 'weekly') {
              periods = updatedCustomer.numberOfWeeks || Math.ceil(updatedCustomer.numberOfDays / 7);
            } else {
              periods = updatedCustomer.numberOfMonths || Math.ceil(updatedCustomer.numberOfDays / 30);
            }
            
            updatedCustomer.totalAmountToBePaid = totalAmountToBePaid;
            updatedCustomer.dailyAmount = totalAmountToBePaid / updatedCustomer.numberOfDays;
            updatedCustomer.interestPercentage = principal > 0 ? (interestAmount / principal) * 100 : 0;
            updatedCustomer.installmentAmount = totalAmountToBePaid / periods;
            
            // Update the deadline date if issued date or periods changed
            if (data.issuedDate !== undefined || data.numberOfDays !== undefined || 
                data.numberOfWeeks !== undefined || data.numberOfMonths !== undefined ||
                data.paymentCategory !== undefined) {
              updatedCustomer.deadlineDate = calculateDeadlineDate(
                updatedCustomer.issuedDate, 
                periods,
                updatedCustomer.paymentCategory
              );
            }
          }
          
          return updatedCustomer;
        }
        return customer;
      })
    );
    
    toast({
      title: "Customer Updated",
      description: "Customer information has been updated.",
    });
  };
  
  // Enhanced addPayment function with better data preservation
  const addPayment = (paymentData: Omit<Payment, 'id' | 'customerName'>, paymentId?: string) => {
    const customer = getCustomerBySerialNumber(paymentData.serialNumber);
    
    if (!customer) {
      console.error(`Customer with serial number ${paymentData.serialNumber} not found`);
      toast({
        title: "Error",
        description: `Customer with serial number ${paymentData.serialNumber} not found.`,
        variant: "destructive",
      });
      return;
    }

    const newPayment: Payment = {
      id: paymentId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerName: customer.name,
      ...paymentData,
      customerId: customer.id,
      areaId: paymentData.areaId || currentAreaId || undefined,
      // Preserve COMPLETE customer data for historical calculations
      customerInterestAmount: customer.interestAmount,
      customerTotalAmountToBePaid: customer.totalAmountToBePaid,
      customerPaymentCategory: customer.paymentCategory,
      customerPenaltyAmount: customer.penaltyAmount || 0,
      customerTotalAmountGiven: customer.totalAmountGiven, // CRITICAL for correct calculation
      isCustomerDeleted: false
    };
  
    setPayments((prev) => [...prev, newPayment]);
    updateCustomerPaymentStatus(customer.id);
    
    // Update daily interest earnings for this date
    addDailyInterestEarning(paymentData.date);
    
    console.log('Payment added successfully with complete customer data:', newPayment);
    
    toast({
      title: "Payment Recorded",
      description: `Payment of ₹${paymentData.amount} recorded for ${customer.name}.`,
    });
  };

  // Add daily interest earning calculation and storage
  const addDailyInterestEarning = (date: string) => {
    const existingEntry = dailyInterestEarnings.find(e => 
      e.date === date && 
      e.areaId === currentAreaId && 
      !e.isWeeklyTotal && 
      !e.isMonthlyTotal
    );
    
    if (existingEntry) {
      // Update existing entry
      const interestEarned = calculateDailyInterestEarnings(date);
      const principleEarned = calculateDailyPrincipleEarnings(date);
      
      setDailyInterestEarnings(prev =>
        prev.map(entry =>
          entry.id === existingEntry.id
            ? { ...entry, totalInterestEarned: interestEarned, totalPrincipleEarned: principleEarned }
            : entry
        )
      );
    } else {
      // Create new entry
      const interestEarned = calculateDailyInterestEarnings(date);
      const principleEarned = calculateDailyPrincipleEarnings(date);
      
      const newEntry: DailyInterestEarning = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date,
        totalInterestEarned: interestEarned,
        totalPrincipleEarned: principleEarned,
        areaId: currentAreaId || undefined,
        createdAt: new Date().toISOString(),
        isWeeklyTotal: false,
        isMonthlyTotal: false
      };
      
      setDailyInterestEarnings(prev => [...prev, newEntry]);
    }
    
    // Check if we need to add weekly/monthly totals
    addWeeklyTotalIfNeeded(date);
    addMonthlyTotalIfNeeded(date);
  };

  // Calculate daily principle earnings
  const calculateDailyPrincipleEarnings = (date: string): number => {
    const datePayments = getCurrentAreaPayments().filter(payment => payment.date === date);
    let totalPrincipleEarned = 0;

    datePayments.forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      
      if (customer) {
        const principleEarned = calculatePrincipleEarning(payment, customer);
        totalPrincipleEarned += principleEarned;
      } else if (payment.customerTotalAmountGiven) {
        const principleEarned = calculatePrincipleEarning(payment, {
          totalAmountGiven: payment.customerTotalAmountGiven
        });
        totalPrincipleEarned += principleEarned;
      }
    });

    return Math.round(totalPrincipleEarned * 100) / 100;
  };

  // Add weekly total if it's end of week
  const addWeeklyTotalIfNeeded = (date: string) => {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Add weekly total on Sunday (end of week)
    if (dayOfWeek === 0) {
      const weekStartDate = new Date(currentDate);
      weekStartDate.setDate(currentDate.getDate() - 6);
      const weekStart = weekStartDate.toISOString().split('T')[0];
      
      const weeklyInterest = calculateWeeklyInterestEarnings(weekStart);
      const weeklyPrinciple = calculateWeeklyPrincipleEarnings(weekStart);
      
      const weeklyEntry: DailyInterestEarning = {
        id: `weekly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date,
        totalInterestEarned: weeklyInterest,
        totalPrincipleEarned: weeklyPrinciple,
        areaId: currentAreaId || undefined,
        createdAt: new Date().toISOString(),
        isWeeklyTotal: true,
        isMonthlyTotal: false,
        weekStartDate: weekStart
      };
      
      setDailyInterestEarnings(prev => [...prev, weeklyEntry]);
    }
  };

  // Add monthly total if it's end of month
  const addMonthlyTotalIfNeeded = (date: string) => {
    const currentDate = new Date(date);
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    
    // Check if next day is first day of next month
    if (nextDay.getDate() === 1) {
      const month = (currentDate.getMonth() + 1).toString();
      const year = currentDate.getFullYear().toString();
      
      const monthlyInterest = calculateMonthlyInterestEarnings(month, year);
      const monthlyPrinciple = calculateMonthlyPrincipleEarnings(month, year);
      
      const monthlyEntry: DailyInterestEarning = {
        id: `monthly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date,
        totalInterestEarned: monthlyInterest,
        totalPrincipleEarned: monthlyPrinciple,
        areaId: currentAreaId || undefined,
        createdAt: new Date().toISOString(),
        isWeeklyTotal: false,
        isMonthlyTotal: true,
        monthYear: `${month}/${year}`
      };
      
      setDailyInterestEarnings(prev => [...prev, monthlyEntry]);
    }
  };

  // Calculate weekly principle earnings
  const calculateWeeklyPrincipleEarnings = (weekStartDate: string): number => {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const weekPayments = getCurrentAreaPayments().filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    let totalPrincipleEarned = 0;

    weekPayments.forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      
      if (customer) {
        const principleEarned = calculatePrincipleEarning(payment, customer);
        totalPrincipleEarned += principleEarned;
      } else if (payment.customerTotalAmountGiven) {
        const principleEarned = calculatePrincipleEarning(payment, {
          totalAmountGiven: payment.customerTotalAmountGiven
        });
        totalPrincipleEarned += principleEarned;
      }
    });

    return Math.round(totalPrincipleEarned * 100) / 100;
  };

  // Calculate monthly principle earnings
  const calculateMonthlyPrincipleEarnings = (month: string, year: string): number => {
    const targetMonth = parseInt(month) - 1;
    const targetYear = parseInt(year);

    const monthPayments = getCurrentAreaPayments().filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getMonth() === targetMonth && paymentDate.getFullYear() === targetYear;
    });

    let totalPrincipleEarned = 0;

    monthPayments.forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      
      if (customer) {
        const principleEarned = calculatePrincipleEarning(payment, customer);
        totalPrincipleEarned += principleEarned;
      } else if (payment.customerTotalAmountGiven) {
        const principleEarned = calculatePrincipleEarning(payment, {
          totalAmountGiven: payment.customerTotalAmountGiven
        });
        totalPrincipleEarned += principleEarned;
      }
    });

    return Math.round(totalPrincipleEarned * 100) / 100;
  };

  // Delete daily interest earning
  const deleteDailyInterestEarning = (id: string) => {
    setDailyInterestEarnings(prev => prev.filter(entry => entry.id !== id));
    
    toast({
      title: "Entry Deleted",
      description: "Daily earnings entry has been deleted.",
    });
  };

  // Get current area daily earnings
  const getCurrentAreaDailyEarnings = (): DailyInterestEarning[] => {
    if (!currentAreaId) return dailyInterestEarnings;
    return dailyInterestEarnings.filter(earning => earning.areaId === currentAreaId);
  };

  // New batch payment function for atomic operations
  const addPaymentBatch = async (paymentsToAdd: Payment[]): Promise<{ success: boolean; errors: string[] }> => {
    console.log('Starting batch payment addition for', paymentsToAdd.length, 'payments');
    
    const errors: string[] = [];
    const successfulPayments: Payment[] = [];
    
    try {
      // Validate all payments first
      for (const payment of paymentsToAdd) {
        const customer = getCustomerBySerialNumber(payment.serialNumber);
        if (!customer) {
          errors.push(`Customer not found for serial number: ${payment.serialNumber}`);
          continue;
        }
        
        if (payment.amount <= 0) {
          errors.push(`Invalid amount for customer ${payment.customerName}: ${payment.amount}`);
          continue;
        }
        
        // Preserve customer data in payment
        const enhancedPayment = {
          ...payment,
          customerInterestAmount: customer.interestAmount,
          customerTotalAmountToBePaid: customer.totalAmountToBePaid,
          customerPaymentCategory: customer.paymentCategory,
          customerPenaltyAmount: customer.penaltyAmount || 0,
          customerTotalAmountGiven: customer.totalAmountGiven, // Added for correct calculation
          isCustomerDeleted: false
        };
        
        successfulPayments.push(enhancedPayment);
      }
      
      if (errors.length > 0) {
        console.error('Validation errors in batch:', errors);
        return { success: false, errors };
      }
      
      // Add all payments atomically using functional state update
      setPayments(prevPayments => {
        const newPayments = [...prevPayments, ...successfulPayments];
        console.log('Batch payments added to state:', successfulPayments.length);
        return newPayments;
      });
      
      // Update customer payment statuses for all affected customers IMMEDIATELY
      const affectedCustomerIds = new Set(successfulPayments.map(p => p.customerId));
      
      // Use setTimeout to ensure the payments state has been updated before recalculating
      setTimeout(() => {
        setCustomers(prevCustomers => {
          return prevCustomers.map(customer => {
            if (affectedCustomerIds.has(customer.id)) {
              // Get updated payments including the new ones
              const allPayments = [...payments, ...successfulPayments];
              const customerPayments = allPayments.filter(p => p.customerId === customer.id);
              const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
              const totalWithPenalty = customer.totalAmountToBePaid + (customer.penaltyAmount || 0);
              
              const effectiveTotalPaid = Math.min(totalPaid, totalWithPenalty);
              const isFullyPaid = totalPaid >= totalWithPenalty;
              
              return { ...customer, totalPaid: effectiveTotalPaid, isFullyPaid };
            }
            return customer;
          });
        });
      }, 100);
      
      console.log('Batch payment addition completed successfully');
      
      toast({
        title: "Batch Payment Success",
        description: `Successfully recorded ${successfulPayments.length} payments.`,
      });
      
      return { success: true, errors: [] };
      
    } catch (error) {
      console.error('Error in batch payment addition:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Batch Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, errors: [errorMessage] };
    }
  };

  const deletePayment = (id: string) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    
    setPayments(prevPayments => 
      prevPayments.filter(p => p.id !== id)
    );
    
    // Update customer payment status
    updateCustomerPaymentStatus(payment.customerId);
    
    toast({
      title: "Payment Deleted",
      description: `Payment for ${payment.customerName} has been deleted.`,
    });
  };
  
  const getCustomerPayments = (customerId: string): Payment[] => {
    return payments.filter(payment => payment.customerId === customerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  
  const getDailyCollections = (date: string): Payment[] => {
    return getCurrentAreaPayments().filter(payment => payment.date === date);
  };
  
  // Area operations
  const addArea = (areaData: Omit<Area, 'id' | 'createdAt'>): Area => {
    const newArea: Area = {
      id: Date.now().toString(),
      ...areaData,
      createdAt: new Date().toISOString()
    };
    
    setAreas(prev => [...prev, newArea]);
    
    return newArea;
  };
  
  const deleteArea = (id: string) => {
    // Remove area from customers
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => 
        customer.areaId === id 
          ? { ...customer, areaId: undefined } 
          : customer
      )
    );
    
    // Remove area from payments
    setPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.areaId === id 
          ? { ...payment, areaId: undefined } 
          : payment
      )
    );
    
    // Delete the area
    setAreas(prevAreas => 
      prevAreas.filter(area => area.id !== id)
    );
    
    // If current area is deleted, set current area to null
    if (currentAreaId === id) {
      setCurrentAreaId(null);
    }
    
    toast({
      title: "Area Deleted",
      description: "Area has been deleted. Associated customers and payments are now unassigned.",
    });
  };
  
  const setCurrentArea = (areaId: string | null) => {
    setCurrentAreaId(areaId);
    
    if (areaId) {
      const area = getAreaById(areaId);
      if (area) {
        toast({
          title: "Area Selected",
          description: `You are now working in ${area.name}.`,
        });
      }
    }
  };
  
  // Fixed interest calculation functions using CORRECTED formula
  const calculateDailyInterestEarnings = (date: string): number => {
    const datePayments = getCurrentAreaPayments().filter(payment => payment.date === date);
    let totalInterestEarned = 0;

    console.log(`CORRECTED: Calculating daily interest for ${date}, found ${datePayments.length} payments`);

    datePayments.forEach(payment => {
      // First try to find current customer data
      const customer = customers.find(c => c.id === payment.customerId);
      
      if (customer) {
        // Use current customer data with correct calculation
        const earnedInterest = calculateCorrectInterestEarning(payment, customer);
        totalInterestEarned += earnedInterest;
      } else if (payment.customerInterestAmount && payment.customerTotalAmountGiven) {
        // Use preserved historical data for deleted customers with correct calculation
        const earnedInterest = calculateCorrectInterestEarning(payment, {
          interestAmount: payment.customerInterestAmount,
          totalAmountGiven: payment.customerTotalAmountGiven
        });
        totalInterestEarned += earnedInterest;
      }
    });

    console.log(`CORRECTED: Total daily interest earned for ${date}: ₹${totalInterestEarned.toFixed(2)}`);
    return Math.round(totalInterestEarned * 100) / 100;
  };

  const calculateWeeklyInterestEarnings = (weekStartDate: string): number => {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    console.log(`CORRECTED: Calculating weekly interest from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    const weekPayments = getCurrentAreaPayments().filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    let totalInterestEarned = 0;

    console.log(`Found ${weekPayments.length} payments in week range`);

    weekPayments.forEach(payment => {
      // First try to find current customer data
      const customer = customers.find(c => c.id === payment.customerId);
      
      if (customer) {
        // Use current customer data with correct calculation
        const earnedInterest = calculateCorrectInterestEarning(payment, customer);
        totalInterestEarned += earnedInterest;
      } else if (payment.customerInterestAmount && payment.customerTotalAmountGiven) {
        // Use preserved historical data for deleted customers with correct calculation
        const earnedInterest = calculateCorrectInterestEarning(payment, {
          interestAmount: payment.customerInterestAmount,
          totalAmountGiven: payment.customerTotalAmountGiven
        });
        totalInterestEarned += earnedInterest;
      }
    });

    console.log(`CORRECTED: Total weekly interest earned: ₹${totalInterestEarned.toFixed(2)}`);
    return Math.round(totalInterestEarned * 100) / 100;
  };

  const calculateMonthlyInterestEarnings = (month: string, year: string): number => {
    const targetMonth = parseInt(month) - 1; // JavaScript months are 0-based
    const targetYear = parseInt(year);
    
    console.log(`CORRECTED: Calculating monthly interest for ${month}/${year}`);

    const monthPayments = getCurrentAreaPayments().filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getMonth() === targetMonth && paymentDate.getFullYear() === targetYear;
    });

    let totalInterestEarned = 0;

    console.log(`Found ${monthPayments.length} payments in month ${month}/${year}`);

    monthPayments.forEach(payment => {
      // First try to find current customer data
      const customer = customers.find(c => c.id === payment.customerId);
      
      if (customer) {
        // Use current customer data with correct calculation
        const earnedInterest = calculateCorrectInterestEarning(payment, customer);
        totalInterestEarned += earnedInterest;
      } else if (payment.customerInterestAmount && payment.customerTotalAmountGiven) {
        // Use preserved historical data for deleted customers with correct calculation
        const earnedInterest = calculateCorrectInterestEarning(payment, {
          interestAmount: payment.customerInterestAmount,
          totalAmountGiven: payment.customerTotalAmountGiven
        });
        totalInterestEarned += earnedInterest;
      }
    });

    console.log(`CORRECTED: Total monthly interest earned for ${month}/${year}: ₹${totalInterestEarned.toFixed(2)}`);
    return Math.round(totalInterestEarned * 100) / 100;
  };

  const getHistoricalPayments = (startDate: string, endDate: string): Payment[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return getCurrentAreaPayments().filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= start && paymentDate <= end;
    });
  };
  
  // Effect to initialize the app and migrate data
  useEffect(() => {
    // Data migration: ensure all payments have customerTotalAmountGiven for correct calculations
    setPayments(prev => prev.map(payment => {
      if (!payment.customerTotalAmountGiven) {
        const customer = customers.find(c => c.id === payment.customerId);
        if (customer) {
          return {
            ...payment,
            customerTotalAmountGiven: customer.totalAmountGiven,
            customerInterestAmount: customer.interestAmount,
            customerTotalAmountToBePaid: customer.totalAmountToBePaid,
            customerPaymentCategory: customer.paymentCategory,
            customerPenaltyAmount: customer.penaltyAmount || 0,
            isCustomerDeleted: false
          };
        }
      }
      return payment;
    }));

    // Calculate penalties on app load
    calculateAllPenalties();
    
    // Any initialization logic can go here
    recalculateAllCustomerPayments();
    
    // Update customers with new fields if they don't have them
    setCustomers(prev => prev.map(customer => {
      let updatedCustomer = { ...customer };
      
      // Add default payment category if missing
      if (!customer.paymentCategory) {
        updatedCustomer.paymentCategory = 'daily';
      }
      
      // Initialize penalty fields if missing
      if (customer.penaltyAmount === undefined) {
        updatedCustomer.penaltyAmount = 0;
      }
      
      if (!customer.deadlineDate) {
        const periods = customer.paymentCategory === 'weekly' ? 
          (customer.numberOfWeeks || Math.ceil(customer.numberOfDays / 7)) :
          customer.paymentCategory === 'monthly' ? 
          (customer.numberOfMonths || Math.ceil(customer.numberOfDays / 30)) :
          customer.numberOfDays;
          
        updatedCustomer.deadlineDate = calculateDeadlineDate(
          customer.issuedDate, 
          periods, 
          customer.paymentCategory
        );
      }
      
      // Migrate old customers with rateOfInterest to new interestAmount system
      if ('rateOfInterest' in customer && !('interestAmount' in customer)) {
        const oldCustomer = customer as any;
        const oldRateOfInterest = oldCustomer.rateOfInterest || 0;
        const dailyRate = oldRateOfInterest / 100;
        const calculatedInterestAmount = updatedCustomer.totalAmountGiven * dailyRate * updatedCustomer.numberOfDays;
        
        updatedCustomer.interestAmount = calculatedInterestAmount;
        updatedCustomer.totalAmountToBePaid = updatedCustomer.totalAmountGiven + calculatedInterestAmount;
        updatedCustomer.dailyAmount = updatedCustomer.totalAmountToBePaid / updatedCustomer.numberOfDays;
        updatedCustomer.interestPercentage = oldRateOfInterest * updatedCustomer.numberOfDays;
        
        // Calculate installment amount based on payment category
        const periods = updatedCustomer.paymentCategory === 'weekly' ? 
          Math.ceil(updatedCustomer.numberOfDays / 7) :
          updatedCustomer.paymentCategory === 'monthly' ? 
          Math.ceil(updatedCustomer.numberOfDays / 30) :
          updatedCustomer.numberOfDays;
        
        updatedCustomer.installmentAmount = updatedCustomer.totalAmountToBePaid / periods;
        
        // Remove the old property
        delete oldCustomer.rateOfInterest;
      } else if (!customer.dailyAmount || !customer.interestPercentage) {
        // Calculate missing fields for existing customers
        updatedCustomer.dailyAmount = customer.totalAmountToBePaid / customer.numberOfDays;
        updatedCustomer.interestPercentage = customer.totalAmountGiven > 0 ? 
          ((customer.totalAmountToBePaid - customer.totalAmountGiven) / customer.totalAmountGiven) * 100 : 0;
          
        // Calculate installment amount
        const periods = customer.paymentCategory === 'weekly' ? 
          (customer.numberOfWeeks || Math.ceil(customer.numberOfDays / 7)) :
          customer.paymentCategory === 'monthly' ? 
          (customer.numberOfMonths || Math.ceil(customer.numberOfDays / 30)) :
          customer.numberOfDays;
        
        updatedCustomer.installmentAmount = customer.totalAmountToBePaid / periods;
      }
      
      return updatedCustomer;
    }));

    // Update existing payments to include historical customer data if missing
    setPayments(prev => prev.map(payment => {
      if (!payment.customerInterestAmount || !payment.customerTotalAmountToBePaid) {
        const customer = customers.find(c => c.id === payment.customerId);
        if (customer) {
          return {
            ...payment,
            customerInterestAmount: customer.interestAmount,
            customerTotalAmountToBePaid: customer.totalAmountToBePaid,
            customerPaymentCategory: customer.paymentCategory,
            customerPenaltyAmount: customer.penaltyAmount || 0,
            isCustomerDeleted: false
          };
        }
      }
      return payment;
    }));
  }, []);
  
  const contextValue: FinanceContextType = {
    customers,
    payments,
    areas,
    dailyInterestEarnings,
    currentAreaId,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addPayment,
    addPaymentBatch,
    deletePayment,
    getCustomerPayments,
    getCustomerBySerialNumber,
    updateCustomerPaymentStatus,
    recalculateAllCustomerPayments,
    getDailyCollections,
    getCurrentAreaCustomers,
    getCurrentAreaPayments,
    addArea,
    deleteArea,
    setCurrentArea,
    getAreaById,
    getAreaCustomers,
    getAreaPayments,
    calculatePenalty,
    calculateAllPenalties,
    calculateTotalEarnings,
    calculateDailyInterestEarnings,
    calculateWeeklyInterestEarnings,
    calculateMonthlyInterestEarnings,
    getHistoricalPayments,
    getPendingCustomers,
    getPaidCustomers,
    getOverdueCustomers,
    addDailyInterestEarning,
    deleteDailyInterestEarning,
    getCurrentAreaDailyEarnings,
  };
  
  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};

export default FinanceProvider;
