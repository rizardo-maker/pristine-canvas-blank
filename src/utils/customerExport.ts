
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Customer } from '@/context/FinanceContext';

export const exportCustomersToPDF = (customers: Customer[], areaName?: string) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 30;

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CUSTOMER DETAILS REPORT', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  if (areaName) {
    pdf.text(`Area: ${areaName}`, margin, yPosition);
    yPosition += 8;
  }
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, margin, yPosition);
  pdf.text(`Total Customers: ${customers.length}`, pageWidth - margin - 80, yPosition);
  
  yPosition += 20;

  // Table Headers
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Serial #', margin, yPosition);
  pdf.text('Name', margin + 40, yPosition);
  pdf.text('Amount Given', margin + 100, yPosition);
  pdf.text('Amount Paid', margin + 150, yPosition);
  pdf.text('Due Amount', pageWidth - margin - 40, yPosition);
  
  yPosition += 5;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Customer Data
  pdf.setFont('helvetica', 'normal');
  customers.forEach((customer) => {
    const dueAmount = customer.totalAmountToBePaid - customer.totalPaid;
    
    pdf.text(customer.serialNumber, margin, yPosition);
    pdf.text(customer.name.substring(0, 20), margin + 40, yPosition);
    pdf.text(`₹${customer.totalAmountGiven.toLocaleString()}`, margin + 100, yPosition);
    pdf.text(`₹${customer.totalPaid.toLocaleString()}`, margin + 150, yPosition);
    pdf.text(`₹${dueAmount.toLocaleString()}`, pageWidth - margin - 40, yPosition, { align: 'right' });
    
    yPosition += 8;
    
    // Add new page if needed
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 30;
    }
  });

  // Summary
  const totalGiven = customers.reduce((sum, c) => sum + c.totalAmountGiven, 0);
  const totalPaid = customers.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalDue = customers.reduce((sum, c) => sum + (c.totalAmountToBePaid - c.totalPaid), 0);

  yPosition += 10;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('SUMMARY', margin, yPosition);
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total Amount Given: ₹${totalGiven.toLocaleString()}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Total Amount Paid: ₹${totalPaid.toLocaleString()}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Total Due Amount: ₹${totalDue.toLocaleString()}`, margin, yPosition);

  // Save the PDF
  const fileName = `CustomerReport_${areaName ? areaName.replace(/\s+/g, '_') + '_' : ''}${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export const exportCustomersToExcel = (customers: Customer[], areaName?: string) => {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Prepare headers
  const headers = [
    'Serial Number',
    'Customer Name',
    'Address',
    'Issued Date',
    'Amount Given (₹)',
    'Amount to be Paid (₹)',
    'Amount Paid (₹)',
    'Due Amount (₹)',
    'Status'
  ];

  // Prepare data
  const excelData = [
    headers,
    ...customers.map(customer => [
      customer.serialNumber,
      customer.name,
      customer.address,
      customer.issuedDate,
      customer.totalAmountGiven,
      customer.totalAmountToBePaid,
      customer.totalPaid,
      customer.totalAmountToBePaid - customer.totalPaid,
      customer.isFullyPaid ? 'Paid' : 'Pending'
    ])
  ];

  // Add summary
  const totalGiven = customers.reduce((sum, c) => sum + c.totalAmountGiven, 0);
  const totalPaid = customers.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalDue = customers.reduce((sum, c) => sum + (c.totalAmountToBePaid - c.totalPaid), 0);

  excelData.push(
    [],
    ['SUMMARY'],
    ['Total Amount Given (₹)', totalGiven],
    ['Total Amount Paid (₹)', totalPaid],
    ['Total Due Amount (₹)', totalDue],
    ['Total Customers', customers.length]
  );

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Set column widths
  ws['!cols'] = [
    { width: 15 }, // Serial Number
    { width: 25 }, // Customer Name
    { width: 30 }, // Address
    { width: 12 }, // Issued Date
    { width: 15 }, // Amount Given
    { width: 18 }, // Amount to be Paid
    { width: 15 }, // Amount Paid
    { width: 15 }, // Due Amount
    { width: 10 }  // Status
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Customer Report');

  // Save the Excel file
  const fileName = `CustomerReport_${areaName ? areaName.replace(/\s+/g, '_') + '_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const printCustomerReport = (customers: Customer[], areaName?: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const totalGiven = customers.reduce((sum, c) => sum + c.totalAmountGiven, 0);
  const totalPaid = customers.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalDue = customers.reduce((sum, c) => sum + (c.totalAmountToBePaid - c.totalPaid), 0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Customer Details Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; }
          .text-right { text-align: right; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CUSTOMER DETAILS REPORT</h1>
        </div>
        <div class="info">
          <div>${areaName ? `Area: ${areaName}` : 'All Areas'}</div>
          <div>Generated on: ${new Date().toLocaleDateString('en-IN')}</div>
          <div>Total Customers: ${customers.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Serial #</th>
              <th>Customer Name</th>
              <th>Amount Given (₹)</th>
              <th>Amount Paid (₹)</th>
              <th>Due Amount (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(customer => {
              const dueAmount = customer.totalAmountToBePaid - customer.totalPaid;
              return `
                <tr>
                  <td>${customer.serialNumber}</td>
                  <td>${customer.name}</td>
                  <td class="text-right">${customer.totalAmountGiven.toLocaleString()}</td>
                  <td class="text-right">${customer.totalPaid.toLocaleString()}</td>
                  <td class="text-right">${dueAmount.toLocaleString()}</td>
                  <td>${customer.isFullyPaid ? 'Paid' : 'Pending'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="summary">
          <h3>SUMMARY</h3>
          <p><strong>Total Amount Given:</strong> ₹${totalGiven.toLocaleString()}</p>
          <p><strong>Total Amount Paid:</strong> ₹${totalPaid.toLocaleString()}</p>
          <p><strong>Total Due Amount:</strong> ₹${totalDue.toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
