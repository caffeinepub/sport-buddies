/**
 * Block 82 — Game / Session Creation
 * Block 90 — Archive Locked Games
 * Block 104 — Heat level added to GameMarker
 * Manages game sessions: create, join, leave, and derive map markers.
 * FULL or LOCKED games are automatically archived and hidden from active views.
 * Storage key: sb_game_sessions
 */
import { useCallback, useEffect, useState } from "react";
import { type HeatLevel, computeHeatLevel } from "../lib/gameHeat";
import { SPORT_COLOR, SPORT_EMOJI } from "./useMapMarkers";

export interface GameSession {
  id: string;
  sport: string;
  locationLabel: string;
  startTime: string; // ISO string
  maxPlayers: number;
  hostId: string;
  hostName: string;
  participants: string[]; // array of participantIds ("me" = current user)
  createdAt: number;
  archived?: boolean;
  archivedAt?: number;
}

export interface GameMarker {
  id: string;
  sport: string;
  sportEmoji: string;
  markerColor: string;
  locationLabel: string;
  startTime: string;
  hostName: string;
  participantCount: number;
  maxPlayers: number;
  posX: number;
  posY: number;
  heatLevel: HeatLevel;
}

const STORAGE_KEY = "sb_game_sessions";

/** Returns true when the game has reached max player capacity */
export function isGameFull(s: GameSession): boolean {
  return s.participants.length >= s.maxPlayers;
}

/** Returns true when the game start time has already passed */
export function isGameLocked(s: GameSession): boolean {
  return new Date(s.startTime).getTime() <= Date.now();
}

/** Derives a stable (0–100, 0–100) position from the session id */
function deriveGamePosition(id: string): { posX: number; posY: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const posX = 10 + ((hash % 1000) / 1000) * 80;
  const posY = 10 + (((hash >> 10) % 1000) / 1000) * 80;
  return { posX, posY };
}

function loadSessions(): GameSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as GameSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: GameSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    // Dispatch StorageEvent for same-tab reactivity
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: JSON.stringify(sessions),
      }),
    );
  } catch {
    // ignore write errors
  }
}

/**
 * Scans all sessions; marks any FULL or LOCKED game as archived if not already.
 * Writes to storage only when something changed. Returns the full updated list.
 */
function archiveStaleGames(): GameSession[] {
  const current = loadSessions();
  let changed = false;
  const now = Date.now();
  const updated = current.map((s) => {
    if (s.archived) return s;
    if (isGameFull(s) || isGameLocked(s)) {
      changed = true;
      return { ...s, archived: true, archivedAt: now };
    }
    return s;
  });
  if (changed) {
    saveSessions(updated);
  }
  return updated;
}

/** Seed demo game sessions if storage is empty */
function seedDemoSessions(): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing !== "[]") return; // already seeded
    const now = Date.now();
    const demos: GameSession[] = [
      {
        id: "demo-game-1",
        sport: "Soccer",
        locationLabel: "Central Park Field",
        startTime: new Date(now + 30 * 60_000).toISOString(),
        maxPlayers: 10,
        hostId: "demo_alex",
        hostName: "Alex R.",
        participants: ["demo_alex", "demo_jordan"],
        createdAt: now,
      },
      {
        id: "demo-game-2",
        sport: "Basketball",
        locationLabel: "Riverside Courts",
        startTime: new Date(now + 60 * 60_000).toISOString(),
        maxPlayers: 6,
        hostId: "demo_sam",
        hostName: "Sam K.",
        participants: ["demo_sam"],
        createdAt: now,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demos));
  } catch {
    // ignore seed errors
  }
}

function toGameMarker(session: GameSession): GameMarker {
  const sportKey = session.sport.toLowerCase();
  const { posX, posY } = deriveGamePosition(session.id);
  return {
    id: session.id,
    sport: session.sport,
    sportEmoji: SPORT_EMOJI[sportKey] ?? SPORT_EMOJI.default,
    markerColor: SPORT_COLOR[sportKey] ?? SPORT_COLOR.default,
    locationLabel: session.locationLabel,
    startTime: session.startTime,
    hostName: session.hostName,
    participantCount: session.participants.length,
    maxPlayers: session.maxPlayers,
    posX,
    posY,
    heatLevel: computeHeatLevel(session),
  };
}

export function useGameSessions(sportFilter?: string) {
  // Seed on first use
  useEffect(() => {
    seedDemoSessions();
  }, []);

  const getSessions = useCallback((): GameSession[] => {
    return loadSessions();
  }, []);

  const [allSessions, setAllSessions] = useState<GameSession[]>(getSessions);

  // Refresh from storage — archive stale games first, then update state
  const refresh = useCallback(() => {
    const latest = archiveStaleGames();
    setAllSessions(latest);
  }, []);

  // Listen to storage events for cross-tab and same-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        // Re-load without re-archiving to avoid infinite loop from saveSessions dispatch
        setAllSessions(loadSessions());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Initial load after seed
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Periodically check for newly locked/full games (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const createSession = useCallback(
    (
      data: Omit<
        GameSession,
        "id" | "createdAt" | "participants" | "archived" | "archivedAt"
      >,
    ): GameSession => {
      const newSession: GameSession = {
        ...data,
        id: Date.now().toString(),
        participants: [data.hostId],
        createdAt: Date.now(),
      };
      const current = loadSessions();
      saveSessions([...current, newSession]);
      return newSession;
    },
    [],
  );

  const joinSession = useCallback((id: string): void => {
    const current = loadSessions();
    const updated = current.map((s) => {
      if (s.id !== id) return s;
      if (s.participants.includes("me")) return s; // already joined
      if (s.participants.length >= s.maxPlayers) return s; // at capacity
      return { ...s, participants: [...s.participants, "me"] };
    });
    saveSessions(updated);
  }, []);

  const leaveSession = useCallback((id: string): void => {
    const current = loadSessions();
    const updated = current.map((s) => {
      if (s.id !== id) return s;
      if (s.hostId === "me") return s; // host cannot leave
      return { ...s, participants: s.participants.filter((p) => p !== "me") };
    });
    saveSessions(updated);
  }, []);

  const getSession = useCallback(
    (id: string | null): GameSession | null => {
      if (!id) return null;
      return allSessions.find((s) => s.id === id) ?? null;
    },
    [allSessions],
  );

  // Derived views — archived games stay in storage but are hidden from active lists
  const activeSessions = allSessions.filter((s) => !s.archived);
  const archivedSessions = allSessions.filter((s) => s.archived === true);

  // Derive game markers from active sessions only, optionally filtered by sport
  const gameMarkers: GameMarker[] = activeSessions
    .filter((s) => {
      if (!sportFilter || sportFilter === "all") return true;
      return s.sport.toLowerCase() === sportFilter.toLowerCase();
    })
    .map(toGameMarker);

  return {
    sessions: activeSessions,
    archivedSessions,
    gameMarkers,
    createSession,
    joinSession,
    leaveSession,
    getSession,
  };
}
