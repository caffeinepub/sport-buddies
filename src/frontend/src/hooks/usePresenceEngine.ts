/**
 * Block 70 — usePresenceEngine
 * Manages the current user's presence lifecycle:
 * - Writes a presence record on activation
 * - Refreshes (extends expiry) on a 2-minute heartbeat
 * - Auto-expires after 10 minutes of inactivity
 * - Clears on deactivation
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PRESENCE_REFRESH_MS,
  type PresenceRecord,
  clearMyPresenceRecord,
  readMyPresenceRecord,
  refreshMyPresenceRecord,
  writeMyPresenceRecord,
} from "../lib/presenceEngine";

export function usePresenceEngine() {
  const [myPresence, setMyPresence] = useState<PresenceRecord | null>(() =>
    readMyPresenceRecord(),
  );
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  /** Schedule auto-expiry for a presence record */
  const scheduleExpiry = useCallback(
    (record: PresenceRecord) => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      const msUntilExpiry = record.expiresAt - Date.now();
      if (msUntilExpiry <= 0) {
        // Already expired
        clearMyPresenceRecord();
        setMyPresence(null);
        clearTimers();
        return;
      }
      expiryTimerRef.current = setTimeout(() => {
        clearMyPresenceRecord();
        setMyPresence(null);
        clearTimers();
      }, msUntilExpiry);
    },
    [clearTimers],
  );

  /** Start the periodic refresh heartbeat */
  const startRefreshHeartbeat = useCallback(
    (initialRecord: PresenceRecord) => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      // Schedule first expiry based on current record
      scheduleExpiry(initialRecord);

      refreshTimerRef.current = setInterval(() => {
        const refreshed = refreshMyPresenceRecord();
        if (refreshed) {
          setMyPresence(refreshed);
          // Re-schedule expiry with the extended window
          scheduleExpiry(refreshed);
        } else {
          // Record already gone — clean up
          setMyPresence(null);
          clearTimers();
        }
      }, PRESENCE_REFRESH_MS);
    },
    [scheduleExpiry, clearTimers],
  );

  /** Called when user activates a sport */
  const activatePresenceRecord = useCallback(
    (sport: string) => {
      clearTimers();
      const record = writeMyPresenceRecord(sport);
      setMyPresence(record);
      startRefreshHeartbeat(record);
    },
    [clearTimers, startRefreshHeartbeat],
  );

  /** Manually refresh (extends expiry) — can be called on user interaction */
  const refreshPresence = useCallback(() => {
    const refreshed = refreshMyPresenceRecord();
    if (refreshed) {
      setMyPresence(refreshed);
      scheduleExpiry(refreshed);
    }
  }, [scheduleExpiry]);

  /** Clear presence on deactivation */
  const expirePresence = useCallback(() => {
    clearTimers();
    clearMyPresenceRecord();
    setMyPresence(null);
  }, [clearTimers]);

  // On mount: resume existing presence if still valid
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs once on mount only
  useEffect(() => {
    const existing = readMyPresenceRecord();
    if (existing && Date.now() < existing.expiresAt) {
      setMyPresence(existing);
      startRefreshHeartbeat(existing);
    } else if (existing) {
      // Expired — clean up
      clearMyPresenceRecord();
      setMyPresence(null);
    }
    return () => {
      clearTimers();
    };
  }, []);

  return {
    myPresence,
    isPresenceActive:
      myPresence !== null && Date.now() < (myPresence?.expiresAt ?? 0),
    activatePresenceRecord,
    refreshPresence,
    expirePresence,
  };
}
