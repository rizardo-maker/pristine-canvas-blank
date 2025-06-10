import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance, Payment } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
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
  Download,
  FileText,
  Users,
  DollarSign,
  Trash2,
  UserCircle,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const PostingDetails = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { 
    getCurrentAreaPayments, 
    deletePayment, 
    currentAreaId, 
    getAreaById,
    recalculateAllCustomerPayments
  } = useFinance();
  
  const isMobile = useIsMobile();
  
  const [dayPayments, setDayPayments] = useState<Payment[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [uniqueAgents, setUniqueAgents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [dataIntegrityStatus, setDataIntegrityStatus] = useState<'checking' | 'valid' | 'issues' | null>(null);
  
  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  
  // Enhanced data loading with integrity checks
  const loadPayments = async () => {
    console.log('Loading payments for date:', date, 'area:', currentAreaId);
    
    if (!date) {
      setIsLoading(false);
      return;
    }
    
    try {
      setDataIntegrityStatus('checking');
      
      // Get all payments for current area with multiple retry attempts
      let areaPayments: Payment[] = [];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        areaPayments = getCurrentAreaPayments();
        
        // If we have payments, break
        if (areaPayments.length > 0 || retryCount === maxRetries - 1) {
          break;
        }
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 200));
        retryCount++;
        console.log(`Retry attempt ${retryCount} for loading payments`);
      }
      
      console.log('All area payments loaded:', areaPayments.length);
      
      // Filter by date with enhanced matching
      const filteredPayments = areaPayments.filter(payment => {
        const paymentDate = payment.date;
        const matches = paymentDate === date;
        console.log(`Payment ${payment.id}: date=${paymentDate}, matches=${matches}`);
        return matches;
      });
      
      console.log('Filtered payments for date:', filteredPayments);
      
      // Data integrity check
      const hasValidData = filteredPayments.every(payment => 
        payment.id && 
        payment.customerName && 
        payment.amount > 0 && 
        payment.date === date
      );
      
      setDataIntegrityStatus(hasValidData ? 'valid' : 'issues');
      
      if (!hasValidData) {
        console.warn('Data integrity issues detected in payments');
        toast.warning('Some payment data may be incomplete');
      }
      
      setDayPayments(filteredPayments);
      
      const total = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalAmount(total);
      console.log('Total amount calculated:', total);
      
      // Get unique agent names
      const agents = filteredPayments
        .map(payment => payment.agentName || 'Not specified')
        .filter((value, index, self) => self.indexOf(value) === index);
      setUniqueAgents(agents);
      
      setLastRefresh(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('Error loading payments:', error);
      setDataIntegrityStatus('issues');
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load payments when component mounts or dependencies change
  useEffect(() => {
    console.log('PostingDetails useEffect triggered');
    setIsLoading(true);
    
    // Enhanced delay to ensure data is fully loaded
    const timer = setTimeout(() => {
      loadPayments();
    }, 150);
    
    return () => clearTimeout(timer);
  }, [date, currentAreaId, getCurrentAreaPayments]);
  
  // Manual refresh function with data validation
  const handleRefresh = async () => {
    console.log('Manual refresh triggered');
    setIsLoading(true);
    
    try {
      // Recalculate customer payments to ensure consistency
      recalculateAllCustomerPayments();
      
      // Wait for recalculation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reload payments after recalculation
      await loadPayments();
      
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error during refresh:', error);
      toast.error('Failed to refresh data');
    }
  };
  
  const exportToPdf = () => {
    if (!date) return;
    
    const element = document.getElementById('posting-details-content');
    if (!element) return;
    
    const opt = {
      margin: 1,
      filename: `Collection_Report_${date}${currentArea ? `_${currentArea.name}` : ''}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleDeletePayment = async (paymentId: string) => {
    console.log('Deleting payment:', paymentId);
    
    try {
      deletePayment(paymentId);
      
      // Update the local state immediately
      const updatedPayments = dayPayments.filter(payment => payment.id !== paymentId);
      setDayPayments(updatedPayments);
      
      const newTotal = updatedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalAmount(newTotal);
      
      // Update unique agents
      const agents = updatedPayments
        .map(payment => payment.agentName || 'Not specified')
        .filter((value, index, self) => self.indexOf(value) === index);
      setUniqueAgents(agents);
      
      console.log('Payment deleted, updated state');
      toast.success('Payment deleted successfully');
      
      // Recalculate customer payments after deletion
      setTimeout(() => {
        recalculateAllCustomerPayments();
      }, 100);
      
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };
  
  if (!date) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold">Invalid date parameter</h2>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => navigate('/posting')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Posting
        </Button>
      </div>
    );
  }
  
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`Collection Details: ${formattedDate}${currentArea ? ` - ${currentArea.name}` : ''}`}
        subtitle={`Summary of all payments collected on this date${lastRefresh ? ` (Last updated: ${lastRefresh})` : ''}`}
      >
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/posting')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posting
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => exportToPdf()}
            className="bg-finance-blue hover:bg-finance-blue/90"
            disabled={dayPayments.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </PageTitle>
      
      {/* Enhanced loading state with data integrity status */}
      {isLoading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-finance-blue" />
          <p className="text-muted-foreground">Loading payment details...</p>
          {dataIntegrityStatus === 'checking' && (
            <p className="text-xs text-muted-foreground mt-2">Verifying data integrity...</p>
          )}
        </div>
      )}
      
      {!isLoading && (
        <>
          {/* Data integrity indicator */}
          {dataIntegrityStatus && (
            <div className={`p-3 rounded-lg border flex items-center gap-2 ${
              dataIntegrityStatus === 'valid' 
                ? 'border-green-200 bg-green-50 text-green-700'
                : dataIntegrityStatus === 'issues'
                ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                : 'border-blue-200 bg-blue-50 text-blue-700'
            }`}>
              {dataIntegrityStatus === 'valid' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">
                {dataIntegrityStatus === 'valid' 
                  ? 'All payment data verified'
                  : dataIntegrityStatus === 'issues'
                  ? 'Some data integrity issues detected'
                  : 'Checking data integrity...'
                }
              </span>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-card border-none">
              <CardHeader className="pb-2">
                <CardDescription>Total Customers</CardDescription>
                <CardTitle className="text-3xl flex items-center">
                  {dayPayments.length}
                  <Users className="ml-2 h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="shadow-card border-none">
              <CardHeader className="pb-2">
                <CardDescription>Total Amount Collected</CardDescription>
                <CardTitle className="text-3xl flex items-center">
                  ₹{totalAmount.toLocaleString()}
                  <DollarSign className="ml-2 h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="shadow-card border-none">
              <CardHeader className="pb-2">
                <CardDescription>Agents</CardDescription>
                <CardTitle className="text-3xl flex items-center">
                  {uniqueAgents.length}
                  <UserCircle className="ml-2 h-5 w-5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          <div id="posting-details-content">
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle>Collection Details for {formattedDate}</CardTitle>
                <CardDescription>
                  List of all payments collected on this date
                  {currentArea && ` in ${currentArea.name}`}
                  {dayPayments.length === 0 && ' - No payments found for this date and area'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial #</TableHead>
                        <TableHead>Customer Name</TableHead>
                        {!isMobile && <TableHead>Agent</TableHead>}
                        <TableHead>Collection Type</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayPayments.length > 0 ? (
                        dayPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.serialNumber}</TableCell>
                            <TableCell>{payment.customerName}</TableCell>
                            {!isMobile && (
                              <TableCell>{payment.agentName || 'Not specified'}</TableCell>
                            )}
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
                                      Are you sure you want to delete this payment of ₹{payment.amount.toLocaleString()} from {payment.customerName}? 
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
                          <TableCell colSpan={isMobile ? 5 : 6} className="text-center py-6 text-muted-foreground">
                            {currentArea ? 
                              `No collections recorded for this date in ${currentArea.name}` : 
                              'No collections recorded for this date'
                            }
                          </TableCell>
                        </TableRow>
                      )}
                      {dayPayments.length > 0 && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={isMobile ? 3 : 4} className="font-bold">Total</TableCell>
                          <TableCell className="text-right font-bold">
                            ₹{totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default PostingDetails;
