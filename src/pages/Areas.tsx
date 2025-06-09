
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { Map, Plus, Users, Trash2, ArrowRight } from 'lucide-react';
import AddAreaForm from '@/components/forms/AddAreaForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Areas = () => {
  const { areas, deleteArea, setCurrentArea, getAreaCustomers, getAreaPayments } = useFinance();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleDeleteArea = (id: string) => {
    deleteArea(id);
  };

  const handleSelectArea = (areaId: string) => {
    setCurrentArea(areaId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Areas</h1>
          <p className="text-muted-foreground">
            Manage your collection areas and lines
          </p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Area
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Area</DialogTitle>
            </DialogHeader>
            <AddAreaForm onClose={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const areaCustomers = getAreaCustomers(area.id);
          const areaPayments = getAreaPayments(area.id);
          const totalCustomers = areaCustomers.length;
          const activeCustomers = areaCustomers.filter(c => !c.isFullyPaid).length;
          const totalCollected = areaPayments.reduce((sum, payment) => sum + payment.amount, 0);

          return (
            <Card key={area.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      {area.name}
                    </CardTitle>
                    {area.description && (
                      <CardDescription>
                        {area.description}
                      </CardDescription>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Area</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{area.name}"? Customers and payments will be unassigned but not deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteArea(area.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Customers:</span>
                    <span className="font-medium">{totalCustomers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Customers:</span>
                    <span className="font-medium text-orange-600">{activeCustomers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Collected:</span>
                    <span className="font-medium text-green-600">₹{totalCollected.toLocaleString()}</span>
                  </div>
                  <div className="pt-2">
                    <Button 
                      onClick={() => handleSelectArea(area.id)} 
                      className="w-full gap-2"
                    >
                      Enter Area
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {areas.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Map className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No areas yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first collection area to start managing customers and payments.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Area
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Areas;
