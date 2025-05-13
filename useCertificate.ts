// src/hooks/useCertificate.ts
// This hook is responsible for fetching user certificate data, handling the
// download process for certificate PDFs, and managing verification status if applicable.
// Developed by Luccas A E | 2025

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Certificate, ApiErrorResponse, GenerateCertificateResponse } from '@/types';
import { useToast } from './useToast';
import { useBetterAuthSession } from './useBetterAuthSession';

// --- Constants ---
const CERTIFICATE_QUERY_KEY_PREFIX = 'certificate';
const USER_CERTIFICATES_QUERY_KEY = [CERTIFICATE_QUERY_KEY_PREFIX, 'userCertificates'];

// --- API Interaction Functions ---

/**
 * Fetches all certificates for the currently authenticated user.
 * @returns Promise<Certificate[]>
 */
const fetchUserCertificates = async (): Promise<Certificate[]> => {
  const response = await fetch('/api/certificates/me'); // Example API endpoint
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message || 'Failed to fetch user certificates');
  }
  const successData = await response.json();
  return successData.data;
};

/**
 * Fetches a specific certificate by its ID or course ID for the current user.
 * @param certificateIdOrCourseId The ID of the certificate or the course ID.
 * @returns Promise<Certificate>
 */
const fetchCertificate = async (certificateIdOrCourseId: string): Promise<Certificate> => {
  // API might allow fetching by certificateId or by courseId for the user's certificate
  const response = await fetch(`/api/certificate/${certificateIdOrCourseId}`); // Example endpoint
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message || 'Failed to fetch certificate');
  }
  const successData = await response.json();
  return successData.data;
};

/**
 * Triggers certificate PDF generation and download.
 * This might involve fetching a URL or a direct blob.
 * @param courseId - The ID of the course for which to download the certificate.
 * @returns Promise<{ downloadUrl?: string; blob?: Blob; fileName: string }>
 */
const downloadCertificatePdf = async (courseId: string): Promise<{ downloadUrl?: string; blob?: Blob; fileName: string }> => {
  // The API endpoint `/api/certificate/[courseId]` as per Nsbs essentials .txt [cite: 84]
  // seems to be for downloading.
  const response = await fetch(`/api/certificate/${courseId}/download`); // Or a specific download endpoint
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json().catch(() => ({
        // Fallback if response is not JSON
        success: false,
        error: { message: `Certificate download failed with status: ${response.status}`},
        timestamp: new Date().toISOString()
    }));
    throw new Error(errorData.error.message || 'Certificate download failed.');
  }

  // Check content type to determine if it's a URL or direct PDF data
  const contentType = response.headers.get('content-type');
  const contentDisposition = response.headers.get('content-disposition');
  let fileName = `NSBS_Certificate_Course_${courseId}.pdf`;

  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (fileNameMatch && fileNameMatch.length > 1) {
      fileName = fileNameMatch[1];
    }
  }

  if (contentType && contentType.includes('application/json')) {
    // API returns JSON with a download URL
    const jsonResponse: GenerateCertificateResponse = await response.json();
    if (jsonResponse.data.certificateUrl) {
      return { downloadUrl: jsonResponse.data.certificateUrl, fileName };
    } else {
      throw new Error('Certificate download URL not provided.');
    }
  } else if (contentType && contentType.includes('application/pdf')) {
    // API returns PDF blob directly
    const blob = await response.blob();
    return { blob, fileName };
  } else {
    throw new Error('Unexpected response format for certificate download.');
  }
};


// --- Hook Definition ---

export interface UseCertificateOptions {
  certificateId?: string; // For fetching a specific certificate by its own ID
  courseId?: string;      // For fetching a certificate related to a specific course, or downloading it
  fetchAll?: boolean;     // To fetch all certificates for the user
}

/**
 * Custom hook for managing user certificates.
 */
export function useCertificate(options: UseCertificateOptions = {}) {
  const { certificateId, courseId, fetchAll } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: session, status: authStatus } = useBetterAuthSession();
  const isAuthenticated = authStatus === 'authenticated' && !!session?.user;

  // Query to fetch all certificates for the user
  const {
    data: userCertificates,
    isLoading: isLoadingUserCertificates,
    error: userCertificatesError,
    refetch: refetchUserCertificates,
  } = useQuery<Certificate[], Error>({
    queryKey: USER_CERTIFICATES_QUERY_KEY,
    queryFn: fetchUserCertificates,
    enabled: isAuthenticated && fetchAll && !certificateId && !courseId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Query to fetch a specific certificate (by its ID or associated course ID)
  const specificCertIdToFetch = certificateId || courseId; // API might use courseId to find user's cert
  const {
    data: specificCertificate,
    isLoading: isLoadingSpecificCertificate,
    error: specificCertificateError,
    refetch: refetchSpecificCertificate,
  } = useQuery<Certificate, Error>({
    queryKey: [CERTIFICATE_QUERY_KEY_PREFIX, specificCertIdToFetch],
    queryFn: () => fetchCertificate(specificCertIdToFetch!),
    enabled: isAuthenticated && !!specificCertIdToFetch && !fetchAll,
    staleTime: 1000 * 60 * 15,
  });

  // Mutation for downloading a certificate
  const { mutate: initiateCertificateDownload, isLoading: isDownloadingCertificate } = useMutation<
    { downloadUrl?: string; blob?: Blob; fileName: string }, // Success type
    Error, // Error type
    string // courseId
  >(downloadCertificatePdf, {
    onSuccess: (data) => {
      try {
        const link = document.createElement('a');
        if (data.blob) {
          const url = window.URL.createObjectURL(data.blob);
          link.href = url;
          link.download = data.fileName;
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url);
          link.remove();
        } else if (data.downloadUrl) {
          // If it's a direct URL, can open in new tab or trigger download
          // Forcing download might require server to set Content-Disposition: attachment
          link.href = data.downloadUrl;
          link.target = '_blank'; // Open in new tab, or browser might download directly
          link.download = data.fileName; // Suggest filename (browser support varies)
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
        toast({
          title: 'Download Started',
          description: `Your certificate "${data.fileName}" is downloading.`,
          variant: 'success',
        });
      } catch (e) {
         const err = e instanceof Error ? e : new Error('Client-side download error');
         toast({ title: 'Download Error', description: err.message, variant: 'destructive' });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Download Failed',
        description: error.message || 'Could not download the certificate.',
        variant: 'destructive',
      });
    },
  });

  // --- Derived Data & Helper Functions ---
  const certificateToDisplay = certificateId ? specificCertificate : (courseId && userCertificates ? userCertificates.find(c => c.courseId === courseId) : undefined);

  return {
    // Data for a specific certificate
    certificate: certificateId ? specificCertificate : (courseId ? certificateToDisplay : undefined),
    isLoadingCertificate: isLoadingSpecificCertificate,
    certificateError: specificCertificateError,
    refetchCertificate: refetchSpecificCertificate,

    // Data for all user certificates
    userCertificates,
    isLoadingUserCertificates,
    userCertificatesError,
    refetchUserCertificates,

    // Actions
    downloadCertificate: initiateCertificateDownload, // Pass courseId to this function
    isDownloadingCertificate,

    // Verification status (placeholder, needs backend support)
    // verifyCertificate: async (uniqueCertId: string) => { /* API call */ return true; },
    // isVerifyingCertificate,
  };
}