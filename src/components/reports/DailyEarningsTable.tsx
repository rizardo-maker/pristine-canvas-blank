
import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const DailyEarningsTable = () => {
  const { 
    getCurrentAreaDailyEarnings, 
    deleteDailyInterestEarning,
    currentAreaId,
    getAreaById 
  } = useFinance();

  const dailyEarnings = getCurrentAreaDailyEarnings();

  const currentArea = currentAreaId ? getAreaById(currentAreaId) : null;

  const handleDelete = (id: string, date: string, isWeekly?: boolean, isMonthly?: boolean) => {
    const entryType = isWeekly ? 'weekly total' : isMonthly ? 'monthly total' : 'daily entry';
    
    if (window.confirm(`Are you sure you want to delete the ${entryType} for ${date}?`)) {
      deleteDailyInterestEarning(id);
      toast.success(`${entryType.charAt(0).toUpperCase() + entryType.slice(1)} deleted successfully`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getRowStyle = (isWeekly?: boolean, isMonthly?: boolean) => {
    if (isMonthly) return 'bg-blue-50 border-l-4 border-l-blue-500';
    if (isWeekly) return 'bg-green-50 border-l-4 border-l-green-500';
    return '';
  };

  const getEntryLabel = (entry: any) => {
    if (entry.isMonthlyTotal) return `Monthly Total (${entry.monthYear})`;
    if (entry.isWeeklyTotal) return `Weekly Total (${formatDate(entry.weekStartDate || entry.date)})`;
    return formatDate(entry.date);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-finance-blue" />
          Daily Interest & Principle Earnings
        </CardTitle>
        <CardDescription>
          Track daily, weekly, and monthly earnings {currentArea ? `in ${currentArea.name}` : ''} with persistent storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dailyEarnings.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date / Period</TableHead>
                  <TableHead className="text-right">Interest Earned (₹)</TableHead>
                  <TableHead className="text-right">Principle Earned (₹)</TableHead>
                  <TableHead className="text-right">Total Earned (₹)</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyEarnings.map((entry, index) => (
                  <TableRow 
                    key={entry.id || index} 
                    className={getRowStyle(entry.isWeeklyTotal, entry.isMonthlyTotal)}
                  >
                    <TableCell className="font-medium">
                      {getEntryLabel(entry)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(entry.totalInterestEarned || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(entry.totalPrincipleEarned || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{((entry.totalInterestEarned || 0) + (entry.totalPrincipleEarned || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.isMonthlyTotal ? (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          Monthly
                        </Badge>
                      ) : entry.isWeeklyTotal ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Weekly
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Daily
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(
                          entry.id || index.toString(), 
                          getEntryLabel(entry), 
                          entry.isWeeklyTotal, 
                          entry.isMonthlyTotal
                        )}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No earnings data available</p>
            <p className="text-sm">
              Earnings will be automatically tracked when payments are recorded
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyEarningsTable;
