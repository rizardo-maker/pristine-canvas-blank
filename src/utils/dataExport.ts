
export const exportData = async (userId: string): Promise<boolean> => {
  try {
    // Get user data from localStorage
    const userData = localStorage.getItem(`user_data_${userId}`);
    const exportData = {
      userId,
      exportDate: new Date().toISOString(),
      data: userData ? JSON.parse(userData) : {},
    };
    
    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

export const handleImportClick = (userId: string, onSuccess: () => void): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data structure
      if (!importData.data || !importData.exportDate) {
        throw new Error('Invalid import file format');
      }
      
      // Save imported data
      localStorage.setItem(`user_data_${userId}`, JSON.stringify(importData.data));
      localStorage.setItem(`last_import_date`, new Date().toISOString());
      localStorage.setItem(`last_sync_${userId}`, new Date().toISOString());
      
      onSuccess();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    }
  };
  
  input.click();
};
