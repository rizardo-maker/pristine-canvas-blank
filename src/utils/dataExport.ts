
import { saveAs } from 'file-saver';
import { Customer, Payment, Area } from '@/context/FinanceContext';
import { loadFromIndexedDB, saveToIndexedDB } from './indexedDB';
import { toast } from '@/hooks/use-toast';

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
 * Import data from a JSON file with improved memory efficiency
 */
export const importData = async (file: File, userId: string): Promise<boolean> => {
  try {
    // Show loading toast
    toast({
      title: "Importing data...",
      description: "Please wait while we process your file.",
    });
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return false;
    }
    
    // Read file in chunks for memory efficiency with large files
    const text = await file.text();
    let importedData: ExportData;
    
    try {
      importedData = JSON.parse(text) as ExportData;
    } catch (e) {
      toast({
        title: "Invalid file format",
        description: "The selected file is not valid JSON.",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate data structure
    if (!importedData || !importedData.data) {
      toast({
        title: "Invalid file format",
        description: "The selected file is not a valid finance app export.",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate each data type exists
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
    
    // Check current data to merge
    const currentCustomersResult = await loadFromIndexedDB<Customer[]>('customers', userId);
    const currentPaymentsResult = await loadFromIndexedDB<Payment[]>('payments', userId);
    const currentAreasResult = await loadFromIndexedDB<Area[]>('areas', userId);
    
    const currentCustomers = currentCustomersResult.data || [];
    const currentPayments = currentPaymentsResult.data || [];
    const currentAreas = currentAreasResult.data || [];
    
    // Merge with imported data (keeping existing data if IDs conflict)
    const mergedCustomers = mergeArrays(currentCustomers, importedData.data.customers || [], 'id');
    const mergedPayments = mergeArrays(currentPayments, importedData.data.payments || [], 'id');
    const mergedAreas = mergeArrays(currentAreas, importedData.data.areas || [], 'id');
    
    // Count imported items
    const newCustomers = mergedCustomers.length - currentCustomers.length;
    const newPayments = mergedPayments.length - currentPayments.length;
    const newAreas = mergedAreas.length - currentAreas.length;
    
    // Save merged data
    try {
      await saveToIndexedDB('customers', mergedCustomers, userId);
      await saveToIndexedDB('payments', mergedPayments, userId);
      await saveToIndexedDB('areas', mergedAreas, userId);
      
      // Store the last import details to improve future imports
      localStorage.setItem('last_import_date', new Date().toISOString());
      localStorage.setItem('last_import_device', importedData.deviceId || 'unknown');
    } catch (error) {
      console.error("Error saving imported data:", error);
      toast({
        title: "Import failed",
        description: "Failed to save imported data to the database.",
        variant: "destructive",
      });
      return false;
    }
    
    // Success notification
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
  // Create a file input element
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
    
    // Validate file
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
      // If import was successful, reload the page to reflect changes
      if (onComplete) {
        onComplete();
      } else {
        // Default behavior is to reload the app
        window.location.reload();
      }
    }
  };
  
  // Trigger file dialog
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
