
export interface BalanceSheetFilterConfig {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  areaId?: string;
  loanStatus: 'active' | 'completed' | 'all';
}

export interface CurrentAssets {
  cash: number;
  receivables: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
}

export interface FixedAssets {
  investments: number;
  otherFixedAssets: number;
  totalFixedAssets: number;
}

export interface Assets {
  currentAssets: CurrentAssets;
  fixedAssets: FixedAssets;
  totalAssets: number;
}

export interface CurrentLiabilities {
  shortTermLoans: number;
  payables: number;
  accruedInterest: number;
  accruedExpenses: number;
  totalCurrentLiabilities: number;
}

export interface LongTermLiabilities {
  longTermLoans: number;
  otherLongTermLiabilities: number;
  totalLongTermLiabilities: number;
}

export interface Liabilities {
  currentLiabilities: CurrentLiabilities;
  longTermLiabilities: LongTermLiabilities;
  totalLiabilities: number;
}

export interface Equity {
  paidUpCapital: number;
  retainedEarnings: number;
  reservesAndSurplus: number;
  totalEquity: number;
}

export interface TransactionSummary {
  totalBorrowed: number;
  totalRepaid: number;
  outstandingBalance: number;
  accruedInterest: number;
  paidInterest: number;
}

export interface BalanceSheetData {
  customerName: string;
  serialNumber: string;
  reportDate: string;
  assets: Assets;
  liabilities: Liabilities;
  equity: Equity;
  transactionSummary: TransactionSummary;
}
