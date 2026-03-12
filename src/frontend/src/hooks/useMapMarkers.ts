/**
 * Block 74 — Live Athlete Map Markers
 * Enriches presence records with sport-specific display data and computes
 * deterministic marker positions for the simulated map canvas.
 */
import { useCallback, useEffect, useState } from "react";
import type { PresenceRecord } from "../lib/presenceEngine";
import {
  getLivePresenceRecords,
  pruneExpiredRecords,
} from "../lib/presenceEngine";

const POLL_INTERVAL_MS = 15_000; // 15 seconds — tighter than useWhoIsOut for marker responsiveness

export interface MapMarker {
  id: string;
  displayName: string;
  sport: string;
  sportEmoji: string;
  markerColor: string; // hex
  distanceLabel: string;
  expiresAt: number;
  isDemo: boolean;
  /** 0–100 percentage positions within the map canvas */
  posX: number;
  posY: number;
}

/** Sport → emoji */
export const SPORT_EMOJI: Record<string, string> = {
  soccer: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  running: "🏃",
  swimming: "🏊",
  cycling: "🚴",
  yoga: "🧘",
  default: "🏅",
};

/** Sport → hex color for the marker ring */
export const SPORT_COLOR: Record<string, string> = {
  soccer: "#4ade80", // green-400
  basketball: "#fb923c", // orange-400
  tennis: "#facc15", // yellow-400
  running: "#60a5fa", // blue-400
  swimming: "#22d3ee", // cyan-400
  cycling: "#c084fc", // purple-400
  yoga: "#f472b6", // pink-400
  default: "#D4AF37", // gold
};

/**
 * Derives a stable (0–100, 0–100) position from the record's id.
 * Pure function — same id always gives the same position.
 */
function derivePosition(id: string): { posX: number; posY: number } {
  // Simple hash from id characters
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  // Spread markers evenly avoiding the very edges (10%–90%)
  const posX = 10 + ((hash % 1000) / 1000) * 80;
  const posY = 10 + (((hash >> 10) % 1000) / 1000) * 80;
  return { posX, posY };
}

/**
 * Converts a PresenceRecord to a MapMarker.
 * Returns null if the record is missing a valid id (safety guard).
 */
function toMarker(record: PresenceRecord): MapMarker | null {
  // Safety guard: skip records with missing/empty id
  if (!record.id) return null;

  const sportKey = record.sport.toLowerCase();
  const { posX, posY } = derivePosition(record.id);
  return {
    id: record.id,
    displayName: record.id === "me" ? "You" : record.displayName,
    sport: record.sport,
    sportEmoji: SPORT_EMOJI[sportKey] ?? SPORT_EMOJI.default,
    markerColor: SPORT_COLOR[sportKey] ?? SPORT_COLOR.default,
    distanceLabel: record.distanceLabel ?? "",
    expiresAt: record.expiresAt,
    isDemo: record.isDemo ?? false,
    posX,
    posY,
  };
}

export function useMapMarkers(sportFilter?: string) {
  const getMarkers = useCallback(() => {
    pruneExpiredRecords();
    return getLivePresenceRecords(sportFilter)
      .map(toMarker)
      .filter((m): m is MapMarker => m !== null);
  }, [sportFilter]);

  const [markers, setMarkers] = useState<MapMarker[]>(getMarkers);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    setMarkers(getMarkers());
  }, [getMarkers]);

  useEffect(() => {
    const interval = setInterval(
      () => setMarkers(getMarkers()),
      POLL_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [getMarkers]);

  useEffect(() => {
    const handler = () => setMarkers(getMarkers());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [getMarkers]);

  const selectMarker = useCallback((id: string | null) => {
    setSelectedMarkerId(id);
  }, []);

  return { markers, count: markers.length, selectedMarkerId, selectMarker };
}
