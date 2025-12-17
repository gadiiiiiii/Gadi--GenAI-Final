import { QuoteData } from '../types';

// This file will be used on client side only
export function generateQuotePDF(quote: QuoteData): Blob {
  // Dynamic import to avoid SSR issues
  const jsPDF = require('jspdf');
  require('jspdf-autotable');

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RIVERHAWK COMPANY', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Industrial Supply Solutions', 105, 27, { align: 'center' });
  doc.text('123 Industrial Parkway | Chicago, IL 60007', 105, 32, { align: 'center' });
  doc.text('Phone: (555) 123-4567 | quotes@riverhawk.com', 105, 37, { align: 'center' });

  // Quote info
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 20, 55);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quote Number: ${quote.quoteNumber}`, 20, 65);
  doc.text(`Date: ${quote.date}`, 20, 71);
  doc.text('Valid for: 30 days', 20, 77);

  // Line items table
  const tableData = quote.lineItems.map(item => [
    item.lineNumber.toString(),
    item.sku,
    item.description,
    `${item.qty} ${item.unit}`,
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.extendedPrice.toFixed(2)}`,
    item.status === 'needs-review' ? '⚠️ Review' : item.status === 'alternate' ? 'Alt' : '✓'
  ]);

  (doc as any).autoTable({
    startY: 90,
    head: [['Line', 'SKU', 'Description', 'Quantity', 'Unit Price', 'Extended', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 30 },
      2: { cellWidth: 60 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 20 }
    }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 140, finalY);
  doc.text(`$${quote.subtotal.toFixed(2)}`, 180, finalY, { align: 'right' });
  
  doc.text('Tax (8%):', 140, finalY + 6);
  doc.text(`$${quote.tax.toFixed(2)}`, 180, finalY + 6, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', 140, finalY + 14);
  doc.text(`$${quote.total.toFixed(2)}`, 180, finalY + 14, { align: 'right' });

  // Footer notes
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const footerY = finalY + 30;
  doc.text('Terms: Net 30 days. All prices are in USD and subject to change.', 20, footerY);
  doc.text('Items marked "⚠️ Review" require manual verification for availability and pricing.', 20, footerY + 5);
  doc.text('This quote was generated with AI assistance and should be verified by a sales representative.', 20, footerY + 10);

  // Generate blob
  return doc.output('blob');
}
