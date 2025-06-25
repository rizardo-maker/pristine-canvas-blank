
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { firebaseService, FirebaseUser } from '@/services/FirebaseService';
import { useToast } from '@/hooks/use-toast';

interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  firebaseUser: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setFirebaseUser(firebaseUser);
        
        // Get user data from Firestore
        const result = await firebaseService.getUserData(firebaseUser.uid);
        if (!result.error) {
          // If no user data in Firestore, create basic user object
          const userData: FirebaseUser = {
            id: firebaseUser.uid,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email!,
            createdAt: new Date().toISOString()
          };
          setUser(userData);
        }
      } else {
        // User is signed out
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, username: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await firebaseService.signUp(email, password, username);
      
      if (result.success && result.user) {
        toast({
          title: "Account created successfully!",
          description: `Welcome ${result.user.username}!`,
        });
        return true;
      } else {
        toast({
          title: "Sign up failed",
          description: result.error || "Failed to create account",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await firebaseService.signIn(email, password);
      
      if (result.success && result.user) {
        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${result.user.username}`,
        });
        return true;
      } else {
        toast({
          title: "Sign in failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseService.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  return (
    <FirebaseAuthContext.Provider value={{
      user,
      firebaseUser,
      isLoading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};
