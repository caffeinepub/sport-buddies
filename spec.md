# Sport Buddies

## Current State
MapPage shows live athlete markers, Who's Out Now layer, Active Games list, sport chat panel, and Create Game shortcut. Games are stored in localStorage via `useGameSessions`. The Active Games list renders below Who's Out Now.

## Requested Changes (Diff)

### Add
- `QuickJoinPrompt` component: a highlighted card shown at the top of the Map screen (above the Active Games list) when active games exist for the current sport
- The card shows the most relevant game (soonest start time, or first available if times are equal)
- Displays: sport emoji + name, location, formatted start time, player count (joined/max)
- Prominent "Join Now" button that calls `joinSession` immediately and shows a success toast
- Card only appears when there is at least one active (non-archived, non-full, non-locked) game for the current sport
- Card is dismissible (X button) for the session — dismissed state stored in component state (not persisted)

### Modify
- `MapPage.tsx`: render `<QuickJoinPrompt>` above the Active Games list section

### Remove
- Nothing

## Implementation Plan
1. Create `src/components/QuickJoinPrompt.tsx`
   - Accept `games`, `currentSport`, `joinSession`, `onOpenLobby` as props
   - Derive the most relevant game: filter active games for current sport, sort by start time ascending, pick first
   - Display sport emoji, location, formatted start time, player count pill
   - "Join Now" button: calls `joinSession(gameId)`, shows toast, dismisses card
   - X dismiss button hides card for the session
   - Only renders when a relevant game exists and not dismissed
2. Update `MapPage.tsx`
   - Import and render `<QuickJoinPrompt>` above the Active Games section
   - Pass `activeGameSessions`, `currentSport`, `joinSession`, and `setSelectedGameId` (to open lobby)
