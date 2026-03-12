/**
 * Block 82 — Game / Session Creation
 * Manages game sessions: create, join, leave, and derive map markers.
 * Storage key: sb_game_sessions
 */
import { useCallback, useEffect, useState } from "react";
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
}

const STORAGE_KEY = "sb_game_sessions";

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

  const [sessions, setSessions] = useState<GameSession[]>(getSessions);

  // Refresh from storage
  const refresh = useCallback(() => {
    setSessions(getSessions());
  }, [getSessions]);

  // Listen to storage events for cross-tab and same-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        refresh();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  // Initial load after seed
  useEffect(() => {
    refresh();
  }, [refresh]);

  const createSession = useCallback(
    (
      data: Omit<GameSession, "id" | "createdAt" | "participants">,
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
      return sessions.find((s) => s.id === id) ?? null;
    },
    [sessions],
  );

  // Derive game markers, optionally filtered by sport
  const gameMarkers: GameMarker[] = sessions
    .filter((s) => {
      if (!sportFilter || sportFilter === "all") return true;
      return s.sport.toLowerCase() === sportFilter.toLowerCase();
    })
    .map(toGameMarker);

  return {
    sessions,
    gameMarkers,
    createSession,
    joinSession,
    leaveSession,
    getSession,
  };
}
