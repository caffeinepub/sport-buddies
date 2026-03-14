# Sport Buddies

## Current State
ProfilePage.tsx contains Trust Score, Invites Sent, Profile Status, Status Selector, User Mode, Location Toggle, Emergency Shield, and Sign Out sections. useGameSessions.ts already exposes `archivedSessions` (games with `archived: true`). Game sessions store `participants[]`, so filtering to games where `"me"` is a participant is straightforward.

## Requested Changes (Diff)

### Add
- A "Past Games" card section on ProfilePage, inserted after the Invites Sent section and before the Profile Status section.
- Each row shows: sport emoji + name, location label, final player count (e.g. "8 players"), and a relative date (e.g. "Yesterday", "2 days ago").
- Only archived games where `participants.includes("me")` are shown.
- Empty state when no past games exist.

### Modify
- ProfilePage.tsx: import `useGameSessions`, derive `pastGames` from `archivedSessions` filtered to user's games, render the new section.

### Remove
- Nothing removed.

## Implementation Plan
1. In ProfilePage.tsx, import `useGameSessions` from `../hooks/useGameSessions`.
2. Call `useGameSessions()` (no sport filter) to get `archivedSessions`.
3. Derive `pastGames = archivedSessions.filter(s => s.participants.includes("me")).sort by archivedAt desc`.
4. Add a `formatGameDate(ts)` helper — "Today", "Yesterday", "X days ago".
5. Render a new card section between Invites Sent and Profile Status with a Gamepad2 icon header, list rows, and empty state.
6. Add deterministic `data-ocid` markers.
