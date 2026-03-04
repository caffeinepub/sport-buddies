/**
 * Block 70 — Sport Activation Presence Engine
 * Pure helpers for presence record storage / retrieval.
 * All data lives in localStorage so it works in the MVP single-user context.
 * The "feed" simulates a broadcast layer that the map can read.
 */

export const PRESENCE_RECORD_KEY = "sb_presence_record"; // current user's record
export const PRESENCE_FEED_KEY = "sb_presence_records_feed"; // all active records (broadcast layer)

export const PRESENCE_DURATION_MS = 10 * 60 * 1000; // 10 minutes before auto-expiry
export const PRESENCE_REFRESH_MS = 2 * 60 * 1000; // refresh heartbeat every 2 minutes

export const CURRENT_USER_PRESENCE_ID = "me";

export type PresenceStatus = "out_now" | "expired";

export interface PresenceRecord {
  id: string; // unique per user — "me" for the local user
  displayName: string;
  sport: string;
  activatedAt: number; // epoch ms
  expiresAt: number; // activatedAt + PRESENCE_DURATION_MS, reset on refresh
  lastRefreshedAt: number;
  status: PresenceStatus;
  /** Simulated distance label for display */
  distanceLabel?: string;
}

// ---------- safe localStorage helpers ----------

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ---------- current-user record ----------

export function writeMyPresenceRecord(sport: string): PresenceRecord {
  const now = Date.now();
  const record: PresenceRecord = {
    id: CURRENT_USER_PRESENCE_ID,
    displayName: "You",
    sport,
    activatedAt: now,
    expiresAt: now + PRESENCE_DURATION_MS,
    lastRefreshedAt: now,
    status: "out_now",
    distanceLabel: "0.0 mi",
  };
  safeSet(PRESENCE_RECORD_KEY, JSON.stringify(record));
  // Also upsert into the feed
  upsertPresenceFeed(record);
  return record;
}

export function refreshMyPresenceRecord(): PresenceRecord | null {
  const raw = safeGet(PRESENCE_RECORD_KEY);
  if (!raw) return null;
  try {
    const record: PresenceRecord = JSON.parse(raw);
    const now = Date.now();
    if (now > record.expiresAt) {
      // Already expired — clean up
      clearMyPresenceRecord();
      return null;
    }
    // Extend the window
    const refreshed: PresenceRecord = {
      ...record,
      expiresAt: now + PRESENCE_DURATION_MS,
      lastRefreshedAt: now,
      status: "out_now",
    };
    safeSet(PRESENCE_RECORD_KEY, JSON.stringify(refreshed));
    upsertPresenceFeed(refreshed);
    return refreshed;
  } catch {
    return null;
  }
}

export function readMyPresenceRecord(): PresenceRecord | null {
  const raw = safeGet(PRESENCE_RECORD_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PresenceRecord;
  } catch {
    return null;
  }
}

export function clearMyPresenceRecord(): void {
  safeRemove(PRESENCE_RECORD_KEY);
  removeFromPresenceFeed(CURRENT_USER_PRESENCE_ID);
}

// ---------- presence feed (broadcast layer) ----------

export function readPresenceFeed(): PresenceRecord[] {
  const raw = safeGet(PRESENCE_FEED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function upsertPresenceFeed(record: PresenceRecord): void {
  const feed = readPresenceFeed();
  const idx = feed.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    feed[idx] = record;
  } else {
    feed.push(record);
  }
  safeSet(PRESENCE_FEED_KEY, JSON.stringify(feed));
}

function removeFromPresenceFeed(id: string): void {
  const feed = readPresenceFeed().filter((r) => r.id !== id);
  safeSet(PRESENCE_FEED_KEY, JSON.stringify(feed));
}

export function pruneExpiredRecords(): PresenceRecord[] {
  const now = Date.now();
  const feed = readPresenceFeed().filter((r) => now < r.expiresAt);
  safeSet(PRESENCE_FEED_KEY, JSON.stringify(feed));
  return feed;
}

/** Returns only live (non-expired) records, optionally filtered by sport */
export function getLivePresenceRecords(sportFilter?: string): PresenceRecord[] {
  const now = Date.now();
  return readPresenceFeed().filter((r) => {
    if (now >= r.expiresAt) return false;
    if (sportFilter && sportFilter !== "all") {
      return r.sport.toLowerCase() === sportFilter.toLowerCase();
    }
    return true;
  });
}
