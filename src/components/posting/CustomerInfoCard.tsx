
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/context/FinanceContext';
import { User, MapPin, Calendar, DollarSign, Percent, Clock } from 'lucide-react';

interface CustomerInfoCardProps {
  customer: Customer;
}

const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({ customer }) => {
  const remainingBalance = customer.totalAmountToBePaid - customer.totalPaid + (customer.penaltyAmount || 0);
  const isOverdue = customer.deadlineDate && new Date(customer.deadlineDate) < new Date();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Serial Number:</span>
              <Badge variant="outline">{customer.serialNumber}</Badge>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-sm">Name:</span>
              <span className="text-sm">{customer.name}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm text-muted-foreground">{customer.address}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Issued: {new Date(customer.issuedDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Category: <Badge variant="secondary">{customer.paymentCategory}</Badge>
              </span>
            </div>
            {customer.deadlineDate && (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Deadline: {new Date(customer.deadlineDate).toLocaleDateString()}
                  {isOverdue && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Details */}
        <div className="border-t pt-4">
          <h4 className="flex items-center gap-2 font-medium text-sm mb-3">
            <DollarSign className="h-4 w-4 text-primary" />
            Financial Details
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Principal Amount</div>
              <div className="text-lg font-semibold text-blue-600">
                ₹{customer.totalAmountGiven.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Interest Amount</div>
              <div className="text-lg font-semibold text-yellow-600">
                ₹{(customer.interestAmount || 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Percent className="h-3 w-3" />
                {customer.interestPercentage?.toFixed(2)}%
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">
                {customer.paymentCategory === 'daily' ? 'Daily' : 
                 customer.paymentCategory === 'weekly' ? 'Weekly' : 'Monthly'} Amount
              </div>
              <div className="text-lg font-semibold text-green-600">
                ₹{(customer.installmentAmount || 0).toLocaleString()}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Total Payable</div>
              <div className="text-lg font-semibold text-gray-700">
                ₹{customer.totalAmountToBePaid.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="bg-teal-50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground">Paid Total</div>
              <div className="text-lg font-semibold text-teal-600">
                ₹{customer.totalPaid.toLocaleString()}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${remainingBalance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="text-xs text-muted-foreground">Balance Remaining</div>
              <div className={`text-lg font-semibold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{Math.max(0, remainingBalance).toFixed(2)}
                {customer.penaltyAmount && customer.penaltyAmount > 0 && (
                  <span className="text-xs text-red-500 ml-2">
                    (includes ₹{customer.penaltyAmount.toLocaleString()} penalty)
                  </span>
                )}
              </div>
              {remainingBalance <= 0 && (
                <Badge variant="default" className="mt-1">Fully Paid</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerInfoCard;
