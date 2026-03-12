/**
 * Block 72 — useSportActivityCounts
 *
 * Reads the live presence feed and returns a map of
 * lowercase sport name → active user count.
 *
 * Includes both real and demo records (isDemo: true).
 * Polls every 15 seconds and responds to storage events for
 * near-real-time updates across tabs / activations.
 */
import { useCallback, useEffect, useState } from "react";
import {
  getLivePresenceRecords,
  pruneExpiredRecords,
} from "../lib/presenceEngine";

const POLL_INTERVAL_MS = 15_000; // 15 seconds

/** Returns a map of lowercase sport name → number of active players */
function buildCountMap(): Record<string, number> {
  pruneExpiredRecords();
  const records = getLivePresenceRecords(); // all sports, includes demo
  const counts: Record<string, number> = {};
  for (const record of records) {
    const key = record.sport.toLowerCase();
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function useSportActivityCounts(): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>(buildCountMap);

  const refresh = useCallback(() => {
    setCounts(buildCountMap());
  }, []);

  // Periodic poll
  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Instant update on localStorage change (presence activation / deactivation)
  useEffect(() => {
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [refresh]);

  return counts;
}
