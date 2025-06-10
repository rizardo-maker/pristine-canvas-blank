
export interface BalanceSheetData {
  customerId: string;
  customerName: string;
  serialNumber: string;
  panNumber?: string;
  reportDate: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
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
  equity: {
    paidUpCapital: number;
    retainedEarnings: number;
    reservesAndSurplus: number;
    totalEquity: number;
  };
  transactionSummary: {
    totalBorrowed: number;
    totalRepaid: number;
    outstandingBalance: number;
    accruedInterest: number;
    paidInterest: number;
  };
}

export interface BalanceSheetFilterConfig {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  customerIds?: string[];
  areaId?: string;
  loanStatus?: 'active' | 'completed' | 'all';
}

export interface BalanceSheetSettings {
  includePanDetails: boolean;
  includeCollateralInfo: boolean;
  currency: 'INR';
  numberFormat: 'indian';
  complianceStandard: 'IndAS';
}
