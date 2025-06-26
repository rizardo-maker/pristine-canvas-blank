
import { 
  ref, 
  push, 
  set, 
  get, 
  remove, 
  onValue, 
  off, 
  serverTimestamp,
  update,
  child
} from 'firebase/database';
import { realtimeDb } from '../config/firebase';

export interface RealtimeCustomer {
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

export interface RealtimePayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  area: string;
  collectionType: 'daily' | 'weekly' | 'monthly';
  paymentMethod: 'cash' | 'online' | 'check';
  notes?: string;
  receiptNumber?: string;
  createdAt: string;
  userId: string;
}

export interface RealtimeArea {
  id: string;
  name: string;
  description?: string;
  totalCustomers: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export class FirebaseRealtimeService {
  // Customer operations
  async saveCustomer(userId: string, customer: Omit<RealtimeCustomer, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const customerData = {
        ...customer,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      const customersRef = ref(realtimeDb, `users/${userId}/customers`);
      const newCustomerRef = push(customersRef);
      await set(newCustomerRef, customerData);
      
      return { success: true, id: newCustomerRef.key || '' };
    } catch (error: any) {
      console.error('Error saving customer:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCustomer(userId: string, customerId: string, updates: Partial<RealtimeCustomer>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      const customerRef = ref(realtimeDb, `users/${userId}/customers/${customerId}`);
      await update(customerRef, updateData);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating customer:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteCustomer(userId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const customerRef = ref(realtimeDb, `users/${userId}/customers/${customerId}`);
      await remove(customerRef);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscription for customers
  subscribeToCustomers(userId: string, callback: (customers: RealtimeCustomer[]) => void): () => void {
    const customersRef = ref(realtimeDb, `users/${userId}/customers`);
    
    const unsubscribe = onValue(customersRef, (snapshot) => {
      const customers: RealtimeCustomer[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          customers.push({ id: key, ...data[key] });
        });
      }
      console.log('Real-time customers update:', customers.length);
      callback(customers);
    }, (error) => {
      console.error('Error in customers subscription:', error);
    });

    return () => off(customersRef, 'value', unsubscribe);
  }

  // Payment operations
  async savePayment(userId: string, payment: Omit<RealtimePayment, 'userId' | 'createdAt' | 'id'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const paymentData = {
        ...payment,
        userId,
        createdAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      const paymentsRef = ref(realtimeDb, `users/${userId}/payments`);
      const newPaymentRef = push(paymentsRef);
      await set(newPaymentRef, paymentData);
      
      return { success: true, id: newPaymentRef.key || '' };
    } catch (error: any) {
      console.error('Error saving payment:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePayment(userId: string, paymentId: string, updates: Partial<RealtimePayment>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        lastModified: serverTimestamp()
      };

      const paymentRef = ref(realtimeDb, `users/${userId}/payments/${paymentId}`);
      await update(paymentRef, updateData);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating payment:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePayment(userId: string, paymentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const paymentRef = ref(realtimeDb, `users/${userId}/payments/${paymentId}`);
      await remove(paymentRef);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscription for payments
  subscribeToPayments(userId: string, callback: (payments: RealtimePayment[]) => void): () => void {
    const paymentsRef = ref(realtimeDb, `users/${userId}/payments`);
    
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      const payments: RealtimePayment[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          payments.push({ id: key, ...data[key] });
        });
      }
      console.log('Real-time payments update:', payments.length);
      callback(payments);
    }, (error) => {
      console.error('Error in payments subscription:', error);
    });

    return () => off(paymentsRef, 'value', unsubscribe);
  }

  // Area operations
  async saveArea(userId: string, area: Omit<RealtimeArea, 'userId' | 'createdAt' | 'updatedAt' | 'id'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const areaData = {
        ...area,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      const areasRef = ref(realtimeDb, `users/${userId}/areas`);
      const newAreaRef = push(areasRef);
      await set(newAreaRef, areaData);
      
      return { success: true, id: newAreaRef.key || '' };
    } catch (error: any) {
      console.error('Error saving area:', error);
      return { success: false, error: error.message };
    }
  }

  async updateArea(userId: string, areaId: string, updates: Partial<RealtimeArea>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      const areaRef = ref(realtimeDb, `users/${userId}/areas/${areaId}`);
      await update(areaRef, updateData);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating area:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteArea(userId: string, areaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const areaRef = ref(realtimeDb, `users/${userId}/areas/${areaId}`);
      await remove(areaRef);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting area:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscription for areas
  subscribeToAreas(userId: string, callback: (areas: RealtimeArea[]) => void): () => void {
    const areasRef = ref(realtimeDb, `users/${userId}/areas`);
    
    const unsubscribe = onValue(areasRef, (snapshot) => {
      const areas: RealtimeArea[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          areas.push({ id: key, ...data[key] });
        });
      }
      console.log('Real-time areas update:', areas.length);
      callback(areas);
    }, (error) => {
      console.error('Error in areas subscription:', error);
    });

    return () => off(areasRef, 'value', unsubscribe);
  }

  // Bulk operations for data migration
  async migrateLocalData(userId: string, localData: {
    customers?: any[];
    payments?: any[];
    areas?: any[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting data migration to Firebase Realtime Database...');

      // Migrate customers
      if (localData.customers && localData.customers.length > 0) {
        const customersRef = ref(realtimeDb, `users/${userId}/customers`);
        const customersData: any = {};
        
        for (const customer of localData.customers) {
          const customerKey = push(child(customersRef, 'temp')).key;
          if (customerKey) {
            customersData[customerKey] = {
              ...customer,
              userId,
              lastModified: serverTimestamp()
            };
          }
        }
        
        await update(customersRef, customersData);
        console.log(`Migrated ${localData.customers.length} customers`);
      }

      // Migrate payments
      if (localData.payments && localData.payments.length > 0) {
        const paymentsRef = ref(realtimeDb, `users/${userId}/payments`);
        const paymentsData: any = {};
        
        for (const payment of localData.payments) {
          const paymentKey = push(child(paymentsRef, 'temp')).key;
          if (paymentKey) {
            paymentsData[paymentKey] = {
              ...payment,
              userId,
              lastModified: serverTimestamp()
            };
          }
        }
        
        await update(paymentsRef, paymentsData);
        console.log(`Migrated ${localData.payments.length} payments`);
      }

      // Migrate areas
      if (localData.areas && localData.areas.length > 0) {
        const areasRef = ref(realtimeDb, `users/${userId}/areas`);
        const areasData: any = {};
        
        for (const area of localData.areas) {
          const areaKey = push(child(areasRef, 'temp')).key;
          if (areaKey) {
            areasData[areaKey] = {
              ...area,
              userId,
              lastModified: serverTimestamp()
            };
          }
        }
        
        await update(areasRef, areasData);
        console.log(`Migrated ${localData.areas.length} areas`);
      }

      console.log('Data migration to Realtime Database completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error during data migration:', error);
      return { success: false, error: error.message };
    }
  }

  // Connection status monitoring
  subscribeToConnectionStatus(callback: (isConnected: boolean) => void): () => void {
    const connectedRef = ref(realtimeDb, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      console.log('Firebase connection status:', isConnected ? 'Connected' : 'Disconnected');
      callback(isConnected);
    });

    return () => off(connectedRef, 'value', unsubscribe);
  }
}

export const firebaseRealtimeService = new FirebaseRealtimeService();
