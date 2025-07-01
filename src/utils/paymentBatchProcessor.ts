
import { Payment, Customer } from '@/context/FinanceContext';
import { toast } from 'sonner';

export interface PaymentBatchEntry {
  serialNumber: string;
  customerName: string;
  amount: number;
  agentName: string;
  isValid: boolean;
  error?: string;
  customer?: Customer;
}

export interface PaymentBatchResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
  payments: Payment[];
}

export const validatePaymentEntry = (
  entry: Omit<PaymentBatchEntry, 'isValid' | 'error' | 'customer'>,
  customers: Customer[]
): PaymentBatchEntry => {
  const errors: string[] = [];
  
  // Find customer by serial number
  const customer = customers.find(c => c.serialNumber === entry.serialNumber);
  
  if (!customer) {
    errors.push(`Customer with serial number ${entry.serialNumber} not found`);
  }
  
  if (!entry.customerName.trim()) {
    errors.push('Customer name is required');
  }
  
  if (!entry.amount || entry.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!entry.agentName.trim()) {
    errors.push('Agent name is required');
  }
  
  // Check if customer name matches
  if (customer && customer.name.toLowerCase() !== entry.customerName.toLowerCase()) {
    errors.push(`Customer name mismatch. Expected: ${customer.name}, Got: ${entry.customerName}`);
  }
  
  return {
    ...entry,
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join(', ') : undefined,
    customer
  };
};

export const processBatchPayments = async (
  entries: PaymentBatchEntry[],
  collectionType: 'daily' | 'weekly' | 'monthly',
  date: string,
  addPayment: (payment: Omit<Payment, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>
): Promise<PaymentBatchResult> => {
  const result: PaymentBatchResult = {
    success: false,
    processedCount: 0,
    failedCount: 0,
    errors: [],
    payments: []
  };
  
  const validEntries = entries.filter(entry => entry.isValid);
  const invalidEntries = entries.filter(entry => !entry.isValid);
  
  // Add errors for invalid entries
  result.errors = invalidEntries.map(entry => `${entry.serialNumber}: ${entry.error}`);
  result.failedCount = invalidEntries.length;
  
  // Process valid entries
  for (const entry of validEntries) {
    try {
      const payment: Omit<Payment, 'id' | 'userId' | 'createdAt'> = {
        customerId: entry.customer!.id,
        customerName: entry.customerName,
        serialNumber: entry.serialNumber,
        amount: entry.amount,
        date: date,
        collectionType: collectionType,
        agentName: entry.agentName,
        area: entry.customer!.area || '',
        paymentMethod: 'cash',
        notes: `Batch payment processed by ${entry.agentName}`,
        receiptNumber: `BATCH-${Date.now()}-${entry.serialNumber}`
      };
      
      const success = await addPayment(payment);
      
      if (success) {
        result.processedCount++;
        result.payments.push(payment as Payment);
      } else {
        result.failedCount++;
        result.errors.push(`Failed to save payment for ${entry.serialNumber}`);
      }
    } catch (error) {
      result.failedCount++;
      result.errors.push(`Error processing payment for ${entry.serialNumber}: ${error}`);
    }
  }
  
  result.success = result.processedCount > 0;
  
  // Show summary toast
  if (result.success) {
    toast.success(`Batch payment processed: ${result.processedCount} successful, ${result.failedCount} failed`);
  } else {
    toast.error(`Batch payment failed: ${result.errors.length} errors`);
  }
  
  return result;
};

export const exportBatchTemplate = () => {
  const template = [
    ['Serial Number', 'Customer Name', 'Amount', 'Agent Name'],
    ['SN001', 'John Doe', '1000', 'Agent Smith'],
    ['SN002', 'Jane Smith', '1500', 'Agent Jones'],
  ];
  
  const csvContent = template.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'payment_batch_template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};
