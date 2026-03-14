# Sport Buddies

## Current State
ProfilePage already contains the Block 91 "Past Games" section implemented in full:
- Imports `useGameSessions` and destructures `archivedSessions`
- Filters archived sessions to only those where `"me"` is in `participants`
- Sorts by `archivedAt` (falling back to `createdAt`), newest first
- Renders each row with: sport label (emoji + name), location, player count, relative date
- Empty state: "No past games yet"
- `data-ocid` markers on section, empty state, and each row item

`useGameSessions` already exposes `archivedSessions` (games with `archived === true`).

## Requested Changes (Diff)

### Add
- Nothing new required — implementation is already present.

### Modify
- Nothing.

### Remove
- Nothing.

## Implementation Plan
- Validate and deploy the existing implementation as Block 91.
