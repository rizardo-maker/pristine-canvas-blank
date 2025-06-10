
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { BalanceSheetData } from '@/types/balanceSheet';
import { formatIndianCurrency } from './balanceSheetCalculations';

export const exportBalanceSheetToPDF = (data: BalanceSheetData) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BALANCE SHEET', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Customer: ${data.customerName} | Serial: ${data.serialNumber}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 6;
  pdf.text(`As on ${new Date(data.reportDate).toLocaleDateString('en-IN')}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;

  // Assets Section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASSETS', margin, yPosition);
  yPosition += 8;
  
  // Current Assets
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Current Assets:', margin + 5, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Cash and Cash Equivalents', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.assets.currentAssets.cash), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Trade Receivables', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.assets.currentAssets.receivables), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Other Current Assets', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.assets.currentAssets.otherCurrentAssets), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Current Assets', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.assets.currentAssets.totalCurrentAssets), pageWidth - margin - 40, yPosition);
  yPosition += 8;
  
  // Non-Current Assets
  pdf.setFont('helvetica', 'bold');
  pdf.text('Non-Current Assets:', margin + 5, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Financial Assets - Investments', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.assets.fixedAssets.investments), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Other Non-Current Assets', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.assets.fixedAssets.otherFixedAssets), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Non-Current Assets', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.assets.fixedAssets.totalFixedAssets), pageWidth - margin - 40, yPosition);
  yPosition += 8;
  
  // Total Assets
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL ASSETS', margin + 5, yPosition);
  pdf.text(formatIndianCurrency(data.assets.totalAssets), pageWidth - margin - 40, yPosition);
  yPosition += 12;

  // Equity and Liabilities Section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EQUITY AND LIABILITIES', margin, yPosition);
  yPosition += 8;
  
  // Equity
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Equity:', margin + 5, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Paid-up Capital', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.equity.paidUpCapital), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Retained Earnings', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.equity.retainedEarnings), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Reserves and Surplus', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.equity.reservesAndSurplus), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Equity', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.equity.totalEquity), pageWidth - margin - 40, yPosition);
  yPosition += 8;
  
  // Current Liabilities
  pdf.setFont('helvetica', 'bold');
  pdf.text('Current Liabilities:', margin + 5, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Short-term Loans', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.liabilities.currentLiabilities.shortTermLoans), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Trade Payables', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.liabilities.currentLiabilities.payables), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Accrued Interest', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.liabilities.currentLiabilities.accruedInterest), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Other Current Liabilities', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.liabilities.currentLiabilities.accruedExpenses), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Current Liabilities', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.liabilities.currentLiabilities.totalCurrentLiabilities), pageWidth - margin - 40, yPosition);
  yPosition += 8;
  
  // Non-Current Liabilities
  pdf.setFont('helvetica', 'bold');
  pdf.text('Non-Current Liabilities:', margin + 5, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Long-term Loans', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.liabilities.longTermLiabilities.longTermLoans), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.text('Other Non-Current Liabilities', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.liabilities.longTermLiabilities.otherLongTermLiabilities), pageWidth - margin - 40, yPosition);
  yPosition += 5;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Non-Current Liabilities', margin + 10, yPosition);
  pdf.text(formatIndianCurrency(data.liabilities.longTermLiabilities.totalLongTermLiabilities), pageWidth - margin - 40, yPosition);
  yPosition += 8;
  
  // Total Liabilities
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL EQUITY AND LIABILITIES', margin + 5, yPosition);
  pdf.text(formatIndianCurrency(data.equity.totalEquity + data.liabilities.totalLiabilities), pageWidth - margin - 40, yPosition);
  yPosition += 12;

  // Transaction Summary
  pdf.setFontSize(10);
  pdf.text('TRANSACTION SUMMARY', margin, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total Loan Amount: ${formatIndianCurrency(data.transactionSummary.totalBorrowed)}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Total Amount Repaid: ${formatIndianCurrency(data.transactionSummary.totalRepaid)}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Outstanding Balance: ${formatIndianCurrency(data.transactionSummary.outstandingBalance)}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Total Accrued Interest: ${formatIndianCurrency(data.transactionSummary.accruedInterest)}`, margin + 5, yPosition);
  yPosition += 5;
  pdf.text(`Paid Interest: ${formatIndianCurrency(data.transactionSummary.paidInterest)}`, margin + 5, yPosition);
  yPosition += 10;

  // Compliance Note
  pdf.setFontSize(8);
  pdf.text('Ind AS Compliance Note: This balance sheet is prepared in accordance with Indian Accounting Standards', margin, yPosition);
  yPosition += 4;
  pdf.text('(Ind AS 1, 18, 39) and is suitable for income tax filing purposes. All amounts are in Indian Rupees (₹).', margin, yPosition);

  // Save the PDF
  const fileName = `BalanceSheet_${data.customerName.replace(/\s+/g, '_')}_${data.serialNumber}_${new Date(data.reportDate).toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export const exportBalanceSheetToExcel = (data: BalanceSheetData) => {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Prepare data for Excel
  const excelData = [
    ['BALANCE SHEET'],
    [`Customer: ${data.customerName} | Serial: ${data.serialNumber}`],
    [`As on ${new Date(data.reportDate).toLocaleDateString('en-IN')}`],
    [''],
    ['ASSETS'],
    ['Current Assets:'],
    ['  Cash and Cash Equivalents', formatIndianCurrency(data.assets.currentAssets.cash)],
    ['  Trade Receivables', formatIndianCurrency(data.assets.currentAssets.receivables)],
    ['  Other Current Assets', formatIndianCurrency(data.assets.currentAssets.otherCurrentAssets)],
    ['  Total Current Assets', formatIndianCurrency(data.assets.currentAssets.totalCurrentAssets)],
    [''],
    ['Non-Current Assets:'],
    ['  Financial Assets - Investments', formatIndianCurrency(data.assets.fixedAssets.investments)],
    ['  Other Non-Current Assets', formatIndianCurrency(data.assets.fixedAssets.otherFixedAssets)],
    ['  Total Non-Current Assets', formatIndianCurrency(data.assets.fixedAssets.totalFixedAssets)],
    [''],
    ['TOTAL ASSETS', formatIndianCurrency(data.assets.totalAssets)],
    [''],
    ['EQUITY AND LIABILITIES'],
    ['Equity:'],
    ['  Paid-up Capital', formatIndianCurrency(data.equity.paidUpCapital)],
    ['  Retained Earnings', formatIndianCurrency(data.equity.retainedEarnings)],
    ['  Reserves and Surplus', formatIndianCurrency(data.equity.reservesAndSurplus)],
    ['  Total Equity', formatIndianCurrency(data.equity.totalEquity)],
    [''],
    ['Current Liabilities:'],
    ['  Short-term Loans', formatIndianCurrency(data.liabilities.currentLiabilities.shortTermLoans)],
    ['  Trade Payables', formatIndianCurrency(data.liabilities.currentLiabilities.payables)],
    ['  Accrued Interest', formatIndianCurrency(data.liabilities.currentLiabilities.accruedInterest)],
    ['  Other Current Liabilities', formatIndianCurrency(data.liabilities.currentLiabilities.accruedExpenses)],
    ['  Total Current Liabilities', formatIndianCurrency(data.liabilities.currentLiabilities.totalCurrentLiabilities)],
    [''],
    ['Non-Current Liabilities:'],
    ['  Long-term Loans', formatIndianCurrency(data.liabilities.longTermLiabilities.longTermLoans)],
    ['  Other Non-Current Liabilities', formatIndianCurrency(data.liabilities.longTermLiabilities.otherLongTermLiabilities)],
    ['  Total Non-Current Liabilities', formatIndianCurrency(data.liabilities.longTermLiabilities.totalLongTermLiabilities)],
    [''],
    ['TOTAL EQUITY AND LIABILITIES', formatIndianCurrency(data.equity.totalEquity + data.liabilities.totalLiabilities)],
    [''],
    ['TRANSACTION SUMMARY'],
    ['Total Loan Amount', formatIndianCurrency(data.transactionSummary.totalBorrowed)],
    ['Total Amount Repaid', formatIndianCurrency(data.transactionSummary.totalRepaid)],
    ['Outstanding Balance', formatIndianCurrency(data.transactionSummary.outstandingBalance)],
    ['Total Accrued Interest', formatIndianCurrency(data.transactionSummary.accruedInterest)],
    ['Paid Interest', formatIndianCurrency(data.transactionSummary.paidInterest)],
    [''],
    ['Ind AS Compliance Note: This balance sheet is prepared in accordance with Indian Accounting Standards'],
    ['(Ind AS 1, 18, 39) and is suitable for income tax filing purposes. All amounts are in Indian Rupees (₹).']
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Set column widths
  ws['!cols'] = [
    { width: 30 },
    { width: 20 }
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');

  // Save the Excel file
  const fileName = `BalanceSheet_${data.customerName.replace(/\s+/g, '_')}_${data.serialNumber}_${new Date(data.reportDate).toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
