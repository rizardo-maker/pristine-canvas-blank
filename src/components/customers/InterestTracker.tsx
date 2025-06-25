import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface InterestResult {
  period: string;
  amount: number;
  type: PeriodType;
}

// Helper function to format date in local timezone as YYYY-MM-DD
const formatDateForCalculation = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const InterestTracker = () => {
  const {
    calculateDailyInterestEarnings,
    calculateWeeklyInterestEarnings,
    calculateMonthlyInterestEarnings,
    currentAreaId,
    getAreaById
  } = useFinance();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PeriodType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [result, setResult] = useState<InterestResult | null>(null);

  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;

  const handlePeriodSelect = (type: PeriodType) => {
    setSelectedType(type);
    setIsDialogOpen(true);
    setResult(null);
    setSelectedDate(undefined);
    setSelectedMonth('');
    setSelectedYear('');
  };

  const calculateInterest = () => {
    if (!selectedType) return;

    let amount = 0;
    let period = '';

    switch (selectedType) {
      case 'daily':
        if (selectedDate) {
          const dateStr = formatDateForCalculation(selectedDate);
          amount = calculateDailyInterestEarnings(dateStr);
          period = selectedDate.toLocaleDateString('en-IN');
        }
        break;
      case 'weekly':
        if (selectedDate) {
          const dateStr = formatDateForCalculation(selectedDate);
          amount = calculateWeeklyInterestEarnings(dateStr);
          const endDate = new Date(selectedDate);
          endDate.setDate(selectedDate.getDate() + 6);
          period = `${selectedDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`;
        }
        break;
      case 'monthly':
        if (selectedMonth && selectedYear) {
          amount = calculateMonthlyInterestEarnings(selectedMonth, selectedYear);
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          period = `${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`;
        }
        break;
    }

    setResult({
      period,
      amount,
      type: selectedType
    });
  };

  const canCalculate = () => {
    switch (selectedType) {
      case 'daily':
      case 'weekly':
        return !!selectedDate;
      case 'monthly':
        return !!(selectedMonth && selectedYear);
      default:
        return false;
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-finance-blue" />
            Interest Earnings Tracker
          </CardTitle>
          <CardDescription>
            Track interest earnings by period {currentArea ? `in ${currentArea.name}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => handlePeriodSelect('daily')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Daily Interests
            </Button>
            <Button
              onClick={() => handlePeriodSelect('weekly')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Weekly Interests
            </Button>
            <Button
              onClick={() => handlePeriodSelect('monthly')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Monthly Interests
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-finance-blue-light rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-finance-blue" />
                <h4 className="font-semibold text-finance-blue">Interest Earnings</h4>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Period: {result.period}
                </p>
                <p className="text-2xl font-bold text-finance-blue">
                  ₹{result.amount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {result.type} interest earnings
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedType} Interest Calculation
            </DialogTitle>
            <DialogDescription>
              Select the {selectedType === 'monthly' ? 'month and year' : 'date'} to calculate interest earnings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {(selectedType === 'daily' || selectedType === 'weekly') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select {selectedType === 'weekly' ? 'Week Start ' : ''}Date
                </label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className={cn("rounded-md border pointer-events-auto")}
                  initialFocus
                />
              </div>
            )}

            {selectedType === 'monthly' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={calculateInterest}
                disabled={!canCalculate()}
                className="bg-finance-blue hover:bg-finance-blue/90"
              >
                Calculate Interest
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InterestTracker;
