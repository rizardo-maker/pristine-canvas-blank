
import React, { useState } from 'react';
import { useAuth } from '@/context/LocalAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LocalAuth = () => {
  const { login, setupUser, isFirstTime, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    masterPassword: ''
  });
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFirstTime) {
        if (!formData.masterPassword) {
          toast({
            title: "Error",
            description: "Master password is required for setup.",
            variant: "destructive",
          });
          return;
        }
        
        const success = await setupUser(formData.username, formData.password, formData.masterPassword);
        if (success) {
          toast({
            title: "Setup Complete",
            description: "Your account has been set up successfully!",
          });
          navigate(from, { replace: true });
        } else {
          toast({
            title: "Setup Failed",
            description: "There was an error setting up your account.",
            variant: "destructive",
          });
        }
      } else {
        const success = await login(formData.username, formData.password);
        if (success) {
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
          navigate(from, { replace: true });
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid username or password.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <div className="animate-pulse text-center">
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {isFirstTime ? 'Setup Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isFirstTime 
              ? 'Create your local account to get started'
              : 'Sign in to your account to continue'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {isFirstTime && (
              <div className="space-y-2">
                <Label htmlFor="masterPassword" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Master Password
                </Label>
                <Input
                  id="masterPassword"
                  name="masterPassword"
                  type="password"
                  placeholder="Create a master password"
                  value={formData.masterPassword}
                  onChange={handleInputChange}
                  required={isFirstTime}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used to secure your data. Remember it well!
                </p>
              </div>
            )}
            
            <Button type="submit" className="w-full">
              {isFirstTime ? 'Setup Account' : 'Sign In'}
            </Button>
          </form>
          
          {isFirstTime && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                Your data will be stored locally on this device. The master password adds an extra layer of security.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalAuth;
