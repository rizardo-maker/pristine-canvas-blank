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
  interestAmount: number; // Changed from rateOfInterest to interestAmount
  numberOfDays: number;
  totalAmountToBePaid: number;
  totalPaid: number;
  isFullyPaid: boolean;
  areaId?: string;
  createdAt: string;
  installmentAmount?: number;
  deadlineDate?: string; // New field for deadline date
  dailyAmount?: number; // Daily payment amount
  interestPercentage?: number; // Calculated interest percentage
  paymentCategory: 'daily' | 'weekly' | 'monthly'; // New field for payment category
  numberOfWeeks?: number; // For weekly customers
  numberOfMonths?: number; // For monthly customers
  penaltyAmount?: number; // Accumulated penalty amount
  lastPenaltyCalculated?: string; // Last date penalty was calculated
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
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface FinanceContextType {
  customers: Customer[];
  payments: Payment[];
  areas: Area[];
  currentAreaId: string | null;
  addCustomer: (customerData: Omit<Customer, 'id' | 'totalAmountToBePaid' | 'totalPaid' | 'isFullyPaid' | 'createdAt' | 'deadlineDate' | 'dailyAmount' | 'interestPercentage' | 'installmentAmount' | 'penaltyAmount' | 'lastPenaltyCalculated'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => Promise<void>;
  addPayment: (paymentData: Omit<Payment, 'id' | 'customerName'>) => void;
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

// Create a provider component
export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // Use local storage to persist data
  const [customers, setCustomers] = useLocalStorage<Customer[]>('finance-customers', []);
  const [payments, setPayments] = useLocalStorage<Payment[]>('finance-payments', []);
  const [areas, setAreas] = useLocalStorage<Area[]>('finance-areas', []);
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
          // Calculate proportional interest earned
          const paymentRatio = totalPaidByCustomer / totalAmountOwed;
          const earnedInterest = interestAmount * paymentRatio;
          totalEarnings += earnedInterest;
        }
      }
    });
    
    return totalEarnings;
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
      date.setMonth(date.getMonth() + periods);
    }
    
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Calculate penalty for overdue customers
  const calculatePenalty = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !customer.deadlineDate) return;

    const currentDate = new Date();
    const deadlineDate = new Date(customer.deadlineDate);
    
    // If not overdue, no penalty
    if (currentDate <= deadlineDate) return;

    const lastCalculated = customer.lastPenaltyCalculated ? new Date(customer.lastPenaltyCalculated) : deadlineDate;
    const daysSinceLastCalculation = Math.floor((currentDate.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastCalculation <= 0) return;

    let penaltyToAdd = 0;

    // Calculate penalty based on payment category using the ORIGINAL period counts
    if (customer.paymentCategory === 'daily') {
      // Daily customers: (interest amount / number of days) × excess days
      const dailyInterestRate = customer.interestAmount / customer.numberOfDays;
      penaltyToAdd = dailyInterestRate * daysSinceLastCalculation;
    } else if (customer.paymentCategory === 'weekly') {
      // Weekly customers: (interest amount / number of weeks) × excess weeks
      // Use the ORIGINAL numberOfWeeks, not calculated from numberOfDays
      const originalNumberOfWeeks = customer.numberOfWeeks || customer.numberOfDays; // Fallback for old data
      const weeklyInterestRate = customer.interestAmount / originalNumberOfWeeks;
      const excessWeeks = Math.floor(daysSinceLastCalculation / 7);
      if (excessWeeks > 0) {
        penaltyToAdd = weeklyInterestRate * excessWeeks;
      }
    } else if (customer.paymentCategory === 'monthly') {
      // Monthly customers: (interest amount / number of months) × excess months
      // Use the ORIGINAL numberOfMonths, not calculated from numberOfDays
      const originalNumberOfMonths = customer.numberOfMonths || customer.numberOfDays; // Fallback for old data
      const monthlyInterestRate = customer.interestAmount / originalNumberOfMonths;
      const excessMonths = Math.floor(daysSinceLastCalculation / 30);
      if (excessMonths > 0) {
        penaltyToAdd = monthlyInterestRate * excessMonths;
      }
    }

    if (penaltyToAdd > 0) {
      setCustomers(prevCustomers => 
        prevCustomers.map(c => 
          c.id === customerId 
            ? { 
                ...c, 
                penaltyAmount: (c.penaltyAmount || 0) + penaltyToAdd,
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
  
  const deleteCustomer = async (id: string): Promise<void> => {
    // Check if customer has payments
    const customerPayments = payments.filter(payment => payment.customerId === id);
    
    if (customerPayments.length > 0) {
      // Delete all payments for this customer
      setPayments(prevPayments => 
        prevPayments.filter(payment => payment.customerId !== id)
      );
    }
    
    // Delete the customer
    setCustomers(prevCustomers => 
      prevCustomers.filter(customer => customer.id !== id)
    );
    
    toast({
      title: "Customer Deleted",
      description: "Customer and all related payments have been deleted.",
    });
  };
  
  const addPayment = (paymentData: Omit<Payment, 'id' | 'customerName'>) => {
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

    // Allow overpayment - no restriction on payment amount
    const newPayment: Payment = {
      id: Date.now().toString(),
      customerName: customer.name,
      ...paymentData,
      customerId: customer.id,
      areaId: paymentData.areaId || currentAreaId || undefined
    };
  
    setPayments((prev) => [...prev, newPayment]);
  
    updateCustomerPaymentStatus(customer.id);
    
    toast({
      title: "Payment Recorded",
      description: `Payment of ₹${paymentData.amount} recorded for ${customer.name}.`,
    });
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
  
  // Effect to initialize the app
  useEffect(() => {
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
  }, []);
  
  const contextValue: FinanceContextType = {
    customers,
    payments,
    areas,
    currentAreaId,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addPayment,
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
  };
  
  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};
