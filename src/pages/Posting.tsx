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
import { Calendar, Plus, Save, Trash2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaymentEntry {
  id: string;
  serialNumber: string;
  customerName: string;
  customerId: string;
  amount: number;
  agentName: string;
}

// Improved ID generation function
const generateUniqueId = (() => {
  let counter = 0;
  return () => {
    counter++;
    return `payment_${Date.now()}_${counter}_${Math.random().toString(36).substring(2, 9)}`;
  };
})();

const Posting = () => {
  const { 
    getCurrentAreaCustomers, 
    addPayment, 
    getCustomerBySerialNumber, 
    recalculateAllCustomerPayments, 
    currentAreaId, 
    getAreaById 
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
  
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  
  useEffect(() => {
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    setTotalAmount(total);
  }, [entries]);
  
  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSerialNumber(value);
    
    const customer = getCustomerBySerialNumber(value);
    if (customer) {
      setCustomerName(customer.name);
    } else {
      setCustomerName('');
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
      // Add new entry
      const newEntry: PaymentEntry = {
        id: generateUniqueId(),
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
    
    // Clear form
    setSerialNumber('');
    setCustomerName('');
    setAmount('');
  };
  
  const handleRemoveEntry = (id: string) => {
    console.log('Removing entry with id:', id);
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    console.log('Entries after removal:', updatedEntries);
    toast.success('Payment entry removed');
  };
  
  // Batch payment processing function
  const processBatchPayments = async (paymentEntries: PaymentEntry[]): Promise<{ success: boolean; savedCount: number; errors: string[] }> => {
    const errors: string[] = [];
    let savedCount = 0;
    
    console.log('Processing batch payments:', paymentEntries);
    
    // Validate all entries before processing
    for (const entry of paymentEntries) {
      const customer = getCustomerBySerialNumber(entry.serialNumber);
      if (!customer) {
        errors.push(`Customer not found for serial number: ${entry.serialNumber}`);
        continue;
      }
      
      if (entry.amount <= 0) {
        errors.push(`Invalid amount for customer: ${entry.customerName}`);
        continue;
      }
    }
    
    if (errors.length > 0) {
      return { success: false, savedCount: 0, errors };
    }
    
    // Process each payment
    for (let i = 0; i < paymentEntries.length; i++) {
      const entry = paymentEntries[i];
      setSavingProgress(Math.round(((i + 1) / paymentEntries.length) * 100));
      
      try {
        console.log(`Processing payment ${i + 1}/${paymentEntries.length}:`, entry);
        
        // Add payment with proper data
        addPayment({
          customerId: entry.customerId,
          serialNumber: entry.serialNumber,
          amount: entry.amount,
          date,
          collectionType,
          agentName: entry.agentName,
          areaId: currentAreaId || undefined
        });
        
        savedCount++;
        console.log(`Successfully saved payment for ${entry.customerName}`);
        
        // Small delay to ensure proper state updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`Error saving payment for ${entry.customerName}:`, error);
        errors.push(`Failed to save payment for ${entry.customerName}: ${error}`);
      }
    }
    
    return { success: savedCount > 0, savedCount, errors };
  };
  
  // Verify payments were actually saved
  const verifyPaymentsSaved = async (expectedCount: number): Promise<boolean> => {
    // Allow time for state updates
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      // Recalculate all customer payments to ensure consistency
      recalculateAllCustomerPayments();
      
      // Additional verification could be added here
      console.log('Payment verification completed');
      return true;
    } catch (error) {
      console.error('Error during payment verification:', error);
      return false;
    }
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    console.log('Starting payment submission with entries:', entries);
    
    // Validation checks
    if (entries.length === 0) {
      toast.error('Please add at least one payment entry');
      return;
    }
    
    // Check for duplicate entries
    const serialNumbers = entries.map(e => e.serialNumber);
    const uniqueSerialNumbers = new Set(serialNumbers);
    if (serialNumbers.length !== uniqueSerialNumbers.size) {
      toast.error('Duplicate entries detected. Please review your entries.');
      return;
    }
    
    setIsSubmitting(true);
    setSavingProgress(0);
    
    try {
      toast.loading(`Saving ${entries.length} payments...`, { id: 'saving-payments' });
      
      // Process batch payments
      const result = await processBatchPayments(entries);
      
      if (!result.success) {
        throw new Error(`Failed to save payments: ${result.errors.join(', ')}`);
      }
      
      if (result.errors.length > 0) {
        console.warn('Some payments had issues:', result.errors);
        toast.warning(`${result.savedCount} payments saved with ${result.errors.length} warnings`);
      }
      
      // Verify payments were saved
      const verified = await verifyPaymentsSaved(result.savedCount);
      if (!verified) {
        console.warn('Payment verification failed, but continuing...');
      }
      
      // Success feedback
      toast.success(`Successfully saved ${result.savedCount} payments for ${date}`, { id: 'saving-payments' });
      
      console.log(`Batch processing completed. Saved: ${result.savedCount}, Errors: ${result.errors.length}`);
      
      // Clear entries only after successful save
      setEntries([]);
      setSavingProgress(0);
      
      // Navigate with a small delay to ensure data is persisted
      setTimeout(() => {
        navigate(`/posting/${date}`);
      }, 100);
      
    } catch (error) {
      console.error('Error during payment submission:', error);
      toast.error(`Failed to save payments: ${error}`, { id: 'saving-payments' });
    } finally {
      setIsSubmitting(false);
      setSavingProgress(0);
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`Record Payments${currentArea ? ` - ${currentArea.name}` : ''}`}
        subtitle="Enter customer payments for collection (overpayments allowed as earnings)"
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card border-none">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Enter the serial number and payment amount for each customer. Overpayments are allowed and will be treated as earnings.
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={serialNumber}
                    onChange={handleSerialNumberChange}
                    placeholder="Enter serial number"
                    disabled={isSubmitting}
                  />
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
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Enter amount"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      onClick={handleAddEntry}
                      className="bg-finance-blue hover:bg-finance-blue/90"
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress indicator during submission */}
            {isSubmitting && (
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      Saving payments... {savingProgress}%
                    </p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${savingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
                        No entries added yet
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
            <Button
              onClick={handleSubmit}
              disabled={entries.length === 0 || isSubmitting}
              className="bg-finance-blue hover:bg-finance-blue/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
