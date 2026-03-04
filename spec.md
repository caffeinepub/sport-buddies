# Sport Buddies

## Current State
- `usePresenceState` hook handles localStorage-based presence (status, sport, timestamps, expiry at 10 min)
- `ActivateSportScreen` calls `activatePresence(sport)` on sport pick, storing to `presenceStatus / presenceSport / presenceActivatedAt / presenceExpiresAt / pocketFlashUntil`
- `MapPage` shows hardcoded `MOCK_BUDDIES` array; does not read from presence store; has "You are Live" banner reading from `sb_status` localStorage key
- `SportContext` has `sportStatus / currentSport / activateSport / deactivateSport` but no presence timestamp, location, or expiry concept wired to the map layer
- No "who's out now" layer on the map reads real presence records
- No periodic refresh heartbeat

## Requested Changes (Diff)

### Add
- `PresenceRecord` type: `{ id, sport, activatedAt, expiresAt, lastRefreshedAt, status: "out_now" | "expired" }`
- `usePresenceEngine` hook: manages the current user's presence record, expiry (10 min), refresh interval (every 2 min heartbeat), writes to localStorage `sb_presence_record`
- `presenceEngine` integration in `SportContext`: expose `myPresence`, `refreshPresence`, `expirePresence`
- `activateSport()` in `SportContext` to write presence record on activation
- `deactivateSport()` to clear the presence record
- `useWhoIsOut` hook: reads `sb_presence_records_feed` (an array) for all active presences and returns filtered, non-expired records — simulates the "broadcast" layer in localStorage
- `MapPage` "who's out now" section: replace or augment the mock buddies list with a dedicated "Who's Out Now" card section that reads from `useWhoIsOut`, showing real presence records including the current user when active
- Periodic refresh: `setInterval` every 120s to call `refreshPresence()` (updates `lastRefreshedAt` and resets expiry window) — auto-expires after inactivity (no refresh)

### Modify
- `activateSport()` in `SportContext`: also write the user's presence record to `sb_presence_records_feed`
- `deactivateSport()` in `SportContext`: remove user's record from `sb_presence_records_feed`
- `ActivateSportScreen` `onPickSport()`: already calls `activateSport()` + `activatePresence()`; ensure the new presence record is written (handled via SportContext)
- `MapPage`: add a "Who's Out Now" layer section below the filter chips, showing live presence records pulled from `useWhoIsOut`

### Remove
- Nothing removed — MOCK_BUDDIES stays for the existing "Nearby Buddies" section; the new "Who's Out Now" layer is additive

## Implementation Plan
1. Create `src/lib/presenceEngine.ts` — types (`PresenceRecord`), localStorage key constants, pure helpers: `writePresenceRecord`, `removePresenceRecord`, `readPresenceFeed`, `pruneExpiredRecords`
2. Create `src/hooks/usePresenceEngine.ts` — manages current user's presence record; expiry (10 min); refresh heartbeat interval (2 min); auto-expire on inactivity; exposes `myPresence`, `refreshPresence`, `expirePresence`, `isPresenceActive`
3. Create `src/hooks/useWhoIsOut.ts` — reads `sb_presence_records_feed`, prunes expired records, returns filtered array; polls every 30s for updates; respects sport filter
4. Add `myPresence`, `refreshPresence`, `expirePresence` to `SportContext` type + provider; wire `activateSport` to write presence record; wire `deactivateSport` to clear it
5. Update `MapPage`: add "Who's Out Now" layer card section above/alongside Nearby Buddies; show current user's own presence record when active; include sport filter integration
6. Ensure `ActivateSportScreen` `onPickSport` flows correctly through the updated `activateSport` (no UI changes needed there)
