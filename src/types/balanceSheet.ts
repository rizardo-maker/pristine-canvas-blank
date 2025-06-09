
export interface BalanceSheetFilterConfig {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  areaId?: string;
  loanStatus?: 'active' | 'completed' | 'all';
}

export interface BalanceSheetData {
  customerName: string;
  serialNumber: string;
  reportDate: string;
  assets: {
    currentAssets: {
      cash: number;
      receivables: number;
      otherCurrentAssets: number;
      totalCurrentAssets: number;
    };
    fixedAssets: {
      investments: number;
      otherFixedAssets: number;
      totalFixedAssets: number;
    };
    totalAssets: number;
  };
  equity: {
    paidUpCapital: number;
    retainedEarnings: number;
    reservesAndSurplus: number;
    totalEquity: number;
  };
  liabilities: {
    currentLiabilities: {
      shortTermLoans: number;
      payables: number;
      accruedInterest: number;
      accruedExpenses: number;
      totalCurrentLiabilities: number;
    };
    longTermLiabilities: {
      longTermLoans: number;
      otherLongTermLiabilities: number;
      totalLongTermLiabilities: number;
    };
    totalLiabilities: number;
  };
  transactionSummary: {
    totalBorrowed: number;
    totalRepaid: number;
    outstandingBalance: number;
    accruedInterest: number;
    paidInterest: number;
  };
}
