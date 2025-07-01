
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const LocalAuth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-6">Local Authentication</h1>
        <p className="text-muted-foreground mb-8">
          Local authentication has been replaced with Firebase authentication for better security and sync capabilities.
        </p>
        <Button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default LocalAuth;
