import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance, Payment } from '@/context/FinanceContext';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ArrowLeft, Plus, Trash2, DollarSign, Users, TrendingUp, TrendingDown, Printer, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

interface Agent {
  id: string;
  name: string;
  salary: number;
  dateAdded: string;
  isActive: boolean;
}

interface Expense {
  id: string;
  type: 'agent' | 'other';
  name: string;
  amount: number;
  date: string;
  agentId?: string;
  description?: string;
}

interface CostData {
  areaId: string;
  month: string; // Format: YYYY-MM
  agents: Agent[];
  expenses: Expense[];
  totalEarnings: number;
  previousMonthEarnings: number;
  createdAt: string;
  updatedAt: string;
}

// Mock data storage (in real app, this would be in context/database)
const getCostDataKey = (areaId: string, month: string) => `cost_data_${areaId}_${month}`;

const saveCostData = (data: CostData) => {
  const key = getCostDataKey(data.areaId, data.month);
  localStorage.setItem(key, JSON.stringify(data));
};

const loadCostData = (areaId: string, month: string): CostData | null => {
  const key = getCostDataKey(areaId, month);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
};

const AreaCost = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const { getAreaById, customers, payments } = useFinance();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', salary: 0 });
  const [newExpense, setNewExpense] = useState({
    type: 'other' as 'agent' | 'other',
    name: '',
    amount: 0,
    agentId: '',
    description: ''
  });

  const area = areaId ? getAreaById(areaId) : null;

  // Get area-specific data
  const areaCustomers = useMemo(() => 
    customers.filter(customer => customer.areaId === areaId), 
    [customers, areaId]
  );
  
  const areaPayments = useMemo(() => 
    payments.filter(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      return customer?.areaId === areaId;
    }), 
    [payments, customers, areaId]
  );

  // Load cost data for current month
  const [costData, setCostData] = useState<CostData>(() => {
    if (!areaId) return null;
    return loadCostData(areaId, selectedMonth) || {
      areaId,
      month: selectedMonth,
      agents: [],
      expenses: [],
      totalEarnings: 0,
      previousMonthEarnings: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // Calculate interest earnings using the correct interest earning calculation
  const calculateInterestEarnings = (monthPayments: Payment[]) => {
    let totalEarnings = 0;
    
    monthPayments.forEach(payment => {
      const customer = customers.find(c => c.id === payment.customerId);
      if (!customer) return;
      
      const principal = customer.totalAmountGiven || 0;
      const totalInterest = customer.interestAmount || 0;
      
      if (principal <= 0 || totalInterest <= 0) return;
      
      // Calculate what portion of PRINCIPAL this payment represents
      const principalRatio = Math.min(payment.amount / principal, 1);
      const earnedInterest = principalRatio * totalInterest;
      
      totalEarnings += Math.round(earnedInterest * 100) / 100;
    });
    
    return totalEarnings;
  };

  // Calculate current month interest earnings
  const currentMonthEarnings = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthPayments = areaPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month;
    });
    return calculateInterestEarnings(monthPayments);
  }, [areaPayments, selectedMonth, customers]);

  // Calculate previous month interest earnings
  const previousMonthEarnings = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const prevMonthPayments = areaPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getFullYear() === prevYear && paymentDate.getMonth() + 1 === prevMonth;
    });
    return calculateInterestEarnings(prevMonthPayments);
  }, [areaPayments, selectedMonth, customers]);

  // Update cost data when month changes
  React.useEffect(() => {
    if (!areaId) return;
    
    const existingData = loadCostData(areaId, selectedMonth);
    if (existingData) {
      setCostData(existingData);
    } else {
      const newData: CostData = {
        areaId,
        month: selectedMonth,
        agents: [],
        expenses: [],
        totalEarnings: currentMonthEarnings,
        previousMonthEarnings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCostData(newData);
      saveCostData(newData);
    }
  }, [areaId, selectedMonth, currentMonthEarnings, previousMonthEarnings]);

  // Update earnings when they change
  React.useEffect(() => {
    if (costData) {
      const updatedData = {
        ...costData,
        totalEarnings: currentMonthEarnings,
        previousMonthEarnings,
        updatedAt: new Date().toISOString()
      };
      setCostData(updatedData);
      saveCostData(updatedData);
    }
  }, [currentMonthEarnings, previousMonthEarnings]);

  const handleAddAgent = () => {
    if (!newAgent.name.trim() || newAgent.salary <= 0) {
      toast.error('Please provide valid agent name and salary');
      return;
    }

    const agent: Agent = {
      id: Date.now().toString(),
      name: newAgent.name.trim(),
      salary: newAgent.salary,
      dateAdded: new Date().toISOString(),
      isActive: true
    };

    const updatedData = {
      ...costData!,
      agents: [...costData!.agents, agent],
      updatedAt: new Date().toISOString()
    };

    setCostData(updatedData);
    saveCostData(updatedData);
    setNewAgent({ name: '', salary: 0 });
    setIsAddAgentOpen(false);
    toast.success('Agent added successfully');
  };

  const handleRemoveAgent = (agentId: string) => {
    const updatedData = {
      ...costData!,
      agents: costData!.agents.filter(agent => agent.id !== agentId),
      updatedAt: new Date().toISOString()
    };

    setCostData(updatedData);
    saveCostData(updatedData);
    toast.success('Agent removed successfully');
  };

  const handleAddExpense = () => {
    if (!newExpense.name.trim() || newExpense.amount <= 0) {
      toast.error('Please provide valid expense details');
      return;
    }

    if (newExpense.type === 'agent' && !newExpense.agentId) {
      toast.error('Please select an agent');
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      type: newExpense.type,
      name: newExpense.name.trim(),
      amount: newExpense.amount,
      date: new Date().toISOString(),
      agentId: newExpense.type === 'agent' ? newExpense.agentId : undefined,
      description: newExpense.description.trim() || undefined
    };

    const updatedData = {
      ...costData!,
      expenses: [...costData!.expenses, expense],
      updatedAt: new Date().toISOString()
    };

    setCostData(updatedData);
    saveCostData(updatedData);
    setNewExpense({
      type: 'other',
      name: '',
      amount: 0,
      agentId: '',
      description: ''
    });
    setIsAddExpenseOpen(false);
    toast.success('Expense added successfully');
  };

  const handleRemoveExpense = (expenseId: string) => {
    const updatedData = {
      ...costData!,
      expenses: costData!.expenses.filter(expense => expense.id !== expenseId),
      updatedAt: new Date().toISOString()
    };

    setCostData(updatedData);
    saveCostData(updatedData);
    toast.success('Expense removed successfully');
  };

  const totalAgentSalaries = costData?.agents.reduce((sum, agent) => sum + agent.salary, 0) || 0;
  const totalOtherExpenses = costData?.expenses.filter(e => e.type === 'other').reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const totalAgentExpenses = costData?.expenses.filter(e => e.type === 'agent').reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const totalExpenses = totalAgentSalaries + totalOtherExpenses + totalAgentExpenses;
  const netAmount = currentMonthEarnings - totalExpenses;

  const exportToPdf = () => {
    const element = document.getElementById('cost-report-content');
    if (!element) return;

    const opt = {
      margin: 1,
      filename: `${area?.name}_Cost_Report_${selectedMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
    toast.success('Cost report exported successfully');
  };

  if (!area) {
    return (
      <div className="space-y-6">
        <PageTitle title="Area Not Found" subtitle="The requested area could not be found" />
        <Button onClick={() => navigate('/areas')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Areas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageTitle 
        title={`${area.name} - Cost Management`}
        subtitle="Manage agents, expenses, and track financial performance"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/areas')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Areas
          </Button>
          <Button
            onClick={exportToPdf}
            className="bg-finance-blue hover:bg-finance-blue/90"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </PageTitle>

      {/* Month Selector */}
      <Card className="shadow-card border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[200px]"
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardDescription>Current Month Earnings</CardDescription>
            <CardTitle className="text-3xl flex items-center text-green-600">
              ₹{currentMonthEarnings.toLocaleString()}
              <TrendingUp className="ml-2 h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardDescription>Previous Month Earnings</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              ₹{previousMonthEarnings.toLocaleString()}
              <DollarSign className="ml-2 h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl flex items-center text-red-600">
              ₹{totalExpenses.toLocaleString()}
              <TrendingDown className="ml-2 h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-card border-none">
          <CardHeader className="pb-2">
            <CardDescription>Net Amount</CardDescription>
            <CardTitle className={`text-3xl flex items-center ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{netAmount.toLocaleString()}
              {netAmount >= 0 ? 
                <TrendingUp className="ml-2 h-5 w-5" /> : 
                <TrendingDown className="ml-2 h-5 w-5" />
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div id="cost-report-content">
        {/* Report Header for PDF */}
        <div className="mb-6 text-center print:block hidden">
          <h1 className="text-2xl font-bold">{area.name} - Cost Report</h1>
          <h2 className="text-lg text-muted-foreground">
            {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            <Card className="shadow-card border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Agent Management</CardTitle>
                  <CardDescription>Manage agents and their salaries for this area</CardDescription>
                </div>
                <Dialog open={isAddAgentOpen} onOpenChange={setIsAddAgentOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-finance-blue hover:bg-finance-blue/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Agent
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Agent</DialogTitle>
                      <DialogDescription>
                        Add a new agent to this area for the current month
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="agentName">Agent Name</Label>
                        <Input
                          id="agentName"
                          value={newAgent.name}
                          onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                          placeholder="Enter agent name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agentSalary">Monthly Salary</Label>
                        <Input
                          id="agentSalary"
                          type="number"
                          value={newAgent.salary}
                          onChange={(e) => setNewAgent({...newAgent, salary: parseFloat(e.target.value) || 0})}
                          placeholder="Enter monthly salary"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddAgent}>Add Agent</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              
              <CardContent>
                {costData?.agents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-4" />
                    <p>No agents added for this month</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Name</TableHead>
                        <TableHead>Monthly Salary</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costData?.agents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell>₹{agent.salary.toLocaleString()}</TableCell>
                          <TableCell>{new Date(agent.dateAdded).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Agent</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {agent.name} from this month?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleRemoveAgent(agent.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card className="shadow-card border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Expense Management</CardTitle>
                  <CardDescription>Track agent expenses and other operational costs</CardDescription>
                </div>
                <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-finance-blue hover:bg-finance-blue/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Expense</DialogTitle>
                      <DialogDescription>
                        Add a new expense for this month
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="expenseType">Expense Type</Label>
                        <Select value={newExpense.type} onValueChange={(value: 'agent' | 'other') => setNewExpense({...newExpense, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agent">Agent Expense</SelectItem>
                            <SelectItem value="other">Other Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {newExpense.type === 'agent' && (
                        <div className="space-y-2">
                          <Label htmlFor="agentSelect">Select Agent</Label>
                          <Select value={newExpense.agentId} onValueChange={(value) => setNewExpense({...newExpense, agentId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {costData?.agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {agent.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="expenseName">Expense Name</Label>
                        <Input
                          id="expenseName"
                          value={newExpense.name}
                          onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                          placeholder="Enter expense name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="expenseAmount">Amount</Label>
                        <Input
                          id="expenseAmount"
                          type="number"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                          placeholder="Enter amount"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="expenseDescription">Description (Optional)</Label>
                        <Input
                          id="expenseDescription"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                          placeholder="Enter description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddExpense}>Add Expense</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              
              <CardContent>
                {costData?.expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="mx-auto h-12 w-12 mb-4" />
                    <p>No expenses recorded for this month</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costData?.expenses.map((expense) => {
                        const agent = costData.agents.find(a => a.id === expense.agentId);
                        return (
                          <TableRow key={expense.id}>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                expense.type === 'agent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {expense.type === 'agent' ? 'Agent' : 'Other'}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{expense.name}</TableCell>
                            <TableCell>{agent?.name || '-'}</TableCell>
                            <TableCell>₹{expense.amount.toLocaleString()}</TableCell>
                            <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Expense</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove this expense?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleRemoveExpense(expense.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card className="shadow-card border-none">
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Complete breakdown of collections and expenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600">Earnings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Current Month:</span>
                        <span className="font-medium">₹{currentMonthEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Previous Month:</span>
                        <span>₹{previousMonthEarnings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-600">Expenses</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Agent Salaries:</span>
                        <span className="font-medium">₹{totalAgentSalaries.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agent Expenses:</span>
                        <span className="font-medium">₹{totalAgentExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Expenses:</span>
                        <span className="font-medium">₹{totalOtherExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Total Expenses:</span>
                        <span>₹{totalExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className={`flex justify-between text-xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Net Amount:</span>
                    <span>₹{netAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {netAmount >= 0 ? 'Profit this month' : 'Loss this month'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AreaCost;