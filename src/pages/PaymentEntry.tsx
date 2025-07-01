
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

const PaymentEntry = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Payment Entry</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
          <CardDescription>
            Enter payment details for customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Payment entry form will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentEntry;
