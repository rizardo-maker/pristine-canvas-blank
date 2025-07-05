
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SignIn = () => {
  const { signIn, isLoading, user } = useFirebaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if user is already logged in
  useEffect(() => {
    console.log("SignIn - User:", user);
    if (user) {
      console.log("User already authenticated, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Attempting sign in...");
    const success = await signIn(email, password);
    
    if (success) {
      console.log("Sign in successful, navigating to dashboard");
      navigate("/dashboard", { replace: true });
    } else {
      console.log("Sign in failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
        <div className="animate-pulse text-center">
          <h1 className="text-3xl font-bold mb-2">Finance Manager App</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <Card className="w-full max-w-md shadow-xl border-background">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Finance App</CardTitle>
          <CardDescription className="text-foreground/70 mt-2">
            Log in to your account to manage your finances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
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
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full py-6 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-sm flex items-center gap-1"
          >
            <ArrowLeft size={16} /> Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
