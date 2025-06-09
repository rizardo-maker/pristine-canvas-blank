
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateTotalAssets(currentAssets: number, fixedAssets: number): number {
  return currentAssets + fixedAssets;
}

export function calculateTotalLiabilities(currentLiabilities: number, longTermLiabilities: number): number {
  return currentLiabilities + longTermLiabilities;
}
