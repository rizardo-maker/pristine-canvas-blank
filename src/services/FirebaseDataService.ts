
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FirebaseCustomer {
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

export interface FirebasePayment {
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

export interface FirebaseArea {
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

export class FirebaseDataService {
  // Customer operations
  async saveCustomer(userId: string, customer: Omit<FirebaseCustomer, 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const customerData = {
        ...customer,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'customers'), customerData);
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error saving customer:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCustomer(customerId: string, updates: Partial<FirebaseCustomer>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      await updateDoc(doc(db, 'customers', customerId), updateData);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating customer:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteCustomer(customerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscription for customers
  subscribeToCustomers(userId: string, callback: (customers: FirebaseCustomer[]) => void): () => void {
    const q = query(
      collection(db, 'customers'), 
      where('userId', '==', userId),
      orderBy('lastModified', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const customers: FirebaseCustomer[] = [];
      snapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() } as FirebaseCustomer);
      });
      callback(customers);
    }, (error) => {
      console.error('Error in customers subscription:', error);
    });
  }

  // Payment operations
  async savePayment(userId: string, payment: Omit<FirebasePayment, 'userId' | 'createdAt'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const paymentData = {
        ...payment,
        userId,
        createdAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'payments'), paymentData);
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error saving payment:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePayment(paymentId: string, updates: Partial<FirebasePayment>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        lastModified: serverTimestamp()
      };

      await updateDoc(doc(db, 'payments', paymentId), updateData);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating payment:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'payments', paymentId));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscription for payments
  subscribeToPayments(userId: string, callback: (payments: FirebasePayment[]) => void): () => void {
    const q = query(
      collection(db, 'payments'), 
      where('userId', '==', userId),
      orderBy('lastModified', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const payments: FirebasePayment[] = [];
      snapshot.forEach((doc) => {
        payments.push({ id: doc.id, ...doc.data() } as FirebasePayment);
      });
      callback(payments);
    }, (error) => {
      console.error('Error in payments subscription:', error);
    });
  }

  // Area operations
  async saveArea(userId: string, area: Omit<FirebaseArea, 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const areaData = {
        ...area,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'areas'), areaData);
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error saving area:', error);
      return { success: false, error: error.message };
    }
  }

  async updateArea(areaId: string, updates: Partial<FirebaseArea>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      };

      await updateDoc(doc(db, 'areas', areaId), updateData);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating area:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteArea(areaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'areas', areaId));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting area:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscription for areas
  subscribeToAreas(userId: string, callback: (areas: FirebaseArea[]) => void): () => void {
    const q = query(
      collection(db, 'areas'), 
      where('userId', '==', userId),
      orderBy('lastModified', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const areas: FirebaseArea[] = [];
      snapshot.forEach((doc) => {
        areas.push({ id: doc.id, ...doc.data() } as FirebaseArea);
      });
      callback(areas);
    }, (error) => {
      console.error('Error in areas subscription:', error);
    });
  }

  // Bulk operations for data migration
  async migrateLocalData(userId: string, localData: {
    customers?: any[];
    payments?: any[];
    areas?: any[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting data migration to Firebase...');

      // Migrate customers
      if (localData.customers) {
        for (const customer of localData.customers) {
          await this.saveCustomer(userId, {
            ...customer,
            id: customer.id || Date.now().toString()
          });
        }
        console.log(`Migrated ${localData.customers.length} customers`);
      }

      // Migrate payments
      if (localData.payments) {
        for (const payment of localData.payments) {
          await this.savePayment(userId, {
            ...payment,
            id: payment.id || Date.now().toString()
          });
        }
        console.log(`Migrated ${localData.payments.length} payments`);
      }

      // Migrate areas
      if (localData.areas) {
        for (const area of localData.areas) {
          await this.saveArea(userId, {
            ...area,
            id: area.id || Date.now().toString()
          });
        }
        console.log(`Migrated ${localData.areas.length} areas`);
      }

      console.log('Data migration completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error during data migration:', error);
      return { success: false, error: error.message };
    }
  }
}

export const firebaseDataService = new FirebaseDataService();
