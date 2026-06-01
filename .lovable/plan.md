# Plan: Google Maps connector — Geocoding (A) + Places autocomplete (B)

Keep the Leaflet map as-is. Replace Nominatim with Google Geocoding via the connector gateway, and add Google Places (New) autocomplete to the town inputs.

## 1. Connect the Google Maps Platform connector
Trigger `standard_connectors--connect` for `google_maps`. After linking, these are available:
- Edge functions: `LOVABLE_API_KEY`, `GOOGLE_MAPS_API_KEY`
- Browser: `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`, `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID`

## 2. New edge function: `geocode`
`supabase/functions/geocode/index.ts` — single function, two modes:
- `{ mode: "forward", query: string }` → Google Geocoding API, biased to GB/IE → `{ lat, lng, town, formatted }`
- `{ mode: "reverse", lat, lng }` → Google Reverse Geocoding → `{ town, formatted }`

Calls go through `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json` with the required `Authorization` + `X-Connection-Api-Key` headers. Zod validation, CORS headers, no JWT required (public lookup).

## 3. Replace Nominatim calls
- `src/pages/ExplorePage.tsx` (reverse geocode after pin drop) → `supabase.functions.invoke("geocode", { body: { mode: "reverse", lat, lng } })`
- `src/components/CreateRequestDialog.tsx` (forward geocode of town on submit when no pin) → same function with `mode: "forward"`
- Remove the two `fetch("https://nominatim...")` blocks.

## 4. Places autocomplete component
New `src/components/PlaceAutocomplete.tsx`:
- Loads Maps JS API once with `loading=async&callback=__lovableInitMaps&libraries=places&channel=<tracking-id>` using the browser key.
- Uses `AutocompleteSuggestion.fetchAutocompleteSuggestions` (Places API New) with a debounced input and a per-mount `AutocompleteSessionToken`.
- Props: `value`, `onChange(text)`, `onSelect({ placeId, primaryText, lat?, lng? })`, `types` (e.g. `["(cities)"]` for towns, `["establishment"]` for businesses), `regionCodes: ["gb","ie"]`.
- Renders styled with existing shadcn `Command`/`Popover` primitives so it matches the rest of the dialog.

## 5. Wire autocomplete into NewBranchFields
`src/components/request/NewBranchFields.tsx`:
- Town input → `<PlaceAutocomplete types={["(cities)"]}>`; on select, fill `value.town` and (if returned) auto-fill `pinLocation` for forward-geocode skip.
- Business name input → optional second `<PlaceAutocomplete types={["establishment"]}>` to surface real branches (improves the new-branch flow with a real `placeId`). Skip if you'd rather keep this minimal — say the word.

## 6. Memory update
Update `mem://index.md` Core line: "Leaflet + OpenStreetMap tiles for map rendering; Google Maps Platform (via Lovable connector) for geocoding and Places autocomplete."

## Technical notes
- Browser key is referrer-restricted to `*.lovable.app`; for a custom domain the user will later need their own Google key + referrers — flagged but not blocking.
- No changes to `MapView.tsx`, no Leaflet removal.
- No new runtime secrets needed beyond what the connector provides.

## Files touched
- New: `supabase/functions/geocode/index.ts`, `src/components/PlaceAutocomplete.tsx`
- Edited: `src/pages/ExplorePage.tsx`, `src/components/CreateRequestDialog.tsx`, `src/components/request/NewBranchFields.tsx`, `mem://index.md`
