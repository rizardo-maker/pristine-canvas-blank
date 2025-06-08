
export const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateTotalAssets = (currentAssets: number, fixedAssets: number): number => {
  return currentAssets + fixedAssets;
};

export const calculateTotalLiabilities = (currentLiabilities: number, longTermLiabilities: number): number => {
  return currentLiabilities + longTermLiabilities;
};

export const calculateTotalEquity = (paidUpCapital: number, retainedEarnings: number, reservesAndSurplus: number): number => {
  return paidUpCapital + retainedEarnings + reservesAndSurplus;
};

export const validateBalanceSheet = (totalAssets: number, totalEquityAndLiabilities: number): boolean => {
  return Math.abs(totalAssets - totalEquityAndLiabilities) < 0.01;
};
