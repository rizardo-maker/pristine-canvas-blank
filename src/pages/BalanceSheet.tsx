
import React, { useState } from 'react';
import BalanceSheetFilters from '@/components/balance-sheet/BalanceSheetFilters';
import BalanceSheetDisplay from '@/components/balance-sheet/BalanceSheetDisplay';
import PageTitle from '@/components/ui/PageTitle';
import { BalanceSheetFilterConfig, BalanceSheetData } from '@/types/balanceSheet';

const BalanceSheet: React.FC = () => {
  const [filters, setFilters] = useState<BalanceSheetFilterConfig>({
    dateRange: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    loanStatus: 'all',
  });
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateBalanceSheet = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockData: BalanceSheetData = {
        customerName: 'Sample Customer',
        serialNumber: 'BS001',
        reportDate: filters.dateRange.endDate,
        assets: {
          currentAssets: {
            cash: 100000,
            receivables: 50000,
            otherCurrentAssets: 25000,
            totalCurrentAssets: 175000,
          },
          fixedAssets: {
            investments: 200000,
            otherFixedAssets: 100000,
            totalFixedAssets: 300000,
          },
          totalAssets: 475000,
        },
        equity: {
          paidUpCapital: 200000,
          retainedEarnings: 150000,
          reservesAndSurplus: 50000,
          totalEquity: 400000,
        },
        liabilities: {
          currentLiabilities: {
            shortTermLoans: 30000,
            payables: 20000,
            accruedInterest: 5000,
            accruedExpenses: 10000,
            totalCurrentLiabilities: 65000,
          },
          longTermLiabilities: {
            longTermLoans: 10000,
            otherLongTermLiabilities: 0,
            totalLongTermLiabilities: 10000,
          },
          totalLiabilities: 75000,
        },
        transactionSummary: {
          totalBorrowed: 300000,
          totalRepaid: 250000,
          outstandingBalance: 50000,
          accruedInterest: 25000,
          paidInterest: 20000,
        },
      };
      setBalanceSheetData(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Balance Sheet" description="Generate and view balance sheets" />
      
      <BalanceSheetFilters
        filters={filters}
        onFiltersChange={setFilters}
        onGenerate={handleGenerateBalanceSheet}
        isLoading={isLoading}
      />
      
      {balanceSheetData && (
        <BalanceSheetDisplay
          data={balanceSheetData}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />
      )}
    </div>
  );
};

export default BalanceSheet;
