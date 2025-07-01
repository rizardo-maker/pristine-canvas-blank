
import React, { createContext, useContext } from 'react';

// Placeholder interface for compatibility
interface LocalAuthContextType {
  user: null;
  isLoading: boolean;
  isFirstTime: boolean;
}

const LocalAuthContext = createContext<LocalAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(LocalAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a LocalAuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // This is a placeholder context that always returns null user
  // Real authentication is handled by Firebase
  return (
    <LocalAuthContext.Provider value={{
      user: null,
      isLoading: false,
      isFirstTime: false
    }}>
      {children}
    </LocalAuthContext.Provider>
  );
};
