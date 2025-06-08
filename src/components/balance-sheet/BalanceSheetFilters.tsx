
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { BalanceSheetFilterConfig } from '@/types/balanceSheet';
import { useFinance } from '@/context/FinanceContext';

interface BalanceSheetFiltersProps {
  filters: BalanceSheetFilterConfig;
  onFiltersChange: (filters: BalanceSheetFilterConfig) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const BalanceSheetFilters: React.FC<BalanceSheetFiltersProps> = ({
  filters,
  onFiltersChange,
  onGenerate,
  isLoading,
}) => {
  const { areas, currentAreaId } = useFinance();

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    });
  };

  const handleAreaChange = (areaId: string) => {
    onFiltersChange({
      ...filters,
      areaId: areaId === 'all' ? undefined : areaId,
    });
  };

  const handleLoanStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      loanStatus: status as 'active' | 'completed' | 'all',
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Balance Sheet Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Report Date)</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Area</Label>
            <Select value={filters.areaId || 'all'} onValueChange={handleAreaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Loan Status</Label>
            <Select value={filters.loanStatus || 'all'} onValueChange={handleLoanStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loans</SelectItem>
                <SelectItem value="active">Active Loans</SelectItem>
                <SelectItem value="completed">Completed Loans</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button onClick={onGenerate} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Generate Balance Sheet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceSheetFilters;
