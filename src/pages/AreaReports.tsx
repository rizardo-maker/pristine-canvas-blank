
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, Users, DollarSign, TrendingUp, Percent, AlertCircle, CreditCard, Target, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import DailyEarningsTable from '@/components/reports/DailyEarningsTable';

const AreaReports = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const { getAreaById, customers, payments } = useFinance();
  const [selectedReport, setSelectedReport] = useState('collection');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  const area = areaId ? getAreaById(areaId) : null;
  
  // Filter data for this specific area
  const areaCustomers = useMemo(() => 
    customers.filter(customer => customer.areaId === areaId), 
    [customers, areaId]
  );
  
  const areaPayments = useMemo(() => 
    payments.filter(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      return customer?.areaId === areaId;
    }), 
    [payments, customers, areaId]
  );
  
  // Calculate detailed financial metrics for this area
  const financialMetrics = React.useMemo(() => {
    const totalAmountOnCustomers = areaCustomers.reduce((sum, customer) => sum + customer.totalAmountToBePaid, 0);
    const totalInterestAmount = areaCustomers.reduce((sum, customer) => sum + (customer.interestAmount || 0), 0);
    const totalPrincipleAmount = areaCustomers.reduce((sum, customer) => sum + customer.totalAmountGiven, 0);
    const totalPaidAmount = areaCustomers.reduce((sum, customer) => sum + customer.totalPaid, 0);
    
    // Calculate received principle and interest based on payment proportions
    const receivedPrinciple = areaCustomers.reduce((sum, customer) => {
      const paymentRatio = customer.totalAmountToBePaid > 0 ? customer.totalPaid / customer.totalAmountToBePaid : 0;
      return sum + (customer.totalAmountGiven * paymentRatio);
    }, 0);
    
    const receivedInterest = totalPaidAmount - receivedPrinciple;
    const pendingInterest = totalInterestAmount - receivedInterest;
    const pendingPrinciple = totalPrincipleAmount - receivedPrinciple;
    
    return {
      totalAmountOnCustomers,
      totalInterestAmount,
      totalPrincipleAmount,
      receivedPrinciple: Math.max(0, receivedPrinciple),
      receivedInterest: Math.max(0, receivedInterest),
      pendingInterest: Math.max(0, pendingInterest),
      pendingPrinciple: Math.max(0, pendingPrinciple)
    };
  }, [areaCustomers]);
  
  // Collection Types Distribution data
  const collectionTypeData = [
    { name: 'Daily', value: areaPayments.filter(p => p.collectionType === 'daily').length },
    { name: 'Weekly', value: areaPayments.filter(p => p.collectionType === 'weekly').length },
    { name: 'Monthly', value: areaPayments.filter(p => p.collectionType === 'monthly').length },
  ];
  
  // Filter out entries with zero value
  const filteredCollectionTypeData = collectionTypeData.filter(item => item.value > 0);
  
  // Chart Colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  // Get total amounts by collection type
  const dailyTotal = areaPayments
    .filter(p => p.collectionType === 'daily')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const weeklyTotal = areaPayments
    .filter(p => p.collectionType === 'weekly')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const monthlyTotal = areaPayments
    .filter(p => p.collectionType === 'monthly')
    .reduce((sum, p) => sum + p.amount, 0);
  
  // Get fully paid vs pending customers in this area
  const fullyPaidCount = areaCustomers.filter(c => c.isFullyPaid).length;
  const pendingCount = areaCustomers.filter(c => !c.isFullyPaid).length;
  
  const customerStatusData = [
    { name: 'Fully Paid', value: fullyPaidCount },
    { name: 'Pending', value: pendingCount },
  ];
  
  // Filter payments based on selected period
  const filteredPayments = (() => {
    const now = new Date();
    let startDate: Date;
    
    switch(selectedPeriod) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        return areaPayments.filter(p => new Date(p.date) >= startDate);
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        return areaPayments.filter(p => new Date(p.date) >= startDate);
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        return areaPayments.filter(p => new Date(p.date) >= startDate);
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        return areaPayments.filter(p => new Date(p.date) >= startDate);
      default:
        return areaPayments;
    }
  })();
  
  // Group by customer for top customers
  const customerTotals = filteredPayments.reduce((acc, payment) => {
    if (!acc[payment.customerId]) {
      acc[payment.customerId] = {
        id: payment.customerId,
        name: payment.customerName,
        total: 0,
      };
    }
    acc[payment.customerId].total += payment.amount;
    return acc;
  }, {} as Record<string, { id: string; name: string; total: number }>);
  
  // Get top 5 customers by payment amount
  const topCustomers = Object.values(customerTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  
  // Monthly data for bar chart (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      yearMonth: `${date.getFullYear()}-${date.getMonth() + 1}`
    };
  }).reverse();
  
  const monthlyData = last6Months.map(monthData => {
    const monthlyAmount = areaPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getMonth() === monthData.monthIndex && 
             paymentDate.getFullYear() === monthData.year;
    }).reduce((sum, payment) => sum + payment.amount, 0);
    
    return {
      month: monthData.month,
      amount: monthlyAmount
    };
  });
  
  const exportToPdf = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const title = selectedReport === 'collection' ? 'Collection Report' : 'Customer Status Report';
    const period = selectedPeriod === 'all' ? 'All Time' : 
                   selectedPeriod === 'today' ? 'Today' :
                   selectedPeriod === 'week' ? 'Last 7 Days' :
                   selectedPeriod === 'month' ? 'Last 30 Days' : 'Last Year';
    
    const opt = {
      margin: 1,
      filename: `${area?.name}_${title}_${period}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };
  
  if (!area) {
    return (
      <div className="space-y-6">
        <PageTitle title="Area Not Found" subtitle="The requested area could not be found" />
        <Button onClick={() => navigate('/areas')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Areas
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`${area.name} - Reports`}
        subtitle={`Analyze collection data and customer statistics for ${area.name}`}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/areas')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Areas
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
      
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardDescription>Area Customers</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              {areaCustomers.length}
              <Users className="ml-2 h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardDescription>Area Collections</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              ₹{areaPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              <DollarSign className="ml-2 h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardDescription>Total Amount on Customers</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              ₹{financialMetrics.totalAmountOnCustomers.toLocaleString()}
              <Target className="ml-2 h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardDescription>Fully Paid Customers</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              {fullyPaidCount} / {areaCustomers.length}
              <FileText className="ml-2 h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Financial Metrics Overview */}
      <Card className="shadow-card border-none">
        <CardHeader>
          <CardTitle>Financial Metrics Overview - {area.name}</CardTitle>
          <CardDescription>Detailed breakdown of principle and interest amounts for this area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total Principle</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                ₹{financialMetrics.totalPrincipleAmount.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Total Interest</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">
                ₹{financialMetrics.totalInterestAmount.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Received Principle</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                ₹{financialMetrics.receivedPrinciple.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-600">Received Interest</span>
              </div>
              <div className="text-2xl font-bold text-teal-700">
                ₹{financialMetrics.receivedInterest.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Pending Principle</span>
              </div>
              <div className="text-2xl font-bold text-orange-700">
                ₹{financialMetrics.pendingPrinciple.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Pending Interest</span>
              </div>
              <div className="text-2xl font-bold text-red-700">
                ₹{financialMetrics.pendingInterest.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Daily Interest & Principle Earnings Table */}
      <DailyEarningsTable />
      
      <Card className="shadow-card border-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Financial Reports - {area.name}</CardTitle>
              <CardDescription>
                View and analyze financial data for this area
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="collection" onValueChange={setSelectedReport}>
            <TabsList className="mb-6">
              <TabsTrigger value="collection">Collection Reports</TabsTrigger>
              <TabsTrigger value="customer">Customer Reports</TabsTrigger>
            </TabsList>
            
            <div id="report-content">
              <TabsContent value="collection" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly Collections</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                          <Bar dataKey="amount" fill="#3b82f6" name="Amount (₹)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Collection Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 h-[300px] flex items-center justify-center">
                      {filteredCollectionTypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={filteredCollectionTypeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {filteredCollectionTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          No collection data available for this area
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Collection Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collection Type</TableHead>
                          <TableHead>Number of Collections</TableHead>
                          <TableHead className="text-right">Total Amount (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Daily</TableCell>
                          <TableCell>{areaPayments.filter(p => p.collectionType === 'daily').length}</TableCell>
                          <TableCell className="text-right">{dailyTotal.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Weekly</TableCell>
                          <TableCell>{areaPayments.filter(p => p.collectionType === 'weekly').length}</TableCell>
                          <TableCell className="text-right">{weeklyTotal.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Monthly</TableCell>
                          <TableCell>{areaPayments.filter(p => p.collectionType === 'monthly').length}</TableCell>
                          <TableCell className="text-right">{monthlyTotal.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-medium">Total</TableCell>
                          <TableCell>{areaPayments.length}</TableCell>
                          <TableCell className="text-right">
                            ₹{(dailyTotal + weeklyTotal + monthlyTotal).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="customer" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 h-[300px] flex items-center justify-center">
                      {areaCustomers.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={customerStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Customers']} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          No customer data available for this area
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top 5 Customers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer Name</TableHead>
                            <TableHead className="text-right">Total Paid (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topCustomers.length > 0 ? (
                            topCustomers.map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell className="text-right">{customer.total.toLocaleString()}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                                No payment data available for this area
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Area Customers</p>
                          <p className="text-2xl font-bold">{areaCustomers.length}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Fully Paid</p>
                          <p className="text-2xl font-bold text-green-500">{fullyPaidCount}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Pending Payments</p>
                          <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Payment Completion Rate</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${areaCustomers.length > 0 ? (fullyPaidCount / areaCustomers.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm mt-2">
                          {areaCustomers.length > 0 
                            ? `${((fullyPaidCount / areaCustomers.length) * 100).toFixed(1)}% of customers have fully paid`
                            : 'No customers in this area yet'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AreaReports;
