import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance, Customer } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Plus, Search, Trash2, Download, FileText, Printer, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportCustomersToPDF, exportCustomersToExcel, printCustomerReport } from '@/utils/customerExport';

const Customers = () => {
  const { getCurrentAreaCustomers, addCustomer, deleteCustomer, currentAreaId, getAreaById, calculateAllPenalties } = useFinance();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  
  // Get only customers for current area
  const customers = getCurrentAreaCustomers();
  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  
  // Form state for new customer
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    address: '',
    issuedDate: new Date().toISOString().split('T')[0],
    totalAmountGiven: 0,
    interestAmount: 0,
    numberOfDays: 0,
    paymentCategory: 'daily' as 'daily' | 'weekly' | 'monthly',
    numberOfWeeks: 0,
    numberOfMonths: 0,
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'totalAmountGiven' || name === 'interestAmount' || name === 'numberOfDays' || name === 'numberOfWeeks' || name === 'numberOfMonths'
        ? parseFloat(value) || 0 
        : value,
    });
  };

  const handlePaymentCategoryChange = (value: 'daily' | 'weekly' | 'monthly') => {
    setFormData({
      ...formData,
      paymentCategory: value,
    });
  };
  
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form based on payment category
    let isValid = true;
    let errorMessage = '';
    
    if (!formData.serialNumber || !formData.name || !formData.address || 
        formData.totalAmountGiven <= 0) {
      isValid = false;
      errorMessage = 'Please fill in all required fields correctly';
    }
    
    // Validate based on payment category
    if (formData.paymentCategory === 'daily' && formData.numberOfDays <= 0) {
      isValid = false;
      errorMessage = 'Please enter a valid number of days';
    }
    
    if (formData.paymentCategory === 'weekly' && formData.numberOfWeeks <= 0) {
      isValid = false;
      errorMessage = 'Please enter a valid number of weeks';
    }
    
    if (formData.paymentCategory === 'monthly' && formData.numberOfMonths <= 0) {
      isValid = false;
      errorMessage = 'Please enter a valid number of months';
    }
    
    if (!isValid) {
      toast.error(errorMessage);
      return;
    }
    
    // Check for duplicate serial number
    const existingCustomer = customers.find(c => c.serialNumber === formData.serialNumber);
    if (existingCustomer) {
      toast.error('A customer with this serial number already exists');
      return;
    }
    
    // Set numberOfDays based on payment category if not set
    let finalFormData = { ...formData };
    if (formData.paymentCategory === 'weekly' && formData.numberOfDays === 0) {
      finalFormData.numberOfDays = formData.numberOfWeeks * 7;
    } else if (formData.paymentCategory === 'monthly' && formData.numberOfDays === 0) {
      finalFormData.numberOfDays = formData.numberOfMonths * 30;
    }
    
    addCustomer(finalFormData);
    toast.success('Customer added successfully');
    
    // Reset form
    setFormData({
      serialNumber: '',
      name: '',
      address: '',
      issuedDate: new Date().toISOString().split('T')[0],
      totalAmountGiven: 0,
      interestAmount: 0,
      numberOfDays: 0,
      paymentCategory: 'daily',
      numberOfWeeks: 0,
      numberOfMonths: 0,
    });
    
    setIsAddDialogOpen(false);
  };
  
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      await deleteCustomer(customerToDelete);
      setCustomerToDelete(null);
    } catch (error) {
      toast.error('Failed to delete customer. Please try again.');
      console.error('Error deleting customer:', error);
    }
  };

  const handleCalculatePenalties = () => {
    calculateAllPenalties();
    toast.success('Penalties calculated for all overdue customers');
  };

  // Export handlers
  const handleExportPDF = () => {
    try {
      exportCustomersToPDF(filteredCustomers, currentArea?.name);
      toast.success('Customer report exported as PDF successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  const handleExportExcel = () => {
    try {
      exportCustomersToExcel(filteredCustomers, currentArea?.name);
      toast.success('Customer report exported as Excel successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel. Please try again.');
    }
  };

  const handlePrint = () => {
    try {
      printCustomerReport(filteredCustomers, currentArea?.name);
      toast.success('Print dialog opened');
    } catch (error) {
      console.error('Error printing:', error);
      toast.error('Failed to open print dialog. Please try again.');
    }
  };
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.serialNumber.includes(searchTerm)
  );

  // Check if customer is overdue
  const isOverdue = (customer: Customer) => {
    if (!customer.deadlineDate) return false;
    const currentDate = new Date();
    const deadlineDate = new Date(customer.deadlineDate);
    return currentDate > deadlineDate && !customer.isFullyPaid;
  };

  // Calculate periods for display
  const calculatePeriods = () => {
    if (formData.paymentCategory === 'daily') {
      return formData.numberOfDays;
    } else if (formData.paymentCategory === 'weekly') {
      return formData.numberOfWeeks;
    } else {
      return formData.numberOfMonths;
    }
  };

  // Calculate total days for calculation
  const calculateTotalDays = () => {
    if (formData.paymentCategory === 'daily') {
      return formData.numberOfDays;
    } else if (formData.paymentCategory === 'weekly') {
      return formData.numberOfWeeks * 7;
    } else {
      return formData.numberOfMonths * 30;
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`Customers${currentArea ? ` - ${currentArea.name}` : ''}`}
        subtitle="Manage your customer information"
      >
        <div className="flex gap-2">
          <Button
            onClick={handleCalculatePenalties}
            variant="outline"
            className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <AlertTriangle className="h-4 w-4" />
            Calculate Penalties
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export/Print
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-finance-blue hover:bg-finance-blue/90">
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter the details for the new customer. Choose payment category and set appropriate time periods.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCustomer} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="serialNumber" className="text-sm font-medium">
                      Serial Number
                    </label>
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Customer Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">
                    Address
                  </label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="issuedDate" className="text-sm font-medium">
                      Issued Date
                    </label>
                    <div className="relative">
                      <Input
                        id="issuedDate"
                        name="issuedDate"
                        type="date"
                        value={formData.issuedDate}
                        onChange={handleInputChange}
                        required
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="paymentCategory" className="text-sm font-medium">
                      Payment Category
                    </label>
                    <Select value={formData.paymentCategory} onValueChange={handlePaymentCategoryChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="totalAmountGiven" className="text-sm font-medium">
                      Total Amount Given (₹)
                    </label>
                    <Input
                      id="totalAmountGiven"
                      name="totalAmountGiven"
                      type="number"
                      min="1"
                      step="any"
                      value={formData.totalAmountGiven || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="interestAmount" className="text-sm font-medium">
                      Interest Amount (₹) - Optional
                    </label>
                    <Input
                      id="interestAmount"
                      name="interestAmount"
                      type="number"
                      min="0"
                      step="any"
                      value={formData.interestAmount}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {formData.paymentCategory === 'daily' && (
                    <div className="space-y-2">
                      <label htmlFor="numberOfDays" className="text-sm font-medium">
                        Number of Days *
                      </label>
                      <Input
                        id="numberOfDays"
                        name="numberOfDays"
                        type="number"
                        min="1"
                        value={formData.numberOfDays || ''}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter number of days"
                      />
                    </div>
                  )}
                  
                  {formData.paymentCategory === 'weekly' && (
                    <div className="space-y-2">
                      <label htmlFor="numberOfWeeks" className="text-sm font-medium">
                        Number of Weeks *
                      </label>
                      <Input
                        id="numberOfWeeks"
                        name="numberOfWeeks"
                        type="number"
                        min="1"
                        value={formData.numberOfWeeks || ''}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter number of weeks"
                      />
                    </div>
                  )}
                  
                  {formData.paymentCategory === 'monthly' && (
                    <div className="space-y-2">
                      <label htmlFor="numberOfMonths" className="text-sm font-medium">
                        Number of Months *
                      </label>
                      <Input
                        id="numberOfMonths"
                        name="numberOfMonths"
                        type="number"
                        min="1"
                        value={formData.numberOfMonths || ''}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter number of months"
                      />
                    </div>
                  )}
                </div>
                
                {/* Show calculated values */}
                {formData.totalAmountGiven > 0 && calculatePeriods() > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Calculated Values:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total to be paid:</span>
                        <p className="font-semibold">₹{(formData.totalAmountGiven + formData.interestAmount).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Installment amount:</span>
                        <p className="font-semibold">
                          ₹{calculatePeriods() > 0 ? ((formData.totalAmountGiven + formData.interestAmount) / calculatePeriods()).toFixed(2) : 0}
                          {formData.paymentCategory === 'daily' ? '/day' : formData.paymentCategory === 'weekly' ? '/week' : '/month'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interest %:</span>
                        <p className="font-semibold">{formData.totalAmountGiven > 0 ? ((formData.interestAmount / formData.totalAmountGiven) * 100).toFixed(2) : 0}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total days:</span>
                        <p className="font-semibold">{calculateTotalDays()} days</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due date:</span>
                        <p className="font-semibold">
                          {formData.issuedDate && calculateTotalDays() > 0 ? 
                            (() => {
                              const date = new Date(formData.issuedDate);
                              date.setDate(date.getDate() + calculateTotalDays());
                              return date.toLocaleDateString('en-IN');
                            })() : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-finance-blue hover:bg-finance-blue/90">
                    Add Customer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageTitle>
      
      <div className="bg-white rounded-xl shadow-card border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or serial number..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>List of all customers {currentArea ? `in ${currentArea.name}` : ''}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Serial #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead className="text-right">Amount Given</TableHead>
                <TableHead className="text-right">Total To Be Paid</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Penalty</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  const totalWithPenalty = customer.totalAmountToBePaid + (customer.penaltyAmount || 0);
                  const remaining = totalWithPenalty - customer.totalPaid;
                  const overdue = isOverdue(customer);
                  
                  return (
                    <TableRow 
                      key={customer.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        customer.isFullyPaid && "bg-finance-green-light hover:bg-finance-green-light/80",
                        overdue && !customer.isFullyPaid && "bg-red-50 hover:bg-red-100"
                      )}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {customer.serialNumber}
                          {overdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                      </TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          customer.paymentCategory === 'daily' && "bg-blue-100 text-blue-800",
                          customer.paymentCategory === 'weekly' && "bg-green-100 text-green-800",
                          customer.paymentCategory === 'monthly' && "bg-purple-100 text-purple-800"
                        )}>
                          {customer.paymentCategory}
                        </span>
                      </TableCell>
                      <TableCell>{customer.issuedDate}</TableCell>
                      <TableCell className="text-right">₹{customer.totalAmountGiven.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{customer.totalAmountToBePaid.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{customer.totalPaid.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{remaining.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">
                        ₹{(customer.penaltyAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span 
                          className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            customer.isFullyPaid 
                              ? "bg-finance-green-light text-finance-green" 
                              : overdue
                              ? "bg-red-100 text-red-800"
                              : "bg-finance-blue-light text-finance-blue"
                          )}
                        >
                          {customer.isFullyPaid ? 'Paid' : overdue ? 'Overdue' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerToDelete(customer.id);
                          }}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">
                    {searchTerm ? 'No customers match your search' : 'No customers found. Add your first customer!'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer and all associated payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
