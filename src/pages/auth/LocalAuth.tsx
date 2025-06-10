
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/LocalAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock, Key, RefreshCw } from "lucide-react";

const LocalAuth = () => {
  const { user, isLoading, isFirstTime, setupCredentials, signIn, resetSetup } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      return;
    }

    if (isFirstTime && !masterPassword) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let success = false;
      
      if (isFirstTime) {
        success = await setupCredentials(username, password, masterPassword);
      } else {
        success = await signIn(username, password);
      }
      
      if (success) {
        // Navigation will be handled by useEffect when user state updates
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all credentials? This action cannot be undone.")) {
      await resetSetup();
      setUsername("");
      setPassword("");
      setMasterPassword("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
        <div className="animate-pulse text-center">
          <h1 className="text-3xl font-bold mb-2">Line Manager App</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <Card className="w-full max-w-md shadow-xl border-background">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Line Manager App</CardTitle>
          <CardDescription className="text-foreground/70 mt-2">
            {isFirstTime 
              ? "Set up your account credentials for first-time access" 
              : "Sign in to your account to manage your finances"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete={isFirstTime ? "new-password" : "current-password"}
                />
              </div>
            </div>
            
            {isFirstTime && (
              <div className="space-y-2">
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Master Password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the master password to set up your account
                </p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full py-6 text-base"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {isFirstTime ? "Setting up..." : "Signing in..."}
                </>
              ) : (
                isFirstTime ? "Set Up Account" : "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        
        {!isFirstTime && (
          <CardFooter className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-destructive"
            >
              Reset Credentials
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default LocalAuth;
