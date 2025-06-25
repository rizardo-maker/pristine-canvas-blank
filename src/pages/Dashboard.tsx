import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import StatCard from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PiggyBank,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  Map,
  Building,
  DollarSign,
  Mic,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSharedVoiceNavigation } from '@/context/VoiceNavigationContext';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const Dashboard = () => {
  const { customers, payments, areas, currentAreaId, calculateTotalEarnings } = useFinance();
  const navigate = useNavigate();
  const [todayCollections, setTodayCollections] = useState(0);
  const [weekCollections, setWeekCollections] = useState(0);
  const [monthCollections, setMonthCollections] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const { isListening, toggleListening, setHelpOpen } = useSharedVoiceNavigation();
  
  useEffect(() => {
    // Filter by current area if selected
    const areaFilter = (item: { areaId?: string }) => 
      currentAreaId ? item.areaId === currentAreaId : true;
    
    const filteredPayments = payments.filter(areaFilter);
    const filteredCustomers = customers.filter(areaFilter);
    
    // Calculate total earnings using the new method that includes overpayments
    const earnings = calculateTotalEarnings(filteredCustomers, filteredPayments);
    setTotalEarnings(earnings);
    
    // Calculate today's collections
    const today = new Date().toISOString().split('T')[0];
    const todayPayments = filteredPayments.filter(payment => 
      payment.date === today
    );
    const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
    setTodayCollections(todayTotal);
    
    // Calculate this week's collections
    const currentDate = new Date();
    const firstDayOfWeek = new Date(
      currentDate.setDate(currentDate.getDate() - currentDate.getDay())
    ).toISOString().split('T')[0];
    
    const lastDayOfWeek = new Date(
      currentDate.setDate(currentDate.getDate() + 6)
    ).toISOString().split('T')[0];
    
    const weekPayments = filteredPayments.filter(payment => {
      const paymentDate = payment.date;
      return paymentDate >= firstDayOfWeek && paymentDate <= lastDayOfWeek;
    });
    
    const weekTotal = weekPayments.reduce((sum, payment) => sum + payment.amount, 0);
    setWeekCollections(weekTotal);
    
    // Calculate this month's collections
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthPayments = filteredPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });
    
    const monthTotal = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    setMonthCollections(monthTotal);
  }, [payments, currentAreaId, customers, calculateTotalEarnings]);
  
  // Calculate total outstanding amount (only for customers who haven't fully paid)
  const totalOutstanding = customers
    .filter(customer => currentAreaId ? customer.areaId === currentAreaId : true)
    .reduce((sum, customer) => {
      if (customer.isFullyPaid) return sum;
      return sum + (customer.totalAmountToBePaid - customer.totalPaid);
    }, 0);
  
  // Get recent payments
  const recentPayments = [...payments]
    .filter(payment => currentAreaId ? payment.areaId === currentAreaId : true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  // Get customers with pending payments
  const pendingCustomers = customers
    .filter(customer => !customer.isFullyPaid && (currentAreaId ? customer.areaId === currentAreaId : true))
    .slice(0, 5);
  
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <PageTitle 
          title="Dashboard" 
          subtitle={currentAreaId ? "Area Overview" : "Overview of your finance operations"}
        />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            onClick={() => setHelpOpen(true)}
            variant="outline"
            size="icon"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
          <Button
            onClick={toggleListening}
            variant="outline"
            size="icon"
            className={cn(isListening && "text-destructive border-destructive")}
          >
            <Mic className={cn("h-5 w-5", isListening && "animate-pulse")} />
            <span className="sr-only">Toggle Voice Navigation</span>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Earnings"
          value={`₹${totalEarnings.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-finance-green" />}
          className="border-l-4 border-finance-green"
        />
        <StatCard
          title="Today's Collections"
          value={`₹${todayCollections.toLocaleString()}`}
          icon={<Calendar className="h-6 w-6 text-finance-blue" />}
          className="border-l-4 border-finance-blue"
        />
        <StatCard
          title="This Week"
          value={`₹${weekCollections.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6 text-finance-green" />}
          className="border-l-4 border-finance-green"
        />
        <StatCard
          title="This Month"
          value={`₹${monthCollections.toLocaleString()}`}
          icon={<PiggyBank className="h-6 w-6 text-finance-blue" />}
          className="border-l-4 border-primary"
        />
        <StatCard
          title="Total Outstanding"
          value={`₹${totalOutstanding.toLocaleString()}`}
          icon={<Users className="h-6 w-6 text-finance-red" />}
          className="border-l-4 border-finance-red"
        />
      </div>

      {!currentAreaId && areas.length > 0 && (
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex justify-between items-center">
              <span>Finance Areas</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-finance-blue flex items-center gap-1 text-xs"
                onClick={() => navigate('/areas')}
              >
                Manage Areas <ArrowRight className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {areas.slice(0, 3).map(area => {
                const areaCustomers = customers.filter(c => c.areaId === area.id);
                const areaPayments = payments.filter(p => p.areaId === area.id);
                const areaTotal = areaPayments.reduce((sum, p) => sum + p.amount, 0);
                
                return (
                  <div 
                    key={area.id}
                    className="p-4 border rounded-lg hover:bg-finance-gray cursor-pointer transition-colors"
                    onClick={() => {
                      navigate('/areas');
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-finance-blue-light flex items-center justify-center">
                        <Building className="h-4 w-4 text-finance-blue" />
                      </div>
                      <h3 className="font-medium">{area.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <p className="text-xs text-finance-text-secondary">Customers</p>
                        <p className="font-medium">{areaCustomers.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-finance-text-secondary">Total Collection</p>
                        <p className="font-medium">₹{areaTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {areas.length > 3 && (
                <div 
                  className="p-4 border rounded-lg flex flex-col items-center justify-center hover:bg-finance-gray cursor-pointer transition-colors"
                  onClick={() => navigate('/areas')}
                >
                  <Map className="h-8 w-8 text-finance-blue mb-2" />
                  <p className="font-medium">View All Areas</p>
                  <p className="text-xs text-finance-text-secondary mt-1">
                    {areas.length} finance areas
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card border-none animate-scale-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex justify-between items-center">
              <span>Recent Payments</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-finance-blue flex items-center gap-1 text-xs"
                onClick={() => navigate('/posting')}
              >
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="space-y-2">
                {recentPayments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-finance-gray transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-finance-blue-light flex items-center justify-center">
                        <PiggyBank className="h-4 w-4 text-finance-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{payment.customerName}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-finance-text-secondary">{payment.date}</p>
                          {payment.agentName && (
                            <p className="text-xs bg-finance-blue-light text-finance-blue px-2 py-0.5 rounded-full">
                              Agent: {payment.agentName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-medium text-finance-text-primary">₹{payment.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-finance-text-secondary">
                <p>No recent payments</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-none animate-scale-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex justify-between items-center">
              <span>Pending Collections</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-finance-blue flex items-center gap-1 text-xs"
                onClick={() => navigate('/customers')}
              >
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCustomers.length > 0 ? (
              <div className="space-y-2">
                {pendingCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-finance-gray transition-colors cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-finance-blue-light flex items-center justify-center">
                        <Users className="h-4 w-4 text-finance-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-finance-text-secondary">Serial #{customer.serialNumber}</p>
                      </div>
                    </div>
                    <span className="font-medium text-finance-red">
                      ₹{(customer.totalAmountToBePaid - customer.totalPaid).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-finance-text-secondary">
                <p>No pending collections</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
};

export default Dashboard;
