
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { User } from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams();
  const { customers, getCustomerPayments } = useFinance();
  
  const customer = customers.find(c => c.id === id);
  const payments = customer ? getCustomerPayments(customer.id) : [];

  if (!customer) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Customer Not Found</h1>
        <p className="text-muted-foreground">The requested customer could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
        <p className="text-muted-foreground">
          Customer details and payment history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
          <CardDescription>
            Basic details and loan information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Serial Number</p>
              <p className="font-medium">{customer.serialNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{customer.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Given</p>
              <p className="font-medium">₹{customer.totalAmountGiven.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Due</p>
              <p className="font-medium">₹{customer.totalAmountToBePaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="font-medium">₹{customer.totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`font-medium ${customer.isFullyPaid ? "text-green-600" : "text-orange-600"}`}>
                {customer.isFullyPaid ? "Completed" : "Active"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Recent payments from this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{payment.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{payment.collectionType}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No payments recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetail;
