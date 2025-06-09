
import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddCustomerFormProps {
  onClose?: () => void;
}

const AddCustomerForm: React.FC<AddCustomerFormProps> = ({ onClose }) => {
  const { addCustomer, currentAreaId } = useFinance();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    address: '',
    totalAmountGiven: '',
    interestAmount: '',
    numberOfDays: '',
    numberOfWeeks: '',
    numberOfMonths: '',
    paymentCategory: 'daily' as 'daily' | 'weekly' | 'monthly'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAreaId) {
      toast({
        title: "No Area Selected",
        description: "Please select an area before adding customers.",
        variant: "destructive"
      });
      return;
    }

    const customer = addCustomer({
      name: formData.name,
      serialNumber: formData.serialNumber,
      address: formData.address,
      issuedDate: new Date().toISOString().split('T')[0],
      totalAmountGiven: parseFloat(formData.totalAmountGiven) || 0,
      interestAmount: parseFloat(formData.interestAmount) || 0,
      numberOfDays: parseInt(formData.numberOfDays) || 0,
      numberOfWeeks: formData.paymentCategory === 'weekly' ? parseInt(formData.numberOfWeeks) || 0 : undefined,
      numberOfMonths: formData.paymentCategory === 'monthly' ? parseInt(formData.numberOfMonths) || 0 : undefined,
      paymentCategory: formData.paymentCategory
    });

    setFormData({
      name: '',
      serialNumber: '',
      address: '',
      totalAmountGiven: '',
      interestAmount: '',
      numberOfDays: '',
      numberOfWeeks: '',
      numberOfMonths: '',
      paymentCategory: 'daily'
    });

    if (onClose) onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Customer
        </CardTitle>
        <CardDescription>
          Add a new customer to your collection list
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="totalAmountGiven">Amount Given (₹)</Label>
              <Input
                id="totalAmountGiven"
                type="number"
                step="0.01"
                value={formData.totalAmountGiven}
                onChange={(e) => handleInputChange('totalAmountGiven', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="interestAmount">Interest Amount (₹)</Label>
              <Input
                id="interestAmount"
                type="number"
                step="0.01"
                value={formData.interestAmount}
                onChange={(e) => handleInputChange('interestAmount', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="paymentCategory">Payment Category</Label>
              <Select value={formData.paymentCategory} onValueChange={(value) => handleInputChange('paymentCategory', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="numberOfDays">Total Days</Label>
              <Input
                id="numberOfDays"
                type="number"
                value={formData.numberOfDays}
                onChange={(e) => handleInputChange('numberOfDays', e.target.value)}
                required
              />
            </div>
            
            {formData.paymentCategory === 'weekly' && (
              <div>
                <Label htmlFor="numberOfWeeks">Number of Weeks</Label>
                <Input
                  id="numberOfWeeks"
                  type="number"
                  value={formData.numberOfWeeks}
                  onChange={(e) => handleInputChange('numberOfWeeks', e.target.value)}
                />
              </div>
            )}
            
            {formData.paymentCategory === 'monthly' && (
              <div>
                <Label htmlFor="numberOfMonths">Number of Months</Label>
                <Input
                  id="numberOfMonths"
                  type="number"
                  value={formData.numberOfMonths}
                  onChange={(e) => handleInputChange('numberOfMonths', e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button type="submit">Add Customer</Button>
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

export default AddCustomerForm;
