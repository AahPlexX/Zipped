// src/hooks/useUserData.ts
// This hook is responsible for fetching the current authenticated user's profile data,
// providing functionality to update this data, and integrating with the
// authentication state (e.g., from Better Auth).
// Developed by Luccas A E | 2025

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User as AuthUser } from 'better-auth'; // Assuming User type from Better Auth
import { UserProfile, ApiErrorResponse, UpdateUserProfileRequest, UpdateUserProfileResponse } from '@/types';
import { useBetterAuthSession } from './useBetterAuthSession'; // To get current auth session
import { useToast } from './useToast';

// --- Constants ---
const USER_DATA_QUERY_KEY = 'userData';

// --- API Interaction Functions ---
// These would typically reside in an API client service.

/**
 * Fetches the current user's detailed profile from the backend.
 * @returns Promise<UserProfile>
 */
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch('/api/user/profile'); // Example API endpoint
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message || 'Failed to fetch user profile');
  }
  const successData = await response.json();
  return successData.data;
};

/**
 * Updates the current user's profile data on the backend.
 * @param profileData - The partial profile data to update.
 * @returns Promise<UserProfile> - The updated user profile.
 */
const updateUserProfile = async (profileData: UpdateUserProfileRequest): Promise<UserProfile> => {
  const response = await fetch('/api/user/profile', { // Example API endpoint
    method: 'PATCH', // Or PUT, depending on API design
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message || 'Failed to update user profile');
  }
  const successData: UpdateUserProfileResponse = await response.json();
  return successData.data;
};


// --- Hook Definition ---

/**
 * Custom hook for managing the current user's profile data.
 */
export function useUserData() {
  const queryClient = useQueryClient();
  const { data: session, status: authStatus } = useBetterAuthSession();
  const { toast } = useToast();

  const isAuthenticated = authStatus === 'authenticated' && !!session?.user;
  const authUser: AuthUser | undefined = session?.user; // User object from Better Auth

  // Query to fetch the user's detailed profile data from your backend
  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchUserProfile,
  } = useQuery<UserProfile, Error>({
    // Query key includes user ID to ensure data is specific to the logged-in user
    // and refetches if the user changes.
    queryKey: [USER_DATA_QUERY_KEY, authUser?.id],
    queryFn: fetchUserProfile,
    enabled: isAuthenticated, // Only run if the user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes, profile data might not change frequently
    // Initial data can be partially populated from the auth session for faster perceived load
    // initialData: () => {
    //   if (authUser) {
    //     return {
    //       id: authUser.dbId || authUser.id, // Prefer dbId if available
    //       email: authUser.email || '',
    //       name: authUser.name || '',
    //       role: authUser.role || UserRole.STUDENT, // Default role if not in auth session
    //       image: authUser.image || '',
    //       // other fields that might be in AuthUser and UserProfile would be undefined initially
    //     } as UserProfile; // Cast carefully, ensure UserProfile structure allows this
    //   }
    //   return undefined;
    // },
  });

  // Mutation for updating the user's profile
  const { mutate: updateProfile, isLoading: isUpdatingProfile } = useMutation<
    UserProfile, // Success type
    Error, // Error type
    UpdateUserProfileRequest // Variables type (data to update)
  >(updateUserProfile, {
    onSuccess: (updatedData) => {
      // Update the query cache with the new data
      queryClient.setQueryData([USER_DATA_QUERY_KEY, authUser?.id], updatedData);
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully updated.',
        variant: 'success',
      });
      // Optionally, invalidate other queries that might depend on user data
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update your profile.',
        variant: 'destructive',
      });
    },
  });

  return {
    /** The Better Auth user object (might contain limited info like id, email, name, role from token). */
    authUser,
    /** The detailed user profile fetched from your application's backend. */
    userProfile,
    isLoadingProfile,
    isUpdatingProfile,
    profileError,
    isAuthenticated,
    authStatus,

    /** Function to manually refetch the user profile data. */
    refetchUserProfile,
    /** Function to update the user profile. Pass an object with fields to update. */
    updateUserProfile: updateProfile,
  };
}