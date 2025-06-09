
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { Users, DollarSign, TrendingUp, AlertTriangle, Calendar, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { 
    getCurrentAreaCustomers, 
    getCurrentAreaPayments, 
    currentAreaId, 
    getAreaById,
    calculateTotalEarnings,
    areas 
  } = useFinance();
  
  const customers = getCurrentAreaCustomers();
  const payments = getCurrentAreaPayments();
  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;
  
  // Calculate statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => !c.isFullyPaid).length;
  const completedCustomers = customers.filter(c => c.isFullyPaid).length;
  const overdueCustomers = customers.filter(c => {
    if (!c.deadlineDate || c.isFullyPaid) return false;
    return new Date() > new Date(c.deadlineDate);
  }).length;
  
  const totalAmountGiven = customers.reduce((sum, c) => sum + c.totalAmountGiven, 0);
  const totalAmountDue = customers.reduce((sum, c) => sum + c.totalAmountToBePaid + (c.penaltyAmount || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalEarnings = calculateTotalEarnings(customers, payments);
  const pendingAmount = totalAmountDue - totalCollected;
  
  // Today's collections
  const today = new Date().toISOString().split('T')[0];
  const todaysCollections = payments.filter(p => p.date === today);
  const todaysTotal = todaysCollections.reduce((sum, p) => sum + p.amount, 0);
  
  // This week's collections
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekCollections = payments.filter(p => {
    const paymentDate = new Date(p.date);
    return paymentDate >= startOfWeek;
  });
  const weekTotal = weekCollections.reduce((sum, p) => sum + p.amount, 0);

  if (!currentAreaId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your finance management system
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Map className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Area Selected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Please select an area to view your dashboard statistics and manage your business.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/areas">
                  {areas.length > 0 ? 'Select Area' : 'Create Area'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {currentArea ? `${currentArea.name} Overview` : 'Business Overview'}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} active, {completedCustomers} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Out of ₹{totalAmountDue.toLocaleString()} due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Interest and profit earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{Math.max(0, pendingAmount).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overdueCustomers} customers overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Collections
            </CardTitle>
            <CardDescription>
              Payments received today ({today})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">₹{todaysTotal.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">{todaysCollections.length} payments</span>
              </div>
              {todaysCollections.length > 0 ? (
                <div className="space-y-1">
                  {todaysCollections.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex justify-between text-sm">
                      <span>{payment.customerName}</span>
                      <span>₹{payment.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {todaysCollections.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      and {todaysCollections.length - 3} more...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No collections today</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Week's Summary</CardTitle>
            <CardDescription>
              Collections from {startOfWeek.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">₹{weekTotal.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">{weekCollections.length} payments</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Daily</p>
                  <p className="font-medium">
                    {weekCollections.filter(p => p.collectionType === 'daily').length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Weekly</p>
                  <p className="font-medium">
                    {weekCollections.filter(p => p.collectionType === 'weekly').length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly</p>
                  <p className="font-medium">
                    {weekCollections.filter(p => p.collectionType === 'monthly').length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button asChild variant="outline">
              <Link to="/customers">Manage Customers</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/collections/daily">Daily Collections</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/reports">View Reports</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Customers Alert */}
      {overdueCustomers > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Overdue Customers
            </CardTitle>
            <CardDescription>
              {overdueCustomers} customers have missed their payment deadline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customers
                .filter(c => {
                  if (!c.deadlineDate || c.isFullyPaid) return false;
                  return new Date() > new Date(c.deadlineDate);
                })
                .slice(0, 5)
                .map((customer) => (
                  <div key={customer.id} className="flex justify-between items-center text-sm">
                    <span>{customer.name} ({customer.serialNumber})</span>
                    <span className="text-orange-700">
                      ₹{(customer.totalAmountToBePaid + (customer.penaltyAmount || 0) - customer.totalPaid).toLocaleString()} due
                    </span>
                  </div>
                ))}
              {overdueCustomers > 5 && (
                <p className="text-xs text-orange-600">
                  and {overdueCustomers - 5} more overdue customers...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
