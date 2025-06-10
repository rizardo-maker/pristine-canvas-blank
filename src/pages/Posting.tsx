
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
import { Calendar, Plus, Save, Trash2, Users } from 'lucide-react';
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
  
  const handleAddEntry = () => {
    if (!serialNumber || !customerName || !amount) {
      toast.error('Please fill in all the required fields');
      return;
    }
    
    const customer = getCustomerBySerialNumber(serialNumber);
    if (!customer) {
      toast.error('Customer not found with this serial number');
      return;
    }
    
    // Remove the balance check - allow overpayments
    const existingEntryIndex = entries.findIndex(e => e.serialNumber === serialNumber);
    
    if (existingEntryIndex !== -1) {
      const updatedEntries = [...entries];
      updatedEntries[existingEntryIndex].amount += Number(amount);
      updatedEntries[existingEntryIndex].agentName = agentName;
      setEntries(updatedEntries);
    } else {
      const newEntry: PaymentEntry = {
        id: Date.now().toString(),
        serialNumber,
        customerName,
        customerId: customer.id,
        amount: Number(amount),
        agentName: agentName || 'Not specified'
      };
      
      setEntries([...entries, newEntry]);
    }
    
    // Show info about overpayment if applicable
    const remaining = customer.totalAmountToBePaid - customer.totalPaid;
    if (Number(amount) > remaining && remaining > 0) {
      const excess = Number(amount) - remaining;
      toast.success(`Payment recorded. Excess amount of ₹${excess.toLocaleString()} will be treated as earnings.`);
    }
    
    setSerialNumber('');
    setCustomerName('');
    setAmount('');
  };
  
  const handleRemoveEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };
  
  const handleSubmit = () => {
    if (entries.length === 0) {
      toast.error('Please add at least one payment entry');
      return;
    }
    
    entries.forEach(entry => {
      addPayment({
        customerId: entry.customerId,
        serialNumber: entry.serialNumber,
        amount: entry.amount,
        date,
        collectionType,
        agentName: entry.agentName
      });
    });
    
    recalculateAllCustomerPayments();
    
    toast.success(`Successfully recorded ${entries.length} payments for ${date}`);
    
    navigate(`/posting/${date}`);
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
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collectionType">Collection Type</Label>
                <Select 
                  value={collectionType} 
                  onValueChange={(value) => setCollectionType(value as 'daily' | 'weekly' | 'monthly')}
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
                    />
                    <Button
                      type="button"
                      onClick={handleAddEntry}
                      className="bg-finance-blue hover:bg-finance-blue/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
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
            </div>
            <Button
              onClick={handleSubmit}
              disabled={entries.length === 0}
              className="bg-finance-blue hover:bg-finance-blue/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Payments
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
                      setSerialNumber(customer.serialNumber);
                      setCustomerName(customer.name);
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
