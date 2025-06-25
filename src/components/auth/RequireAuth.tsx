
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";

type RequireAuthProps = {
  children: React.ReactNode;
};

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, isLoading } = useFirebaseAuth();
  const location = useLocation();

  useEffect(() => {
    // This effect ensures we re-render when auth state changes
    if (!isLoading) {
      if (!user) {
        console.log("User not authenticated, will redirect to sign-in");
      } else {
        console.log("User authenticated, allowing access");
      }
    }
  }, [user, isLoading]);

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

  // If not authenticated, redirect to sign-in page
  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If authenticated, render the children
  return <>{children}</>;
};

export default RequireAuth;
