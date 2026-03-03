# Specification

## Summary
**Goal:** Add a location enable/disable toggle and a user mode switcher to the Profile page, both persisted in localStorage and integrated with the existing SportContext.

**Planned changes:**
- Add a `locationEnabled` boolean (default `true`) to SportContext, persisted in localStorage, synced with `useLocationPermission` hook and `LocationPermissionModal`
- Add a visible toggle switch labeled "Location" to the Profile page; when disabled, suppress location-dependent UI (nearby buddies map, Go Live button on MapPage)
- When re-enabling location, show the `LocationPermissionModal` to re-request browser permission
- Add a `userMode` state (default `"normal"`) with setter to SportContext, persisted in localStorage
- Add a mode selector (segmented control or dropdown) to the Profile page with "Normal" and "Buddy Finder" options
- MapPage conditionally highlights buddy-finder-specific UI when `userMode` is `"buddy_finder"`

**User-visible outcome:** Users can toggle location services on/off and switch between Normal and Buddy Finder modes from the Profile page, with their preferences saved and restored across sessions.
