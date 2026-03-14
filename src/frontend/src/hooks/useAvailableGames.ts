/**
 * Block 85 — Upcoming Game Alerts
 * Block 90 — Excludes archived and locked sessions from the count.
 * Returns the count of game sessions for the user's active sport
 * that the current user ("me") has NOT joined yet.
 * Reacts to storage changes in real time.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sb_game_sessions";

interface GameSession {
  id: string;
  sport: string;
  participants: string[];
  archived?: boolean;
  startTime: string;
}

function computeAvailableGames(sport: string | null | undefined): number {
  if (!sport) return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const sessions: GameSession[] = JSON.parse(raw);
    if (!Array.isArray(sessions)) return 0;
    return sessions.filter(
      (s) =>
        s.sport.toLowerCase() === sport.toLowerCase() &&
        !s.participants.includes("me") &&
        // Exclude archived sessions
        !s.archived &&
        // Exclude locked sessions (start time passed)
        new Date(s.startTime).getTime() > Date.now(),
    ).length;
  } catch {
    return 0;
  }
}

export function useAvailableGames(sport: string | null | undefined) {
  const recompute = useCallback(() => computeAvailableGames(sport), [sport]);
  const [availableGames, setAvailableGames] = useState(() => recompute());

  useEffect(() => {
    setAvailableGames(recompute());
  }, [recompute]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setAvailableGames(recompute());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [recompute]);

  return { availableGames };
}
