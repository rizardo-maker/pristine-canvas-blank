
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/LocalAuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { areas, currentAreaId } = useFinance();
  const { user, isLoading, isFirstTime } = useAuth();
  
  useEffect(() => {
    if (isLoading) return;
    
    // If user is authenticated, route to appropriate page
    if (user && !isFirstTime) {
      console.log("User authenticated, routing to app");
      routeUser();
    }
    // If user is not authenticated or first time, they'll see the landing page
  }, [user, isLoading, isFirstTime]);
  
  const routeUser = () => {
    if (!user) return;
    
    if (areas.length === 0) {
      navigate('/areas');
    } else if (!currentAreaId) {
      navigate('/areas');
    } else {
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <div className="text-center animate-pulse">
          <h1 className="text-4xl font-bold mb-4">Line Manager App</h1>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or first time setup, show landing page
  if (!user || isFirstTime) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl font-bold mb-6">Line Manager App</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your all-in-one solution for managing finances, tracking customers, and monitoring collections.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')} 
              className="py-6 px-8 text-lg flex items-center gap-2"
            >
              <LogIn size={20} /> {isFirstTime ? 'Set Up Account' : 'Sign In'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Should never reach here because of the useEffect redirect
  return null;
};

export default Index;
