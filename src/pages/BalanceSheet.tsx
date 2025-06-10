import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { BalanceSheetData, BalanceSheetFilterConfig } from '@/types/balanceSheet';
import { calculateBalanceSheet } from '@/utils/balanceSheetCalculations';
import BalanceSheetFilters from '@/components/balance-sheet/BalanceSheetFilters';
import BalanceSheetDisplay from '@/components/balance-sheet/BalanceSheetDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { exportBalanceSheetToPDF, exportBalanceSheetToExcel } from '@/utils/balanceSheetExport';

const BalanceSheet = () => {
  const { getCurrentAreaCustomers, getCurrentAreaPayments, getCustomerPayments } = useFinance();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<BalanceSheetFilterConfig>({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0], // Financial year start (Apr 1)
      endDate: new Date().toISOString().split('T')[0],
    },
    loanStatus: 'all',
  });
  
  const [balanceSheets, setBalanceSheets] = useState<BalanceSheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const generateBalanceSheets = async () => {
    setIsLoading(true);
    try {
      const customers = getCurrentAreaCustomers();
      const allPayments = getCurrentAreaPayments();
      
      // Filter customers based on loan status
      let filteredCustomers = customers.filter(customer => customer.totalAmountGiven > 0);
      
      if (filters.loanStatus === 'active') {
        filteredCustomers = filteredCustomers.filter(customer => !customer.isFullyPaid);
      } else if (filters.loanStatus === 'completed') {
        filteredCustomers = filteredCustomers.filter(customer => customer.isFullyPaid);
      }
      
      if (filteredCustomers.length === 0) {
        toast({
          title: "No Data Found",
          description: "No customers found matching the selected criteria.",
          variant: "destructive",
        });
        setBalanceSheets([]);
        setIsLoading(false);
        return;
      }

      const sheets = filteredCustomers.map(customer => {
        const customerPayments = getCustomerPayments(customer.id);
        return calculateBalanceSheet(
          customer,
          customerPayments,
          filters.dateRange.endDate,
          filters.dateRange.startDate,
          filters.dateRange.endDate
        );
      });

      setBalanceSheets(sheets);
      
      toast({
        title: "Balance Sheets Generated",
        description: `Generated balance sheets for ${sheets.length} customers.`,
      });
    } catch (error) {
      console.error('Error generating balance sheets:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate balance sheets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async (data: BalanceSheetData) => {
    try {
      exportBalanceSheetToPDF(data);
      toast({
        title: "PDF Export Successful",
        description: "Balance sheet has been downloaded as PDF.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "PDF Export Failed",
        description: "Failed to export balance sheet as PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async (data: BalanceSheetData) => {
    try {
      exportBalanceSheetToExcel(data);
      toast({
        title: "Excel Export Successful",
        description: "Balance sheet has been downloaded as Excel file.",
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Excel Export Failed",
        description: "Failed to export balance sheet as Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedBalanceSheet = selectedCustomerId 
    ? balanceSheets.find(sheet => sheet.customerId === selectedCustomerId)
    : balanceSheets[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Balance Sheets</h1>
          <p className="text-muted-foreground">
            Generate comprehensive balance sheets for income tax filing and financial reporting
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm">Ind AS Compliant</span>
        </div>
      </div>

      <BalanceSheetFilters
        filters={filters}
        onFiltersChange={setFilters}
        onGenerate={generateBalanceSheets}
        isLoading={isLoading}
      />

      {balanceSheets.length > 0 && (
        <>
          {/* Customer Selection */}
          {balanceSheets.length > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Customer:</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedCustomerId || balanceSheets[0]?.customerId || ''}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    {balanceSheets.map((sheet) => (
                      <option key={sheet.customerId} value={sheet.customerId}>
                        {sheet.customerName} ({sheet.serialNumber})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Generated {balanceSheets.length} balance sheet(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Sheet Display */}
          {selectedBalanceSheet && (
            <BalanceSheetDisplay
              data={selectedBalanceSheet}
              onExportPDF={() => handleExportPDF(selectedBalanceSheet)}
              onExportExcel={() => handleExportExcel(selectedBalanceSheet)}
            />
          )}
        </>
      )}

      {balanceSheets.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Balance Sheets Generated</h3>
            <p className="text-muted-foreground">
              Use the filters above to select date range and criteria, then click "Generate Balance Sheet" to create reports.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BalanceSheet;
