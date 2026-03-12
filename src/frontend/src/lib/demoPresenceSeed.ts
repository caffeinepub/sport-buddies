/**
 * Block 71 — Presence Seed Data for Demo Athletes
 *
 * Seeds several realistic demo presence records into the broadcast feed so the
 * "Who's Out Now" layer on the Map page looks populated during demos and
 * onboarding.  All demo records are tagged with `isDemo: true` and use IDs
 * prefixed with "demo_" so they can be safely identified and removed without
 * touching any real user record.
 */

import {
  PRESENCE_DURATION_MS,
  type PresenceRecord,
  getLivePresenceRecords,
  readPresenceFeed,
  upsertPresenceFeed,
} from "./presenceEngine";

export const DEMO_ID_PREFIX = "demo_";

/** The 8 simulated nearby athletes */
const DEMO_ATHLETES: Array<{
  id: string;
  displayName: string;
  sport: string;
  distanceLabel: string;
}> = [
  {
    id: "demo_alex_r",
    displayName: "Alex R.",
    sport: "Soccer",
    distanceLabel: "0.3 mi",
  },
  {
    id: "demo_jordan_m",
    displayName: "Jordan M.",
    sport: "Basketball",
    distanceLabel: "0.5 mi",
  },
  {
    id: "demo_sam_k",
    displayName: "Sam K.",
    sport: "Tennis",
    distanceLabel: "0.8 mi",
  },
  {
    id: "demo_taylor_b",
    displayName: "Taylor B.",
    sport: "Running",
    distanceLabel: "1.1 mi",
  },
  {
    id: "demo_casey_l",
    displayName: "Casey L.",
    sport: "Yoga",
    distanceLabel: "1.4 mi",
  },
  {
    id: "demo_morgan_p",
    displayName: "Morgan P.",
    sport: "Cycling",
    distanceLabel: "1.7 mi",
  },
  {
    id: "demo_riley_v",
    displayName: "Riley V.",
    sport: "Swimming",
    distanceLabel: "2.0 mi",
  },
  {
    id: "demo_drew_s",
    displayName: "Drew S.",
    sport: "Soccer",
    distanceLabel: "2.3 mi",
  },
];

/** Returns true if a presence record is a seeded demo entry. */
export function isDemoRecord(record: PresenceRecord): boolean {
  return record.isDemo === true || record.id.startsWith(DEMO_ID_PREFIX);
}

/**
 * Writes all demo athlete records into the presence feed.
 * Safe to call multiple times — existing real records (id === "me") are never
 * touched.  If a demo record already exists in the feed it is simply
 * refreshed (expiry extended) rather than duplicated.
 */
export function seedDemoPresence(): void {
  const now = Date.now();
  for (const athlete of DEMO_ATHLETES) {
    const record: PresenceRecord = {
      id: athlete.id,
      displayName: athlete.displayName,
      sport: athlete.sport,
      activatedAt: now,
      expiresAt: now + PRESENCE_DURATION_MS,
      lastRefreshedAt: now,
      status: "out_now",
      distanceLabel: athlete.distanceLabel,
      isDemo: true,
    };
    upsertPresenceFeed(record);
  }
}

/**
 * Re-stamps every existing demo record in the feed with a fresh expiresAt so
 * they stay live alongside real presence refresh cycles.
 * Records that have already expired are simply re-seeded from scratch.
 */
export function refreshDemoPresence(): void {
  const now = Date.now();
  const feed = readPresenceFeed();
  const existingDemoIds = new Set(feed.filter(isDemoRecord).map((r) => r.id));

  for (const athlete of DEMO_ATHLETES) {
    const existing = feed.find((r) => r.id === athlete.id);
    if (existing) {
      upsertPresenceFeed({
        ...existing,
        expiresAt: now + PRESENCE_DURATION_MS,
        lastRefreshedAt: now,
        status: "out_now",
      });
    } else if (!existingDemoIds.has(athlete.id)) {
      // Was pruned after expiry — re-seed it
      upsertPresenceFeed({
        id: athlete.id,
        displayName: athlete.displayName,
        sport: athlete.sport,
        activatedAt: now,
        expiresAt: now + PRESENCE_DURATION_MS,
        lastRefreshedAt: now,
        status: "out_now",
        distanceLabel: athlete.distanceLabel,
        isDemo: true,
      });
    }
  }
}

/**
 * Removes all demo records from the presence feed.
 * Real user records are never affected.
 */
export function clearDemoPresence(): void {
  try {
    const PRESENCE_FEED_KEY = "sb_presence_records_feed";
    const raw = localStorage.getItem(PRESENCE_FEED_KEY);
    if (!raw) return;
    const feed: PresenceRecord[] = JSON.parse(raw);
    const cleaned = feed.filter((r) => !isDemoRecord(r));
    localStorage.setItem(PRESENCE_FEED_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore storage errors
  }
}

/** Returns the current demo records that are still live in the feed. */
export function getLiveDemoRecords(): PresenceRecord[] {
  return getLivePresenceRecords().filter(isDemoRecord);
}
