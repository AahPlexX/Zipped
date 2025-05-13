
// src/lib/exports.ts

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from './dates';

/**
 * Converts an array of objects to CSV format
 * 
 * @param data Array of objects to convert
 * @param columns Optional column definitions
 * @returns CSV string
 */
export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (!data || !data.length) {
    return '';
  }
  
  // If columns are not provided, use object keys from first item
  const exportColumns = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    header: key as string,
  }));
  
  // Create header row
  const headerRow = exportColumns.map(col => `"${col.header}"`).join(',');
  
  // Create data rows
  const csvRows = data.map(item => {
    return exportColumns.map(column => {
      const value = item[column.key];
      
      // Format the value appropriately for CSV
      if (value === null || value === undefined) {
        return '""';
      } else if (typeof value === 'string') {
        // Escape quotes in string and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`;
      } else if (value instanceof Date) {
        return `"${formatDate(value)}"`;
      } else if (typeof value === 'object') {
        try {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } catch (e) {
          return '""';
        }
      } else {
        return `"${value}"`;
      }
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...csvRows].join('\n');
}

/**
 * Generates a PDF report from tabular data
 * 
 * @param data Array of objects to include in the report
 * @param columns Column definitions for the report
 * @param title Report title
 * @param subtitle Optional report subtitle
 * @returns PDF as a Blob
 */
export function exportToPdf<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string; width?: number }[],
  title: string,
  subtitle?: string
): Blob {
  // Initialize PDF document (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Document dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Add title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, margin, { align: 'center' });
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(subtitle, pageWidth / 2, margin + 8, { align: 'center' });
  }
  
  // Add timestamp
  doc.setFontSize(10);
  doc.text(
    `Generated: ${formatDate(new Date(), 'PPpp')}`,
    pageWidth - margin,
    margin,
    { align: 'right' }
  );
  
  // Prepare table data
  const headers = columns.map(col => col.header);
  
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      
      // Format value for display
      if (value === null || value === undefined) {
        return '';
      } else if (value instanceof Date) {
        return formatDate(value);
      } else if (typeof value === 'object') {
        try {
          return JSON.stringify(value);
        } catch (e) {
          return '';
        }
      } else {
        return String(value);
      }
    });
  });
  
  // Set column widths if provided
  const columnStyles: Record<number, { cellWidth?: number }> = {};
  columns.forEach((col, index) => {
    if (col.width) {
      columnStyles[index] = { cellWidth: col.width };
    }
  });
  
  // Generate table
  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: subtitle ? margin + 15 : margin + 10,
    margin: { left: margin, right: margin },
    columnStyles,
    headStyles: {
      fillColor: [41, 98, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    useCss: true,
    // Add pagination footer
    didDrawPage: (data: any) => {
      // Add page number at the bottom
      doc.setFontSize(10);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });
  
  // Convert the PDF to a blob and return it
  return doc.output('blob');
}

/**
 * Downloads data as a CSV file
 * 
 * @param data Array of objects to download
 * @param columns Optional column definitions
 * @param filename Filename for the download
 */
export function downloadCsv<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; header: string }[],
  filename: string = 'export.csv'
): void {
  // Convert data to CSV
  const csvContent = exportToCsv(data, columns);
  
  // Create a Blob from the CSV string
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  downloadBlob(blob, filename);
}

/**
 * Downloads data as a PDF file
 * 
 * @param data Array of objects to download
 * @param columns Column definitions
 * @param title Report title
 * @param subtitle Optional report subtitle
 * @param filename Filename for the download
 */
export function downloadPdf<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string; width?: number }[],
  title: string,
  subtitle?: string,
  filename: string = 'report.pdf'
): void {
  // Generate PDF
  const pdfBlob = exportToPdf(data, columns, title, subtitle);
  
  // Download the PDF file
  downloadBlob(pdfBlob, filename);
}

/**
 * Helper function to download a Blob as a file
 * 
 * @param blob The Blob to download
 * @param filename Filename for the download
 */
function downloadBlob(blob: Blob, filename: string): void {
  // Create a link element
  const link = document.createElement('a');
  
  // Set link properties
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  
  // Append to document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object after a delay
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 100);
}

/* Developed by Luccas A E | 2025 */
