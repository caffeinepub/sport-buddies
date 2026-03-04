import { useCallback, useEffect, useState } from "react";
import { useCoinBalance } from "./useCoinBalance";

const STORAGE_KEY_ATTENDED_IDS = "sb_attendedEventIds";

// Safe localStorage operations with fallback
function safeGetItem(key: string, defaultValue: string): string {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return defaultValue;
    }
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

function loadAttendedEventIds(): string[] {
  try {
    const stored = safeGetItem(STORAGE_KEY_ATTENDED_IDS, "[]");
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAttendedEventIds(ids: string[]): void {
  safeSetItem(STORAGE_KEY_ATTENDED_IDS, JSON.stringify(ids));

  // Dispatch custom event for cross-tab/component synchronization
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("attendanceStateChanged", { detail: ids }),
    );
  }
}

export function useAttendance() {
  const [attendedEventIds, setAttendedEventIds] =
    useState<string[]>(loadAttendedEventIds);
  const { addCoins } = useCoinBalance();

  // Listen for changes from other tabs or components
  useEffect(() => {
    const handleStorageChange = () => {
      setAttendedEventIds(loadAttendedEventIds());
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail) {
        setAttendedEventIds(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("attendanceStateChanged", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("attendanceStateChanged", handleCustomEvent);
    };
  }, []);

  const isEventAttended = useCallback(
    (eventId: string): boolean => {
      return attendedEventIds.includes(eventId);
    },
    [attendedEventIds],
  );

  const markEventAttended = useCallback(
    (eventId: string) => {
      // Guard: prevent duplicate attendance
      if (attendedEventIds.includes(eventId)) {
        return;
      }

      // Add event ID to attended list
      const newAttendedIds = [...attendedEventIds, eventId];
      setAttendedEventIds(newAttendedIds);
      saveAttendedEventIds(newAttendedIds);

      // Award +5 coins
      addCoins(5);
    },
    [attendedEventIds, addCoins],
  );

  const getAttendedEventIds = useCallback((): string[] => {
    return attendedEventIds;
  }, [attendedEventIds]);

  return {
    isEventAttended,
    markEventAttended,
    getAttendedEventIds,
  };
}
