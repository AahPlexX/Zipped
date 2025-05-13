// src/components/features/admin/UserTable.tsx
// This component displays a table of users for administrators, enabling user management tasks.
// It includes features like sorting, filtering, pagination, and action buttons for each user.
// Developed by Luccas A E | 2025

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowUpDown, MoreHorizontal, Search, UserPlus, Edit3, Trash2, Eye, ShieldOff, ShieldCheck as ShieldOn,
} from 'lucide-react';
import { UserProfile, UserRole, UserManagementFilters } from '@/types'; // Using our defined types
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // For data fetching and mutations
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
} from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox'; // For row selection if needed

// --- API Interaction Functions (Simulated - replace with actual API client calls) ---
interface FetchUsersParams extends UserManagementFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedUsersResponse {
  users: UserProfile[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

const fetchAdminUsers = async (params: FetchUsersParams): Promise<PaginatedUsersResponse> => {
  // Simulate API call: In a real app, use query params for server-side filtering/pagination
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.role) query.append('role', params.role);
  if (params.status) query.append('status', params.status);
  if (params.searchQuery) query.append('search', params.searchQuery);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);

  const response = await fetch(`/api/admin/users?${query.toString()}`); // Example endpoint
  if (!response.ok) throw new Error('Failed to fetch users.');
  return response.json().then(res => res.data); // Assuming API response is { success: true, data: PaginatedUsersResponse }
};

