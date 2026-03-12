/**
 * Block 71 — useDemoPresenceSeed
 *
 * Mounts demo athlete presence records into the broadcast feed on first render
 * and keeps them alive by refreshing on the same heartbeat interval as real
 * presence records (PRESENCE_REFRESH_MS = 2 min).
 *
 * Seeding is idempotent: if demo records are already in the feed (e.g. the
 * component re-mounts) the hook skips the initial seed to avoid duplicates.
 *
 * Returns `{ clearDemo }` so the host component can wipe demo data on demand.
 */

import { useCallback, useEffect, useRef } from "react";
import {
  clearDemoPresence,
  getLiveDemoRecords,
  refreshDemoPresence,
  seedDemoPresence,
} from "../lib/demoPresenceSeed";
import { PRESENCE_REFRESH_MS } from "../lib/presenceEngine";

export function useDemoPresenceSeed() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only seed if there are no live demo records already present
    const existing = getLiveDemoRecords();
    if (existing.length === 0) {
      seedDemoPresence();
    }

    // Refresh demo records on the same cadence as real presence heartbeats
    intervalRef.current = setInterval(() => {
      refreshDemoPresence();
    }, PRESENCE_REFRESH_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const clearDemo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    clearDemoPresence();
  }, []);

  return { clearDemo };
}
