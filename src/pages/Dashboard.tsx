import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance, Customer, Payment } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  User,
  Home,
  Clock,
  Percent,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const Dashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    customers, 
    getCustomerPayments, 
    updateCustomerPaymentStatus, 
    deletePayment 
  } = useFinance();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      updateCustomerPaymentStatus(id);
      
      const foundCustomer = customers.find(c => c.id === id);
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setPayments(getCustomerPayments(id));
      }
    }
    
    setLoading(false);
  }, [id, customers, getCustomerPayments, updateCustomerPaymentStatus]);

  const handleDeletePayment = (paymentId: string) => {
    deletePayment(paymentId);
    if (id) {
      setPayments(getCustomerPayments(id));
    }
  };

  // Function to determine if a deadline is near (within 7 days)
  const isDeadlineNear = (deadlineDate: string): boolean => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  // Calculate penalty information - UPDATED for clarity
  const calculatePenaltyInfo = (customer: Customer) => {
    if (!customer.deadlineDate || customer.isFullyPaid) return null;

    const currentDate = new Date();
    const deadlineDate = new Date(customer.deadlineDate);
    const excessDays = Math.max(0, Math.floor((currentDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (excessDays === 0) return null;

    let penaltyPerPeriod = 0;
    let periodLabel = '';
    let originalPeriods = 0;
    let daysPerPeriod = 1;

    if (customer.paymentCategory === 'daily') {
      originalPeriods = customer.numberOfDays;
      if (originalPeriods > 0) penaltyPerPeriod = customer.interestAmount / originalPeriods;
      periodLabel = 'day';
      daysPerPeriod = 1;
    } else if (customer.paymentCategory === 'weekly') {
      originalPeriods = customer.numberOfWeeks || Math.ceil(customer.numberOfDays / 7);
      if (originalPeriods > 0) penaltyPerPeriod = customer.interestAmount / originalPeriods;
      periodLabel = 'week';
      daysPerPeriod = 7;
    } else if (customer.paymentCategory === 'monthly') {
      originalPeriods = customer.numberOfMonths || Math.ceil(customer.numberOfDays / 30);
      if (originalPeriods > 0) penaltyPerPeriod = customer.interestAmount / originalPeriods;
      periodLabel = 'month';
      daysPerPeriod = 30;
    }

    const dailyPenaltyRate = (penaltyPerPeriod / daysPerPeriod) || 0;
    const totalPenalty = customer.penaltyAmount || 0;
    
    const rateCalculationDetails = `₹${customer.interestAmount.toLocaleString()} ÷ ${originalPeriods} ${periodLabel}s = ₹${penaltyPerPeriod.toLocaleString(undefined, { maximumFractionDigits: 2 })} per ${periodLabel}`;
    const penaltyCalculationDetails = `This penalty accrues daily at a rate of ~₹${dailyPenaltyRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`;
    
    const excessPeriods = Math.floor(excessDays / daysPerPeriod);

    return {
      excessDays,
      excessPeriods,
      penaltyPerPeriod,
      periodLabel,
      totalPenalty,
      rateCalculationDetails,
      penaltyCalculationDetails,
    };
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse">Loading customer details...</div>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold">Customer not found</h2>
        <p className="text-muted-foreground mt-2">The customer you're looking for doesn't exist or has been removed.</p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => navigate('/customers')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </div>
    );
  }
  
  const remainingAmount = customer.totalAmountToBePaid - customer.totalPaid;
  const paymentProgress = (customer.totalPaid / customer.totalAmountToBePaid) * 100;
  const isDeadlineApproaching = customer.deadlineDate && !customer.isFullyPaid && isDeadlineNear(customer.deadlineDate);
  const isPastDeadline = customer.deadlineDate && !customer.isFullyPaid && new Date(customer.deadlineDate) < new Date();
  const penaltyInfo = calculatePenaltyInfo(customer);
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={customer.name} 
        subtitle={`Serial Number: ${customer.serialNumber}`}
      >
        <Button
          variant="outline"
          onClick={() => navigate('/customers')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </PageTitle>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card border-none">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Personal and loan details for {customer.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-finance-blue-light">
                  <User className="h-5 w-5 text-finance-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-finance-blue-light">
                  <Home className="h-5 w-5 text-finance-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-finance-blue-light">
                  <Calendar className="h-5 w-5 text-finance-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issued Date</p>
                  <p className="font-medium">{customer.issuedDate}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-finance-blue-light">
                  <Clock className="h-5 w-5 text-finance-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Term</p>
                  <p className="font-medium">{customer.numberOfDays} days</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-finance-blue-light">
                  <Percent className="h-5 w-5 text-finance-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest Percentage</p>
                  <p className="font-medium">{customer.interestPercentage?.toFixed(2) || 0}%</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-finance-blue-light">
                  <DollarSign className="h-5 w-5 text-finance-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Principal</p>
                  <p className="font-medium">₹{customer.totalAmountGiven.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-amber-100">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest Amount</p>
                  <p className="font-medium">₹{(customer.interestAmount || (customer.totalAmountToBePaid - customer.totalAmountGiven)).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-finance-blue-light">
                  <DollarSign className="h-5 w-5 text-finance-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Repayment</p>
                  <p className="font-medium">₹{customer.totalAmountToBePaid.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-finance-green-light">
                  <DollarSign className="h-5 w-5 text-finance-green" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid So Far</p>
                  <p className="font-medium">₹{customer.totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {/* Deadline information */}
            <div className={cn(
              "p-4 rounded-lg border",
              isPastDeadline ? "bg-finance-red-light/30 border-finance-red" : 
              isDeadlineApproaching ? "bg-amber-100 border-amber-500" : 
              "bg-finance-blue-light border-finance-blue/30"
            )}>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className={cn(
                    "h-5 w-5", 
                    isPastDeadline ? "text-finance-red" : 
                    isDeadlineApproaching ? "text-amber-600" : 
                    "text-finance-blue"
                  )} />
                  <span className="font-medium">Payment Deadline:</span>
                </div>
                <span className={cn(
                  "font-semibold",
                  isPastDeadline ? "text-finance-red" : 
                  isDeadlineApproaching ? "text-amber-600" : ""
                )}>
                  {customer.deadlineDate || "Not set"}
                </span>
              </div>
              {isPastDeadline && (
                <p className="mt-1 text-sm text-finance-red">
                  This payment is past due. Please collect payment as soon as possible.
                </p>
              )}
              {isDeadlineApproaching && !isPastDeadline && (
                <p className="mt-1 text-sm text-amber-600">
                  Payment deadline is approaching. Follow up with the customer soon.
                </p>
              )}
            </div>

            {/* Penalty Information */}
            {penaltyInfo && (
              <Card className="border-finance-red/20 bg-finance-red-light/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-finance-red flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Penalty Information
                  </CardTitle>
                  <CardDescription>
                    Overdue penalty details for this customer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-3 rounded-lg bg-white/50 border border-finance-red/20">
                      <p className="text-xs text-muted-foreground mb-1">Excess Days</p>
                      <p className="text-lg font-semibold text-finance-red">{penaltyInfo.excessDays} days</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-white/50 border border-finance-red/20">
                      <p className="text-xs text-muted-foreground mb-1">Excess {penaltyInfo.periodLabel}s</p>
                      <p className="text-lg font-semibold text-finance-red">{penaltyInfo.excessPeriods} {penaltyInfo.periodLabel}s</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-white/50 border border-finance-red/20">
                      <p className="text-xs text-muted-foreground mb-1">Penalty per {penaltyInfo.periodLabel}</p>
                      <p className="text-lg font-semibold text-finance-red">
                        ₹{penaltyInfo.penaltyPerPeriod.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-finance-red/10 border border-finance-red/30">
                      <p className="text-xs text-muted-foreground mb-1">Total Penalty</p>
                      <p className="text-lg font-bold text-finance-red">
                        ₹{penaltyInfo.totalPenalty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-finance-red/5 border border-finance-red/20 space-y-2">
                    <p className="text-sm text-finance-red">
                      <strong>Rate Calculation:</strong> {penaltyInfo.rateCalculationDetails}
                    </p>
                    <p className="text-sm text-finance-red">
                      <strong>Accrual Method:</strong> {penaltyInfo.penaltyCalculationDetails}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Payment Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {paymentProgress.toFixed(1)}%
                </span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-sm text-muted-foreground">Daily Payment Amount</p>
                <p className="text-lg font-semibold">
                  ₹{(customer.dailyAmount || (customer.totalAmountToBePaid / customer.numberOfDays)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ₹{customer.totalAmountToBePaid.toLocaleString()} ÷ {customer.numberOfDays} days
                </p>
              </div>
              <Button
                onClick={() => navigate('/posting')}
                className="bg-finance-blue hover:bg-finance-blue/90"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-none h-fit">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>
              Current loan repayment status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="w-full h-[120px] rounded-lg flex items-center justify-center bg-muted/50 relative overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 bg-finance-blue h-full transition-all duration-700"
                  style={{ width: `${paymentProgress}%` }}
                ></div>
                <div className="z-10 text-center">
                  <p className="text-3xl font-bold">
                    {customer.isFullyPaid ? '100%' : `${paymentProgress.toFixed(1)}%`}
                  </p>
                  <p className="text-sm text-muted-foreground">Repaid</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-semibold">₹{customer.totalAmountToBePaid.toLocaleString()}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className="font-semibold">₹{remainingAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Show penalty in payment status if applicable */}
              {penaltyInfo && (
                <div className="p-4 border border-finance-red/30 rounded-lg text-center bg-finance-red-light/10">
                  <p className="text-xs text-muted-foreground mb-1">Penalty Amount</p>
                  <p className="font-semibold text-finance-red">₹{penaltyInfo.totalPenalty.toLocaleString()}</p>
                </div>
              )}
              
              <div className="p-4 border rounded-lg bg-muted/20 mt-4">
                <p className="text-sm font-medium mb-2">Payment Status</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {customer.isFullyPaid ? 'Fully Paid' : isPastDeadline ? 'Overdue' : 'In Progress'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    customer.isFullyPaid 
                      ? 'bg-finance-green-light text-finance-green' 
                      : isPastDeadline
                      ? 'bg-finance-red-light text-finance-red'
                      : 'bg-finance-blue-light text-finance-blue'
                  }`}>
                    {customer.isFullyPaid ? 'PAID' : isPastDeadline ? 'OVERDUE' : 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-card border-none">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Record of all payments made by this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Collection Type</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length > 0 ? (
                  payments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell className="capitalize">{payment.collectionType}</TableCell>
                        <TableCell className="text-right">{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this payment of ₹{payment.amount.toLocaleString()}? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeletePayment(payment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No payment history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
