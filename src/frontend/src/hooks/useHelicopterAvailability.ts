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

export function useHelicopterAvailability(
  startTime: string,
  endTime: string,
  enabled = false,
) {
  const { actor, isFetching: isActorFetching } = useActor();

  return useQuery<AvailabilityResponse>({
    queryKey: ["helicopter-availability", startTime, endTime],
    queryFn: async () => {
      if (!actor) {
        return { busy: [], error: "Backend not initialized" };
      }

      try {
        const response = await actor.checkHelicopterAvailability(
          startTime,
          endTime,
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
