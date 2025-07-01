
import { saveAs } from 'file-saver';
import { Customer, Payment, Area } from '@/context/FinanceContext';
import { toast } from '@/hooks/use-toast';
import { invoke } from '@tauri-apps/api/tauri';
import { isMobile } from '@/utils/mobileUtils';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Interface for export data structure
interface ExportData {
  version: string;
  exportDate: string;
  deviceId: string;
  data: {
    customers: Customer[];
    payments: Payment[];
    areas: Area[];
  };
}

/**
 * Export all app data to a JSON file
 */
export const exportData = async (customers: Customer[], payments: Payment[], areas: Area[]): Promise<boolean> => {
  try {
    // Show loading toast
    toast({
      title: "Exporting data...",
      description: "Please wait while we prepare your data.",
    });

    if (!customers.length && !payments.length && !areas.length) {
      toast({
        title: "No data to export",
        description: "There is no data to export at this time.",
        variant: "destructive",
      });
      return false;
    }
    
    // Create export data structure
    const exportData: ExportData = {
      version: "1.2",
      exportDate: new Date().toISOString(),
      deviceId: getDeviceId(),
      data: {
        customers,
        payments,
        areas,
      }
    };
    
    // Generate a descriptive filename with timestamp
    const date = new Date();
    const timestamp = date.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `finance-data-${timestamp}.json`;
    
    // Convert to JSON with pretty formatting for better readability
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Use Tauri API if available
    if (isTauri()) {
      try {
        await invoke('save_file_dialog', { content: jsonData, filename });
        toast({
          title: "Data exported successfully",
          description: `Your file has been saved.`,
        });
        return true;
      } catch (error) {
        console.error("Tauri export error:", error);
        toast({
          title: "Export Failed",
          description: "The file could not be saved.",
          variant: "destructive",
        });
        return false;
      }
    }

    // Use Capacitor Filesystem API for mobile
    if (isMobile()) {
      try {
        await Filesystem.writeFile({
          path: filename,
          data: jsonData,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        toast({
          title: "Data exported successfully",
          description: `Saved to Documents folder as ${filename}`,
        });
        return true;
      } catch (error) {
        console.error("Capacitor export error:", error);
        toast({
          title: "Export Failed",
          description: "Could not save file to device storage. You may need to grant permissions.",
          variant: "destructive",
        });
        return false;
      }
    }

    // Fallback to web-based download
    try {
      const blob = new Blob([jsonData], { type: 'application/json' });
      saveAs(blob, filename);
      
      toast({
        title: "Data exported successfully",
        description: `Saved as ${filename}`,
      });
      
      return true;
    } catch (saveError) {
      console.error("Error saving file:", saveError);
      
      // Fallback method if saveAs fails
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(new Blob([jsonData], { type: 'application/json' }));
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Data exported successfully",
        description: `Saved as ${filename} (using fallback method)`,
      });
      
      return true;
    }
  } catch (error) {
    console.error("Export error:", error);
    toast({
      title: "Export failed",
      description: "Failed to export data. Try again later.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Processes imported data from a JSON string and returns it for Firebase upload.
 */
const importDataFromString = async (jsonString: string): Promise<{ success: boolean; data?: ExportData['data']; error?: string }> => {
  try {
    toast({
      title: "Processing import file...",
      description: "Please wait while we process your file.",
    });

    let importedData: ExportData;
    
    try {
      importedData = JSON.parse(jsonString) as ExportData;
    } catch (e) {
      return { success: false, error: "The selected file is not valid JSON." };
    }
    
    if (!importedData || !importedData.data) {
      return { success: false, error: "The selected file is not a valid finance app export." };
    }
    
    if (!importedData.data.customers || !Array.isArray(importedData.data.customers) ||
        !importedData.data.payments || !Array.isArray(importedData.data.payments) ||
        !importedData.data.areas || !Array.isArray(importedData.data.areas)) {
      return { success: false, error: "The export file is missing required data structures." };
    }
    
    return { success: true, data: importedData.data };
  } catch (error) {
    console.error("Import error:", error);
    return { success: false, error: "Failed to process import file." };
  }
};

/**
 * Import data from a JSON file (for web)
 */
export const importData = async (file: File): Promise<{ success: boolean; data?: ExportData['data']; error?: string }> => {
  try {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return { success: false, error: "Maximum file size is 10MB." };
    }
    
    const text = await file.text();
    return await importDataFromString(text);
  } catch (error) {
    console.error("Import file read error:", error);
    return { success: false, error: "Could not read the selected file." };
  }
};

/**
 * Create data import dialog handler that returns the parsed data
 */
export const handleImportClick = (onComplete: (data: ExportData['data']) => void) => {
  if (isTauri()) {
    invoke<string>('open_file_dialog')
      .then(async (content) => {
        if (content) {
          const result = await importDataFromString(content);
          if (result.success && result.data) {
            onComplete(result.data);
          } else {
            toast({
              title: "Import Failed",
              description: result.error || "Could not process the file.",
              variant: "destructive",
            });
          }
        } else {
          toast({ title: "Import Cancelled", description: "No file was selected." });
        }
      })
      .catch((err) => {
        console.error('Tauri open dialog error:', err);
        toast({
          title: "Import Failed",
          description: "Could not open the file.",
          variant: "destructive",
        });
      });
    return;
  }
  
  // Web-based file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  
  fileInput.onchange = async (event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      toast({
        title: "No file selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }
    
    const file = target.files[0];
    
    const validation = validateImportFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error || "The selected file cannot be imported.",
        variant: "destructive",
      });
      return;
    }
    
    const result = await importData(file);
    
    if (result.success && result.data) {
      onComplete(result.data);
    } else {
      toast({
        title: "Import Failed",
        description: result.error || "Could not process the file.",
        variant: "destructive",
      });
    }
  };
  
  fileInput.click();
};

/**
 * Validate import file before processing
 */
export const validateImportFile = (file: File): { valid: boolean, error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  if (!file.name.toLowerCase().endsWith('.json')) {
    return { valid: false, error: 'File must be a JSON document' };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: 'File is too large (max 10MB)' };
  }
  
  return { valid: true };
};

/**
 * Generate or retrieve a unique device ID
 */
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('finance_device_id');
  
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('finance_device_id', deviceId);
  }
  
  return deviceId;
};

/**
 * Helper to check if running in a Tauri environment
 */
const isTauri = () => typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
