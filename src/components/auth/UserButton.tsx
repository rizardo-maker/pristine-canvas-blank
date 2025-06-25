
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/LocalAuthContext";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserButton = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <Button variant="outline" onClick={() => navigate("/auth")} className="gap-2">
        <User size={18} />
        <span>Sign In</span>
      </Button>
    );
  }

  // User avatar or initials for signed in users
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <div className="flex h-10 w-10 rounded-full bg-primary text-primary-foreground items-center justify-center">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>{user.username}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
