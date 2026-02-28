import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { HelicopterBooking } from '../backend';

interface BookingParams {
  startTime: string;
  endTime: string;
  name: string;
  phone: string;
  email: string;
  passengerCount: number;
  weights: string;
  notes: string;
  paymentMode: 'paid' | 'coins';
}

interface BookingResponse {
  ok: boolean;
  eventId?: string;
  htmlLink?: string;
  reason?: string;
  error?: string;
}

export function useHelicopterBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<BookingResponse, Error, BookingParams>({
    mutationFn: async (params: BookingParams) => {
      if (!actor) {
        throw new Error('Backend not initialized');
      }

      const booking: HelicopterBooking = {
        startTime: params.startTime,
        endTime: params.endTime,
        name: params.name,
        phone: params.phone,
        email: params.email,
        passengerCount: BigInt(params.passengerCount),
        weights: params.weights,
        notes: params.notes,
        paymentMode: params.paymentMode,
      };

      try {
        const response = await actor.bookHelicopter(booking);
        
        // Parse JSON response from backend
        try {
          const parsed = JSON.parse(response);
          return parsed as BookingResponse;
        } catch (parseError) {
          // If response is not JSON, check for error messages
          if (response.includes('Calendar not configured') || response.includes('not configured')) {
            return { ok: false, error: 'Calendar not configured' };
          }
          if (response.includes('busy') || response.includes('unavailable')) {
            return { ok: false, reason: 'busy' };
          }
          if (response.includes('error') || response.includes('Error')) {
            return { ok: false, error: response };
          }
          // If it's a successful response but not JSON, assume success
          return { ok: true };
        }
      } catch (error) {
        console.error('Error booking helicopter:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate availability queries after successful booking
      queryClient.invalidateQueries({ queryKey: ['helicopter-availability'] });
    },
  });
}
