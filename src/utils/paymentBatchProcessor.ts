
import { Payment } from '@/context/FinanceContext';
import { generateUniquePaymentId, generateUniqueBatchId } from './idGeneration';

export interface PaymentEntry {
  id: string;
  serialNumber: string;
  customerName: string;
  customerId: string;
  amount: number;
  agentName: string;
}

export interface BatchProcessingResult {
  success: boolean;
  batchId: string;
  savedCount: number;
  failedCount: number;
  errors: Array<{
    entryId: string;
    customerName: string;
    error: string;
  }>;
  savedPaymentIds: string[];
}

export class PaymentBatchProcessor {
  private batchId: string;
  private payments: Payment[] = [];
  private errors: Array<{ entryId: string; customerName: string; error: string }> = [];

  constructor() {
    this.batchId = generateUniqueBatchId();
  }

  async processPaymentBatch(
    entries: PaymentEntry[],
    paymentData: {
      date: string;
      collectionType: 'daily' | 'weekly' | 'monthly';
      areaId: string | null;
    },
    addPaymentFunction: (payment: Omit<Payment, 'id' | 'customerName'>) => void,
    getCustomerBySerialNumber: (serialNumber: string) => any
  ): Promise<BatchProcessingResult> {
    console.log(`Starting batch processing for ${entries.length} payments. Batch ID: ${this.batchId}`);
    
    this.payments = [];
    this.errors = [];

    // Validate all entries first
    const validationErrors = this.validateEntries(entries, getCustomerBySerialNumber);
    if (validationErrors.length > 0) {
      return {
        success: false,
        batchId: this.batchId,
        savedCount: 0,
        failedCount: validationErrors.length,
        errors: validationErrors,
        savedPaymentIds: []
      };
    }

    // Process each payment with proper error isolation
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      try {
        console.log(`Processing payment ${i + 1}/${entries.length}: ${entry.customerName}`);
        
        const customer = getCustomerBySerialNumber(entry.serialNumber);
        if (!customer) {
          throw new Error(`Customer not found for serial number: ${entry.serialNumber}`);
        }

        const paymentId = generateUniquePaymentId();
        
        const payment: Omit<Payment, 'id' | 'customerName'> = {
          customerId: customer.id,
          serialNumber: entry.serialNumber,
          amount: entry.amount,
          date: paymentData.date,
          collectionType: paymentData.collectionType,
          agentName: entry.agentName || 'Not specified',
          areaId: paymentData.areaId || undefined
        };

        // Call the add payment function
        addPaymentFunction(payment);
        
        // Store successful payment info
        this.payments.push({
          id: paymentId,
          customerName: customer.name,
          ...payment
        });

        console.log(`Successfully processed payment for ${entry.customerName}`);
        
        // Small delay to ensure proper state updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`Error processing payment for ${entry.customerName}:`, error);
        this.errors.push({
          entryId: entry.id,
          customerName: entry.customerName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const result: BatchProcessingResult = {
      success: this.errors.length === 0,
      batchId: this.batchId,
      savedCount: this.payments.length,
      failedCount: this.errors.length,
      errors: this.errors,
      savedPaymentIds: this.payments.map(p => p.id)
    };

    console.log(`Batch processing completed. Saved: ${result.savedCount}, Failed: ${result.failedCount}`);
    return result;
  }

  private validateEntries(
    entries: PaymentEntry[],
    getCustomerBySerialNumber: (serialNumber: string) => any
  ): Array<{ entryId: string; customerName: string; error: string }> {
    const errors: Array<{ entryId: string; customerName: string; error: string }> = [];

    // Check for duplicates
    const serialNumbers = entries.map(e => e.serialNumber);
    const duplicateSerials = serialNumbers.filter((serial, index) => 
      serialNumbers.indexOf(serial) !== index
    );

    if (duplicateSerials.length > 0) {
      entries.forEach(entry => {
        if (duplicateSerials.includes(entry.serialNumber)) {
          errors.push({
            entryId: entry.id,
            customerName: entry.customerName,
            error: `Duplicate serial number: ${entry.serialNumber}`
          });
        }
      });
    }

    // Validate each entry
    entries.forEach(entry => {
      if (!entry.serialNumber.trim()) {
        errors.push({
          entryId: entry.id,
          customerName: entry.customerName,
          error: 'Serial number is required'
        });
        return;
      }

      if (!entry.customerName.trim()) {
        errors.push({
          entryId: entry.id,
          customerName: entry.customerName,
          error: 'Customer name is required'
        });
        return;
      }

      if (!entry.amount || entry.amount <= 0) {
        errors.push({
          entryId: entry.id,
          customerName: entry.customerName,
          error: 'Valid amount is required'
        });
        return;
      }

      const customer = getCustomerBySerialNumber(entry.serialNumber);
      if (!customer) {
        errors.push({
          entryId: entry.id,
          customerName: entry.customerName,
          error: `Customer not found with serial number: ${entry.serialNumber}`
        });
        return;
      }
    });

    return errors;
  }

  async verifyPaymentsPersisted(
    expectedPaymentIds: string[],
    getCurrentAreaPayments: () => Payment[],
    maxRetries: number = 3
  ): Promise<{ success: boolean; missingIds: string[] }> {
    console.log(`Verifying ${expectedPaymentIds.length} payments are persisted`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
      
      const currentPayments = getCurrentAreaPayments();
      const persistedIds = currentPayments.map(p => p.id);
      
      const missingIds = expectedPaymentIds.filter(id => !persistedIds.includes(id));
      
      console.log(`Verification attempt ${attempt}: ${persistedIds.length} total payments, ${missingIds.length} missing`);
      
      if (missingIds.length === 0) {
        console.log('All payments verified as persisted');
        return { success: true, missingIds: [] };
      }
      
      if (attempt === maxRetries) {
        console.warn(`Verification failed after ${maxRetries} attempts. Missing IDs:`, missingIds);
        return { success: false, missingIds };
      }
    }

    return { success: false, missingIds: expectedPaymentIds };
  }
}
