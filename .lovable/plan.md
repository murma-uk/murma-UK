## Backlog item: Azure Maps → OSM fallback in business search

Saved for later — not for immediate implementation. When you're ready to pick this up, approve this plan to proceed.

### Goal

Improve business search coverage (especially for UK chains like Tesco, Greggs, Costa) by querying **Azure Maps Search POI** first and **automatically falling back to the existing Overpass/OSM logic** when Azure returns no results or errors.

The frontend (`BusinessSearch.tsx`) does not change — it keeps calling the `search-businesses` edge function with `{ town, query }` and receives the same `BusinessResult[]` shape.

### Prerequisites (user actions)

1. Create an **Azure Maps Account** in the [Azure Portal](https://portal.azure.com) (Gen2, S0 pricing tier — generous free tier).
2. Open the account → **Authentication** → copy the **Primary Key**.
3. When this plan is approved, I'll request the secret `AZURE_MAPS_KEY` and you paste it.

### Technical changes

**`supabase/functions/search-businesses/index.ts`** — restructure into two helpers:

1. `searchAzure(town, query)`:
   - Hit `https://atlas.microsoft.com/search/poi/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${query}&countrySet=GB,IE&limit=20` (or `search/fuzzy` if `query` is empty, scoped to the town's bounding box from Nominatim).
   - Map each result to `BusinessResult`:
     - `osm_id`: stable numeric hash of Azure's `poi.id` (so existing dedupe by `osm_id` keeps working without a schema change).
     - `osm_type`: `"node"` (synthetic).
     - `name`: `poi.name`.
     - `business_type`: first `poi.classifications[0].names[0].name` (e.g. `"supermarket"`), normalized to snake_case.
     - `lat`/`lng`: `position.lat` / `position.lon`.
     - `town`: input `town`.
     - `address`: `address.freeformAddress`.
   - Return `[]` on any error or zero results (don't throw — let fallback kick in).

2. `searchOverpass(town, query)`:
   - The existing implementation, extracted unchanged.

3. Main handler:
   ```ts
   let results = AZURE_MAPS_KEY ? await searchAzure(town, query) : [];
   let source = "azure";
   if (results.length === 0) {
     results = await searchOverpass(town, query);
     source = "osm";
   }
   return { results, source };
   ```
   - `source` is added to the response for debugging but `BusinessSearch.tsx` ignores it.

**`supabase/functions/link-business/index.ts`** — small follow-up:
- Currently fetches canonical data from `openstreetmap.org/api/0.6/...` keyed on `osm_id`. For Azure-sourced rows the synthetic `osm_id` won't resolve at OSM. Change the function to:
  1. First try OSM lookup as today.
  2. If OSM 404s, accept the row's `name`, `lat`, `lng`, `address` as-passed from the frontend (they came from Azure and are already trustworthy).
- No DB schema change needed.

**Frontend** — no changes. `BusinessSearch.tsx` and `CreateRequestDialog.tsx` keep working as-is.

### Edge cases

- **No Azure key set** → function still works, falls back to OSM-only (current behaviour).
- **Azure rate-limited / network error** → caught, treated as zero results, fallback runs.
- **Duplicate businesses across sources** → low risk because Azure runs first; only when Azure returns 0 does OSM run. A user picking the same shop on different days will hit the same source consistently for a given query.
- **Cost** → Azure S0 free tier covers ~5,000 search calls/day; well above any community-app load.

### Out of scope (separate future work)

- Storing `azure_poi_id` as a first-class column on `businesses` (cleaner long-term but requires migration).
- Merging Azure + OSM results in parallel (more complex dedupe).
- Switching the *map renderer* to Azure Maps — keeping Leaflet.
