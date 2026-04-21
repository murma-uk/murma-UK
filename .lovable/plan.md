

## Plan: Fix map not loading on mobile

**Root cause:** On mobile, the map container starts with `display: none` (list view is default). Leaflet initialises into a zero-size container, then when the user taps the "Map" tab, Leaflet has no idea the container resized — so tiles never load and you see a blank/grey area.

The existing `invalidateSize` call only runs when `center`/`zoom` change, not when the container's visibility flips.

### Changes

**1. `src/components/MapView.tsx` — observe container size**
- Add a `ResizeObserver` on the map container inside the mount effect.
- Whenever the container's size changes from 0 to non-zero (or any size change), call `map.invalidateSize(false)` so Leaflet recalculates and loads the correct tiles.
- This fixes the issue regardless of *why* the container became visible (mobile tab toggle, sidebar collapse, orientation change, etc.) — no coupling to ExplorePage state needed.

**2. `src/pages/ExplorePage.tsx` — keep map mounted, just hide it**
- Current code already uses `hidden`/`flex` (good — keeps the map mounted across tab switches).
- Confirm the wrapper uses `hidden md:flex` style classes so the map element stays in the DOM but is visually hidden — the `ResizeObserver` will then handle the reveal.

### Technical notes
- `ResizeObserver` is supported in all modern mobile browsers.
- We deliberately keep the map mounted (rather than unmount/remount on tab switch) because remounting Leaflet is expensive and causes a visible flash.
- No changes to coordinate validation — the existing `isValidLatLng` guards stay in place.

### Files to edit
- `src/components/MapView.tsx` (add ResizeObserver in mount effect)

