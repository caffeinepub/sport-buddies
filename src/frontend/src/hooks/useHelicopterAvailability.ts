import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

interface BusyBlock {
  start: string;
  end: string;
}

interface AvailabilityResponse {
  busy: BusyBlock[];
  error?: string;
}

/**
 * Block 69 — useHelicopterAvailability
 *
 * Fetches helicopter availability from the backend.
 * Accepts an optional calendarId which is encoded into the endTime parameter
 * using the `${endTime}|calendarId=...` suffix convention so the backend can
 * route the query to the correct Google Calendar. The backend ignores unknown
 * suffixes, making this forward-compatible.
 */
export function useHelicopterAvailability(
  startTime: string,
  endTime: string,
  enabled = false,
  calendarId?: string | null,
) {
  const { actor, isFetching: isActorFetching } = useActor();

  return useQuery<AvailabilityResponse>({
    queryKey: [
      "helicopter-availability",
      startTime,
      endTime,
      calendarId ?? "none",
    ],
    queryFn: async () => {
      if (!actor) {
        return { busy: [], error: "Backend not initialized" };
      }

      try {
        // Block 69 — Encode calendarId into endTime suffix for forward-compatible routing
        const encodedEnd = calendarId
          ? `${endTime}|calendarId=${encodeURIComponent(calendarId)}`
          : endTime;

        const response = await actor.checkHelicopterAvailability(
          startTime,
          encodedEnd,
        );

        // Parse JSON response from backend
        try {
          const parsed = JSON.parse(response);
          return parsed as AvailabilityResponse;
        } catch (_parseError) {
          // If response is not JSON, check for error messages
          if (
            response.includes("Calendar not configured") ||
            response.includes("not configured")
          ) {
            return { busy: [], error: "Calendar not configured" };
          }
          if (response.includes("error") || response.includes("Error")) {
            return { busy: [], error: response };
          }
          // If it's a successful response but not JSON, assume no busy blocks
          return { busy: [] };
        }
      } catch (error) {
        console.error("Error checking availability:", error);
        return {
          busy: [],
          error:
            error instanceof Error
              ? error.message
              : "Failed to check availability",
        };
      }
    },
    enabled: enabled && !!actor && !isActorFetching && !!startTime && !!endTime,
    staleTime: 1000 * 30, // 30 seconds
    retry: false,
  });
}
