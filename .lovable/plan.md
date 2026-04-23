
## Plan: Pretty request URLs with slugs

Move request URLs from `/request/{uuid}` to `/request/{slug}-{shortId}` (e.g. `/request/bring-tk-maxx-to-leeds-8f2a1c3d`). Old UUID-only links keep working.

### URL format

```
/request/bring-tk-maxx-to-leeds-8f2a1c3d
         └────── slug ───────┘ └─ short ─┘
```

- **slug** — kebab-case from `title` (+ `town` if not already in title), max 60 chars, ASCII only.
- **shortId** — first 8 chars of the request UUID. Enough to disambiguate; we still resolve via DB lookup so collisions don't break.

### Database changes (migration)

1. Add `slug text` column to `requests` (nullable, no unique constraint — the short-id keeps URLs unique).
2. Create a SQL helper `public.slugify(text)` that lowercases, strips diacritics, replaces non-alphanumerics with `-`, trims, and clips to 60 chars.
3. Trigger `requests_set_slug` BEFORE INSERT OR UPDATE OF title, town: sets `NEW.slug = slugify(NEW.title || '-' || NEW.town)` when slug is null or title/town changed.
4. Backfill: `UPDATE requests SET slug = slugify(title || '-' || town) WHERE slug IS NULL;`

No RLS changes needed — slug is a public field on an already-public table.

### Code changes

**`src/lib/slug.ts` (new)** — tiny helpers:
- `buildRequestPath(id, slug)` → `/request/${slug}-${id.slice(0,8)}` (falls back to `/request/${id}` if slug missing).
- `parseRequestParam(param)` → returns `{ shortId, isUuid }`. If param is a full UUID, treat as legacy. Otherwise extract the trailing 8-hex-char segment as `shortId`.

**`src/pages/RequestDetailPage.tsx`** — update fetch logic:
- Use `parseRequestParam(id)`.
- If full UUID: `eq("id", id)` as today, then `navigate(buildRequestPath(...), { replace: true })` to canonicalise.
- If short-id: query with `.ilike("id::text", shortId + "%")` — actually use `.filter("id", "like", shortId + "%")` after casting; simpler: store `id_short` as a generated column. **Decision:** add a generated column `id_short text GENERATED ALWAYS AS (substring(id::text, 1, 8)) STORED` with an index, then `.eq("id_short", shortId)`.
- 404 if no match; if multiple matches (collision), pick newest and log a warning.

**Update all link generators** to use `buildRequestPath(r.id, r.slug)`:
- `src/components/RequestCard.tsx` (navigate on click)
- `src/pages/ExplorePage.tsx` (`onMarkerClick` → navigate)
- `src/pages/MyRequestsPage.tsx` (if/when present)
- `ShareButton` canonical URL

**`src/App.tsx`** — route stays `/request/:id` (the param now accepts both formats; no router change needed).

**Type regeneration** — `src/integrations/supabase/types.ts` will auto-regenerate after the migration so `requests.slug` and `id_short` are typed.

### Backwards compatibility

- Old `/request/{full-uuid}` links continue to work and 301-style redirect (via `navigate(..., { replace: true })`) to the pretty URL once loaded.
- Already-shared links on social/messaging keep resolving.

### Files

```text
NEW    supabase migration             — add slug, id_short, slugify(), trigger, backfill
NEW    src/lib/slug.ts                — buildRequestPath / parseRequestParam
EDIT   src/pages/RequestDetailPage.tsx — resolve by short-id or uuid, canonicalise URL
EDIT   src/components/RequestCard.tsx  — link via buildRequestPath
EDIT   src/pages/ExplorePage.tsx       — marker navigation via buildRequestPath
EDIT   src/components/CreateRequestDialog.tsx — after insert, navigate to pretty URL (if it does so today)
```

### Notes
- 8-hex-char short IDs give 4.3 billion combinations — collision risk is negligible at this scale, and the resolver handles it gracefully.
- Slug is informational only; changing the title later updates the slug, but old links still resolve because the short-id is the actual key.
- No SEO meta tags are added in this pass — can be a follow-up if you want richer link previews.
