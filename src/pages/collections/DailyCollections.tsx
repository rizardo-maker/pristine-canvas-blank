
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance, Payment } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar, PiggyBank, Plus, Search, UserCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const DailyCollections = () => {
  const { payments, getDailyCollections, currentAreaId, getAreaById } = useFinance();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dailyPayments, setDailyPayments] = useState<Payment[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [uniqueAgents, setUniqueAgents] = useState<string[]>([]);
  
  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  
  useEffect(() => {
    const filteredPayments = getDailyCollections(selectedDate);
    setDailyPayments(filteredPayments);
    
    const total = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalAmount(total);
    
    // Get unique agent names
    const agents = filteredPayments
      .map(payment => payment.agentName || 'Not specified')
      .filter((value, index, self) => self.indexOf(value) === index);
    setUniqueAgents(agents);
  }, [selectedDate, payments, getDailyCollections]);
  
  // Filter payments based on search term
  const filteredPayments = dailyPayments.filter(payment => 
    payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.serialNumber.includes(searchTerm) ||
    (payment.agentName && payment.agentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`Daily Collections${currentArea ? ` - ${currentArea.name}` : ''}`}
        subtitle="View and manage your daily collection records"
      >
        <Button
          onClick={() => navigate('/posting')}
          className="bg-finance-blue hover:bg-finance-blue/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </PageTitle>
      
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="shadow-card border-none">
            <CardHeader className="pb-0">
              <CardTitle>Collection Records</CardTitle>
              <CardDescription>
                Daily collection records for {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="search"
                      placeholder="Search by name, serial number, or agent..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 w-full sm:w-[200px]">
                  <Label htmlFor="date">Select Date</Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial #</TableHead>
                      <TableHead>Customer Name</TableHead>
                      {!isMobile && <TableHead>Agent</TableHead>}
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.serialNumber}</TableCell>
                          <TableCell>{payment.customerName}</TableCell>
                          {!isMobile && (
                            <TableCell>{payment.agentName || 'Not specified'}</TableCell>
                          )}
                          <TableCell className="text-right">{payment.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isMobile ? 3 : 4} className="text-center py-6 text-muted-foreground">
                          {searchTerm 
                            ? 'No collections match your search' 
                            : 'No collections recorded for this date'}
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredPayments.length > 0 && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={isMobile ? 2 : 3} className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          ₹{filteredPayments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="shadow-card border-none">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Collections summary for {new Date(selectedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Customers</span>
                  <span className="text-lg font-semibold">{dailyPayments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-lg font-semibold">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Agents</span>
                  <span className="text-lg font-semibold flex items-center gap-2">
                    {uniqueAgents.length}
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Amount</span>
                  <span className="text-lg font-semibold">
                    ₹{dailyPayments.length > 0 
                      ? (totalAmount / dailyPayments.length).toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                      : '0'}
                  </span>
                </div>
              </div>
              
              <Button
                onClick={() => navigate(`/posting/${selectedDate}`)}
                className="w-full bg-finance-blue hover:bg-finance-blue/90"
                disabled={dailyPayments.length === 0}
              >
                <PiggyBank className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DailyCollections;
