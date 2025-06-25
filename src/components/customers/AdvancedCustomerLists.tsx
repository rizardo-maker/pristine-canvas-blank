
import React, { useState } from 'react';
import { useFinance, Customer } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Download, 
  FileText, 
  Printer,
  Clock,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportCustomersToPDF, exportCustomersToExcel, printCustomerReport } from '@/utils/customerExport';
import { toast } from 'sonner';

type ListType = 'pending' | 'paid' | 'overdue';

interface UrgencyLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  bgColor: string;
}

const AdvancedCustomerLists = () => {
  const {
    getCurrentAreaCustomers,
    currentAreaId,
    getAreaById
  } = useFinance();

  const [activeList, setActiveList] = useState<ListType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  const allCustomers = getCurrentAreaCustomers();

  // Fixed filtering logic
  const getPendingCustomers = (): Customer[] => {
    return allCustomers.filter(customer => !customer.isFullyPaid);
  };

  const getPaidCustomers = (): Customer[] => {
    return allCustomers.filter(customer => customer.isFullyPaid);
  };

  const getOverdueCustomers = (): Customer[] => {
    return allCustomers.filter(customer => {
      if (!customer.deadlineDate || customer.isFullyPaid) return false;
      const currentDate = new Date();
      const deadlineDate = new Date(customer.deadlineDate);
      return currentDate > deadlineDate;
    });
  };

  const getCustomersForActiveList = (): Customer[] => {
    switch (activeList) {
      case 'pending':
        return getPendingCustomers();
      case 'paid':
        return getPaidCustomers();
      case 'overdue':
        return getOverdueCustomers();
      default:
        return [];
    }
  };

  const filteredCustomers = getCustomersForActiveList().filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.serialNumber.includes(searchTerm)
  );

  const getUrgencyLevel = (customer: Customer): UrgencyLevel => {
    if (!customer.deadlineDate) return { level: 'low', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    
    const currentDate = new Date();
    const deadlineDate = new Date(customer.deadlineDate);
    const daysOverdue = Math.floor((currentDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOverdue <= 7) {
      return { level: 'low', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    } else if (daysOverdue <= 30) {
      return { level: 'medium', color: 'text-orange-700', bgColor: 'bg-orange-100' };
    } else if (daysOverdue <= 60) {
      return { level: 'high', color: 'text-finance-red', bgColor: 'bg-finance-red-light' };
    } else {
      return { level: 'critical', color: 'text-destructive-foreground', bgColor: 'bg-destructive' };
    }
  };

  const getDaysOverdue = (customer: Customer): number => {
    if (!customer.deadlineDate) return 0;
    const currentDate = new Date();
    const deadlineDate = new Date(customer.deadlineDate);
    return Math.max(0, Math.floor((currentDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getDaysSinceIssue = (customer: Customer): number => {
    const currentDate = new Date();
    const issuedDate = new Date(customer.issuedDate);
    return Math.floor((currentDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCompletionDate = (customer: Customer): string => {
    if (!customer.isFullyPaid) return 'N/A';
    return 'Recently';
  };

  const handleExport = (type: 'pdf' | 'excel' | 'print') => {
    try {
      const listName = activeList ? `${activeList.charAt(0).toUpperCase() + activeList.slice(1)} Customers` : 'Customers';
      const fileName = `${listName}${currentArea ? ` - ${currentArea.name}` : ''}`;
      
      switch (type) {
        case 'pdf':
          exportCustomersToPDF(filteredCustomers, fileName);
          toast.success('PDF export completed successfully');
          break;
        case 'excel':
          exportCustomersToExcel(filteredCustomers, fileName);
          toast.success('Excel export completed successfully');
          break;
        case 'print':
          printCustomerReport(filteredCustomers, fileName);
          toast.success('Print dialog opened');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  const renderPendingCustomersTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Serial #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Amount Given</TableHead>
          <TableHead className="text-right">Amount Paid</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead className="text-center">Days Since Issue</TableHead>
          <TableHead className="text-right">Expected Daily Payment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredCustomers.map((customer) => {
          const remaining = (customer.totalAmountToBePaid + (customer.penaltyAmount || 0)) - customer.totalPaid;
          return (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.serialNumber}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell className="text-right">₹{customer.totalAmountGiven.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{customer.totalPaid.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{remaining.toLocaleString()}</TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="text-blue-700 border-blue-200">
                  {getDaysSinceIssue(customer)} days
                </Badge>
              </TableCell>
              <TableCell className="text-right">₹{(customer.dailyAmount || 0).toLocaleString()}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const renderPaidCustomersTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Serial #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Total Paid</TableHead>
          <TableHead className="text-center">Completion</TableHead>
          <TableHead className="text-right">Interest Earned</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredCustomers.map((customer) => (
          <TableRow key={customer.id} className="bg-finance-green-light">
            <TableCell className="font-medium">{customer.serialNumber}</TableCell>
            <TableCell>{customer.name}</TableCell>
            <TableCell className="text-right">₹{customer.totalPaid.toLocaleString()}</TableCell>
            <TableCell className="text-center">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                {getCompletionDate(customer)}
              </Badge>
            </TableCell>
            <TableCell className="text-right text-green-700 font-semibold">
              ₹{(customer.interestAmount || 0).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderOverdueCustomersTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Serial #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Amount Due</TableHead>
          <TableHead className="text-center">Days Overdue</TableHead>
          <TableHead className="text-right">Penalty</TableHead>
          <TableHead className="text-center">Urgency</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredCustomers.map((customer) => {
          const urgency = getUrgencyLevel(customer);
          const daysOverdue = getDaysOverdue(customer);
          const amountDue = (customer.totalAmountToBePaid + (customer.penaltyAmount || 0)) - customer.totalPaid;
          
          return (
            <TableRow key={customer.id} className="bg-finance-red-light">
              <TableCell className="font-medium">{customer.serialNumber}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell className="text-right font-semibold">₹{amountDue.toLocaleString()}</TableCell>
              <TableCell className="text-center">
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {daysOverdue} days
                </Badge>
              </TableCell>
              <TableCell className="text-right text-red-600">
                ₹{(customer.penaltyAmount || 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                <Badge className={cn(urgency.bgColor, urgency.color, "font-medium")}>
                  {urgency.level.toUpperCase()}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const renderTable = () => {
    switch (activeList) {
      case 'pending':
        return renderPendingCustomersTable();
      case 'paid':
        return renderPaidCustomersTable();
      case 'overdue':
        return renderOverdueCustomersTable();
      default:
        return null;
    }
  };

  const getListTitle = () => {
    switch (activeList) {
      case 'pending':
        return `Pending Customers (${filteredCustomers.length})`;
      case 'paid':
        return `Paid Customers (${filteredCustomers.length})`;
      case 'overdue':
        return `Overdue Customers (${filteredCustomers.length})`;
      default:
        return 'Select a list type';
    }
  };

  const getListDescription = () => {
    switch (activeList) {
      case 'pending':
        return 'Customers who haven\'t fully completed their payments';
      case 'paid':
        return 'Customers who have fully completed their payments';
      case 'overdue':
        return 'Customers who are past their deadline and haven\'t fully paid';
      default:
        return 'Choose from pending, paid, or overdue customers';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-finance-blue" />
          Advanced Customer Lists
        </CardTitle>
        <CardDescription>
          View categorized customer lists {currentArea ? `for ${currentArea.name}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List Type Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setActiveList('pending')}
            variant={activeList === 'pending' ? 'default' : 'outline'}
            className={cn(
              "flex items-center gap-2",
              activeList === 'pending' && "bg-finance-blue hover:bg-finance-blue/90"
            )}
          >
            <Clock className="h-4 w-4" />
            Pending Customers ({getPendingCustomers().length})
          </Button>
          <Button
            onClick={() => setActiveList('paid')}
            variant={activeList === 'paid' ? 'default' : 'outline'}
            className={cn(
              "flex items-center gap-2",
              activeList === 'paid' && "bg-green-600 hover:bg-green-700"
            )}
          >
            <CheckCircle className="h-4 w-4" />
            Paid Customers ({getPaidCustomers().length})
          </Button>
          <Button
            onClick={() => setActiveList('overdue')}
            variant={activeList === 'overdue' ? 'default' : 'outline'}
            className={cn(
              "flex items-center gap-2",
              activeList === 'overdue' && "bg-red-600 hover:bg-red-700"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            Overdue Customers ({getOverdueCustomers().length})
          </Button>
        </div>

        {activeList && (
          <>
            {/* Search and Export Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export/Print
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('print')}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* List Display */}
            <div className="rounded-lg border">
              <div className="p-4 border-b border-border/50 bg-muted/30">
                <h3 className="font-semibold text-lg">{getListTitle()}</h3>
                <p className="text-sm text-muted-foreground">{getListDescription()}</p>
              </div>
              
              <div className="overflow-x-auto">
                {filteredCustomers.length > 0 ? (
                  renderTable()
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No customers found</p>
                    <p className="text-sm">
                      {searchTerm ? 
                        'Try adjusting your search criteria' : 
                        `No ${activeList} customers in this area`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!activeList && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Select a Customer List</h3>
            <p className="text-sm">
              Choose from pending, paid, or overdue customers to view detailed information
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedCustomerLists;
