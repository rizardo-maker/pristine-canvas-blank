
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, TableIcon, Shield } from 'lucide-react';
import { BalanceSheetData } from '@/types/balanceSheet';
import { formatIndianCurrency } from '@/utils/balanceSheetCalculations';

interface BalanceSheetDisplayProps {
  data: BalanceSheetData;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

const BalanceSheetDisplay: React.FC<BalanceSheetDisplayProps> = ({
  data,
  onExportPDF,
  onExportExcel,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">BALANCE SHEET</CardTitle>
            <p className="text-muted-foreground mt-1">
              Customer: {data.customerName} | Serial: {data.serialNumber}
            </p>
            <p className="text-sm text-muted-foreground">
              As on {new Date(data.reportDate).toLocaleDateString('en-IN')}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Ind AS Compliant</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onExportPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={onExportExcel} className="gap-2">
              <TableIcon className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assets Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b-2 border-primary pb-2">ASSETS</h3>
            
            {/* Current Assets */}
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Current Assets:</h4>
              
              <div className="pl-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cash and Cash Equivalents</span>
                  <span className="font-mono">{formatIndianCurrency(data.assets.currentAssets.cash)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Trade Receivables</span>
                  <span className="font-mono">{formatIndianCurrency(data.assets.currentAssets.receivables)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Other Current Assets</span>
                  <span className="font-mono">{formatIndianCurrency(data.assets.currentAssets.otherCurrentAssets)}</span>
                </div>
                
                <div className="flex justify-between font-medium text-blue-700 border-t pt-2">
                  <span>Total Current Assets</span>
                  <span className="font-mono">{formatIndianCurrency(data.assets.currentAssets.totalCurrentAssets)}</span>
                </div>
              </div>
            </div>
            
            {/* Fixed Assets */}
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Non-Current Assets:</h4>
              
              <div className="pl-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Financial Assets - Investments</span>
                  <span className="font-mono">{formatIndianCurrency(data.assets.fixedAssets.investments)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Other Non-Current Assets</span>
                  <span className="font-mono">{formatIndianCurrency(data.assets.fixedAssets.otherFixedAssets)}</span>
                </div>
                
                <div className="flex justify-between font-medium text-blue-700 border-t pt-2">
                  <span>Total Non-Current Assets</span>
                  <span className="font-mono">{formatIndianCurrency(data.assets.fixedAssets.totalFixedAssets)}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-bold text-lg text-primary">
              <span>TOTAL ASSETS</span>
              <span className="font-mono">{formatIndianCurrency(data.assets.totalAssets)}</span>
            </div>
          </div>
          
          {/* Liabilities & Equity Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b-2 border-primary pb-2">EQUITY AND LIABILITIES</h3>
            
            {/* Equity */}
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Equity:</h4>
              
              <div className="pl-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Paid-up Capital</span>
                  <span className="font-mono">{formatIndianCurrency(data.equity.paidUpCapital)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Retained Earnings</span>
                  <span className="font-mono">{formatIndianCurrency(data.equity.retainedEarnings)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Reserves and Surplus</span>
                  <span className="font-mono">{formatIndianCurrency(data.equity.reservesAndSurplus)}</span>
                </div>
                
                <div className="flex justify-between font-medium text-green-700 border-t pt-2">
                  <span>Total Equity</span>
                  <span className="font-mono">{formatIndianCurrency(data.equity.totalEquity)}</span>
                </div>
              </div>
            </div>
            
            {/* Current Liabilities */}
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">Current Liabilities:</h4>
              
              <div className="pl-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Short-term Loans</span>
                  <span className="font-mono">{formatIndianCurrency(data.liabilities.currentLiabilities.shortTermLoans)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Trade Payables</span>
                  <span className="font-mono">{formatIndianCurrency(data.liabilities.currentLiabilities.payables)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Accrued Interest</span>
                  <span className="font-mono">{formatIndianCurrency(data.liabilities.currentLiabilities.accruedInterest)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Other Current Liabilities</span>
                  <span className="font-mono">{formatIndianCurrency(data.liabilities.currentLiabilities.accruedExpenses)}</span>
                </div>
                
                <div className="flex justify-between font-medium text-red-700 border-t pt-2">
                  <span>Total Current Liabilities</span>
                  <span className="font-mono">{formatIndianCurrency(data.liabilities.currentLiabilities.totalCurrentLiabilities)}</span>
                </div>
              </div>
            </div>
            
            {/* Non-Current Liabilities */}
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">Non-Current Liabilities:</h4>
              
              <div className="pl-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Long-term Loans</span>
                  <span className="font-mono">{formatIndianCurrency(data.liabilities.longTermLiabilities.longTermLoans)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Other Non-Current Liabilities</span>
                  <span className="font-mono">{formatIndianCurrency(data.liabilities.longTermLiabilities.otherLongTermLiabilities)}</span>
                </div>
                
                <div className="flex justify-between font-medium text-red-700 border-t pt-2">
                  <span>Total Non-Current Liabilities</span>
                  <span className="font-mono">{formatIndianCurrency(data.liabilities.longTermLiabilities.totalLongTermLiabilities)}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-bold text-lg text-primary">
              <span>TOTAL EQUITY AND LIABILITIES</span>
              <span className="font-mono">{formatIndianCurrency(data.equity.totalEquity + data.liabilities.totalLiabilities)}</span>
            </div>
          </div>
        </div>
        
        {/* Transaction Summary */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-3">Transaction Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-muted-foreground text-sm">Total Loan Amount:</span>
              <p className="font-semibold">{formatIndianCurrency(data.transactionSummary.totalBorrowed)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Total Amount Repaid:</span>
              <p className="font-semibold">{formatIndianCurrency(data.transactionSummary.totalRepaid)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Outstanding Balance:</span>
              <p className="font-semibold">{formatIndianCurrency(data.transactionSummary.outstandingBalance)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Total Accrued Interest:</span>
              <p className="font-semibold">{formatIndianCurrency(data.transactionSummary.accruedInterest)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Paid Interest:</span>
              <p className="font-semibold">{formatIndianCurrency(data.transactionSummary.paidInterest)}</p>
            </div>
          </div>
        </div>
        
        {/* Compliance Note */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Ind AS Compliance Note:</strong> This balance sheet is prepared in accordance with Indian Accounting Standards (Ind AS 1) 
            for Presentation of Financial Statements, Ind AS 39 for Financial Instruments: Recognition and Measurement, and Ind AS 18 for Revenue Recognition.
            All amounts are in Indian Rupees (₹).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceSheetDisplay;
