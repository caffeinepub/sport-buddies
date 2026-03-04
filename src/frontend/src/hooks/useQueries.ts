import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SkillLevel, Sport, UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useBackendHealth() {
  const { actor, isFetching } = useActor();

  return {
    actor,
    isFetching,
  };
}

export function useCompleteProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      sport,
      level,
      locationPermission,
    }: {
      name: string;
      sport: Sport;
      level: SkillLevel;
      locationPermission: boolean;
    }) => {
      if (!actor) {
        throw new Error("Actor not initialized");
      }
      return await actor.completeProfile(
        name,
        sport,
        level,
        locationPermission,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profileComplete"] });
    },
  });
}

export function useIsProfileComplete() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["profileComplete"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isProfileComplete();
      } catch (error) {
        console.error("Error checking profile completion:", error);
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getUserProfile();
      } catch (_error) {
        // User might not have a profile yet
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}
