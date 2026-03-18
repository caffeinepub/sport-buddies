# Sport Buddies

## Current State
The Map screen displays game session markers as rounded square pins via `MapMarkerLayer.tsx`. Each marker shows a sport emoji and a player count badge. `useGameSessions.ts` derives `GameMarker` objects from active sessions with sport, location, start time, host, and participant data. There is currently no heat or urgency system.

## Requested Changes (Diff)

### Add
- `src/frontend/src/lib/gameHeat.ts` — pure heat computation module
  - `HeatLevel` type: `'low' | 'medium' | 'high'`
  - `computeHeatLevel(session)` — derives heat from fill ratio and time until start
  - HIGH: >= 70% full OR starts within 15 minutes
  - MEDIUM: >= 35% full OR starts within 45 minutes
  - LOW: everything else
- `heatLevel` field added to `GameMarker` interface
- Heat visual layer on `GameMarkerPin`:
  - HIGH: orange/red animated glow ring + 🔥 badge label
  - MEDIUM: amber static glow ring
  - LOW: no change (existing behavior)

### Modify
- `useGameSessions.ts` — `toGameMarker()` calls `computeHeatLevel` and attaches `heatLevel` to the marker
- `MapMarkerLayer.tsx` — `GameMarkerPin` renders heat-specific visual indicators

### Remove
- Nothing removed

## Implementation Plan
1. Create `gameHeat.ts` with `HeatLevel` type and `computeHeatLevel` function
2. Add `heatLevel: HeatLevel` to `GameMarker` interface in `useGameSessions.ts`
3. Update `toGameMarker()` to pass the session into `computeHeatLevel`
4. In `MapMarkerLayer.tsx`, update `GameMarkerPin` to:
   - HIGH: animated orange glow ring (animate-ping), 🔥 icon label below pin
   - MEDIUM: static amber border glow
   - LOW: existing styles unchanged
