/**
 * Block 104 — Live Activity Heat System
 * Computes a heat level for a game session based on fill ratio and time until start.
 * This is a pure metadata/visual layer — no game logic is modified.
 */
import type { GameSession } from "../hooks/useGameSessions";

export type HeatLevel = "low" | "medium" | "high";

/**
 * Computes a heat level for a game session based on:
 * - Fill ratio (participants / maxPlayers)
 * - Minutes until start
 */
export function computeHeatLevel(session: GameSession): HeatLevel {
  const fillRatio =
    session.participants.length / Math.max(session.maxPlayers, 1);
  const msUntilStart = new Date(session.startTime).getTime() - Date.now();
  const minUntilStart = msUntilStart / 60_000;

  if (fillRatio >= 0.7 || (minUntilStart > 0 && minUntilStart <= 15)) {
    return "high";
  }
  if (fillRatio >= 0.35 || (minUntilStart > 0 && minUntilStart <= 45)) {
    return "medium";
  }
  return "low";
}
