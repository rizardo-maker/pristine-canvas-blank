
import { supabase } from '@/integrations/supabase/client';
import { getSyncMetadata } from './indexedDB';
import { useAuth } from '@/context/AuthContext';
import { Customer, Payment, Area } from '@/context/FinanceContext';

// This helper will format and display sync information
export const formatSyncInfo = (lastSyncedDate: string): string => {
  if (!lastSyncedDate) return 'Not synced yet';
  
  const syncDate = new Date(lastSyncedDate);
  const now = new Date();
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) {
    return 'Synced just now';
  } else if (diffMins < 60) {
    return `Synced ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) {
      return `Synced ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `Synced ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }
};

// Sync information helper for displaying device-specific info
export const getDeviceSyncInfo = async (userId: string): Promise<string> => {
  if (!userId) return '';
  
  try {
    const syncData = await getSyncMetadata(userId);
    
    if (syncData.lastSynced) {
      const formattedTime = formatSyncInfo(syncData.lastSynced);
      return `${formattedTime} (${syncData.deviceId || 'unknown device'})`;
    }
    
    return 'Not synced yet';
  } catch (error) {
    console.error('Error getting sync info:', error);
    return 'Sync status unknown';
  }
};

// Helper function to calculate deadline date
const calculateDeadlineDate = (issuedDate: string, numberOfDays: number): string => {
  const date = new Date(issuedDate);
  date.setDate(date.getDate() + numberOfDays);
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Sync data to Supabase
export const syncDataToSupabase = async (
  userId: string,
  customers: Customer[],
  payments: Payment[],
  areas: Area[]
): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // First, fetch current data from Supabase
    const { data: existingCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId);
      
    if (customersError) {
      console.error('Error fetching existing customers:', customersError);
      return false;
    }
    
    // For each customer in local storage, update or insert into Supabase
    for (const customer of customers) {
      // Map the customer to match Supabase schema
      const supabaseCustomer = {
        id: customer.id,
        user_id: userId,
        name: customer.name,
        address: customer.address,
        totalamountgiven: customer.totalAmountGiven,
        rateofinterest: customer.interestAmount, // Store interestAmount in the old field for backward compatibility
        numberofdays: customer.numberOfDays,
        totalamounttobepaid: customer.totalAmountToBePaid,
        isfullypaid: customer.isFullyPaid,
        areaid: customer.areaId,
        installmentamount: customer.installmentAmount
      };
      
      // Check if customer already exists
      const existing = existingCustomers?.find(c => c.id === customer.id);
      
      if (existing) {
        // Update existing customer
        const { error: updateError } = await supabase
          .from('customers')
          .update(supabaseCustomer)
          .eq('id', customer.id);
          
        if (updateError) {
          console.error('Error updating customer:', updateError);
        }
      } else {
        // Insert new customer
        const { error: insertError } = await supabase
          .from('customers')
          .insert(supabaseCustomer);
          
        if (insertError) {
          console.error('Error inserting customer:', insertError);
        }
      }
    }
    
    // Update sync metadata
    await updateSyncMetadata(userId);
    
    return true;
  } catch (error) {
    console.error('Error syncing data to Supabase:', error);
    return false;
  }
};

// Sync data from Supabase
export const syncDataFromSupabase = async (userId: string): Promise<{ 
  customers: Customer[] | null,
  success: boolean 
}> => {
  if (!userId) return { customers: null, success: false };
  
  try {
    const { data: supabaseCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId);
      
    if (customersError) {
      console.error('Error fetching customers from Supabase:', customersError);
      return { customers: null, success: false };
    }
    
    if (!supabaseCustomers) {
      return { customers: [], success: true };
    }
    
    // Map Supabase customers to local format
    const customers = supabaseCustomers.map(c => {
      const issuedDate = new Date(c.createdat).toISOString().split('T')[0];
      const totalAmountGiven = Number(c.totalamountgiven);
      const interestAmount = Number(c.rateofinterest); // Using the old field to store interest amount
      const numberOfDays = c.numberofdays || 30; // Default to 30 days if not set
      const totalAmountToBePaid = Number(c.totalamounttobepaid);
      
      // Calculate derived fields
      const dailyAmount = totalAmountToBePaid / numberOfDays;
      const interestPercentage = totalAmountGiven > 0 ? (interestAmount / totalAmountGiven) * 100 : 0;
      const deadlineDate = calculateDeadlineDate(issuedDate, numberOfDays);
      
      return {
        id: c.id,
        name: c.name,
        serialNumber: c.id.substring(0, 8),  // Generate a serial number from ID
        area: c.areaid || 'default',
        mobile: '', // Default empty mobile
        loanAmount: totalAmountGiven,
        installmentAmount: c.installmentamount ? Number(c.installmentamount) : dailyAmount,
        collectionType: 'daily' as 'daily' | 'weekly' | 'monthly',
        startDate: issuedDate,
        endDate: deadlineDate,
        address: c.address || '',
        guarantor: '', // Default empty guarantor
        guarantorMobile: '', // Default empty guarantor mobile
        totalInstallments: numberOfDays,
        paidInstallments: 0, // Default to 0
        balanceAmount: totalAmountToBePaid,
        status: c.isfullypaid ? 'completed' as const : 'active' as const,
        createdAt: c.createdat || new Date().toISOString(),
        updatedAt: c.createdat || new Date().toISOString(),
        totalAmountGiven,
        totalAmountToBePaid,
        totalPaid: 0, // This would need to be calculated from payments
        interestAmount,
        interestPercentage,
        penaltyAmount: 0, // Initialize penalty amount
        dailyAmount,
        paymentCategory: 'daily' as 'daily' | 'weekly' | 'monthly',
        issuedDate,
        deadlineDate,
        isFullyPaid: c.isfullypaid || false,
        areaId: c.areaid,
        numberOfDays,
        numberOfWeeks: Math.ceil(numberOfDays / 7),
        numberOfMonths: Math.ceil(numberOfDays / 30)
      };
    });
    
    // Update sync metadata
    await updateSyncMetadata(userId);
    
    return { customers, success: true };
  } catch (error) {
    console.error('Error syncing data from Supabase:', error);
    return { customers: null, success: false };
  }
};

// Update sync metadata helper
const updateSyncMetadata = async (userId: string): Promise<void> => {
  const now = new Date().toISOString();
  const deviceId = getDeviceId();
  
  // Using SQL RPC call instead of direct table access
  const { error } = await supabase.rpc('upsert_sync_metadata', { 
    p_user_id: userId,
    p_last_synced: now,
    p_device_id: deviceId
  });
  
  if (error) {
    console.error('Error updating sync metadata:', error);
    // Fallback method - try direct SQL query
    try {
      // We use executeRaw to bypass TypeScript issues until types are updated
      const { data, error: execError } = await supabase.from('sync_metadata')
        .upsert({
          user_id: userId,
          last_synced: now,
          device_id: deviceId
        }, {
          onConflict: 'user_id'
        });
        
      if (execError) {
        console.error('Fallback sync metadata update failed:', execError);
      }
    } catch (fallbackError) {
      console.error('Fallback sync metadata update failed:', fallbackError);
    }
  }
};

// Generate or retrieve a unique device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('finance_device_id');
  
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('finance_device_id', deviceId);
  }
  
  return deviceId;
};
