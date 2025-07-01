
import { Payment, Customer } from '@/context/FinanceContext';
import { generatePaymentBatch } from './idGenerator';

export interface PaymentEntry {
  id: string;
  serialNumber: string;
  customerName: string;
  customerId: string;
  amount: number;
  agentName: string;
}

export interface BatchPaymentData {
  date: string;
  collectionType: 'daily' | 'weekly' | 'monthly';
  areaId?: string;
}

export interface BatchProcessResult {
  success: boolean;
  successfulPayments: Payment[];
  failedPayments: { entry: PaymentEntry; error: string }[];
  totalProcessed: number;
}

export class PaymentBatchProcessor {
  private getCustomerBySerialNumber: (serialNumber: string) => Customer | undefined;
  private currentAreaId: string | null;

  constructor(
    getCustomerBySerialNumber: (serialNumber: string) => Customer | undefined,
    currentAreaId: string | null
  ) {
    this.getCustomerBySerialNumber = getCustomerBySerialNumber;
    this.currentAreaId = currentAreaId;
  }

  async processBatch(
    entries: PaymentEntry[],
    batchData: BatchPaymentData
  ): Promise<BatchProcessResult> {
    console.log('Starting batch payment processing for', entries.length, 'entries');
    
    const result: BatchProcessResult = {
      success: false,
      successfulPayments: [],
      failedPayments: [],
      totalProcessed: 0
    };

    if (entries.length === 0) {
      console.warn('No entries to process');
      return result;
    }

    // Generate unique IDs for all payments upfront
    const paymentIds = generatePaymentBatch(entries.length);
    console.log('Generated unique IDs:', paymentIds);

    // Validate all entries first
    const validationResults = this.validateEntries(entries);
    if (validationResults.length > 0) {
      console.error('Validation errors found:', validationResults);
      result.failedPayments = validationResults;
      return result;
    }

    // Process each entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const paymentId = paymentIds[i];
      
      try {
        const customer = this.getCustomerBySerialNumber(entry.serialNumber);
        if (!customer) {
          throw new Error(`Customer not found with serial number: ${entry.serialNumber}`);
        }

        const payment: Payment = {
          id: paymentId,
          customerId: customer.id,
          customerName: customer.name,
          serialNumber: entry.serialNumber,
          amount: entry.amount,
          date: batchData.date,
          collectionType: batchData.collectionType,
          agentName: entry.agentName || 'Not specified',
          areaId: batchData.areaId || this.currentAreaId || undefined
        };

        result.successfulPayments.push(payment);
        console.log(`Successfully processed payment for ${customer.name}:`, payment);
        
      } catch (error) {
        console.error(`Failed to process entry for serial ${entry.serialNumber}:`, error);
        result.failedPayments.push({
          entry,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      result.totalProcessed++;
    }

    result.success = result.failedPayments.length === 0;
    console.log('Batch processing completed:', result);
    
    return result;
  }

  private validateEntries(entries: PaymentEntry[]): { entry: PaymentEntry; error: string }[] {
    const errors: { entry: PaymentEntry; error: string }[] = [];
    const serialNumbers = new Set<string>();

    for (const entry of entries) {
      // Check for required fields
      if (!entry.serialNumber) {
        errors.push({ entry, error: 'Serial number is required' });
        continue;
      }

      if (!entry.amount || entry.amount <= 0) {
        errors.push({ entry, error: 'Amount must be greater than 0' });
        continue;
      }

      // Check for duplicates within the batch
      if (serialNumbers.has(entry.serialNumber)) {
        errors.push({ entry, error: 'Duplicate serial number in batch' });
        continue;
      }
      serialNumbers.add(entry.serialNumber);

      // Validate customer exists
      const customer = this.getCustomerBySerialNumber(entry.serialNumber);
      if (!customer) {
        errors.push({ entry, error: 'Customer not found' });
        continue;
      }
    }

    return errors;
  }
}
