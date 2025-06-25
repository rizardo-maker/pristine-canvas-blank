
import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Calendar, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const WeeklyCollections = () => {
  const { payments } = useFinance();
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    // Set to the beginning of the current week (Sunday)
    date.setDate(date.getDate() - date.getDay());
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    // Set to the end of the current week (Saturday)
    date.setDate(date.getDate() + (6 - date.getDay()));
    return date.toISOString().split('T')[0];
  });
  
  const [weeklyPayments, setWeeklyPayments] = useState<typeof payments>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  
  useEffect(() => {
    // Filter payments between the selected dates and with collection type 'weekly'
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();
    
    const filtered = payments.filter(payment => {
      const paymentDate = new Date(payment.date).getTime();
      return paymentDate >= startTimestamp && 
             paymentDate <= endTimestamp && 
             payment.collectionType === 'weekly';
    });
    
    setWeeklyPayments(filtered);
    
    // Calculate total amount
    const total = filtered.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalAmount(total);
  }, [payments, startDate, endDate]);
  
  const handlePreviousWeek = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() - 7);
    setStartDate(start.toISOString().split('T')[0]);
    
    const end = new Date(endDate);
    end.setDate(end.getDate() - 7);
    setEndDate(end.toISOString().split('T')[0]);
  };
  
  const handleNextWeek = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + 7);
    setStartDate(start.toISOString().split('T')[0]);
    
    const end = new Date(endDate);
    end.setDate(end.getDate() + 7);
    setEndDate(end.toISOString().split('T')[0]);
  };
  
  const exportToPdf = () => {
    const element = document.getElementById('weekly-collections-content');
    if (!element) return;
    
    const formattedStart = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    const formattedEnd = new Date(endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const opt = {
      margin: 1,
      filename: `Weekly_Collections_${formattedStart}_to_${formattedEnd}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };
  
  // Format dates for display
  const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title="Weekly Collections" 
        subtitle="View and manage weekly payment collections"
      >
        <Button
          onClick={exportToPdf}
          className="bg-finance-blue hover:bg-finance-blue/90"
        >
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </PageTitle>
      
      <Card className="shadow-card border-none">
        <CardHeader className="pb-2">
          <CardTitle>
            <div className="flex items-center justify-between">
              <span>Week: {formattedStartDate} to {formattedEndDate}</span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousWeek}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextWeek}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="flex flex-col sm:flex-row items-center mt-4 space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label htmlFor="startDate" className="whitespace-nowrap">Start Date:</label>
              <div className="relative w-full">
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label htmlFor="endDate" className="whitespace-nowrap">End Date:</label>
              <div className="relative w-full">
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div id="weekly-collections-content">
        <Card className="shadow-card border-none">
          <CardHeader>
            <CardTitle>Collections Summary</CardTitle>
            <CardDescription>Total amount collected: ₹{totalAmount.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyPayments.length > 0 ? (
                    weeklyPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{payment.serialNumber}</TableCell>
                        <TableCell>{payment.customerName}</TableCell>
                        <TableCell className="text-right">{payment.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No weekly collections found for this date range
                      </TableCell>
                    </TableRow>
                  )}
                  {weeklyPayments.length > 0 && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={3} className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">
                        ₹{totalAmount.toLocaleString()}
                      </TableCell>
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

export default WeeklyCollections;
