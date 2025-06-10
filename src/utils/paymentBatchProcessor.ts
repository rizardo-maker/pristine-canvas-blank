
import { Payment } from '@/context/FinanceContext';
import { generateBatchPaymentIds, generateUniqueBatchId, validateIdUniqueness } from './idGeneration';

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
  rollbackData?: Payment[];
}

export interface BatchProcessingOptions {
  enableRollback?: boolean;
  validateBeforeSubmit?: boolean;
  maxRetries?: number;
  delayBetweenPayments?: number;
}

export class PaymentBatchProcessor {
  private batchId: string;
  private payments: Payment[] = [];
  private errors: Array<{ entryId: string; customerName: string; error: string }> = [];
  private rollbackData: Payment[] = [];

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
    getCustomerBySerialNumber: (serialNumber: string) => any,
    getCurrentAreaPayments: () => Payment[],
    options: BatchProcessingOptions = {}
  ): Promise<BatchProcessingResult> {
    const {
      enableRollback = true,
      validateBeforeSubmit = true,
      maxRetries = 3,
      delayBetweenPayments = 50
    } = options;

    console.log(`[Batch ${this.batchId}] Starting batch processing for ${entries.length} payments`);
    
    this.payments = [];
    this.errors = [];
    this.rollbackData = [];

    // Phase 1: Pre-validation
    if (validateBeforeSubmit) {
      console.log(`[Batch ${this.batchId}] Running pre-validation checks...`);
      const validationErrors = this.validateEntries(entries, getCustomerBySerialNumber);
      if (validationErrors.length > 0) {
        console.error(`[Batch ${this.batchId}] Validation failed:`, validationErrors);
        return {
          success: false,
          batchId: this.batchId,
          savedCount: 0,
          failedCount: validationErrors.length,
          errors: validationErrors,
          savedPaymentIds: []
        };
      }
    }

    // Phase 2: Generate unique IDs for the entire batch
    const paymentIds = generateBatchPaymentIds(entries.length);
    if (!validateIdUniqueness(paymentIds)) {
      console.error(`[Batch ${this.batchId}] ID generation failed - duplicates detected`);
      return {
        success: false,
        batchId: this.batchId,
        savedCount: 0,
        failedCount: entries.length,
        errors: [{ entryId: 'batch', customerName: 'All', error: 'Failed to generate unique payment IDs' }],
        savedPaymentIds: []
      };
    }

    // Phase 3: Capture current state for rollback
    if (enableRollback) {
      this.rollbackData = [...getCurrentAreaPayments()];
      console.log(`[Batch ${this.batchId}] Captured rollback data: ${this.rollbackData.length} existing payments`);
    }

    // Phase 4: Process each payment with retry logic
    const processedPayments: Payment[] = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const paymentId = paymentIds[i];
      let attempts = 0;
      let processed = false;

      while (attempts < maxRetries && !processed) {
        try {
          console.log(`[Batch ${this.batchId}] Processing payment ${i + 1}/${entries.length}: ${entry.customerName} (attempt ${attempts + 1})`);
          
          const customer = getCustomerBySerialNumber(entry.serialNumber);
          if (!customer) {
            throw new Error(`Customer not found for serial number: ${entry.serialNumber}`);
          }

          const payment: Payment = {
            id: paymentId,
            customerId: customer.id,
            customerName: customer.name,
            serialNumber: entry.serialNumber,
            amount: entry.amount,
            date: paymentData.date,
            collectionType: paymentData.collectionType,
            agentName: entry.agentName || 'Not specified',
            areaId: paymentData.areaId || undefined
          };

          // Simulate the add payment operation
          addPaymentFunction({
            customerId: payment.customerId,
            serialNumber: payment.serialNumber,
            amount: payment.amount,
            date: payment.date,
            collectionType: payment.collectionType,
            agentName: payment.agentName,
            areaId: payment.areaId
          });

          processedPayments.push(payment);
          this.payments.push(payment);
          processed = true;

          console.log(`[Batch ${this.batchId}] Successfully processed payment for ${entry.customerName}`);
          
          // Small delay between payments
          if (delayBetweenPayments > 0 && i < entries.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenPayments));
          }
          
        } catch (error) {
          attempts++;
          console.error(`[Batch ${this.batchId}] Error processing payment for ${entry.customerName} (attempt ${attempts}):`, error);
          
          if (attempts >= maxRetries) {
            this.errors.push({
              entryId: entry.id,
              customerName: entry.customerName,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          }
        }
      }
    }

    // Phase 5: Verify persistence
    console.log(`[Batch ${this.batchId}] Verifying payment persistence...`);
    const verificationResult = await this.verifyPaymentsPersisted(
      this.payments.map(p => p.id),
      getCurrentAreaPayments,
      3
    );

    if (!verificationResult.success && enableRollback) {
      console.warn(`[Batch ${this.batchId}] Verification failed, considering rollback...`);
      // In a real implementation, you might want to implement rollback here
      // For now, we'll just log the warning
    }

    const result: BatchProcessingResult = {
      success: this.errors.length === 0 && verificationResult.success,
      batchId: this.batchId,
      savedCount: this.payments.length,
      failedCount: this.errors.length,
      errors: this.errors,
      savedPaymentIds: this.payments.map(p => p.id),
      rollbackData: enableRollback ? this.rollbackData : undefined
    };

    console.log(`[Batch ${this.batchId}] Batch processing completed. Success: ${result.success}, Saved: ${result.savedCount}, Failed: ${result.failedCount}`);
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
    console.log(`[Batch ${this.batchId}] Verifying ${expectedPaymentIds.length} payments are persisted`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Wait for persistence with exponential backoff
      const delay = 200 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const currentPayments = getCurrentAreaPayments();
      const persistedIds = currentPayments.map(p => p.id);
      
      const missingIds = expectedPaymentIds.filter(id => !persistedIds.includes(id));
      
      console.log(`[Batch ${this.batchId}] Verification attempt ${attempt}: ${persistedIds.length} total payments, ${missingIds.length} missing`);
      
      if (missingIds.length === 0) {
        console.log(`[Batch ${this.batchId}] All payments verified as persisted`);
        return { success: true, missingIds: [] };
      }
      
      if (attempt === maxRetries) {
        console.warn(`[Batch ${this.batchId}] Verification failed after ${maxRetries} attempts. Missing IDs:`, missingIds);
        return { success: false, missingIds };
      }
    }

    return { success: false, missingIds: expectedPaymentIds };
  }

  // Get batch statistics
  getBatchStats() {
    return {
      batchId: this.batchId,
      totalProcessed: this.payments.length,
      totalErrors: this.errors.length,
      successRate: this.payments.length / (this.payments.length + this.errors.length) * 100
    };
  }
}
