import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, Save, Trash2, Users, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateUniquePaymentId } from '@/utils/idGeneration';
import { PaymentBatchProcessor, PaymentEntry, BatchProcessingResult } from '@/utils/paymentBatchProcessor';
import CustomerDetailsCard from '@/components/posting/CustomerDetailsCard';

const Posting = () => {
  const { 
    getCurrentAreaCustomers, 
    addPayment, 
    getCustomerBySerialNumber, 
    recalculateAllCustomerPayments, 
    currentAreaId, 
    getAreaById,
    getCurrentAreaPayments,
    getCustomerPayments
  } = useFinance();
  
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const customers = getCurrentAreaCustomers();
  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectionType, setCollectionType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [serialNumber, setSerialNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  
  // New state for customer details display
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [batchProcessor, setBatchProcessor] = useState<PaymentBatchProcessor | null>(null);
  
  useEffect(() => {
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    setTotalAmount(total);
  }, [entries]);
  
  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSerialNumber(value);
    
    if (value.trim()) {
      const customer = getCustomerBySerialNumber(value);
      if (customer) {
        setCustomerName(customer.name);
        setSelectedCustomer(customer);
        setShowCustomerDetails(true);
      } else {
        setCustomerName('');
        setSelectedCustomer(null);
        setShowCustomerDetails(false);
      }
    } else {
      setCustomerName('');
      setSelectedCustomer(null);
      setShowCustomerDetails(false);
    }
  };
  
  const validateEntry = (serialNumber: string, customerName: string, amount: number | ''): string | null => {
    if (!serialNumber.trim()) return 'Serial number is required';
    if (!customerName.trim()) return 'Customer name is required';
    if (!amount || amount <= 0) return 'Valid amount is required';
    
    const customer = getCustomerBySerialNumber(serialNumber);
    if (!customer) return 'Customer not found with this serial number';
    
    return null;
  };
  
  const handleAddEntry = () => {
    console.log('Adding entry:', { serialNumber, customerName, amount, agentName });
    
    const validationError = validateEntry(serialNumber, customerName, amount);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    const customer = getCustomerBySerialNumber(serialNumber);
    if (!customer) {
      toast.error('Customer not found with this serial number');
      return;
    }
    
    const existingEntryIndex = entries.findIndex(e => e.serialNumber === serialNumber);
    
    if (existingEntryIndex !== -1) {
      // Update existing entry
      const updatedEntries = [...entries];
      updatedEntries[existingEntryIndex] = {
        ...updatedEntries[existingEntryIndex],
        amount: updatedEntries[existingEntryIndex].amount + Number(amount),
        agentName: agentName || 'Not specified'
      };
      setEntries(updatedEntries);
      console.log('Updated existing entry:', updatedEntries[existingEntryIndex]);
    } else {
      // Add new entry with robust ID generation
      const newEntry: PaymentEntry = {
        id: generateUniquePaymentId(),
        serialNumber: serialNumber.trim(),
        customerName: customerName.trim(),
        customerId: customer.id,
        amount: Number(amount),
        agentName: agentName.trim() || 'Not specified'
      };
      
      const updatedEntries = [...entries, newEntry];
      setEntries(updatedEntries);
      console.log('Added new entry:', newEntry);
      console.log('All entries after add:', updatedEntries);
    }
    
    // Show success feedback
    const remaining = customer.totalAmountToBePaid - customer.totalPaid;
    if (Number(amount) > remaining && remaining > 0) {
      const excess = Number(amount) - remaining;
      toast.success(`Payment added. Excess amount of ₹${excess.toLocaleString()} will be treated as earnings.`);
    } else {
      toast.success('Payment entry added successfully');
    }
    
    // Clear form but keep customer details displayed
    setAmount('');
    // Don't clear serialNumber and customerName to keep customer details visible
  };
  
  const handleRemoveEntry = (id: string) => {
    console.log('Removing entry with id:', id);
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    console.log('Entries after removal:', updatedEntries);
    toast.success('Payment entry removed');
  };

  const clearForm = () => {
    setSerialNumber('');
    setCustomerName('');
    setSelectedCustomer(null);
    setShowCustomerDetails(false);
    setAmount('');
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    console.log('Starting enhanced payment submission with entries:', entries);
    
    // Phase 1: Pre-submission validation
    if (entries.length === 0) {
      toast.error('Please add at least one payment entry');
      return;
    }
    
    setIsSubmitting(true);
    setSavingProgress(0);
    setProcessingStatus('Initializing enhanced batch processing...');
    
    try {
      const loadingToastId = toast.loading(`Processing ${entries.length} payments with enhanced system...`);
      
      // Create enhanced batch processor
      const processor = new PaymentBatchProcessor();
      setBatchProcessor(processor);
      setProcessingStatus('Starting batch validation...');
      setSavingProgress(10);
      
      // Process batch with enhanced options
      const result: BatchProcessingResult = await processor.processPaymentBatch(
        entries,
        {
          date,
          collectionType,
          areaId: currentAreaId
        },
        (payment) => {
          addPayment(payment);
          const currentProgress = Math.min(80, (processor.getBatchStats().totalProcessed / entries.length) * 70 + 10);
          setSavingProgress(currentProgress);
        },
        getCustomerBySerialNumber,
        getCurrentAreaPayments,
        {
          enableRollback: true,
          validateBeforeSubmit: true,
          maxRetries: 3,
          delayBetweenPayments: 100
        }
      );
      
      console.log('Enhanced batch processing result:', result);
      
      if (!result.success || result.errors.length > 0) {
        setProcessingStatus('Processing completed with errors');
        const errorMessage = result.errors.length > 0 
          ? `Saved ${result.savedCount} payments, but ${result.failedCount} failed: ${result.errors[0].error}`
          : 'Failed to save payments';
        
        toast.error(errorMessage, { id: loadingToastId });
        
        if (result.savedCount > 0) {
          toast.warning(`${result.savedCount} payments were saved successfully`);
          // Partial success - still recalculate and clear saved entries
          recalculateAllCustomerPayments();
          // Remove successfully processed entries
          const failedEntryIds = result.errors.map(e => e.entryId);
          const remainingEntries = entries.filter(e => failedEntryIds.includes(e.id));
          setEntries(remainingEntries);
        }
        
        return;
      }
      
      // Phase 2: Verify payments were persisted
      setProcessingStatus('Verifying payments persistence...');
      setSavingProgress(85);
      
      // Additional verification delay for localStorage to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Phase 3: Recalculate customer payments to ensure consistency
      setProcessingStatus('Updating customer balances...');
      setSavingProgress(95);
      recalculateAllCustomerPayments();
      
      // Phase 4: Final validation
      const finalPayments = getCurrentAreaPayments();
      const finalVerification = result.savedPaymentIds.every(id => 
        finalPayments.some(p => p.id === id)
      );
      
      if (!finalVerification) {
        console.warn('Final verification failed - some payments may not be properly persisted');
        toast.warning('Payments processed, but please verify the data on the posting details page');
      }
      
      // Success!
      setSavingProgress(100);
      setProcessingStatus('All payments successfully processed!');
      
      toast.success(`Successfully saved ${result.savedCount} payments for ${date}`, { id: loadingToastId });
      
      console.log(`Enhanced batch processing completed successfully. Batch ID: ${result.batchId}, Saved: ${result.savedCount}`);
      
      // Clear all form data
      setEntries([]);
      clearForm();
      
      // Navigate with additional delay to ensure all state updates are complete
      setTimeout(() => {
        navigate(`/posting/${date}`);
      }, 500);
      
    } catch (error) {
      console.error('Error during enhanced payment submission:', error);
      setProcessingStatus('Critical error occurred');
      toast.error(`Failed to save payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setSavingProgress(0);
      setProcessingStatus('');
      setBatchProcessor(null);
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`Record Payments${currentArea ? ` - ${currentArea.name}` : ''}`}
        subtitle="Enter customer payments for collection (enhanced processing system)"
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card border-none">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter the serial number to view customer details and record payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Collection Date</Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collectionType">Collection Type</Label>
                  <Select 
                    value={collectionType} 
                    onValueChange={(value) => setCollectionType(value as 'daily' | 'weekly' | 'monthly')}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="collectionType">
                      <SelectValue placeholder="Select collection type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <div className="relative">
                      <Input
                        id="serialNumber"
                        value={serialNumber}
                        onChange={handleSerialNumberChange}
                        placeholder="Enter serial number"
                        disabled={isSubmitting}
                      />
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      readOnly
                      className="bg-muted"
                      placeholder="Customer name will appear here"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agentName">Agent Name</Label>
                    <Input
                      id="agentName"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Enter agent name"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details Display */}
          {showCustomerDetails && selectedCustomer && (
            <CustomerDetailsCard 
              customer={selectedCustomer}
              customerPayments={getCustomerPayments(selectedCustomer.id)}
            />
          )}

          {/* Amount Entry Section - Only show when customer is selected */}
          {showCustomerDetails && selectedCustomer && (
            <Card className="shadow-card border-none border-l-4 border-l-finance-blue">
              <CardHeader>
                <CardTitle className="text-finance-blue">Add Payment</CardTitle>
                <CardDescription>
                  Enter the payment amount for {selectedCustomer.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="amount">Payment Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Enter payment amount"
                      disabled={isSubmitting}
                      className="text-lg"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddEntry}
                    className="bg-finance-blue hover:bg-finance-blue/90"
                    disabled={isSubmitting || !amount}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Enhanced progress indicator during submission */}
          {isSubmitting && (
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-blue-900">
                      {processingStatus || `Processing payments... ${savingProgress}%`}
                    </p>
                    {savingProgress === 100 && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${savingProgress}%` }}
                    />
                  </div>
                  {savingProgress > 0 && (
                    <p className="text-xs text-blue-700 mt-1">
                      Enhanced processing: {entries.length} payment{entries.length !== 1 ? 's' : ''}
                      {batchProcessor && ` (Batch ID: ${batchProcessor.getBatchStats().batchId})`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Entries Table */}
          <Card className="shadow-card border-none">
            <CardHeader>
              <CardTitle>Payment Entries</CardTitle>
              <CardDescription>
                Review payments before saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial #</TableHead>
                      <TableHead>Customer Name</TableHead>
                      {!isMobile && <TableHead>Agent</TableHead>}
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length > 0 ? (
                      entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.serialNumber}</TableCell>
                          <TableCell>{entry.customerName}</TableCell>
                          {!isMobile && <TableCell>{entry.agentName}</TableCell>}
                          <TableCell className="text-right">{entry.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveEntry(entry.id)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isMobile ? 4 : 5} className="text-center py-6 text-muted-foreground">
                          No payment entries added yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t p-4">
              <div className="text-lg font-medium">
                Total: <span className="text-finance-blue">₹{totalAmount.toLocaleString()}</span>
                {entries.length > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({entries.length} payment{entries.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearForm}
                  disabled={isSubmitting}
                >
                  Clear Form
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={entries.length === 0 || isSubmitting}
                  className="bg-finance-blue hover:bg-finance-blue/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Payments
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <Card className="shadow-card border-none">
          <CardHeader>
            <CardTitle>Customer Quick View</CardTitle>
            <CardDescription>
              Recent customers with pending payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customers
                .filter(customer => 
                  !customer.isFullyPaid && 
                  (currentAreaId ? customer.areaId === currentAreaId : true)
                )
                .slice(0, 8)
                .map((customer) => (
                  <div 
                    key={customer.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-finance-gray transition-colors cursor-pointer"
                    onClick={() => {
                      if (!isSubmitting) {
                        setSerialNumber(customer.serialNumber);
                        setCustomerName(customer.name);
                        setSelectedCustomer(customer);
                        setShowCustomerDetails(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-finance-blue-light flex items-center justify-center">
                        <span className="text-sm font-medium text-finance-blue">
                          {customer.serialNumber}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-finance-text-secondary">
                          Pending: ₹{(customer.totalAmountToBePaid - customer.totalPaid).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              
              {customers.filter(customer => 
                !customer.isFullyPaid &&
                (currentAreaId ? customer.areaId === currentAreaId : true)
              ).length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No pending customers</p>
                </div>
              )}
              
              {customers.filter(customer => 
                !customer.isFullyPaid &&
                (currentAreaId ? customer.areaId === currentAreaId : true)
              ).length > 8 && (
                <Button
                  variant="outline"
                  className="w-full text-finance-blue"
                  onClick={() => navigate('/customers')}
                  disabled={isSubmitting}
                >
                  View All Customers
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Posting;
