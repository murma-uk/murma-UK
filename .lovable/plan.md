

## Plan: Let users start a request from the list, derive location from the business

Right now on mobile, the only entry point to create a request is the "Drop pin to request" button on the map pane. That button forces map-first interaction even when the user already knows the business they want to nominate. We'll add a list-view entry point and rework `CreateRequestDialog` so a pin is optional when a business is chosen.

### What the user will see

**Mobile List view** gets a floating "+ New request" pill (bottom-right). Tapping it opens the Create Request dialog immediately — no map flip required.

Inside the dialog, the user can fill in Title, Description, Category, Town, and (most usefully) **search/pick a Business**. Location is resolved in this priority:

1. **Business picked** → coordinates and town come from the business (OSM lat/lng). No pin needed.
2. **Pin dropped on map** → coordinates and reverse-geocoded town come from the pin (today's behaviour).
3. **Neither** → a small inline prompt appears: *"Pick a business or drop a pin on the map to set a location"* with a **"Drop pin on map"** button that closes the dialog, switches the mobile view to **Map**, and enters pin mode. The dialog re-opens with the user's already-typed Title/Description/Category/Town preserved when the pin lands.

Submit button is disabled until either a business or a pin is set.

### Desktop

Unchanged in layout — the new floating button is `md:hidden`. Desktop users can also benefit from the new "business sets the location" rule: picking a business in the dialog now satisfies the location requirement without needing to drop a pin first.

### Technical changes

**`src/pages/ExplorePage.tsx`**
- Make the sidebar wrapper `relative` and add a `md:hidden` floating Button (bottom-right, `rounded-full shadow-lg`, `MapPin` icon, label "New request") that calls `setCreateOpen(true)`. Below it, when `!user`, show the same "Plan now — sign in required to post" hint as the map button.
- New helper `handleRequestPinFromDialog(draft)`:
  - Stash the in-progress draft in state (`setInitialDraft(draft)`),
  - `setCreateOpen(false)`, `setMobileView("map")`, `setPinMode(true)`.
- When the map click resolves (`handleMapClick`), the existing flow already re-opens the dialog with `droppedPin` set; we just also pass through the preserved `initialDraft` (already wired).
- Pass `handleRequestPinFromDialog` as a new `onRequestPin` prop to `CreateRequestDialog`.

**`src/components/CreateRequestDialog.tsx`** (need to view to confirm exact shape, but the contract is):
- Accept new optional prop `onRequestPin?: (draft) => void`.
- Selected business (from `BusinessSearch`) already exposes `lat`, `lng`, `town`. When a business is selected, treat its coords as the location and **hide** the "drop a pin" prompt; auto-fill Town from the business if the field is empty.
- If no business and no `pinLocation`:
  - Show an inline notice + a "Drop pin on map" button that calls `onRequestPin({ title, description, category, town, business })`.
  - Disable the submit button.
- On submit, resolve `lat`/`lng` from `selectedBusiness ?? pinLocation`.

**`src/lib/slug.ts` / routing / DB** — no changes.

### Edge cases

- User picks a business, then later drops a pin → business wins (coords from business). If they want to override, they can clear the business in `BusinessSearch` (the `X` button already exists).
- User had a pin, then picks a business → business wins; the pin is ignored for submission (we don't clear `droppedPin` so the map still shows it visually).
- Draft preservation across map flip uses the existing `initialDraft` mechanism + `sessionStorage` fallback — no new persistence code needed.

