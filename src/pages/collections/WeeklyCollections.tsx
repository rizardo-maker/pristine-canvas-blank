
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/context/FinanceContext';
import { Calendar, Plus, Trash2, DollarSign } from 'lucide-react';
import PaymentForm from '@/components/forms/PaymentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const WeeklyCollections = () => {
  const { getCurrentAreaPayments, deletePayment, currentAreaId } = useFinance();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  const allPayments = getCurrentAreaPayments();
  const weeklyPayments = allPayments.filter(payment => 
    payment.collectionType === 'weekly'
  );
  
  // Get payments for the selected week
  const selectedWeekPayments = weeklyPayments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const selectedDateObj = new Date(selectedDate);
    const startOfWeek = new Date(selectedDateObj);
    startOfWeek.setDate(selectedDateObj.getDate() - selectedDateObj.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return paymentDate >= startOfWeek && paymentDate <= endOfWeek;
  });
  
  const totalCollection = selectedWeekPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const getWeekRange = (date: string) => {
    const selectedDateObj = new Date(date);
    const startOfWeek = new Date(selectedDateObj);
    startOfWeek.setDate(selectedDateObj.getDate() - selectedDateObj.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    };
  };

  const weekRange = getWeekRange(selectedDate);

  if (!currentAreaId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Area Selected</h3>
          <p className="text-muted-foreground">
            Please select an area to view weekly collections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Collections</h1>
          <p className="text-muted-foreground">
            Manage weekly payment collections
          </p>
        </div>
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Weekly Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm collectionType="weekly" onClose={() => setShowPaymentForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Week Filter</CardTitle>
            <CardDescription>
              Select any date to view that week's collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="date">Select Date in Week</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Week: {weekRange.start} to {weekRange.end}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Weekly Summary
            </CardTitle>
            <CardDescription>
              {weekRange.start} to {weekRange.end}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Collections:</span>
                <span className="font-semibold">₹{totalCollection.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Number of Payments:</span>
                <span className="font-semibold">{selectedWeekPayments.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            All weekly payments from {weekRange.start} to {weekRange.end}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedWeekPayments.length > 0 ? (
            <div className="space-y-4">
              {selectedWeekPayments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{payment.customerName}</p>
                    <p className="text-sm text-muted-foreground">Serial: {payment.serialNumber}</p>
                    <p className="text-sm text-muted-foreground">Date: {payment.date}</p>
                    {payment.agentName && (
                      <p className="text-sm text-muted-foreground">Agent: {payment.agentName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{payment.amount.toLocaleString()}</p>
                    <div className="flex gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this payment of ₹{payment.amount} from {payment.customerName}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePayment(payment.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments recorded</h3>
              <p className="text-muted-foreground mb-4">
                No weekly payments have been recorded for this week
              </p>
              <Button onClick={() => setShowPaymentForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyCollections;
