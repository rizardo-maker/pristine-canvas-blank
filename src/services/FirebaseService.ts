import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  UserCredential 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface FirebaseUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export class FirebaseService {
  // Authentication methods
  async signUp(email: string, password: string, username: string): Promise<{ success: boolean; error?: string; user?: FirebaseUser }> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save additional user data to Firestore
      const userData: FirebaseUser = {
        id: user.uid,
        username,
        email: user.email!,
        createdAt: new Date().toISOString()
      };
      
      try {
        await setDoc(doc(db, 'users', user.uid), userData);
      } catch (firestoreError) {
        console.log("Could not save to Firestore (offline), but auth succeeded");
      }
      
      return { success: true, user: userData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: FirebaseUser }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Try to get user data from Firestore, but don't fail if offline
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as FirebaseUser;
          return { success: true, user: userData };
        } else {
          // No user data in Firestore, but auth succeeded
          return { success: true, user: undefined };
        }
      } catch (firestoreError) {
        console.log("Firestore offline during sign in, but Firebase Auth succeeded");
        // Return success without user data - will be handled by auth context
        return { success: true, user: undefined };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Firestore data operations
  async saveUserData(userId: string, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      await setDoc(doc(db, 'userData', userId), {
        userId,
        data,
        lastUpdated: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getUserData(userId: string): Promise<{ data?: any; error?: string }> {
    try {
      const docRef = doc(db, 'userData', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { data: docSnap.data().data };
      } else {
        return { data: null };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async saveCustomers(userId: string, customers: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete existing customers for this user
      const q = query(collection(db, 'customers'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // Add new customers
      for (const customer of customers) {
        await addDoc(collection(db, 'customers'), {
          ...customer,
          userId
        });
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCustomers(userId: string): Promise<{ data?: any[]; error?: string }> {
    try {
      const q = query(collection(db, 'customers'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const customers: any[] = [];
      querySnapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() });
      });
      
      return { data: customers };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async savePayments(userId: string, payments: any[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete existing payments for this user
      const q = query(collection(db, 'payments'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // Add new payments
      for (const payment of payments) {
        await addDoc(collection(db, 'payments'), {
          ...payment,
          userId
        });
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPayments(userId: string): Promise<{ data?: any[]; error?: string }> {
    try {
      const q = query(collection(db, 'payments'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const payments: any[] = [];
      querySnapshot.forEach((doc) => {
        payments.push({ id: doc.id, ...doc.data() });
      });
      
      return { data: payments };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}

export const firebaseService = new FirebaseService();
