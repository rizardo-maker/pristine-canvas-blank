import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import UserButton from '../auth/UserButton';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Database, RefreshCw, Info, Mic, Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/context/FinanceContext';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VoiceNavigationProvider, useSharedVoiceNavigation } from '@/context/VoiceNavigationContext';
import { voiceNavRoutes } from '@/config/voice-nav-routes';
import HelpDialog from './HelpDialog';
import { useVoiceAction } from '@/hooks/useVoiceAction';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const LayoutContent: React.FC<LayoutProps> = ({ children, className }) => {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const { isConnected, isLoading } = useFinance();
  const [syncStatus, setSyncStatus] = useState('');
  const { isListening, toggleListening, setHelpOpen } = useSharedVoiceNavigation();

  useVoiceAction(
    ['help', 'show help', 'open help', 'voice commands'],
    () => {
      setHelpOpen(true);
    },
  );

  useEffect(() => {
    if (user) {
      updateSyncStatus();
      
      // Update sync status periodically
      const interval = setInterval(updateSyncStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isConnected]);

  const updateSyncStatus = () => {
    if (user) {
      if (isLoading) {
        setSyncStatus("Syncing...");
      } else if (isConnected) {
        setSyncStatus("Real-time sync active");
      } else {
        setSyncStatus("Offline - will sync when connected");
      }
    }
  };

  const handleRefreshSync = () => {
    updateSyncStatus();
    toast({
      title: "Sync status updated",
      description: "Connection status refreshed.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex justify-between items-center p-4 lg:pl-64">
        {user && (
          <div className="flex items-center text-xs text-muted-foreground gap-3">
            <div className="flex items-center">
              {isConnected ? (
                <Wifi className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span>{syncStatus}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Firebase Real-time Database</p>
                    <p className="text-xs mt-1">Data syncs instantly across all devices</p>
                    <p className="text-xs">Offline changes sync when reconnected</p>
                    <p className="text-xs mt-1">Status: {isConnected ? 'Connected' : 'Offline'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button 
                onClick={handleRefreshSync}
                className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}
        <UserButton />
      </div>
      
      <main 
        className={cn(
          "transition-all duration-300 pt-16 lg:pt-4 lg:pl-64 min-h-screen",
          className
        )}
      >
        <div className="container mx-auto p-4 max-w-7xl">
          {children}
        </div>
      </main>

      {/* Floating Voice Command Button */}
      {user && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleListening}
                className={cn(
                  "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center",
                  isListening 
                    ? "bg-destructive text-destructive-foreground animate-pulse" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                aria-label="Toggle Voice Navigation"
              >
                <Mic className="h-7 w-7" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="mb-2">
              <p>{isListening ? 'Stop' : 'Start'} voice navigation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

    </div>
  );
};

const HelpDialogController = () => {
  const { isHelpOpen, setHelpOpen } = useSharedVoiceNavigation();
  return <HelpDialog open={isHelpOpen} onOpenChange={setHelpOpen} />;
}

const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <VoiceNavigationProvider routes={voiceNavRoutes}>
      <LayoutContent {...props} />
      <HelpDialogController />
    </VoiceNavigationProvider>
  );
};

export default Layout;
