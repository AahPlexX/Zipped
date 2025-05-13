// src/components/features/certificate/CertificateDownloadButton.tsx
// This component provides a button for users to download their course certificate PDF.
// It handles the API request for certificate generation/retrieval and manages loading/error states.
// Developed by Luccas A E | 2025

'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button'; // Using shadcn/ui Button
import { Download, Loader2, AlertCircle } from 'lucide-react'; // Icons for states
import { useCertificate } from '@/hooks/useCertificate'; // Hook to handle certificate logic
import { useToast } from '@/hooks/useToast'; // For user feedback
import { cn } from '@/lib/utils';

export interface CertificateDownloadButtonProps extends Omit<ButtonProps, 'onClick' | 'disabled' | 'children'> {
  /** The ID of the course for which the certificate is to be downloaded. */
  courseId: string;
  /** Optional: The user ID, if not implicitly handled by the session in useCertificate. */
  userId?: string; // userId might be handled by useCertificate hook via session
  /** Custom label for the button. Defaults to "Download Certificate". */
  buttonLabel?: string;
  /** Optional: Provide specific certificate details if already known, for filename or verification. */
  certificateFileName?: string; // To suggest a filename for download
  /** Optional: Callback function after a successful download attempt (not necessarily success of file save by user). */
  onDownloadAttempted?: (success: boolean) => void;
}

/**
 * CertificateDownloadButton component allows users to initiate the download of their certificate.
 */
export const CertificateDownloadButton: React.FC<CertificateDownloadButtonProps> = ({
  courseId,
  userId, // userId might be passed to useCertificate if needed, or handled by its session logic
  buttonLabel = 'Download Certificate',
  certificateFileName,
  onDownloadAttempted,
  className,
  variant = 'default',
  size = 'default',
  ...restButtonProps
}) => {
  const { downloadCertificate, isDownloadingCertificate } = useCertificate({ courseId });
  const { toast } = useToast();

  const handleDownload = async () => {
    if (isDownloadingCertificate) return;

    try {
      // The downloadCertificate mutation in useCertificate handles actual download prompting
      await downloadCertificate(courseId, {
        onSuccess: (data) => {
          // The success toast and file prompting is handled within the useCertificate hook's mutation.
          // This callback is more for the consuming component if needed.
          if (onDownloadAttempted) onDownloadAttempted(true);
        },
        onError: (error) => {
          // Error toast is also handled within the useCertificate hook's mutation.
          console.error('Certificate download error callback in component:', error);
          if (onDownloadAttempted) onDownloadAttempted(false);
        }
      });
    } catch (error) {
      // This catch block is mostly a fallback, as useMutation should handle errors.
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during download.';
      toast({
        title: 'Download Error',
        description: errorMessage,
        variant: 'destructive',
      });
      if (onDownloadAttempted) onDownloadAttempted(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloadingCertificate}
      className={cn('flex items-center gap-2', className)}
      variant={variant}
      size={size}
      aria-label={isDownloadingCertificate ? 'Downloading certificate...' : buttonLabel}
      {...restButtonProps}
    >
      {isDownloadingCertificate ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isDownloadingCertificate ? 'Downloading...' : buttonLabel}</span>
      {/* Developed by Luccas A E | 2025 (within button if space or as comment) */}
    </Button>
  );
};