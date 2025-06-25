
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/LocalAuthContext';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user: localUser, isLoading: localLoading, isFirstTime } = useAuth();
  const { user: firebaseUser, isLoading: firebaseLoading } = useFirebaseAuth();
  
  const isLoading = localLoading || firebaseLoading;
  
  useEffect(() => {
    console.log("Index - Firebase user:", firebaseUser);
    console.log("Index - Local user:", localUser);
    console.log("Index - Is loading:", isLoading);
    console.log("Index - Is first time:", isFirstTime);

    if (isLoading) return;
    
    // If Firebase user is authenticated, route to dashboard
    if (firebaseUser) {
      console.log("Firebase user authenticated, routing to dashboard");
      navigate('/dashboard');
      return;
    }
    
    // If local user is authenticated and setup is complete, route to appropriate page
    if (localUser && !isFirstTime) {
      console.log("Local user authenticated, routing to app-entry");
      navigate('/app-entry');
    }
    // If user is not authenticated or first time, they'll see the landing page
  }, [localUser, firebaseUser, isLoading, isFirstTime, navigate]);
  
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

  // If user is authenticated, don't show landing page
  if (firebaseUser || (localUser && !isFirstTime)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <div className="text-center animate-pulse">
          <h1 className="text-4xl font-bold mb-4">Line Manager App</h1>
          <p className="text-xl text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page with authentication options
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold mb-6">Line Manager App</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your all-in-one solution for managing finances, tracking customers, and monitoring collections.
        </p>
        
        <div className="space-y-4">
          <div className="text-lg font-semibold text-muted-foreground mb-4">
            Choose your authentication method:
          </div>
          
          {/* Firebase Authentication Options */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Cloud Sync (Recommended)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Access your data from any device with automatic cloud synchronization
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/sign-in')} 
                className="py-3 px-6 text-base flex items-center gap-2"
              >
                <LogIn size={20} /> Sign In
              </Button>
              <Button 
                onClick={() => navigate('/sign-up')} 
                variant="outline"
                className="py-3 px-6 text-base flex items-center gap-2"
              >
                <UserPlus size={20} /> Sign Up
              </Button>
            </div>
          </div>
          
          {/* Local Authentication Option */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Local Access</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use the app locally on this device only (data won't sync across devices)
            </p>
            <Button 
              onClick={() => navigate('/auth')} 
              variant="secondary"
              className="py-3 px-6 text-base flex items-center gap-2"
            >
              <LogIn size={20} /> {isFirstTime ? 'Set Up Local Account' : 'Access Locally'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
