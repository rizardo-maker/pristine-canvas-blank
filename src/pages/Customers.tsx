
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { Users, Plus } from 'lucide-react';

const Customers = () => {
  const { customers, getCurrentAreaCustomers } = useFinance();
  
  const currentAreaCustomers = getCurrentAreaCustomers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer base and track payments
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentAreaCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {customer.name}
              </CardTitle>
              <CardDescription>
                Serial: {customer.serialNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amount Given:</span>
                  <span>₹{customer.totalAmountGiven.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Due:</span>
                  <span>₹{customer.totalAmountToBePaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Paid:</span>
                  <span>₹{customer.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Status:</span>
                  <span className={customer.isFullyPaid ? "text-green-600" : "text-orange-600"}>
                    {customer.isFullyPaid ? "Completed" : "Active"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {currentAreaCustomers.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
              <p className="text-muted-foreground text-center">
                Start by adding your first customer to begin managing collections.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Customers;
