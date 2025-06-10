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
    
    console.log('Starting payment submission with entries:', entries);
    
    // Validation checks
    if (entries.length === 0) {
      toast.error('Please add at least one payment entry');
      return;
    }
    
    setIsSubmitting(true);
    setSavingProgress(0);
    setProcessingStatus('Initializing batch processing...');
    
    try {
      const loadingToastId = toast.loading(`Processing ${entries.length} payments...`);
      
      // Create batch processor
      const processor = new PaymentBatchProcessor();
      setProcessingStatus('Processing payments...');
      
      // Process batch with progress updates
      const updateProgress = (current: number, total: number) => {
        const progress = Math.round((current / total) * 80); // Reserve 20% for verification
        setSavingProgress(progress);
      };
      
      let processedCount = 0;
      const result: BatchProcessingResult = await processor.processPaymentBatch(
        entries,
        {
          date,
          collectionType,
          areaId: currentAreaId
        },
        (payment) => {
          addPayment(payment);
          processedCount++;
          updateProgress(processedCount, entries.length);
        },
        getCustomerBySerialNumber
      );
      
      console.log('Batch processing result:', result);
      
      if (!result.success || result.errors.length > 0) {
        const errorMessage = result.errors.length > 0 
          ? `Saved ${result.savedCount} payments, but ${result.failedCount} failed: ${result.errors[0].error}`
          : 'Failed to save payments';
        
        toast.error(errorMessage, { id: loadingToastId });
        
        if (result.savedCount > 0) {
          toast.warning(`${result.savedCount} payments were saved successfully`);
        }
        
        return;
      }
      
      // Verify payments were persisted
      setProcessingStatus('Verifying payments saved...');
      setSavingProgress(85);
      
      const verification = await processor.verifyPaymentsPersisted(
        result.savedPaymentIds,
        getCurrentAreaPayments,
        3
      );
      
      if (!verification.success) {
        console.warn('Payment verification failed:', verification.missingIds);
        toast.warning(`${result.savedCount} payments processed, but verification failed. Please check the payment details page.`);
      }
      
      // Recalculate customer payments to ensure consistency
      setProcessingStatus('Updating customer balances...');
      setSavingProgress(95);
      recalculateAllCustomerPayments();
      
      // Final success
      setSavingProgress(100);
      setProcessingStatus('Complete!');
      
      toast.success(`Successfully saved ${result.savedCount} payments for ${date}`, { id: loadingToastId });
      
      console.log(`Batch processing completed successfully. Saved: ${result.savedCount}`);
      
      // Clear all form data
      setEntries([]);
      clearForm();
      
      // Navigate with delay to ensure data persistence
      setTimeout(() => {
        navigate(`/posting/${date}`);
      }, 300);
      
    } catch (error) {
      console.error('Error during payment submission:', error);
      setProcessingStatus('Error occurred');
      toast.error(`Failed to save payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setSavingProgress(0);
      setProcessingStatus('');
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`Record Payments${currentArea ? ` - ${currentArea.name}` : ''}`}
        subtitle="Enter customer payments for collection (overpayments allowed as earnings)"
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
                      {processingStatus || `Saving payments... ${savingProgress}%`}
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
                      Processing {entries.length} payment{entries.length !== 1 ? 's' : ''}
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
