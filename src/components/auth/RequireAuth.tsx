
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useAuth } from "@/context/LocalAuthContext";

type RequireAuthProps = {
  children: React.ReactNode;
};

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user: firebaseUser, isLoading: firebaseLoading } = useFirebaseAuth();
  const { user: localUser, isLoading: localLoading } = useAuth();
  const location = useLocation();

  const isLoading = firebaseLoading || localLoading;

  useEffect(() => {
    console.log("RequireAuth - Firebase user:", firebaseUser);
    console.log("RequireAuth - Local user:", localUser);
    console.log("RequireAuth - Is loading:", isLoading);
  }, [firebaseUser, localUser, isLoading]);

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

  // Check if user is authenticated (either Firebase or local)
  const isAuthenticated = firebaseUser || localUser;

  // If not authenticated, redirect to sign-in page
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to sign-in");
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  console.log("User authenticated, rendering protected content");
  // If authenticated, render the children
  return <>{children}</>;
};

export default RequireAuth;
