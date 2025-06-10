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
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useIsMobile } from '@/hooks/use-mobile';

const PostingDetails = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { 
    getCurrentAreaPayments, 
    deletePayment, 
    currentAreaId, 
    getAreaById 
  } = useFinance();
  
  const isMobile = useIsMobile();
  
  const [dayPayments, setDayPayments] = useState<Payment[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [uniqueAgents, setUniqueAgents] = useState<string[]>([]);
  
  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  
  useEffect(() => {
    if (!date || !currentAreaId) return;
    
    // Get only payments for current area
    const areaPayments = getCurrentAreaPayments();
    const filteredPayments = areaPayments.filter(payment => payment.date === date);
    
    setDayPayments(filteredPayments);
    
    const total = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalAmount(total);
    
    // Get unique agent names
    const agents = filteredPayments
      .map(payment => payment.agentName || 'Not specified')
      .filter((value, index, self) => self.indexOf(value) === index);
    setUniqueAgents(agents);
  }, [date, currentAreaId, getCurrentAreaPayments]);
  
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

  const handleDeletePayment = (paymentId: string) => {
    deletePayment(paymentId);
    // Update the local state to reflect the deletion
    if (date) {
      const updatedPayments = dayPayments.filter(payment => payment.id !== paymentId);
      setDayPayments(updatedPayments);
      const newTotal = updatedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalAmount(newTotal);
      
      // Update unique agents
      const agents = updatedPayments
        .map(payment => payment.agentName || 'Not specified')
        .filter((value, index, self) => self.indexOf(value) === index);
      setUniqueAgents(agents);
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
        subtitle="Summary of all payments collected on this date"
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
            onClick={exportToPdf}
            className="bg-finance-blue hover:bg-finance-blue/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </PageTitle>
      
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
                        No collections recorded for this date
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
    </div>
  );
};

export default PostingDetails;
