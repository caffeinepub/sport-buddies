# Specification

## Summary
**Goal:** Wire `ActivateSportScreen` to `SportContext` so that selecting a sport activates it globally and navigates the user to the Map screen.

**Planned changes:**
- Ensure `frontend/src/context/SportContext.tsx` exists with `SportProvider` and `useSport`, implementing `SportStatus`, `UserMode`, `locationEnabled`, and the `activateSport`, `deactivateSport`, `setUserMode`, and `toggleLocation` functions.
- Ensure `SportProvider` wraps the application root in `App.tsx`.
- In `ActivateSportScreen.tsx`, import `useSport` from `SportContext` and call `activateSport(sportName)` followed by navigation to `/map` when a sport icon is tapped.
- Each sport icon (Soccer, Basketball, Tennis, Running, Yoga) invokes the handler with its respective sport name.

**User-visible outcome:** When the user taps a sport icon on the Activate Sport screen, that sport becomes the active sport in global context and the user is taken to the Map screen.
