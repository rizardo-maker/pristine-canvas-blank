import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance, Customer } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import CustomerStatsCards from '@/components/customers/CustomerStatsCards';
import InterestTracker from '@/components/customers/InterestTracker';
import AdvancedCustomerLists from '@/components/customers/AdvancedCustomerLists';
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
import { Calendar, Plus, Search, Trash2, Download, FileText, Printer, AlertTriangle, FileScan } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportCustomersToPDF, exportCustomersToExcel, printCustomerReport } from '@/utils/customerExport';
import { processImageWithOCR } from '@/utils/ocrService';
import { useVoiceAction } from '@/hooks/useVoiceAction';

const Customers = () => {
  const { getCurrentAreaCustomers, addCustomer, deleteCustomer, currentAreaId, getAreaById, calculateAllPenalties } = useFinance();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice command to open the "Add Customer" dialog
  useVoiceAction(['add customer', 'new customer'], (_transcript) => {
    if (!isAddDialogOpen) {
      setIsAddDialogOpen(true);
      toast.info('Opening form to add a new customer.');
    }
  });

  // Refs for keyboard navigation
  const serialNumberRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const issuedDateRef = useRef<HTMLInputElement>(null);
  const totalAmountGivenRef = useRef<HTMLInputElement>(null);
  const interestAmountRef = useRef<HTMLInputElement>(null);
  const numberOfDaysRef = useRef<HTMLInputElement>(null);
  const numberOfWeeksRef = useRef<HTMLInputElement>(null);
  const numberOfMonthsRef = useRef<HTMLInputElement>(null);
  
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

  // Keyboard navigation handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  const handleFinalFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomer(e as any);
    }
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

  // OCR Handlers
  const handleOcrImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrRunning(true);
    setOcrProgress(0);
    toast.info('Scanning image for customer details...');

    // The PSM parameter is no longer needed as the service tries multiple modes internally.
    const text = await processImageWithOCR(file, setOcrProgress);

    setIsOcrRunning(false);

    if (text) {
      parseCustomerText(text);
    }
    
    // Reset file input to allow re-selection of the same file
    if (ocrFileInputRef.current) {
      ocrFileInputRef.current.value = '';
    }
  };

  const parseCustomerText = (text: string) => {
    console.log("Raw OCR for customer:", text);

    if (!text.trim()) {
      toast.error('No text detected in the image.');
      return;
    }

    const newFormData = { ...formData };
    let fieldsFound = 0;

    // Helper to find a value near a label in the text
    const findValueNearLabel = (label: string, text: string, pattern: RegExp): string | null => {
      try {
        // Allow newlines between words in the label
        const labelRegex = new RegExp(label.replace(/\s+/g, '[\\s\\S]+'), 'i');
        const match = text.match(labelRegex);
        if (!match || typeof match.index === 'undefined') return null;
        
        // Search in a window of characters after the label
        const searchWindow = text.substring(match.index + match[0].length, match.index + match[0].length + 100);
        const valueMatch = searchWindow.match(pattern);

        return valueMatch ? valueMatch[0].trim() : null;
      } catch (e) {
        console.error("Error finding value for label:", label, e);
        return null;
      }
    };
    
    const cleanNumeric = (str: string | null) => str ? str.replace(/[^0-9.]/g, '') : null;
    const cleanName = (str: string | null) => str ? str.replace(/[^a-zA-Z\s]/g, '').trim() : null;

    // Regex patterns for different fields
    const serialPattern = /\d+/;
    const namePattern = /[a-zA-Z]+(?:\s[a-zA-Z]+)*/;
    const addressPattern = /([a-zA-Z0-9\s,.-]+)/;
    const datePattern = /\d{4}-\d{2}-\d{2}/;
    const daysPattern = /(\d+)\s*days/;
    const amountPattern = /[₹$]?\s*[\d,]+\.?\d*/;

    let serialNumber = findValueNearLabel('Serial Number', text, serialPattern);
    let name = findValueNearLabel('Customer Name', text, namePattern);
    let address = findValueNearLabel('Address', text, addressPattern);
    let issuedDate = findValueNearLabel('Issued Date', text, datePattern);
    let term = findValueNearLabel('Term', text, daysPattern);
    let principal = findValueNearLabel('Principal', text, amountPattern);
    let interest = findValueNearLabel('Interest Amount', text, amountPattern);

    if (serialNumber) { newFormData.serialNumber = serialNumber; fieldsFound++; }
    if (name) { newFormData.name = cleanName(name) || ''; fieldsFound++; }
    if (address) { newFormData.address = address.split('\n')[0].trim(); fieldsFound++; }
    if (issuedDate) { newFormData.issuedDate = issuedDate; fieldsFound++; }
    if (principal) { 
        newFormData.totalAmountGiven = parseFloat(cleanNumeric(principal) || '0');
        fieldsFound++;
    }
    if (interest) {
        newFormData.interestAmount = parseFloat(cleanNumeric(interest) || '0');
        fieldsFound++;
    }
    if (term) {
        const daysMatch = term.match(/(\d+)/);
        if (daysMatch) {
            newFormData.numberOfDays = parseInt(daysMatch[1], 10);
            newFormData.paymentCategory = 'daily';
            fieldsFound++;
        }
    }
    
    if (fieldsFound > 0) {
      setFormData(newFormData);
      toast.success(`${fieldsFound} field(s) populated from the image. Please verify.`, {
        description: "Review the extracted details before saving.",
        duration: 5000,
      });
    } else {
      toast.warning('Could not find customer details. Check the image quality and format.');
    }
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
  
  // Filter and sort customers based on search term and serial number
  const filteredCustomers = customers
    .filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.serialNumber.includes(searchTerm)
    )
    .sort((a, b) => {
      // Sort by serial number in ascending order (1, 2, 3, 4, ...)
      const serialA = parseInt(a.serialNumber) || 0;
      const serialB = parseInt(b.serialNumber) || 0;
      return serialA - serialB;
    });

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
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                      Enter the details or scan from an image.
                    </DialogDescription>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={ocrFileInputRef}
                      onChange={handleOcrImport}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => ocrFileInputRef.current?.click()}
                      disabled={isOcrRunning}
                      className="w-full"
                    >
                      {isOcrRunning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Scanning... ({ocrProgress}%)
                        </>
                      ) : (
                        <>
                          <FileScan className="mr-2 h-4 w-4" />
                          Scan from Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleAddCustomer} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="serialNumber" className="text-sm font-medium">
                      Serial Number
                    </label>
                    <Input
                      ref={serialNumberRef}
                      id="serialNumber"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, nameRef)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Customer Name
                    </label>
                    <Input
                      ref={nameRef}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, addressRef)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">
                    Address
                  </label>
                  <Input
                    ref={addressRef}
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, issuedDateRef)}
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
                        ref={issuedDateRef}
                        id="issuedDate"
                        name="issuedDate"
                        type="date"
                        value={formData.issuedDate}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e, totalAmountGivenRef)}
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
                      ref={totalAmountGivenRef}
                      id="totalAmountGiven"
                      name="totalAmountGiven"
                      type="number"
                      min="1"
                      step="any"
                      value={formData.totalAmountGiven || ''}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyDown(e, interestAmountRef)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="interestAmount" className="text-sm font-medium">
                      Interest Amount (₹) - Optional
                    </label>
                    <Input
                      ref={interestAmountRef}
                      id="interestAmount"
                      name="interestAmount"
                      type="number"
                      min="0"
                      step="any"
                      value={formData.interestAmount}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (formData.paymentCategory === 'daily') {
                          handleKeyDown(e, numberOfDaysRef);
                        } else if (formData.paymentCategory === 'weekly') {
                          handleKeyDown(e, numberOfWeeksRef);
                        } else {
                          handleKeyDown(e, numberOfMonthsRef);
                        }
                      }}
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
                        ref={numberOfDaysRef}
                        id="numberOfDays"
                        name="numberOfDays"
                        type="number"
                        min="1"
                        value={formData.numberOfDays || ''}
                        onChange={handleInputChange}
                        onKeyDown={handleFinalFieldKeyDown}
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
                        ref={numberOfWeeksRef}
                        id="numberOfWeeks"
                        name="numberOfWeeks"
                        type="number"
                        min="1"
                        value={formData.numberOfWeeks || ''}
                        onChange={handleInputChange}
                        onKeyDown={handleFinalFieldKeyDown}
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
                        ref={numberOfMonthsRef}
                        id="numberOfMonths"
                        name="numberOfMonths"
                        type="number"
                        min="1"
                        value={formData.numberOfMonths || ''}
                        onChange={handleInputChange}
                        onKeyDown={handleFinalFieldKeyDown}
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
      
      <CustomerStatsCards customers={customers} />
      
      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
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
                        customer.isFullyPaid && "bg-finance-green-light hover:brightness-95",
                        overdue && !customer.isFullyPaid && "bg-finance-red-light hover:brightness-95"
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
                          customer.paymentCategory === 'daily' && "bg-finance-blue-light text-finance-blue",
                          customer.paymentCategory === 'weekly' && "bg-finance-green-light text-finance-green",
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
                              ? "bg-finance-red-light text-finance-red"
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
      
      {/* Interest Tracker component */}
      <InterestTracker />
      
      {/* Advanced Customer Lists component */}
      <AdvancedCustomerLists />
      
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
