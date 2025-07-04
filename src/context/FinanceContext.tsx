import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFirebaseAuth } from './FirebaseAuthContext';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { useToast } from "@/hooks/use-toast";

// Define unified data interfaces that match the existing structure
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
  agentName?: string;
  areaId?: string;
  customerInterestAmount?: number;
  customerTotalAmountToBePaid?: number;
  customerPaymentCategory?: 'daily' | 'weekly' | 'monthly';
  customerPenaltyAmount?: number;
  customerTotalAmountGiven?: number;
  isCustomerDeleted?: boolean;
  userId: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  userId: string;
}

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
  userId: string;
}

interface FinanceContextType {
  customers: Customer[];
  payments: Payment[];
  areas: Area[];
  dailyInterestEarnings: DailyInterestEarning[];
  currentAreaId: string | null;
  isLoading: boolean;
  isConnected: boolean;
  addCustomer: (customerData: Omit<Customer, 'id' | 'totalAmountToBePaid' | 'totalPaid' | 'isFullyPaid' | 'createdAt' | 'deadlineDate' | 'dailyAmount' | 'interestPercentage' | 'installmentAmount' | 'penaltyAmount' | 'lastPenaltyCalculated' | 'userId'>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addPayment: (paymentData: Omit<Payment, 'id' | 'customerName' | 'userId'>, paymentId?: string) => Promise<void>;
  addPaymentBatch: (payments: Payment[]) => Promise<{ success: boolean; errors: string[] }>;
  deletePayment: (id: string) => Promise<void>;
  getCustomerPayments: (customerId: string) => Payment[];
  getCustomerBySerialNumber: (serialNumber: string) => Customer | undefined;
  updateCustomerPaymentStatus: (customerId: string) => void;
  recalculateAllCustomerPayments: () => void;
  getDailyCollections: (date: string) => Payment[];
  getCurrentAreaCustomers: () => Customer[];
  getCurrentAreaPayments: () => Payment[];
  addArea: (areaData: Omit<Area, 'id' | 'createdAt' | 'userId'>) => Promise<Area>;
  deleteArea: (id: string) => Promise<void>;
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
  addDailyInterestEarning: (date: string) => Promise<void>;
  deleteDailyInterestEarning: (id: string) => Promise<void>;
  getCurrentAreaDailyEarnings: () => DailyInterestEarning[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

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
  
  if (principal <= 0 || totalInterest <= 0) {
    return 0;
  }
  
  // CORRECTED: Calculate what portion of PRINCIPAL this payment represents
  const principalRatio = Math.min(payment.amount / principal, 1);
  const earnedInterest = principalRatio * totalInterest;
  
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

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { user, firebaseUser } = useFirebaseAuth();
  const { toast } = useToast();
  
  // Local state for current area selection
  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null);

  // Use Firebase Realtime Database hooks
  const {
    data: customersData,
    loading: customersLoading,
    connected: customersConnected,
    pushData: pushCustomer,
    updateData: updateCustomerData,
    deleteData: deleteCustomerData
  } = useFirebaseRealtime<Record<string, Customer>>({
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
  } = useFirebaseRealtime<Record<string, Payment>>({
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
  } = useFirebaseRealtime<Record<string, Area>>({
    path: 'areas',
    enabled: !!user && !!firebaseUser
  });

  const {
    data: dailyEarningsData,
    loading: dailyEarningsLoading,
    connected: dailyEarningsConnected,
    pushData: pushDailyEarning,
    updateData: updateDailyEarningData,
    deleteData: deleteDailyEarningData
  } = useFirebaseRealtime<Record<string, DailyInterestEarning>>({
    path: 'dailyEarnings',
    enabled: !!user && !!firebaseUser
  });

  // Convert Firebase objects to arrays
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [dailyInterestEarnings, setDailyInterestEarnings] = useState<DailyInterestEarning[]>([]);

  useEffect(() => {
    if (customersData) {
      const customersList = Object.keys(customersData).map(key => ({
        id: key,
        ...customersData[key]
      }));
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
      setAreas(areasList);
    } else {
      setAreas([]);
    }
  }, [areasData]);

  useEffect(() => {
    if (dailyEarningsData) {
      const earningsList = Object.keys(dailyEarningsData).map(key => ({
        id: key,
        ...dailyEarningsData[key]
      }));
      setDailyInterestEarnings(earningsList);
    } else {
      setDailyInterestEarnings([]);
    }
  }, [dailyEarningsData]);

  const isLoading = customersLoading || paymentsLoading || areasLoading || dailyEarningsLoading;
  const isConnected = customersConnected && paymentsConnected && areasConnected && dailyEarningsConnected;

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
    
    updateCustomerData({ totalPaid: effectiveTotalPaid, isFullyPaid }, customerId);
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
          totalEarnings += interestAmount;
          
          // Add overpayment amount to earnings
          const overpayment = totalPaidByCustomer - totalAmountOwed;
          if (overpayment > 0) {
            totalEarnings += overpayment;
          }
        } else {
          // Customer has partially paid
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
      date.setDate(date.getDate() + (periods * 30));
    }
    
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Calculate penalty for overdue customers
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
      updateCustomerData({
        penaltyAmount: (customer.penaltyAmount || 0) + penaltyToAdd,
        lastPenaltyCalculated: currentDate.toISOString().split('T')[0]
      }, customerId);
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
    
    // Update all payments for this customer to preserve complete historical data
    const customerPayments = payments.filter(p => p.customerId === id);
    for (const payment of customerPayments) {
      await updatePaymentData({
        isCustomerDeleted: true,
        customerInterestAmount: customer.interestAmount,
        customerTotalAmountToBePaid: customer.totalAmountToBePaid,
        customerPaymentCategory: customer.paymentCategory,
        customerPenaltyAmount: customer.penaltyAmount || 0,
        customerTotalAmountGiven: customer.totalAmountGiven
      }, payment.id);
    }
    
    // Delete the customer
    await deleteCustomerData(id);
    
    toast({
      title: "Customer Deleted",
      description: "Customer deleted. Payment history preserved for accurate interest calculations.",
    });
  };
  
  // CRUD operations
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'totalAmountToBePaid' | 'totalPaid' | 'isFullyPaid' | 'createdAt' | 'deadlineDate' | 'dailyAmount' | 'interestPercentage' | 'installmentAmount' | 'penaltyAmount' | 'lastPenaltyCalculated' | 'userId'>): Promise<Customer> => {
    if (!user) throw new Error('User not authenticated');
    
    // Calculate the total amount to be paid with interest amount
    const principal = customerData.totalAmountGiven;
    const interestAmount = customerData.interestAmount || 0;
    const totalAmountToBePaid = principal + interestAmount;
    
    // Determine the number of periods based on payment category
    let periods: number;
    if (customerData.paymentCategory === 'daily') {
      periods = customerData.numberOfDays;
    } else if (customerData.paymentCategory === 'weekly') {
      periods = customerData.numberOfWeeks || Math.ceil(customerData.numberOfDays / 7);
    } else {
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
    
    const newCustomer: Omit<Customer, 'id'> = {
      ...customerData,
      userId: user.id,
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
    
    const newCustomerId = await pushCustomer(newCustomer);
    
    toast({
      title: "Customer Added",
      description: `${customerData.name} has been added successfully.`,
    });
    
    return { id: newCustomerId!, ...newCustomer };
  };
  
  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    let updatedData = { ...data };
    
    // If any of these values were updated, recalculate derived values
    if (data.totalAmountGiven !== undefined || 
        data.interestAmount !== undefined || 
        data.numberOfDays !== undefined ||
        data.numberOfWeeks !== undefined ||
        data.numberOfMonths !== undefined ||
        data.paymentCategory !== undefined ||
        data.issuedDate !== undefined) {
          
      const principal = data.totalAmountGiven ?? customer.totalAmountGiven;
      const interestAmount = data.interestAmount ?? customer.interestAmount;
      const numberOfDays = data.numberOfDays ?? customer.numberOfDays;
      const numberOfWeeks = data.numberOfWeeks ?? customer.numberOfWeeks;
      const numberOfMonths = data.numberOfMonths ?? customer.numberOfMonths;
      const paymentCategory = data.paymentCategory ?? customer.paymentCategory;
      const issuedDate = data.issuedDate ?? customer.issuedDate;

      // Recalculate derived values
      const totalAmountToBePaid = principal + interestAmount;
      
      let periods: number;
      if (paymentCategory === 'daily') {
        periods = numberOfDays;
      } else if (paymentCategory === 'weekly') {
        periods = numberOfWeeks || Math.ceil(numberOfDays / 7);
      } else {
        periods = numberOfMonths || Math.ceil(numberOfDays / 30);
      }
      
      const installmentAmount = totalAmountToBePaid / periods;
      const dailyAmount = totalAmountToBePaid / numberOfDays;
      const interestPercentage = principal > 0 ? (interestAmount / principal) * 100 : 0;
      const deadlineDate = calculateDeadlineDate(issuedDate, periods, paymentCategory);

      updatedData = {
        ...updatedData,
        totalAmountToBePaid,
        installmentAmount,
        dailyAmount,
        interestPercentage,
        deadlineDate
      };
    }
    
    await updateCustomerData(updatedData, id);
    
    toast({
      title: "Customer Updated",
      description: "Customer information has been updated successfully.",
    });
  };
  
  const getCustomerPayments = (customerId: string): Payment[] => {
    return payments.filter(payment => payment.customerId === customerId);
  };
  
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'customerName' | 'userId'>, paymentId?: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const customer = customers.find(c => c.id === paymentData.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';
    
    const newPayment: Omit<Payment, 'id'> = {
      ...paymentData,
      userId: user.id,
      customerName,
      areaId: currentAreaId || paymentData.areaId
    };
    
    await pushPayment(newPayment);
    
    // Update customer payment status after adding payment
    updateCustomerPaymentStatus(paymentData.customerId);
    
    toast({
      title: "Payment Added",
      description: `Payment of ₹${paymentData.amount} has been recorded.`,
    });
  };

  const addPaymentBatch = async (paymentsToAdd: Payment[]): Promise<{ success: boolean; errors: string[] }> => {
    if (!user) return { success: false, errors: ['User not authenticated'] };
    
    const errors: string[] = [];
    
    for (const payment of paymentsToAdd) {
      try {
        const paymentWithUser = { ...payment, userId: user.id };
        await pushPayment(paymentWithUser);
        updateCustomerPaymentStatus(payment.customerId);
      } catch (error) {
        errors.push(`Failed to add payment for ${payment.customerName}: ${error}`);
      }
    }
    
    if (errors.length === 0) {
      toast({
        title: "Batch Payment Success",
        description: `Successfully added ${paymentsToAdd.length} payments.`,
      });
    } else {
      toast({
        title: "Batch Payment Partial Success",
        description: `Added ${paymentsToAdd.length - errors.length} payments. ${errors.length} failed.`,
        variant: "destructive",
      });
    }
    
    return { success: errors.length === 0, errors };
  };
  
  const deletePayment = async (id: string): Promise<void> => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    
    await deletePaymentData(id);
    
    // Update customer payment status after deletion
    updateCustomerPaymentStatus(payment.customerId);
    
    toast({
      title: "Payment Deleted",
      description: "Payment has been deleted successfully.",
    });
  };
  
