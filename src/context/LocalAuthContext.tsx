import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/LocalAuthService';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirstTime: boolean;
  setupCredentials: (username: string, password: string, masterPassword: string) => Promise<boolean>;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
  resetSetup: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await authService.init();
        
        // Check if this is first time setup
        const firstTime = await authService.isFirstTimeSetup();
        setIsFirstTime(firstTime);
        
        // We no longer automatically sign in the user.
        // The user will be null on initial load.
        
      } catch (error) {
        console.error('Auth initialization failed:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to initialize authentication system",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const setupCredentials = async (username: string, password: string, masterPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.setupCredentials(username, password, masterPassword);
      
      if (result.success) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setIsFirstTime(false);
        
        toast({
          title: "Setup Complete",
          description: "Your credentials have been saved successfully",
        });
        return true;
      } else {
        toast({
          title: "Setup Failed",
          description: result.error || "Failed to setup credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Setup failed:', error);
      toast({
        title: "Setup Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.login(username, password);
      
      if (result.success && result.user) {
        setUser(result.user);
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
    } catch (error) {
      console.error('Sign in failed:', error);
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

  const signOut = () => {
    authService.logout();
    setUser(null);
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };

  const resetSetup = async () => {
    try {
      await authService.resetCredentials();
      setUser(null);
      setIsFirstTime(true);
      toast({
        title: "Setup Reset",
        description: "Credentials have been cleared. You can now set up again.",
      });
    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isFirstTime, 
      setupCredentials, 
      signIn, 
      signOut, 
      resetSetup 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
