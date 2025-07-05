import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user: firebaseUser, isLoading } = useFirebaseAuth();
  
  useEffect(() => {
    console.log("Index - Firebase user:", firebaseUser);
    console.log("Index - Is loading:", isLoading);

    if (isLoading) return;
    
    // If Firebase user is authenticated, route to dashboard
    if (firebaseUser) {
      console.log("Firebase user authenticated, routing to dashboard");
      navigate('/dashboard');
      return;
    }
    
    // If not authenticated, redirect to sign-in
    console.log("User not authenticated, redirecting to sign-in");
    navigate('/sign-in');
  }, [firebaseUser, isLoading, navigate]);
  
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

  // Show landing page with authentication options
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold mb-6">Line Manager App</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your all-in-one solution for managing finances, tracking customers, and monitoring collections.
        </p>
        
        <div className="space-y-4">
          <div className="text-lg font-semibold text-muted-foreground mb-4">
            Welcome to Line Manager App
          </div>
          
          {/* Firebase Authentication Options */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Cloud Sync with Real-time Updates</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Access your data from any device with automatic cloud synchronization and real-time updates
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
        </div>
      </div>
    </div>
  );
};

export default Index;
