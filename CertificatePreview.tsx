// src/components/features/certificate/CertificatePreview.tsx
// This component displays a visual preview of a certificate.
// It shows key information like student name, course name, date, and a unique ID.
// It aims for a scaled, non-editable representation, possibly using an image template.
// Developed by Luccas A E | 2025

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // For formatting dates
import { Certificate } from '@/types'; // Assuming Certificate type is defined

// Define the props for the CertificatePreview component
export interface CertificatePreviewProps {
  /** Data for the certificate to be previewed. */
  certificateData: Pick<Certificate, 'studentName' | 'courseName' | 'issuedAt' | 'uniqueCertificateId'>;
  /**
   * URL for the certificate background template image.
   * Defaults to a placeholder if not provided.
   * As per Nsbs official file list: `public/images/certificate-template.png`
   */
  templateImageUrl?: string;
  /** Optional: className for custom styling of the container. */
  className?: string;
  /** Optional: Scale factor for the preview (e.g., 0.5 for half size). Defaults to 1. */
  scale?: number;
}

/**
 * CertificatePreview component provides a visual, scaled representation of a certificate.
 * It is designed for display purposes and is not an editable document.
 */
export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  certificateData,
  templateImageUrl = '/images/certificate-template.png', // Default path as per Nsbs file list
  className,
  scale = 0.7, // Default scale to make it fit typical UI spaces
}) => {
  const { studentName, courseName, issuedAt, uniqueCertificateId } = certificateData;

  // Define typical dimensions for a certificate (e.g., A4 landscape in pixels at 96 DPI)
  // These are illustrative and should match the actual certificate template.
  const baseWidth = 1123; // A4 landscape width at 96 DPI (approx 29.7cm)
  const baseHeight = 794; // A4 landscape height at 96 DPI (approx 21cm)

  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;

  // Styles for text elements, positions would be absolute relative to the certificate container
  // These positions are highly dependent on the templateImageUrl design.
  // Using percentages for somewhat responsive positioning within the scaled certificate.
  // These values would need to be fine-tuned with the actual certificate template.
  // For production, these could be configurable or derived from template metadata.

  const nameStyle: React.CSSProperties = {
    position: 'absolute',
    top: '42%', // Example position
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: `${2.8 * scale}rem`, // Scaled font size
    fontWeight: 600,
    color: '#2c3e50', // Example text color, ensure high contrast
    textAlign: 'center',
    width: '70%', // Prevent overflow
    fontFamily: '"Times New Roman", Times, serif', // Classical font
  };

  const courseNameStyle: React.CSSProperties = {
    position: 'absolute',
    top: '57%', // Example position
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: `${1.5 * scale}rem`,
    color: '#34495e',
    textAlign: 'center',
    width: '80%',
    fontStyle: 'italic',
  };

  const dateStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '18%', // Example position
    left: '25%', // Example for date
    transform: 'translateX(-50%)',
    fontSize: `${1.0 * scale}rem`,
    color: '#555',
  };

  const idStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '12%', // Example position
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: `${0.75 * scale}rem`,
    color: '#777',
    fontFamily: 'monospace',
  };

   const issuedByStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '18%',
    right: '15%', // Example
    transform: 'translateX(50%)',
    fontSize: `${1.0 * scale}rem`,
    color: '#555',
    textAlign: 'center',
  };


  return (
    <div
      className={cn(
        'relative bg-white shadow-lg overflow-hidden border border-gray-300 dark:border-gray-700',
        className
      )}
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        backgroundImage: `url(${templateImageUrl})`,
        backgroundSize: 'cover', // Ensure template image covers the area
        backgroundPosition: 'center',
        // Adding a subtle pattern or texture if template is minimal
        // backgroundColor: '#f9f9f0', // Creamy off-white as a fallback
      }}
      role="img"
      aria-label={`Certificate preview for ${studentName} for the course ${courseName}`}
    >
      {/* Render certificate details positioned absolutely over the template */}
      {/* Ensure text is accessible (WCAG AA contrast against background) */}
      <div style={nameStyle} aria-label={`Student Name: ${studentName}`}>
        {studentName || 'Sample Student Name'}
      </div>
      <p style={courseNameStyle} aria-label={`Course Name: ${courseName}`}>
        {courseName || 'Sample Course Title Goes Here'}
      </p>
      <p style={dateStyle} aria-label={`Date Issued: ${format(new Date(issuedAt), 'MMMM d, yyyy')}`}>
        Date Issued: {format(new Date(issuedAt), 'MMMM d, yyyy') || 'Month DD, YYYY'}
      </p>
       <div style={issuedByStyle}>
        <p style={{ fontWeight: 'bold', marginBottom: `${0.5*scale}rem`}}>National Society of</p>
        <p style={{ fontWeight: 'bold'}}>Business Sciences</p>
      </div>
      <p style={idStyle} aria-label={`Certificate ID: ${uniqueCertificateId}`}>
        Certificate ID: {uniqueCertificateId || 'NSBS-XXXX-XXXX-XXXX'}
      </p>
      {/* Developed by Luccas A E | 2025 (as a comment, not displayed on certificate) */}
    </div>
  );
};