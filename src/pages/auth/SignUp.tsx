
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";

const SignUp = () => {
  const { signUp, signInWithGoogle, isLoading, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    const success = await signUp(email, password, name);
    
    if (success) {
      // Don't navigate here, let the auth state change handle the navigation
      // or if email confirmation is required, show appropriate message
      toast({
        title: "Account created!",
        description: "You may need to verify your email before signing in",
      });
      navigate("/sign-in");
    }
  };

  const handleGoogleSignUp = async () => {
    await signInWithGoogle();
    // Redirect happens automatically via the auth state change
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
            Create your account to start managing finances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="name"
                />
              </div>
            </div>
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
                  placeholder="Password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full py-6 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Button 
            onClick={handleGoogleSignUp} 
            variant="outline"
            className="w-full py-6 text-base"
            disabled={isLoading}
          >
            <FcGoogle className="mr-2 h-5 w-5" /> Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="ghost" 
            asChild
            className="text-sm flex items-center gap-1"
          >
            <Link to="/sign-in">
              <ArrowLeft size={16} /> Already have an account? Sign in
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUp;
