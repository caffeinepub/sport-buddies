# Specification

## Summary
**Goal:** Make the activation button in ActivateSportScreen context-aware so it toggles between activating and deactivating the current sport.

**Planned changes:**
- Import `useSport` from `SportContext` in `ActivateSportScreen` and destructure `sportStatus`, `currentSport`, and `deactivateSport`
- Derive `isActive` boolean from `sportStatus === 'active'`
- Update button label dynamically: show `'Deactivate {currentSport}'` when active, otherwise `'Activate My Sport'`
- Update button `onClick` handler to call `deactivateSport()` when active, or `handleActivate()` when inactive

**User-visible outcome:** The activation button on the Activate Sport screen now reflects the current sport state — showing the sport name when active and allowing one-tap deactivation, while still activating normally when no sport is active.
