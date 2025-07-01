import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance, Customer, Area } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from 'sonner';
import { Calendar, MapPin, Users, ArrowRight, Plus, Trash2, Edit } from 'lucide-react';

const Customers = () => {
  const { 
    customers, 
    addCustomer, 
    deleteCustomer, 
    areas, 
    currentAreaId,
    getAreaCustomers
  } = useFinance();
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    address: '',
    issuedDate: new Date().toISOString().split('T')[0],
    totalAmountGiven: 0,
    interestAmount: 0,
    numberOfDays: 30,
    numberOfWeeks: 4,
    numberOfMonths: 1,
    paymentCategory: 'daily' as 'daily' | 'weekly' | 'monthly',
  });
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentCategoryChange = (value: 'daily' | 'weekly' | 'monthly') => {
    setNewCustomer(prev => ({
      ...prev,
      paymentCategory: value,
    }));
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.address || !newCustomer.issuedDate || 
        !newCustomer.totalAmountGiven || !newCustomer.interestAmount || !newCustomer.numberOfDays) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const totalAmountToBePaid = newCustomer.totalAmountGiven + newCustomer.interestAmount;
      const serialNumber = `CID${Date.now().toString().slice(-8)}`;
      const endDate = new Date(newCustomer.issuedDate);
      endDate.setDate(endDate.getDate() + newCustomer.numberOfDays);
      
      const customerToAdd: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
        serialNumber,
        name: newCustomer.name,
        area: currentAreaId || 'default',
        mobile: '',
        loanAmount: newCustomer.totalAmountGiven,
        installmentAmount: totalAmountToBePaid / newCustomer.numberOfDays,
        collectionType: newCustomer.paymentCategory,
        startDate: newCustomer.issuedDate,
        endDate: endDate.toISOString().split('T')[0],
        address: newCustomer.address,
        guarantor: '',
        guarantorMobile: '',
        totalInstallments: newCustomer.numberOfDays,
        paidInstallments: 0,
        balanceAmount: totalAmountToBePaid,
        status: 'active' as const,
        totalAmountGiven: newCustomer.totalAmountGiven,
        totalAmountToBePaid,
        totalPaid: 0,
        interestAmount: newCustomer.interestAmount,
        interestPercentage: (newCustomer.interestAmount / newCustomer.totalAmountGiven) * 100,
        penaltyAmount: 0,
        dailyAmount: totalAmountToBePaid / newCustomer.numberOfDays,
        paymentCategory: newCustomer.paymentCategory,
        issuedDate: newCustomer.issuedDate,
        deadlineDate: endDate.toISOString().split('T')[0],
        isFullyPaid: false,
        areaId: currentAreaId || 'default',
        numberOfDays: newCustomer.numberOfDays,
        numberOfWeeks: newCustomer.numberOfWeeks,
        numberOfMonths: newCustomer.numberOfMonths
      };

      await addCustomer(customerToAdd);
      
      toast.success(`Customer "${newCustomer.name}" added successfully`);
      setIsDialogOpen(false);
      setNewCustomer({
        name: '',
        address: '',
        issuedDate: new Date().toISOString().split('T')[0],
        totalAmountGiven: 0,
        interestAmount: 0,
        numberOfDays: 30,
        numberOfWeeks: 4,
        numberOfMonths: 1,
        paymentCategory: 'daily' as 'daily' | 'weekly' | 'monthly',
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const confirmDeleteCustomer = (id: string) => {
    setCustomerToDelete(id);
    setIsDeleteConfirmationOpen(true);
  };

  const handleCloseDeleteConfirmation = () => {
    setIsDeleteConfirmationOpen(false);
    setCustomerToDelete(null);
  };

  const handleDeleteCustomer = async () => {
    if (customerToDelete) {
      await deleteCustomer(customerToDelete);
      toast.success('Customer deleted successfully');
      handleCloseDeleteConfirmation();
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title="Customer Management" 
        subtitle="Add, view, and manage your finance customers"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-finance-blue hover:bg-finance-blue/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Create a new customer profile to track loans and payments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input 
                    id="customerName" 
                    name="name"
                    placeholder="Enter customer name" 
                    value={newCustomer.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    name="address"
                    placeholder="Enter address" 
                    value={newCustomer.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issuedDate">Issued Date</Label>
                  <Input
                    type="date"
                    id="issuedDate"
                    name="issuedDate"
                    value={newCustomer.issuedDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalAmountGiven">Total Amount Given</Label>
                  <Input
                    type="number"
                    id="totalAmountGiven"
                    name="totalAmountGiven"
                    placeholder="Enter amount given"
                    value={newCustomer.totalAmountGiven}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestAmount">Interest Amount</Label>
                  <Input
                    type="number"
                    id="interestAmount"
                    name="interestAmount"
                    placeholder="Enter interest amount"
                    value={newCustomer.interestAmount}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfDays">Number of Days</Label>
                  <Input
                    type="number"
                    id="numberOfDays"
                    name="numberOfDays"
                    placeholder="Enter number of days"
                    value={newCustomer.numberOfDays}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfWeeks">Number of Weeks</Label>
                  <Input
                    type="number"
                    id="numberOfWeeks"
                    name="numberOfWeeks"
                    placeholder="Enter number of weeks"
                    value={newCustomer.numberOfWeeks}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfMonths">Number of Months</Label>
                  <Input
                    type="number"
                    id="numberOfMonths"
                    name="numberOfMonths"
                    placeholder="Enter number of months"
                    value={newCustomer.numberOfMonths}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentCategory">Payment Category</Label>
                <Select onValueChange={handlePaymentCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddCustomer}
                className="bg-finance-blue hover:bg-finance-blue/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTitle>

      {customers.length === 0 ? (
        <Card className="shadow-card border-none text-center">
          <CardHeader>
            <CardTitle>No Customers</CardTitle>
            <CardDescription>
              Add your first customer to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-finance-blue hover:bg-finance-blue/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-none">
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              Overview of all your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Interest Amount</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell>{formatDate(customer.issuedDate)}</TableCell>
                      <TableCell>₹{customer.totalAmountGiven.toLocaleString()}</TableCell>
                      <TableCell>₹{customer.interestAmount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/customer/${customer.id}`)}
                            className="h-8 w-8"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
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
                                <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {customer.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => confirmDeleteCustomer(customer.id)} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <AlertDialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteConfirmation}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
