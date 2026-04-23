

## Plan: Fix the two security warnings

### Issue 1 — `unaccent` extension in `public` schema

Move it to the dedicated `extensions` schema where Supabase expects it. The `slugify()` function already has `SET search_path = public, extensions`, so it'll keep working unchanged.

**Migration:**
```sql
DROP EXTENSION IF EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
```

If the drop fails because `slugify()` depends on it, we'll `CREATE EXTENSION ... WITH SCHEMA extensions` first and then update `slugify()` to call `extensions.unaccent(...)` explicitly.

### Issue 2 — `businesses.INSERT` policy is wide open

Currently any signed-in user can insert any row into `businesses` (`WITH CHECK (true)`), which means a malicious user could spam fake business records. We can't drop the table without a bigger refactor (the Businesses sidebar, map markers, and `requests.business_id` join all depend on it), so we'll move the insert path off the client and behind a trusted server boundary that re-validates the data against a third-party source (OpenStreetMap, which we already use).

**Approach:** Replace direct client inserts with an edge function `link-business` that:

1. Accepts `{ osm_id, osm_type }` from the client (just the OSM identifier — no name/coords/etc. that the client could forge).
2. Validates the user's JWT.
3. Fetches the canonical record from the OSM API server-side:
   `https://www.openstreetmap.org/api/0.6/{node|way|relation}/{osm_id}.json`
4. Extracts `name`, `tags.shop|amenity|leisure|tourism`, `lat`, `lng`, address fields directly from the OSM response — client-supplied values are ignored.
5. Reverse-geocodes the town via Nominatim (server-side, with our app's User-Agent).
6. Upserts into `businesses` keyed on `osm_id` using the service role (bypassing RLS).
7. Returns the `businesses.id` for the client to attach as `requests.business_id`.

Then tighten RLS:
```sql
DROP POLICY "Authenticated users can add businesses" ON public.businesses;
-- No INSERT policy = no client inserts allowed.
-- The edge function uses the service role, which bypasses RLS.
```

**Client changes** (`src/components/CreateRequestDialog.tsx`):
- Replace the inline `select existing → insert new` block with a single `supabase.functions.invoke("link-business", { body: { osm_id, osm_type } })` call that returns `{ business_id }`.
- `BusinessSearch` already gets `osm_id` from Overpass; we'll also pass through `osm_type` (Overpass returns `type: "node"` etc. — store it on `BusinessResult`).

**Why this is safer:**
- Users can no longer write arbitrary `name`/`lat`/`lng`/`address` to the public `businesses` table.
- The server is the only writer, and it only writes data it fetched itself from OSM — a trusted third-party source.
- Existing rows keep working unchanged; the table shape doesn't change (no schema migration on `businesses`).

### Files

```text
NEW    supabase/migrations/<ts>_security_fixes.sql
         - move unaccent extension to extensions schema
         - drop businesses INSERT policy
NEW    supabase/functions/link-business/index.ts
         - JWT verify, fetch OSM, upsert via service role
EDIT   src/components/BusinessSearch.tsx
         - include osm_type ("node"/"way"/"relation") on BusinessResult
EDIT   src/components/CreateRequestDialog.tsx
         - call link-business edge function instead of direct insert
```

### Notes
- No user-facing UX change — picking a business and submitting still works the same way.
- The edge function's outbound calls to OSM are rate-limited by OSM's fair-use policy (1 req/sec for Nominatim); for a community app this is fine.
- We're NOT dropping the `businesses` table or moving fully to live OSM lookups — that would break the Businesses sidebar/map view, the `business_id` foreign-link on requests, and request counts per business. Happy to plan that as a separate larger refactor if you'd prefer.

