/**
 * Block 84 — Open Game Spots Badge
 * Block 90 — Excludes archived, full, and locked sessions from the count.
 * Returns the total number of open player slots across active game sessions
 * for the given sport. Reacts to storage changes in real time.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sb_game_sessions";

interface GameSession {
  id: string;
  sport: string;
  maxPlayers: number;
  participants: string[];
  archived?: boolean;
  startTime: string;
}

function computeOpenSpots(sport: string | null | undefined): number {
  if (!sport) return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const sessions: GameSession[] = JSON.parse(raw);
    if (!Array.isArray(sessions)) return 0;
    return (
      sessions
        .filter((s) => s.sport.toLowerCase() === sport.toLowerCase())
        // Exclude archived sessions
        .filter((s) => !s.archived)
        // Exclude full sessions
        .filter((s) => s.participants.length < s.maxPlayers)
        // Exclude locked sessions (start time passed)
        .filter((s) => new Date(s.startTime).getTime() > Date.now())
        .reduce((sum, s) => {
          const open = Math.max(0, s.maxPlayers - s.participants.length);
          return sum + open;
        }, 0)
    );
  } catch {
    return 0;
  }
}

export function useOpenGameSpots(sport: string | null | undefined) {
  const recompute = useCallback(() => computeOpenSpots(sport), [sport]);
  const [openSpots, setOpenSpots] = useState(() => recompute());

  useEffect(() => {
    setOpenSpots(recompute());
  }, [recompute]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setOpenSpots(recompute());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [recompute]);

  return { openSpots };
}
