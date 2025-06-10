
import React from 'react';
import { Customer, Payment } from '@/context/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Calendar, DollarSign, TrendingUp, Target, CheckCircle, AlertCircle } from 'lucide-react';

interface CustomerDetailsCardProps {
  customer: Customer;
  customerPayments: Payment[];
}

const CustomerDetailsCard: React.FC<CustomerDetailsCardProps> = ({ customer, customerPayments }) => {
  const totalPaidAmount = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceAmount = (customer.totalAmountToBePaid + (customer.penaltyAmount || 0)) - customer.totalPaid;
  const isOverdue = customer.deadlineDate && new Date() > new Date(customer.deadlineDate);
  const paymentProgress = (customer.totalPaid / customer.totalAmountToBePaid) * 100;

  return (
    <Card className="shadow-card border-none mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-finance-blue" />
            Customer Information
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={customer.isFullyPaid ? "default" : "secondary"} className="text-xs">
              {customer.isFullyPaid ? "Fully Paid" : "Active"}
            </Badge>
            {isOverdue && !customer.isFullyPaid && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Details Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Personal Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Account Number:</span>
                  <span className="text-sm text-finance-blue font-semibold">{customer.serialNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Customer Name:</span>
                  <span className="text-sm">{customer.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">Address:</span>
                    <p className="text-sm text-muted-foreground">{customer.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Schedule</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">From Date:</span>
                  <span className="text-sm">{new Date(customer.issuedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Closing Date:</span>
                  <span className="text-sm">{customer.deadlineDate ? new Date(customer.deadlineDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Payment Type:</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {customer.paymentCategory}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Financial Details Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-1">Principal Amount</div>
              <div className="text-lg font-bold text-blue-700">₹{customer.totalAmountGiven.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Original loan amount</div>
            </div>

            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-xs text-yellow-600 font-medium mb-1">Interest Amount</div>
              <div className="text-lg font-bold text-yellow-700">₹{(customer.interestAmount || 0).toLocaleString()}</div>
              <div className="text-xs text-yellow-600">{customer.interestPercentage?.toFixed(2)}%</div>
            </div>

            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="text-xs text-green-600 font-medium mb-1">Installment Amount</div>
              <div className="text-lg font-bold text-green-700">₹{(customer.installmentAmount || 0).toLocaleString()}</div>
              <div className="text-xs text-green-600">Per {customer.paymentCategory}</div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600 font-medium mb-1">Total Payable</div>
              <div className="text-lg font-bold text-gray-700">₹{customer.totalAmountToBePaid.toLocaleString()}</div>
              {customer.penaltyAmount && customer.penaltyAmount > 0 && (
                <div className="text-xs text-red-600">+₹{customer.penaltyAmount.toLocaleString()} penalty</div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Status Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Payment Status
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
              <div className="text-xs text-teal-600 font-medium mb-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Paid Total
              </div>
              <div className="text-lg font-bold text-teal-700">₹{customer.totalPaid.toLocaleString()}</div>
              <div className="text-xs text-teal-600">{customerPayments.length} payment{customerPayments.length !== 1 ? 's' : ''}</div>
            </div>

            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="text-xs text-red-600 font-medium mb-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Balance Total
              </div>
              <div className="text-lg font-bold text-red-700">₹{Math.max(0, balanceAmount).toLocaleString()}</div>
              <div className="text-xs text-red-600">Remaining amount</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-medium">{Math.min(100, paymentProgress).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-finance-blue h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, paymentProgress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        {customerPayments.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Payments</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {customerPayments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-2">{new Date(payment.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {payment.collectionType}
                    </Badge>
                  </div>
                ))}
                {customerPayments.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    +{customerPayments.length - 3} more payment{customerPayments.length - 3 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerDetailsCard;
