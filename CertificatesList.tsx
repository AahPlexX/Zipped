// src/components/features/certificate/CertificatesList.tsx
// This component fetches and displays a list of certificates earned by the user.
// It provides options for sorting, filtering, and downloading each certificate.
// Developed by Luccas A E | 2025

'use client';

import React, { useState, useMemo } from 'react';
import { Certificate } from '@/types'; // Using our defined Certificate type
import { useCertificate } from '@/hooks/useCertificate'; // Hook to fetch certificates
import { CertificateDownloadButton } from './CertificateDownloadButton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Search, FileText, ShieldCheck, CalendarDays, Info } from 'lucide-react'; // Icons
import { format } from 'date-fns'; // For date formatting
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // For empty/error states

// Define sorting options
type SortKey = 'courseName' | 'issuedAt';
type SortOrder = 'asc' | 'desc';

export interface CertificatesListProps {
  /** Optional: Custom class name for the main container. */
  className?: string;
  /** Optional: Initial filter text. */
  initialFilterText?: string;
  /** Optional: Initial sort configuration. */
  initialSort?: { key: SortKey; order: SortOrder };
}

/**
 * CertificatesList component displays a filterable and sortable list of a user's earned certificates.
 */
export const CertificatesList: React.FC<CertificatesListProps> = ({
  className,
  initialFilterText = '',
  initialSort = { key: 'issuedAt', order: 'desc' },
}) => {
  const {
    userCertificates,
    isLoadingUserCertificates,
    userCertificatesError,
    refetchUserCertificates,
  } = useCertificate({ fetchAll: true });

  const [filterText, setFilterText] = useState<string>(initialFilterText);
  const [sortKey, setSortKey] = useState<SortKey>(initialSort.key);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSort.order);

  // Memoized and sorted/filtered certificates
  const processedCertificates = useMemo(() => {
    if (!userCertificates) return [];

    let certs = [...userCertificates];

    // Filtering
    if (filterText) {
      const lowerFilterText = filterText.toLowerCase();
      certs = certs.filter(cert =>
        cert.courseName.toLowerCase().includes(lowerFilterText) ||
        cert.uniqueCertificateId.toLowerCase().includes(lowerFilterText)
      );
    }

    // Sorting
    certs.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'courseName') {
        comparison = a.courseName.localeCompare(b.courseName);
      } else if (sortKey === 'issuedAt') {
        comparison = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return certs;
  }, [userCertificates, filterText, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // --- Loading State ---
  if (isLoadingUserCertificates) {
    return (
      <div className={cn('space-y-4 p-4 md:p-6', className)}>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Skeleton className="h-10 w-full sm:w-1/2" />
          <Skeleton className="h-10 w-full sm:w-1/4" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        ))}
        {/* Developed by Luccas A E | 2025 */}
      </div>
    );
  }

  // --- Error State ---
  if (userCertificatesError) {
    return (
      <Alert variant="destructive" className={cn('m-4 md:m-6', className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Certificates</AlertTitle>
        <AlertDescription>
          {userCertificatesError.message || 'An unexpected error occurred.'}
          <Button variant="link" onClick={() => refetchUserCertificates()} className="ml-2 p-0 h-auto">Try again</Button>
        </AlertDescription>
      </Alert>
    );
  }

  // --- Empty State ---
  if (!userCertificates || userCertificates.length === 0) {
    return (
      <Alert className={cn('m-4 md:m-6 text-center', className)}>
        <Info className="h-4 w-4" />
        <AlertTitle>No Certificates Earned Yet</AlertTitle>
        <AlertDescription>
          You haven't earned any certificates. Complete your courses and pass the final exams to receive them.
        </AlertDescription>
        {/* Optional: Link to courses page */}
        {/* <Button asChild variant="outline" className="mt-4"><Link href="/courses">Explore Courses</Link></Button> */}
      </Alert>
    );
  }

  // --- Main Content: List/Table of Certificates ---
  return (
    <div className={cn('p-4 md:p-6 space-y-6', className)}>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">My Certificates</CardTitle>
          <CardDescription>View, manage, and download your earned course certificates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
            <div className="relative w-full sm:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by course name or ID..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-10 w-full"
                aria-label="Filter certificates"
              />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <Select
                value={`${sortKey}-${sortOrder}`}
                onValueChange={(value) => {
                  const [key, order] = value.split('-') as [SortKey, SortOrder];
                  setSortKey(key);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger aria-label="Sort certificates">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issuedAt-desc">Date Issued (Newest)</SelectItem>
                  <SelectItem value="issuedAt-asc">Date Issued (Oldest)</SelectItem>
                  <SelectItem value="courseName-asc">Course Name (A-Z)</SelectItem>
                  <SelectItem value="courseName-desc">Course Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {processedCertificates.length === 0 && filterText && (
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>No Matching Certificates</AlertTitle>
              <AlertDescription>Your filter criteria did not match any of your certificates. Try adjusting your search.</AlertDescription>
            </Alert>
          )}

          {/* Using Table for a structured view, could also use a list of Cards */}
          {processedCertificates.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[40%]"
                      onClick={() => handleSort('courseName')}
                      aria-sort={sortKey === 'courseName' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Course Name
                      {sortKey === 'courseName' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[30%]"
                      onClick={() => handleSort('issuedAt')}
                      aria-sort={sortKey === 'issuedAt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Date Issued
                      {sortKey === 'issuedAt' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </TableHead>
                    <TableHead className="w-[20%] text-center">Certificate ID</TableHead>
                    <TableHead className="text-right w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                        {cert.courseName}
                      </TableCell>
                      <TableCell>
                        <CalendarDays className="mr-2 h-4 w-4 inline text-muted-foreground" />
                        {format(new Date(cert.issuedAt), 'MMMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        <ShieldCheck className="mr-1 h-4 w-4 inline text-green-600" />
                        {cert.uniqueCertificateId.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="text-right">
                        <CertificateDownloadButton
                          courseId={cert.courseId}
                          userId={cert.userId} // Assuming userId is on cert type
                          certificateFileName={`${cert.courseName.replace(/\s+/g, '_')}_Certificate_${cert.uniqueCertificateId}.pdf`}
                          variant="outline"
                          size="sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Developed by Luccas A E | 2025 */}
    </div>
  );
};