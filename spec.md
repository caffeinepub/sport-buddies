# Specification

## Summary
**Goal:** Make EventsPage automatically filter events based on the active sport from SportContext.

**Planned changes:**
- Import `useEffect`, `useState`, and `useSport` in `EventsPage.tsx`, and consume `sportStatus` and `currentSport` from the context
- Add a `useEffect` that sets `selectedSport` to `currentSport` when a sport is active, and resets it to `'All'` when inactive or no sport is set
- Derive a `filteredEvents` list from the events array based on `selectedSport`, and render `filteredEvents` instead of the raw events array
- Preserve the existing manual filter chip UI so users can still change the filter independently

**User-visible outcome:** When the user activates a sport, the Events page automatically filters to show only events for that sport. Deactivating the sport resets the list to show all events. Manual filter chip selection continues to work as before.
