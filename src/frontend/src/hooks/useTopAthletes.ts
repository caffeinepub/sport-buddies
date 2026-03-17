/**
 * Block 95 — Top Athletes Leaderboard
 * Block 96 — adds topSport (most played sport) per athlete
 */
import { useEffect, useState } from "react";

const SESSIONS_KEY = "sb_game_sessions";
const INVITES_KEY = "sb_invite_records";

const PLAYER_NAMES: Record<string, string> = {
  me: "You",
  demo_alex: "Alex R.",
  demo_jordan: "Jordan M.",
  demo_sam: "Sam K.",
  demo_maya: "Maya T.",
  demo_chris: "Chris B.",
  demo_priya: "Priya S.",
  demo_marcus: "Marcus W.",
  demo_zoe: "Zoe L.",
};

export interface TopAthlete {
  id: string;
  name: string;
  score: number;
  gamesPlayed: number;
  /** Sport this athlete played the most games in (lowercase). */
  topSport: string;
}

function computeTopAthletes(): TopAthlete[] {
  let sessions: any[] = [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) sessions = p;
    }
  } catch {
    /* ignore */
  }

  let invites: any[] = [];
  try {
    const raw = localStorage.getItem(INVITES_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) invites = p;
    }
  } catch {
    /* ignore */
  }

  const scoreMap: Record<string, number> = {};
  const gamesMap: Record<string, number> = {};
  const sportCountMap: Record<string, Record<string, number>> = {};

  const addScore = (id: string, pts: number) => {
    scoreMap[id] = (scoreMap[id] ?? 0) + pts;
  };
  const addGame = (id: string) => {
    gamesMap[id] = (gamesMap[id] ?? 0) + 1;
  };
  const addSportGame = (id: string, sport: string) => {
    const key = (sport ?? "").toLowerCase().trim() || "soccer";
    if (!sportCountMap[id]) sportCountMap[id] = {};
    sportCountMap[id][key] = (sportCountMap[id][key] ?? 0) + 1;
  };

  for (const s of sessions) {
    if (!s || !Array.isArray(s.participants)) continue;
    const sport = (s.sport ?? "").toLowerCase().trim();
    if (s.hostId) {
      addScore(s.hostId, 2);
      addGame(s.hostId);
      addSportGame(s.hostId, sport);
    }
    for (const p of s.participants) {
      if (p !== s.hostId) {
        addScore(p, 1);
        addGame(p);
        addSportGame(p, sport);
      }
    }
  }

  addScore("me", invites.length);

  const allIds = [
    ...new Set([...Object.keys(scoreMap), ...Object.keys(gamesMap)]),
  ];
  return allIds
    .filter((id) => (scoreMap[id] ?? 0) > 0)
    .map((id) => {
      const entries = Object.entries(sportCountMap[id] ?? {});
      const topSport =
        entries.length > 0
          ? entries.reduce((b, c) => (c[1] > b[1] ? c : b))[0]
          : "soccer";
      return {
        id,
        name: PLAYER_NAMES[id] ?? id,
        score: scoreMap[id] ?? 0,
        gamesPlayed: gamesMap[id] ?? 0,
        topSport,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function useTopAthletes(): TopAthlete[] {
  const [athletes, setAthletes] = useState<TopAthlete[]>(computeTopAthletes);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === SESSIONS_KEY || e.key === INVITES_KEY)
        setAthletes(computeTopAthletes());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return athletes;
}
