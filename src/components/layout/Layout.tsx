import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import UserButton from '../auth/UserButton';
import { useAuth } from '@/context/LocalAuthContext';
import { displaySyncStatus, getDeviceId } from '@/utils/indexedDB';
import { Database, RefreshCw, Info, FileUp, FileDown, AlertTriangle, Mic } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportData, handleImportClick } from '@/utils/dataExport';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const finance = useFinance();
  const [syncStatus, setSyncStatus] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
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
      setDeviceId(getDeviceId().substring(0, 10) + '...');
      
      // Check for last import date
      const lastImport = localStorage.getItem('last_import_date');
      if (lastImport) {
        const date = new Date(lastImport);
        setLastImportDate(
          date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        );
      }
      
      // Update sync status every minute
      const interval = setInterval(updateSyncStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const updateSyncStatus = async () => {
    if (user) {
      try {
        const status = await displaySyncStatus(user.id);
        setSyncStatus(status);
      } catch (error) {
        console.error("Error updating sync status:", error);
        setSyncStatus("Status unknown");
      }
    }
  };

  const handleRefreshSync = async () => {
    if (!user || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await updateSyncStatus();
      toast({
        title: "Sync status updated",
        description: "Latest sync information retrieved.",
      });
    } catch (error) {
      console.error("Error refreshing sync:", error);
      toast({
        title: "Sync refresh failed",
        description: "Could not update sync status.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleExportClick = async () => {
    if (!user || isExporting) return;
    
    setIsExporting(true);
    try {
      const result = await exportData(user.id);
      if (!result) {
        toast({
          title: "Export issue",
          description: "There may have been an issue with the export.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleImport = () => {
    if (!user) return;
    
    // Show confirmation dialog first
    setShowImportDialog(true);
  };
  
  const confirmImport = () => {
    setShowImportDialog(false);
    
    if (!user) return;
    
    setImportProgress("Preparing to import...");
    
    handleImportClick(user.id, () => {
      // Update the last import date
      setLastImportDate(
        new Date().toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
      
      setImportProgress(null);
      // Force reload to refresh context data
      window.location.reload();
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex justify-between items-center p-4 lg:pl-64">
        {user && (
          <div className="flex items-center text-xs text-muted-foreground gap-3">
            <div className="flex items-center">
              <Database className="h-3 w-3 mr-1" />
              <span>{syncStatus}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Device ID: {deviceId}</p>
                    <p className="text-xs mt-1">Data is stored locally on this device.</p>
                    <p className="text-xs">Use import/export to transfer data between devices.</p>
                    {lastImportDate && (
                      <p className="text-xs mt-1">Last import: {lastImportDate}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button 
                onClick={handleRefreshSync}
                className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSyncing}
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 border-l pl-3 border-muted">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleExportClick}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isExporting}
                    >
                      <FileDown className={`h-3.5 w-3.5 ${isExporting ? 'animate-pulse' : ''}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      <p>Export all data to file</p>
                      <p className="text-xs mt-1">Includes customers, payments, and areas</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleImport}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FileUp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      <p>Import data from file</p>
                      <p className="text-xs mt-1">Merge with existing data</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Import Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              Importing data will merge it with your existing data. This action cannot be undone.
              <br /><br />
              Only import files exported from this application. The application will reload after import.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Continue Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Progress Dialog */}
      <Dialog open={!!importProgress} onOpenChange={(open) => !open && setImportProgress(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importing Data</DialogTitle>
            <DialogDescription>
              Please wait while we import your data...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p>{importProgress}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
