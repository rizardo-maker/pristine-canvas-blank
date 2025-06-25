
import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const MonthlyCollections = () => {
  const { payments } = useFinance();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().getMonth();
  });
  
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear();
  });
  
  const [monthlyPayments, setMonthlyPayments] = useState<typeof payments>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate array of years from 2020 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);
  
  useEffect(() => {
    // Filter payments for the selected month and year with collection type 'monthly'
    const filtered = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getMonth() === selectedMonth && 
             paymentDate.getFullYear() === selectedYear && 
             payment.collectionType === 'monthly';
    });
    
    setMonthlyPayments(filtered);
    
    // Calculate total amount
    const total = filtered.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalAmount(total);
  }, [payments, selectedMonth, selectedYear]);
  
  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };
  
  const exportToPdf = () => {
    const element = document.getElementById('monthly-collections-content');
    if (!element) return;
    
    const opt = {
      margin: 1,
      filename: `Monthly_Collections_${months[selectedMonth]}_${selectedYear}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };
  
  // Group payments by date
  const groupedPayments = monthlyPayments.reduce((acc, payment) => {
    const date = payment.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(payment);
    return acc;
  }, {} as Record<string, typeof payments>);
  
  // Sort dates
  const sortedDates = Object.keys(groupedPayments).sort();
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title="Monthly Collections" 
        subtitle="View and manage monthly payment collections"
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
              <span>{months[selectedMonth]} {selectedYear}</span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousMonth}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="flex flex-col sm:flex-row items-center mt-4 space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label htmlFor="month" className="whitespace-nowrap">Month:</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger id="month" className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label htmlFor="year" className="whitespace-nowrap">Year:</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger id="year" className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div id="monthly-collections-content">
        <Card className="shadow-card border-none">
          <CardHeader>
            <CardTitle>Monthly Collections Summary</CardTitle>
            <CardDescription>
              Total amount collected: ₹{totalAmount.toLocaleString()} for {months[selectedMonth]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedDates.length > 0 ? (
              <div className="space-y-6">
                {sortedDates.map(date => (
                  <div key={date} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2 font-medium">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial #</TableHead>
                          <TableHead>Customer Name</TableHead>
                          <TableHead className="text-right">Amount (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedPayments[date].map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.serialNumber}</TableCell>
                            <TableCell>{payment.customerName}</TableCell>
                            <TableCell className="text-right">{payment.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={2} className="font-bold">Daily Total</TableCell>
                          <TableCell className="text-right font-bold">
                            ₹{groupedPayments[date].reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ))}
                <div className="bg-finance-blue-light text-finance-blue rounded-lg p-4 text-lg font-bold flex justify-between">
                  <span>Monthly Total</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No monthly collections found for {months[selectedMonth]} {selectedYear}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyCollections;