  const getDailyCollections = (date: string): Payment[] => {
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date).toISOString().split('T')[0];
      return paymentDate === date;
    });
  };
  
  const addArea = async (areaData: Omit<Area, 'id' | 'createdAt' | 'userId'>): Promise<Area> => {
    if (!user) throw new Error('User not authenticated');
    
    const newArea: Omit<Area, 'id'> = {
      ...areaData,
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    
    const newAreaId = await pushArea(newArea);
    
    toast({
      title: "Area Added",
      description: `${areaData.name} has been added successfully.`,
    });
    
    return { id: newAreaId!, ...newArea };
  };
  
  const deleteArea = async (id: string): Promise<void> => {
    await deleteAreaData(id);
    
    if (currentAreaId === id) {
      setCurrentAreaId(null);
    }
    
    toast({
      title: "Area Deleted",
      description: "Area has been deleted successfully.",
    });
  };

  const setCurrentArea = (areaId: string | null) => {
    setCurrentAreaId(areaId);
  };

  // Interest earnings calculations
  const calculateDailyInterestEarnings = (date: string): number => {
    const dayPayments = getDailyCollections(date);
    let totalInterestEarned = 0;
    
    dayPayments.forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      if (customer) {
        totalInterestEarned += calculateCorrectInterestEarning(payment, customer);
      } else if (payment.isCustomerDeleted) {
        totalInterestEarned += calculateCorrectInterestEarning(payment, payment);
      }
    });
    
    return totalInterestEarned;
  };

  const calculateWeeklyInterestEarnings = (weekStartDate: string): number => {
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const weekPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
    
    let totalInterestEarned = 0;
    
    weekPayments.forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      if (customer) {
        totalInterestEarned += calculateCorrectInterestEarning(payment, customer);
      } else if (payment.isCustomerDeleted) {
        totalInterestEarned += calculateCorrectInterestEarning(payment, payment);
      }
    });
    
    return totalInterestEarned;
  };

  const calculateMonthlyInterestEarnings = (month: string, year: string): number => {
    const monthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      const paymentMonth = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
      const paymentYear = paymentDate.getFullYear().toString();
      return paymentMonth === month && paymentYear === year;
    });
    
    let totalInterestEarned = 0;
    
    monthPayments.forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      if (customer) {
        totalInterestEarned += calculateCorrectInterestEarning(payment, customer);
      } else if (payment.isCustomerDeleted) {
        totalInterestEarned += calculateCorrectInterestEarning(payment, payment);
      }
    });
    
    return totalInterestEarned;
  };

  const getHistoricalPayments = (startDate: string, endDate: string): Payment[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= start && paymentDate <= end;
    });
  };

  const addDailyInterestEarning = async (date: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const existingEarning = dailyInterestEarnings.find(earning => 
      earning.date === date && earning.areaId === currentAreaId
    );
    
    if (existingEarning) {
      toast({
        title: "Daily Earning Exists",
        description: "A daily earning record already exists for this date.",
        variant: "destructive",
      });
      return;
    }
    
    const totalInterestEarned = calculateDailyInterestEarnings(date);
    const dayPayments = getDailyCollections(date);
    
    let totalPrincipleEarned = 0;
    dayPayments.forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      if (customer) {
        totalPrincipleEarned += calculatePrincipleEarning(payment, customer);
      } else if (payment.isCustomerDeleted) {
        totalPrincipleEarned += calculatePrincipleEarning(payment, payment);
      }
    });
    
    const newEarning: Omit<DailyInterestEarning, 'id'> = {
      date,
      totalInterestEarned,
      totalPrincipleEarned,
      areaId: currentAreaId || undefined,
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    
    await pushDailyEarning(newEarning);
    
    toast({
      title: "Daily Earning Added",
      description: `Daily earning for ${date} has been recorded.`,
    });
  };

  const deleteDailyInterestEarning = async (id: string): Promise<void> => {
    await deleteDailyEarningData(id);
    
    toast({
      title: "Daily Earning Deleted",
      description: "Daily earning record has been deleted.",
    });
  };

  const getCurrentAreaDailyEarnings = (): DailyInterestEarning[] => {
    if (!currentAreaId) return dailyInterestEarnings;
    return dailyInterestEarnings.filter(earning => earning.areaId === currentAreaId);
  };

  return (
    <FinanceContext.Provider value={{
      customers,
      payments,
      areas,
      dailyInterestEarnings,
      currentAreaId,
      isLoading,
      isConnected,
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
      getCurrentAreaDailyEarnings
    }}>
      {children}
    </FinanceContext.Provider>
  );
};