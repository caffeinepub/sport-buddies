/**
 * Block 70 — useWhoIsOut
 * Reads the presence broadcast feed and returns live (non-expired) records.
 * Polls every 30 seconds and prunes expired entries from storage.
 * Accepts an optional sport filter string (pass "all" or undefined for no filter).
 */
import { useCallback, useEffect, useState } from "react";
import {
  type PresenceRecord,
  getLivePresenceRecords,
  pruneExpiredRecords,
} from "../lib/presenceEngine";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useWhoIsOut(sportFilter?: string) {
  const getRecords = useCallback(() => {
    pruneExpiredRecords();
    return getLivePresenceRecords(sportFilter);
  }, [sportFilter]);

  const [liveRecords, setLiveRecords] = useState<PresenceRecord[]>(getRecords);

  // Refresh when sport filter changes
  useEffect(() => {
    setLiveRecords(getRecords());
  }, [getRecords]);

  // Periodic poll
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveRecords(getRecords());
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [getRecords]);

  // Also listen for storage events (cross-tab / activation from same session)
  useEffect(() => {
    const handler = () => {
      setLiveRecords(getRecords());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [getRecords]);

  return {
    liveRecords,
    count: liveRecords.length,
    refresh: () => setLiveRecords(getRecords()),
  };
}
