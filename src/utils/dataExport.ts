import { saveAs } from 'file-saver';
import { Customer, Payment, Area } from '@/context/FinanceContext';
import { loadFromIndexedDB, saveToIndexedDB } from './indexedDB';
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
export const exportData = async (userId: string): Promise<boolean> => {
  try {
    // Show loading toast
    toast({
      title: "Exporting data...",
      description: "Please wait while we prepare your data.",
    });

    // Load all data from IndexedDB
    const customersResult = await loadFromIndexedDB<Customer[]>('customers', userId);
    const paymentsResult = await loadFromIndexedDB<Payment[]>('payments', userId);
    const areasResult = await loadFromIndexedDB<Area[]>('areas', userId);
    
    if (!customersResult.data && !paymentsResult.data && !areasResult.data) {
      toast({
        title: "No data to export",
        description: "There is no data to export at this time.",
        variant: "destructive",
      });
      return false;
    }
    
    // Create export data structure
    const exportData: ExportData = {
      version: "1.2", // Incrementing version for better tracking
      exportDate: new Date().toISOString(),
      deviceId: localStorage.getItem('finance_device_id') || 'unknown',
      data: {
        customers: customersResult.data || [],
        payments: paymentsResult.data || [],
        areas: areasResult.data || [],
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
      // Create blob and download
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
 * Processes imported data from a JSON string.
 */
const importDataFromString = async (jsonString: string, userId: string): Promise<boolean> => {
  try {
    toast({
      title: "Importing data...",
      description: "Please wait while we process your file.",
    });

    let importedData: ExportData;
    
    try {
      importedData = JSON.parse(jsonString) as ExportData;
    } catch (e) {
      toast({
        title: "Invalid file format",
        description: "The selected file is not valid JSON.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!importedData || !importedData.data) {
      toast({
        title: "Invalid file format",
        description: "The selected file is not a valid finance app export.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!importedData.data.customers || !Array.isArray(importedData.data.customers) ||
        !importedData.data.payments || !Array.isArray(importedData.data.payments) ||
        !importedData.data.areas || !Array.isArray(importedData.data.areas)) {
      toast({
        title: "Invalid data structure",
        description: "The export file is missing required data structures.",
        variant: "destructive",
      });
      return false;
    }
    
    const currentCustomersResult = await loadFromIndexedDB<Customer[]>('customers', userId);
    const currentPaymentsResult = await loadFromIndexedDB<Payment[]>('payments', userId);
    const currentAreasResult = await loadFromIndexedDB<Area[]>('areas', userId);
    
    const currentCustomers = currentCustomersResult.data || [];
    const currentPayments = currentPaymentsResult.data || [];
    const currentAreas = currentAreasResult.data || [];
    
    const mergedCustomers = mergeArrays(currentCustomers, importedData.data.customers || [], 'id');
    const mergedPayments = mergeArrays(currentPayments, importedData.data.payments || [], 'id');
    const mergedAreas = mergeArrays(currentAreas, importedData.data.areas || [], 'id');
    
    const newCustomers = mergedCustomers.length - currentCustomers.length;
    const newPayments = mergedPayments.length - currentPayments.length;
    const newAreas = mergedAreas.length - currentAreas.length;
    
    await saveToIndexedDB('customers', mergedCustomers, userId);
    await saveToIndexedDB('payments', mergedPayments, userId);
    await saveToIndexedDB('areas', mergedAreas, userId);
    
    localStorage.setItem('last_import_date', new Date().toISOString());
    localStorage.setItem('last_import_device', importedData.deviceId || 'unknown');
    
    toast({
      title: "Data imported successfully",
      description: `Imported ${newCustomers} new customers, ${newPayments} new payments, and ${newAreas} new areas.`,
    });
    
    return true;
  } catch (error) {
    console.error("Import error:", error);
    toast({
      title: "Import failed",
      description: "Failed to import data. Check the file format and try again.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Import data from a JSON file (for web)
 */
export const importData = async (file: File, userId: string): Promise<boolean> => {
  try {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return false;
    }
    
    const text = await file.text();
    return await importDataFromString(text, userId);
  } catch (error) {
    console.error("Import file read error:", error);
    toast({
      title: "Import Failed",
      description: "Could not read the selected file.",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Helper function to merge arrays by ID with improved efficiency
 */
function mergeArrays<T extends { id: string }>(current: T[], imported: T[], idField: keyof T): T[] {
  // Create a map of existing IDs for efficient lookup
  const existingMap = new Map<string, boolean>();
  current.forEach(item => existingMap.set(String(item[idField]), true));
  
  // Copy existing items
  const merged: T[] = [...current];
  
  // Add only new items from imported data
  for (const item of imported) {
    if (!item[idField]) continue; // Skip items without an ID
    
    const id = String(item[idField]);
    if (!existingMap.has(id)) {
      merged.push(item);
      existingMap.set(id, true); // Update map to prevent duplicates
    }
  }
  
  return merged;
}

/**
 * Create data import dialog handler
 */
export const handleImportClick = (userId: string, onComplete?: () => void) => {
  const handleSuccess = () => {
    if (onComplete) {
      onComplete();
    } else {
      window.location.reload();
    }
  };

  if (isTauri()) {
    invoke<string>('open_file_dialog')
      .then(async (content) => {
        if (content) {
          const success = await importDataFromString(content, userId);
          if (success) {
            handleSuccess();
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
    
    const success = await importData(file, userId);
    
    if (success) {
      handleSuccess();
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
 * Helper to check if running in a Tauri environment
 */
const isTauri = () => typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
