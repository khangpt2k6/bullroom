import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { bookingsApi } from '../../services/api/bookings';
import {
  BookingsResponse,
  BookingResponse,
  CreateBookingResponse,
  CreateBookingRequest,
} from '../../types/api';
import { BookingFilters } from '../../types/models';

// Get all bookings for a user
export const useBookings = (
  userId: string,
  filters?: BookingFilters
): UseQueryResult<BookingsResponse> => {
  return useQuery({
    queryKey: ['bookings', userId, filters],
    queryFn: () => bookingsApi.getBookings(userId, filters),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get single booking by ID
export const useBooking = (bookingId: string): UseQueryResult<BookingResponse> => {
  return useQuery({
    queryKey: ['bookings', 'detail', bookingId],
    queryFn: () => bookingsApi.getBooking(bookingId),
    enabled: !!bookingId,
    staleTime: 1 * 60 * 1000,
  });
};

// Create a new booking
export const useCreateBooking = (): UseMutationResult<
  CreateBookingResponse,
  Error,
  CreateBookingRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingRequest) => bookingsApi.createBooking(data),
    onSuccess: () => {
      // Invalidate bookings cache to refetch
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

// Confirm a pending booking
export const useConfirmBooking = (): UseMutationResult<BookingResponse, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.confirmBooking(bookingId),
    onMutate: async (bookingId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['bookings', 'detail', bookingId] });

      // Optimistically update to CONFIRMED
      queryClient.setQueryData(['bookings', 'detail', bookingId], (old: any) => ({
        ...old,
        booking: {
          ...old?.booking,
          status: 'CONFIRMED',
          confirmedAt: new Date().toISOString(),
        },
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (_error, bookingId) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['bookings', 'detail', bookingId] });
    },
  });
};

// Cancel a booking
export const useCancelBooking = (): UseMutationResult<BookingResponse, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.cancelBooking(bookingId),
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: ['bookings', 'detail', bookingId] });

      // Optimistically update to CANCELLED
      queryClient.setQueryData(['bookings', 'detail', bookingId], (old: any) => ({
        ...old,
        booking: {
          ...old?.booking,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
        },
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (_error, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'detail', bookingId] });
    },
  });
};
