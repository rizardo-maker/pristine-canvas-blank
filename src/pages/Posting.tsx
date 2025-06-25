import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance, Customer } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import CustomerInfoCard from '@/components/posting/CustomerInfoCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { PaymentBatchProcessor, PaymentEntry } from '@/utils/paymentBatchProcessor';
import { processImageWithOCR } from '@/utils/ocrService';
import { useVoiceAction } from '@/hooks/useVoiceAction';
import PostingHeader from '@/components/posting/PostingHeader';
import PaymentEntryForm from '@/components/posting/PaymentEntryForm';
import PaymentEntriesTable from '@/components/posting/PaymentEntriesTable';

const Posting = () => {
  const { 
    addPaymentBatch, 
    getCustomerBySerialNumber, 
    recalculateAllCustomerPayments, 
    currentAreaId, 
    getAreaById 
  } = useFinance();
  
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectionType, setCollectionType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [serialNumber, setSerialNumber] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [agentName, setAgentName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTriggeredAdd, setVoiceTriggeredAdd] = useState(false);
  
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for keyboard navigation
  const serialNumberRef = useRef<HTMLInputElement>(null);
  const agentNameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    setTotalAmount(total);
  }, [entries]);
  
  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSerialNumber(value);
    
    if (value.trim()) {
      const customer = getCustomerBySerialNumber(value);
      setSelectedCustomer(customer || null);
      
      // Auto-fill the installment amount when customer is found
      if (customer && customer.installmentAmount) {
        setAmount(customer.installmentAmount);
      } else {
        setAmount('');
      }
    } else {
      setSelectedCustomer(null);
      setAmount('');
    }
  };

  const handleSerialNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedCustomer) {
        agentNameRef.current?.focus();
      } else {
        toast.error('Please enter a valid serial number');
      }
    }
  };

  const handleAgentNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      amountRef.current?.focus();
    }
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEntry();
    }
  };
  
  const handleAddEntry = useCallback(() => {
    if (!serialNumber || !selectedCustomer || !amount) {
      toast.error('Please fill in all the required fields');
      return;
    }
    
    if (Number(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    // Check for duplicate entries
    const existingEntryIndex = entries.findIndex(e => e.serialNumber === serialNumber);
    
    if (existingEntryIndex !== -1) {
      const updatedEntries = [...entries];
      updatedEntries[existingEntryIndex].amount += Number(amount);
      updatedEntries[existingEntryIndex].agentName = agentName;
      setEntries(updatedEntries);
      toast.success(`Updated payment amount for ${selectedCustomer.name}`);
    } else {
      const newEntry: PaymentEntry = {
        id: `temp-${Date.now()}-${serialNumber}`,
        serialNumber,
        customerName: selectedCustomer.name,
        customerId: selectedCustomer.id,
        amount: Number(amount),
        agentName: agentName || 'Not specified'
      };
      
      setEntries([...entries, newEntry]);
      toast.success(`Added payment entry for ${selectedCustomer.name}`);
    }
    
    // Show overpayment info if applicable
    const remaining = selectedCustomer.totalAmountToBePaid - selectedCustomer.totalPaid;
    if (Number(amount) > remaining && remaining > 0) {
      const excess = Number(amount) - remaining;
      toast.info(`Excess amount of ₹${excess.toLocaleString()} will be treated as earnings.`);
    }
    
    // Clear form and focus back to serial number
    setSerialNumber('');
    setSelectedCustomer(null);
    setAmount('');
    serialNumberRef.current?.focus();
  }, [serialNumber, selectedCustomer, amount, entries, agentName]);
  
  const handleRemoveEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
    toast.success('Entry removed successfully');
  };
  
  // OCR and PDF Handlers
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrRunning(true);
    setOcrProgress(0);
    toast.info('Scanning file for payment entries...');

    // The OCR service handles images and PDFs.
    const text = await processImageWithOCR(file, setOcrProgress);

    setIsOcrRunning(false);

    if (text) {
      parsePostingList(text);
    }
    
    if (ocrFileInputRef.current) {
        ocrFileInputRef.current.value = '';
    }
    if (pdfFileInputRef.current) {
        pdfFileInputRef.current.value = '';
    }
  };

  const parsePostingList = (text: string) => {
    console.log('Raw OCR Text for debugging:\n---START---\n', text, '\n---END---');
    const lines = text.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      toast.error("No text detected in the image.");
      return;
    }

    let currentEntries = [...entries];
    let entriesAdded = 0;
    let entriesUpdated = 0;
    let entriesFailed = 0;
    const failedSerials: string[] = [];

    for (const line of lines) {
      // Skip what look like header or footer lines, or lines without numbers
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.includes('serial') ||
        lowerLine.includes('customer') ||
        lowerLine.includes('agent') ||
        lowerLine.includes('collection') ||
        lowerLine.includes('amount') ||
        lowerLine.includes('s.no') ||
        lowerLine.includes('sno') ||
        lowerLine.includes('total') ||
        lowerLine.includes('actions') ||
        !/\d/.test(line) // Also skip lines that contain no digits
      ) {
        console.log(`Skipping header/footer/non-data line: "${line}"`);
        continue;
      }

      let serial: string | undefined;
      let amountStr: string | undefined;
      const trimmedLine = line.trim();

      // --- UPDATED PARSING LOGIC ---

      // Strategy 1: Table-like structure (space separated)
      // This is more robust for table formats, like in the provided image.
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const firstPart = parts[0];
        let lastNumericPart: string | undefined;

        // Find the last part that is a number, to ignore trailing text/icons from OCR.
        for (let i = parts.length - 1; i > 0; i--) {
          const cleanedPart = parts[i].replace(/[^0-9.]/g, '');
          if (cleanedPart && !isNaN(parseFloat(cleanedPart))) {
            lastNumericPart = parts[i];
            break;
          }
        }

        if (lastNumericPart) {
          serial = firstPart;
          amountStr = lastNumericPart;
        }
      }

      // Strategy 2: Dash-separated "serial-amount" format (as a fallback)
      // This handles cases where space-separation is not appropriate, e.g., "123-456"
      if (!amountStr && trimmedLine.includes('-')) {
        const dashParts = trimmedLine.split('-');
        if (dashParts.length === 2) {
          const potentialSerial = dashParts[0].trim();
          const potentialAmount = dashParts[1].trim();
          
          const cleanedSerial = potentialSerial.replace(/[^0-9]/g, '');
          const cleanedAmount = potentialAmount.replace(/[^0-9.]/g, '');

          if (cleanedSerial && cleanedAmount && !isNaN(parseFloat(cleanedAmount))) {
            serial = potentialSerial; // Keep original for full cleaning later
            amountStr = potentialAmount;
          }
        }
      }


      if (serial && amountStr) {
        // Clean up serial and amount strings
        const cleanedSerial = serial.replace(/[^0-9]/g, '');
        const cleanedAmountStr = amountStr.replace(/[^0-9.]/g, '');
        const amount = parseFloat(cleanedAmountStr);

        if (cleanedSerial && !isNaN(amount) && amount > 0) {
          const customer = getCustomerBySerialNumber(cleanedSerial);
          if (customer) {
            const existingEntryIndex = currentEntries.findIndex(e => e.serialNumber === cleanedSerial);
            if (existingEntryIndex !== -1) {
              currentEntries[existingEntryIndex].amount += amount;
              entriesUpdated++;
            } else {
              currentEntries.push({
                id: `temp-${Date.now()}-${cleanedSerial}`,
                serialNumber: cleanedSerial,
                customerName: customer.name,
                customerId: customer.id,
                amount: amount,
                agentName: agentName || 'Not specified'
              });
              entriesAdded++;
            }
          } else {
            console.log(`OCR failed lookup for serial: "${cleanedSerial}" from line: "${line}"`);
            entriesFailed++;
            failedSerials.push(cleanedSerial);
          }
        } else {
          console.log(`Skipping line, could not parse serial/amount from: "${line}"`);
        }
      } else {
        console.log(`Skipping line, could not parse: "${line}"`);
      }
    }

    setEntries(currentEntries);

    const messages = [];
    if (entriesAdded > 0) messages.push(`Added ${entriesAdded} new entries.`);
    if (entriesUpdated > 0) messages.push(`Updated ${entriesUpdated} entries.`);
    if (messages.length > 0) toast.success(messages.join(' '));

    if (entriesFailed > 0) {
      toast.warning(`${entriesFailed} entries failed (serial number not found). Failed: ${failedSerials.join(', ')}`);
    }
    
    const dataLines = lines.filter(l => !l.toLowerCase().includes('serial') && !l.toLowerCase().includes('amount') && !l.toLowerCase().includes('s.no'));
    
    if (entriesAdded === 0 && entriesUpdated === 0) {
      if (entriesFailed > 0) {
        toast.error('Could not parse any valid entries from the image.');
      } else if (dataLines.length > 0) {
        toast.error('No valid payment entries found. Expected format: "SerialNumber - Amount" or "SerialNumber Amount" per line.');
      }
    }
  };

  const handleSubmit = async () => {
    if (entries.length === 0) {
      toast.error('Please add at least one payment entry');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting batch payment submission...');
      
      // Create batch processor
      const batchProcessor = new PaymentBatchProcessor(
        getCustomerBySerialNumber,
        currentAreaId
      );
      
      // Process the batch
      const batchResult = await batchProcessor.processBatch(entries, {
        date,
        collectionType,
        areaId: currentAreaId || undefined
      });
      
      console.log('Batch processing result:', batchResult);
      
      if (batchResult.failedPayments.length > 0) {
        console.error('Some payments failed:', batchResult.failedPayments);
        toast.error(`${batchResult.failedPayments.length} payments failed. Please check and try again.`);
        return;
      }
      
      // Add all successful payments using batch operation
      const addResult = await addPaymentBatch(batchResult.successfulPayments);
      
      if (!addResult.success) {
        console.error('Batch add failed:', addResult.errors);
        toast.error(`Failed to save payments: ${addResult.errors.join(', ')}`);
        return;
      }
      
      // Recalculate customer payment statuses
      recalculateAllCustomerPayments();
      
      console.log('All payments saved successfully');
      
      // Clear entries and show success
      setEntries([]);
      
      toast.success(`Successfully recorded ${batchResult.successfulPayments.length} payments for ${date}`, {
        duration: 3000,
      });
      
      // Navigate after successful save
      setTimeout(() => {
        navigate(`/posting/${date}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error during payment submission:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to handle voice-triggered entry addition
  useEffect(() => {
    if (voiceTriggeredAdd) {
      // The state should be updated now. Let's check for amount.
      if (amount) {
        handleAddEntry();
      } else if (selectedCustomer) {
        toast.error(`Customer ${selectedCustomer.name} found, but no installment amount is set. Please enter amount manually.`);
        amountRef.current?.focus();
      }
      setVoiceTriggeredAdd(false); // Reset the trigger
    }
  }, [voiceTriggeredAdd, amount, selectedCustomer, handleAddEntry]);

  // Voice actions for the Posting page
  useVoiceAction(['add entry', 'new entry', 'add payment'], (_transcript) => {
    serialNumberRef.current?.focus();
    toast.info('Ready to add a new payment entry.');
  });
  
  useVoiceAction(['add '], (transcript) => {
    const cleanedTranscript = transcript.toLowerCase();
    
    // Prevent this from firing for more specific "add" commands.
    if (['add entry', 'new entry', 'add payment'].some(c => cleanedTranscript.startsWith(c))) {
        return;
    }

    const command = 'add ';
    if (cleanedTranscript.startsWith(command)) {
      const serial = cleanedTranscript.substring(command.length).trim().replace(/[^0-9]/g, '');
      if (serial) {
        const customer = getCustomerBySerialNumber(serial);
        if (customer) {
          toast.success(`Found customer: ${customer.name}. Adding payment.`);
          setSerialNumber(serial);
          setSelectedCustomer(customer);
          setAmount(customer.installmentAmount || '');
          setVoiceTriggeredAdd(true);
        } else {
          toast.error(`Customer with serial number "${serial}" not found.`);
        }
      }
    }
  });

  useVoiceAction(['save payments', 'submit payments', 'save entries'], (_transcript) => {
    if (entries.length > 0) {
      handleSubmit();
    } else {
      toast.warning('No entries to save.');
    }
  }, !isProcessing);
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`Record Payments${currentArea ? ` - ${currentArea.name}` : ''}`}
        subtitle="Enter customer payments for collection (overpayments allowed as earnings)"
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card border-none">
          <PostingHeader
            onOcrImport={handleFileImport}
            onPdfImport={handleFileImport}
            isOcrRunning={isOcrRunning}
            ocrProgress={ocrProgress}
            ocrFileInputRef={ocrFileInputRef}
            pdfFileInputRef={pdfFileInputRef}
          />
          <CardContent className="space-y-6">
            <PaymentEntryForm
              date={date}
              setDate={setDate}
              collectionType={collectionType}
              setCollectionType={setCollectionType}
              serialNumber={serialNumber}
              handleSerialNumberChange={handleSerialNumberChange}
              handleSerialNumberKeyDown={handleSerialNumberKeyDown}
              serialNumberRef={serialNumberRef}
              agentName={agentName}
              setAgentName={setAgentName}
              handleAgentNameKeyDown={handleAgentNameKeyDown}
              agentNameRef={agentNameRef}
              amount={amount}
              setAmount={setAmount}
              handleAmountKeyDown={handleAmountKeyDown}
              amountRef={amountRef}
              handleAddEntry={handleAddEntry}
              selectedCustomer={selectedCustomer}
            />
            
            <PaymentEntriesTable
              entries={entries}
              onRemoveEntry={handleRemoveEntry}
              isProcessing={isProcessing}
              isMobile={isMobile}
            />
          </CardContent>
          <CardFooter className="justify-between border-t p-4">
            <div className="text-lg font-medium">
              Total: <span className="text-finance-blue">₹{totalAmount.toLocaleString()}</span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={entries.length === 0 || isProcessing}
              className="bg-finance-blue hover:bg-finance-blue/90"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Payments
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Customer Information Card */}
        <div className="space-y-6">
          {selectedCustomer ? (
            <CustomerInfoCard customer={selectedCustomer} />
          ) : (
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Customer Information
                </CardTitle>
                <CardDescription>
                  Enter a serial number to view customer details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No customer selected</p>
                  <p className="text-sm">Enter a serial number to see customer details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Posting;
