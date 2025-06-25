
import { Customer, Payment } from '@/context/FinanceContext';
import { BalanceSheetData } from '@/types/balanceSheet';

export const calculateBalanceSheet = (
  customer: Customer,
  payments: Payment[],
  reportDate: string,
  startDate: string,
  endDate: string
): BalanceSheetData => {
  // Filter payments within the report period
  const periodPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const start = new Date(startDate);
    const end = new Date(reportDate);
    return paymentDate >= start && paymentDate <= end;
  });

  const totalRepaid = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingPrincipal = Math.max(0, customer.totalAmountGiven - customer.totalPaid);
  
  // Calculate accrued interest up to report date
  const issuedDate = new Date(customer.issuedDate);
  const reportingDate = new Date(reportDate);
  const daysPassed = Math.floor((reportingDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const totalInterestAmount = customer.interestAmount || (customer.totalAmountToBePaid - customer.totalAmountGiven);
  const dailyInterestAmount = totalInterestAmount / customer.numberOfDays;
  const accruedInterest = Math.min(dailyInterestAmount * daysPassed, totalInterestAmount);
  
  // Calculate paid interest (portion of total payments that represents interest)
  const totalPrincipalAndInterest = customer.totalAmountToBePaid;
  const paymentRatio = customer.totalPaid / totalPrincipalAndInterest;
  const paidInterest = totalInterestAmount * paymentRatio;
  const unpaidAccruedInterest = Math.max(0, accruedInterest - paidInterest);

  // Assets calculation (from financier's perspective)
  const currentAssets = {
    cash: 0, // This would need to be tracked separately
    receivables: outstandingPrincipal + unpaidAccruedInterest,
    otherCurrentAssets: 0
  };
  
  const fixedAssets = {
    investments: customer.totalAmountGiven, // Initial loan deployment treated as investment
    otherFixedAssets: 0
  };
  
  const totalAssets = currentAssets.receivables + fixedAssets.investments;

  // Liabilities calculation (minimal for this business model)
  const currentLiabilities = {
    shortTermLoans: 0, // External borrowings if any
    payables: 0,
    accruedExpenses: 0
  };
  
  const longTermLiabilities = {
    longTermLoans: 0, // External long-term borrowings if any
    otherLongTermLiabilities: 0
  };
  
  const totalLiabilities = currentLiabilities.shortTermLoans + currentLiabilities.payables + 
                          currentLiabilities.accruedExpenses + longTermLiabilities.longTermLoans;

  // Equity calculation (for financier)
  const paidUpCapital = customer.totalAmountGiven; // Initial capital deployed
  const retainedEarnings = customer.totalPaid - customer.totalAmountGiven; // Profit/Loss
  const reservesAndSurplus = Math.max(0, retainedEarnings);
  const totalEquity = paidUpCapital + retainedEarnings;

  return {
    customerId: customer.id,
    customerName: customer.name,
    serialNumber: customer.serialNumber,
    panNumber: undefined,
    reportDate,
    reportPeriod: {
      startDate,
      endDate: reportDate,
    },
    assets: {
      currentAssets: {
        cash: currentAssets.cash,
        receivables: currentAssets.receivables,
        otherCurrentAssets: currentAssets.otherCurrentAssets,
        totalCurrentAssets: currentAssets.receivables + currentAssets.cash + currentAssets.otherCurrentAssets
      },
      fixedAssets: {
        investments: fixedAssets.investments,
        otherFixedAssets: fixedAssets.otherFixedAssets,
        totalFixedAssets: fixedAssets.investments + fixedAssets.otherFixedAssets
      },
      totalAssets
    },
    liabilities: {
      currentLiabilities: {
        shortTermLoans: currentLiabilities.shortTermLoans,
        payables: currentLiabilities.payables,
        accruedInterest: unpaidAccruedInterest,
        accruedExpenses: currentLiabilities.accruedExpenses,
        totalCurrentLiabilities: currentLiabilities.shortTermLoans + currentLiabilities.payables + 
                                 unpaidAccruedInterest + currentLiabilities.accruedExpenses
      },
      longTermLiabilities: {
        longTermLoans: longTermLiabilities.longTermLoans,
        otherLongTermLiabilities: longTermLiabilities.otherLongTermLiabilities,
        totalLongTermLiabilities: longTermLiabilities.longTermLoans + longTermLiabilities.otherLongTermLiabilities
      },
      totalLiabilities
    },
    equity: {
      paidUpCapital,
      retainedEarnings,
      reservesAndSurplus,
      totalEquity
    },
    transactionSummary: {
      totalBorrowed: customer.totalAmountGiven,
      totalRepaid: customer.totalPaid,
      outstandingBalance: outstandingPrincipal + unpaidAccruedInterest,
      accruedInterest: accruedInterest,
      paidInterest: paidInterest
    },
  };
};

export const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};
