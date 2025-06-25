
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, AlertCircle } from 'lucide-react';
import type { Customer } from '@/context/FinanceContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentEntryFormProps {
  date: string;
  setDate: (date: string) => void;
  collectionType: 'daily' | 'weekly' | 'monthly';
  setCollectionType: (type: 'daily' | 'weekly' | 'monthly') => void;
  serialNumber: string;
  handleSerialNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSerialNumberKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  serialNumberRef: React.RefObject<HTMLInputElement>;
  agentName: string;
  setAgentName: (name: string) => void;
  handleAgentNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  agentNameRef: React.RefObject<HTMLInputElement>;
  amount: number | '';
  setAmount: (amount: number | '') => void;
  handleAmountKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  amountRef: React.RefObject<HTMLInputElement>;
  handleAddEntry: () => void;
  selectedCustomer: Customer | null;
}

const PaymentEntryForm: React.FC<PaymentEntryFormProps> = ({
  date,
  setDate,
  collectionType,
  setCollectionType,
  serialNumber,
  handleSerialNumberChange,
  handleSerialNumberKeyDown,
  serialNumberRef,
  agentName,
  setAgentName,
  handleAgentNameKeyDown,
  agentNameRef,
  amount,
  setAmount,
  handleAmountKeyDown,
  amountRef,
  handleAddEntry,
  selectedCustomer,
}) => {
  return (
    <>
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
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input
              ref={serialNumberRef}
              id="serialNumber"
              value={serialNumber}
              onChange={handleSerialNumberChange}
              onKeyDown={handleSerialNumberKeyDown}
              placeholder="Enter serial number"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agentName">Agent Name</Label>
            <Input
              ref={agentNameRef}
              id="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              onKeyDown={handleAgentNameKeyDown}
              placeholder="Enter agent name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <div className="flex space-x-2">
              <Input
                ref={amountRef}
                id="amount"
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                onKeyDown={handleAmountKeyDown}
                placeholder="Enter amount"
                disabled={!selectedCustomer}
              />
              <Button
                type="button"
                onClick={handleAddEntry}
                disabled={!selectedCustomer || !amount}
                className="bg-finance-blue hover:bg-finance-blue/90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {selectedCustomer && selectedCustomer.installmentAmount && (
              <p className="text-sm text-muted-foreground">
                Suggested installment: ₹{selectedCustomer.installmentAmount.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {!selectedCustomer && serialNumber && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No customer found with serial number "{serialNumber}". Please check and try again.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default PaymentEntryForm;
