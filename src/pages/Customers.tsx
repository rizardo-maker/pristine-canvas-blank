
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import AddCustomerForm from '@/components/forms/AddCustomerForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

const Customers = () => {
  const { customers, getCurrentAreaCustomers, deleteCustomer, currentAreaId } = useFinance();
  const [showAddForm, setShowAddForm] = useState(false);
  
  const currentAreaCustomers = getCurrentAreaCustomers();

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
  };

  if (!currentAreaId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Area Selected</h3>
          <p className="text-muted-foreground">
            Please select an area from the Line section to manage customers.
          </p>
          <Button asChild className="mt-4">
            <Link to="/areas">Go to Areas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer base and track payments
          </p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <AddCustomerForm onClose={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentAreaCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {customer.name}
                  </CardTitle>
                  <CardDescription>
                    Serial: {customer.serialNumber}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/customers/${customer.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {customer.name}? This action cannot be undone and will also delete all associated payments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Amount Given:</span>
                  <span>₹{customer.totalAmountGiven.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Due:</span>
                  <span>₹{customer.totalAmountToBePaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Paid:</span>
                  <span>₹{customer.totalPaid.toLocaleString()}</span>
                </div>
                {customer.penaltyAmount && customer.penaltyAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Penalty:</span>
                    <span>₹{customer.penaltyAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium">
                  <span>Status:</span>
                  <span className={customer.isFullyPaid ? "text-green-600" : "text-orange-600"}>
                    {customer.isFullyPaid ? "Completed" : "Active"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Category:</span>
                  <span className="capitalize">{customer.paymentCategory}</span>
                </div>
                {customer.installmentAmount && (
                  <div className="flex justify-between text-sm">
                    <span>Installment:</span>
                    <span>₹{customer.installmentAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {currentAreaCustomers.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start by adding your first customer to begin managing collections.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Customers;
