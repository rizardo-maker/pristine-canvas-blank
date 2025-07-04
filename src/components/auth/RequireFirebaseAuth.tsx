import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";

type RequireFirebaseAuthProps = {
  children: React.ReactNode;
};

const RequireFirebaseAuth = ({ children }: RequireFirebaseAuthProps) => {
  const { user, isLoading } = useFirebaseAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("RequireFirebaseAuth - User:", user);
    console.log("RequireFirebaseAuth - Is loading:", isLoading);
    console.log("RequireFirebaseAuth - Current location:", location.pathname);
  }, [user, isLoading, location.pathname]);

  // If still loading auth state, show a loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <div className="animate-pulse text-center">
          <p className="text-lg font-medium">Authenticating...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to home page
  if (!user) {
    console.log("User not authenticated, redirecting to home");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  console.log("User authenticated, rendering protected content");
  // If authenticated, render the children
  return <>{children}</>;
};

export default RequireFirebaseAuth;