const updateUserAccountStatus = async ({ userId, status }: { userId: string, status: UserProfile['accountStatus'] }): Promise<UserProfile> => {
  const response = await fetch(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update user status.');
  return response.json().then(res => res.data);
};
// --- End API Interaction Functions ---


export interface UserTableProps {
  /** Callback when "Add User" is clicked. Typically navigates to a creation form. */
  onAddUser?: () => void;
  /** Callback when "Edit User" is clicked. Passes the user ID. */
  onEditUser?: (userId: string) => void;
  /** Callback when "View User Details" is clicked. Passes the user ID. */
  onViewUser?: (userId: string) => void;
}

/**
 * UserTable component for admin user management.
 * Features sorting, filtering, pagination, and user actions.
 */
export const UserTable: React.FC<UserTableProps> = ({
  onAddUser,
  onEditUser,
  onViewUser,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({}); // For bulk actions if needed
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 }); // Current page and size

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserProfile['accountStatus'] | 'all'>('all');

  // Data fetching using React Query
  // For server-side pagination/filtering, pass pagination and filter states to fetchAdminUsers
  const { data, isLoading, error, refetch } = useQuery<PaginatedUsersResponse, Error>(
    ['adminUsers', pagination, searchQuery, roleFilter, statusFilter, sorting], // Query key includes dependencies
    () => fetchAdminUsers({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      searchQuery: searchQuery || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      sortBy: sorting[0]?.id,
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    }),
    {
      keepPreviousData: true, // Important for smooth pagination
      // staleTime: 1000 * 60 * 1, // 1 minute
    }
  );
  const users = data?.users || [];
  const pageCount = data?.totalPages || 0;


  // Mutation for updating user status
  const statusMutation = useMutation(updateUserAccountStatus, {
    onSuccess: (updatedUser) => {
      toast({ title: "Status Updated", description: `User ${updatedUser.name || updatedUser.email} status changed to ${updatedUser.accountStatus}.`, variant: 'success' });
      queryClient.invalidateQueries(['adminUsers']); // Refetch user list
    },
    onError: (err: Error) => {
      toast({ title: "Update Failed", description: err.message, variant: 'destructive' });
    },
  });

  const handleToggleStatus = (userId: string, currentStatus: UserProfile['accountStatus']) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    statusMutation.mutate({ userId, status: newStatus });
  };


  // Define columns for the table
  const columns: ColumnDef<UserProfile>[] = useMemo(() => [
    // Optional: Select column for bulk actions
    // {
    //   id: 'select',
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={table.getIsAllPageRowsSelected()}
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('name') || '-'}</div>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <span className={cn(
        "px-2 py-0.5 rounded-full text-xs font-semibold",
        row.getValue('role') === UserRole.ADMIN && "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
        row.getValue('role') === UserRole.STUDENT && "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100"
      )}>{String(row.getValue('role')).toUpperCase()}</span>,
    },
    {
      accessorKey: 'accountStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('accountStatus') as UserProfile['accountStatus'];
        return (
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center",
            status === 'active' && "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
            status === 'suspended' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
            status === 'deactivated' && "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200",
            status === 'pending_verification' && "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100"
          )}>
            {status === 'active' && <ShieldOn className="mr-1 h-3 w-3" />}
            {status === 'suspended' && <ShieldOff className="mr-1 h-3 w-3" />}
            {String(status).replace('_', ' ').toUpperCase()}
          </span>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Joined Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'MMMM d, yyyy'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onViewUser && <DropdownMenuItem onClick={() => onViewUser(user.id)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>}
              {onEditUser && <DropdownMenuItem onClick={() => onEditUser(user.id)}><Edit3 className="mr-2 h-4 w-4" />Edit User</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleToggleStatus(user.id, user.accountStatus)}
                className={user.accountStatus === 'active' ? 'text-yellow-600 focus:text-yellow-700 dark:text-yellow-400 dark:focus:text-yellow-300' : 'text-green-600 focus:text-green-700 dark:text-green-400 dark:focus:text-green-300'}
              >
                {user.accountStatus === 'active' ? <ShieldOff className="mr-2 h-4 w-4" /> : <ShieldOn className="mr-2 h-4 w-4" />}
                {user.accountStatus === 'active' ? 'Suspend' : 'Activate'} User
              </DropdownMenuItem>
              {/* Add more actions like "Delete User" with confirmation */}
              {/* <DropdownMenuItem className="text-destructive focus:text-destructive-foreground dark:text-red-500 dark:focus:text-red-400" onClick={() => console.log('Delete', user.id)}>
                <Trash2 className="mr-2 h-4 w-4" />Delete User
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onEditUser, onViewUser, handleToggleStatus]);


  const table = useReactTable({
    data: users,
    columns,
    pageCount, // For server-side pagination
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    manualPagination: true, // True for server-side pagination
    manualSorting: true,    // True for server-side sorting
    manualFiltering: true,  // True for server-side filtering
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(), // Not needed for manualPagination
    // getSortedRowModel: getSortedRowModel(), // Not needed for manualSorting
    // getFilteredRowModel: getFilteredRowModel(), // Not needed for manualFiltering
  });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      // Trigger refetch when debounced search query changes
      // This is implicitly handled by queryKey including searchQuery
      // If not using queryKey for this, call refetch() here.
      // For manual filtering, the queryKey already includes `searchQuery`.
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, refetch]);


  // --- Render ---
  if (isLoading && !data) { // Show skeleton only on initial load
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
          <Skeleton className="h-10 w-full sm:w-1/3" /> {/* Search */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-1/2 sm:w-[120px]" /> {/* Role Filter */}
            <Skeleton className="h-10 w-1/2 sm:w-[120px]" /> {/* Status Filter */}
          </div>
          {onAddUser && <Skeleton className="h-10 w-full sm:w-auto sm:px-8" />} {/* Add User Button */}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
        {/* Developed by Luccas A E | 2025 */}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4 md:m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Users</AlertTitle>
        <AlertDescription>{error.message}<Button variant="link" onClick={() => refetch()} className="ml-2 p-0 h-auto">Try again</Button></AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10 w-full"
            aria-label="Search users"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
            <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by role">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
              <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as UserProfile['accountStatus'] | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by status">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending_verification">Pending Verification</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {onAddUser && (
          <Button onClick={onAddUser} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? "Loading users..." : "No users found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {/* Row selection count (if used) */}
          {/* {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected. */}
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
        <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
                table.setPageSize(Number(value));
            }}
        >
            <SelectTrigger className="w-[100px]" aria-label="Rows per page">
                <SelectValue placeholder={`${table.getState().pagination.pageSize} rows`} />
            </SelectTrigger>
            <SelectContent>
                {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize} rows
                </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      {/* Developed by Luccas A E | 2025 */}
    </div>
  );
};