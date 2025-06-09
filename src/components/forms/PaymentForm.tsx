
import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentFormProps {
  onClose?: () => void;
  collectionType: 'daily' | 'weekly' | 'monthly';
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onClose, collectionType }) => {
  const { addPayment, getCurrentAreaCustomers } = useFinance();
  const { toast } = useToast();
  const customers = getCurrentAreaCustomers();
  
  const [formData, setFormData] = useState({
    serialNumber: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    agentName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customer = customers.find(c => c.serialNumber === formData.serialNumber);
    if (!customer) {
      toast({
        title: "Customer Not Found",
        description: "Please check the serial number and try again.",
        variant: "destructive"
      });
      return;
    }

    addPayment({
      customerId: customer.id,
      serialNumber: formData.serialNumber,
      amount: parseFloat(formData.amount),
      date: formData.date,
      collectionType,
      agentName: formData.agentName || undefined
    });

    setFormData({
      serialNumber: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      agentName: ''
    });

    if (onClose) onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedCustomer = customers.find(c => c.serialNumber === formData.serialNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Record {collectionType.charAt(0).toUpperCase() + collectionType.slice(1)} Payment
        </CardTitle>
        <CardDescription>
          Record a payment from a customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="serialNumber">Customer Serial Number</Label>
            <Select value={formData.serialNumber} onValueChange={(value) => handleInputChange('serialNumber', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.serialNumber}>
                    {customer.serialNumber} - {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCustomer && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Customer: {selectedCustomer.name}</p>
              <p className="text-sm text-muted-foreground">
                Due: ₹{(selectedCustomer.totalAmountToBePaid + (selectedCustomer.penaltyAmount || 0) - selectedCustomer.totalPaid).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Installment: ₹{selectedCustomer.installmentAmount?.toLocaleString() || 'N/A'}
              </p>
            </div>
          )}
          
          <div>
            <Label htmlFor="amount">Payment Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="date">Payment Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="agentName">Agent Name (Optional)</Label>
            <Input
              id="agentName"
              value={formData.agentName}
              onChange={(e) => handleInputChange('agentName', e.target.value)}
              placeholder="Collection agent name"
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit">Record Payment</Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
