
// src/lib/pdfGenerator.ts

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from './dates';

// Define types for certificate data
interface CertificateData {
  id: string;
  recipientName: string;
  courseName: string;
  issueDate: string | Date;
  completionDate: string | Date;
  certificateId: string;
}

// Define styling constants
const COLORS = {
  primary: [41, 98, 255], // RGB value
  secondary: [23, 23, 23],
  accent: [245, 158, 11],
  text: [33, 33, 33],
  border: [200, 200, 200],
};

/**
 * Generates a PDF certificate based on provided certificate data.
 * 
 * @param certificateData The data to use for certificate generation
 * @returns A Blob containing the generated PDF
 */
export function generateCertificatePDF(certificateData: CertificateData): Blob {
  // Initialize PDF document (A4 landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Document dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);

  // Add border
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(1);
  doc.rect(margin, margin, contentWidth, contentHeight);

  // Add decorative inner border
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.rect(margin + 5, margin + 5, contentWidth - 10, contentHeight - 10);

  // Add header
  doc.setFontSize(30);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, margin + 20, { align: 'center' });

  // Add NSBS Platform text
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text('NSBS Learning Platform', pageWidth / 2, margin + 30, { align: 'center' });

  // Add recipient name
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('This certificate is awarded to:', pageWidth / 2, margin + 50, { align: 'center' });

  doc.setFontSize(30);
  doc.setTextColor(...COLORS.primary);
  doc.text(certificateData.recipientName, pageWidth / 2, margin + 65, { align: 'center' });

  // Add course completion text
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'for successfully completing the course:',
    pageWidth / 2,
    margin + 80,
    { align: 'center' }
  );

  // Add course name
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.secondary);
  doc.setFont('helvetica', 'bold');
  doc.text(certificateData.courseName, pageWidth / 2, margin + 95, { align: 'center' });

  // Add completion date
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Completed on: ${formatDate(certificateData.completionDate, 'MMMM d, yyyy')}`,
    pageWidth / 2,
    margin + 115,
    { align: 'center' }
  );

  // Add certificate ID
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    `Certificate ID: ${certificateData.certificateId}`,
    pageWidth / 2,
    pageHeight - margin - 15,
    { align: 'center' }
  );

  // Add issue date
  doc.setFontSize(10);
  doc.text(
    `Issue Date: ${formatDate(certificateData.issueDate, 'MMMM d, yyyy')}`,
    pageWidth / 2,
    pageHeight - margin - 10,
    { align: 'center' }
  );

  // Convert the PDF to a blob and return it
  return doc.output('blob');
}

/**
 * Generates a downloadable certificate filename based on recipient and course
 * 
 * @param recipientName The name of the certificate recipient
 * @param courseName The name of the completed course
 * @returns A formatted filename string
 */
export function generateCertificateFilename(recipientName: string, courseName: string): string {
  const sanitizedRecipient = recipientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const sanitizedCourse = courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `nsbs_certificate_${sanitizedCourse}_${sanitizedRecipient}_${timestamp}.pdf`;
}

/* Developed by Luccas A E | 2025 */
