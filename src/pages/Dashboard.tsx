
import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, PiggyBank, TrendingUp, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { customers, payments, getCurrentAreaCustomers, getCurrentAreaPayments } = useFinance();
  
  const currentAreaCustomers = getCurrentAreaCustomers();
  const currentAreaPayments = getCurrentAreaPayments();
  
  const totalCustomers = currentAreaCustomers.length;
  const activeCustomers = currentAreaCustomers.filter(c => !c.isFullyPaid).length;
  const totalCollected = currentAreaPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const overdueCustomers = currentAreaCustomers.filter(c => {
    if (!c.deadlineDate || c.isFullyPaid) return false;
    return new Date(c.deadlineDate) < new Date();
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your finance management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {currentAreaPayments.length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Currently paying
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest payment collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentAreaPayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {payment.customerName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₹{payment.amount} - {payment.date}
                    </p>
                  </div>
                </div>
              ))}
              {currentAreaPayments.length === 0 && (
                <p className="text-sm text-muted-foreground">No payments yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium">
                  {totalCustomers > 0 
                    ? Math.round(((totalCustomers - activeCustomers) / totalCustomers) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Payment</span>
                <span className="text-sm font-medium">
                  ₹{currentAreaPayments.length > 0 
                    ? Math.round(totalCollected / currentAreaPayments.length)
                    : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Today's Collections</span>
                <span className="text-sm font-medium">
                  ₹{currentAreaPayments
                    .filter(p => p.date === new Date().toISOString().split('T')[0])
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
