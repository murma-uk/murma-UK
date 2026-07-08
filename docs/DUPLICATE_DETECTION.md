# Duplicate Detection System

This document describes how Murma detects similar requests and helps users avoid posting duplicates.

## Overview

When users compose a new murma (request), the system automatically searches for similar existing murmas nearby and offers options to join them instead of creating a duplicate. This encourages users to "join forces" rather than fragment demand across multiple requests.

### Key Goals

- **Reduce fragmentation**: Consolidate similar requests in the same geographic area
- **Increase impact**: Combined upvotes/cosigners make signals stronger
- **Non-intrusive**: Users can dismiss and create new requests if they prefer
- **Real-time**: Results appear as they type (with debounce)

## How It Works

### 1. Frontend Detection Hook

**File**: `src/lib/similarRequests.ts`

The `useSimilarRequests` React hook triggers similarity detection:

```typescript
const { results, loading } = useSimilarRequests({
  text: wish,           // User's murma text
  category: effectiveCategory,
  lat: location.lat,
  lng: location.lng,
  enabled: wishReady && locationReady && !similarDismissed,
  debounceMs: 350,  // Prevents excessive API calls
});
```

**Requirements**:
- Text must be ≥10 characters
- Valid location (latitude + longitude)
- Category set (optional, can be `null` to match all)
- Not dismissed by user

**Debounce**: 350ms — waits for user to finish typing before calling RPC

### 2. Database RPC Function

**File**: `supabase/migrations/20260609155348_b568cfbd-c622-4565-8437-73fca38ed703.sql`

The `find_similar_requests` RPC function implements the core detection logic:

```sql
CREATE OR REPLACE FUNCTION public.find_similar_requests(
  _text text,
  _category public.request_category,
  _lat double precision,
  _lng double precision,
  _limit int DEFAULT 5
)
```

#### Scoring Algorithm

Results are ranked by a combined score (0–1 scale):

```
score = 0.6 * trgm_score + 0.4 * proximity_score

where:
  trgm_score = similarity(request.title, input_text)     [0–1]
  proximity_score = MAX(0, 1 - distance_km / 5)           [0–1]
```

**Weights**:
- **60% title similarity**: Trigram-based fuzzy matching
- **40% proximity**: Inverse distance (5km radius)

#### Filters

Results are included only if:
- **Status**: Request is `active` (not hidden/removed)
- **Similarity**: Trigram score ≥ 0.15
- **Distance**: ≤ 5km away
- **Category**: Matches if specified, otherwise all categories
- **Limit**: Returns up to 5 results, ranked by score

#### Technology: PostgreSQL Trigram Extension

The system uses PostgreSQL's `pg_trgm` extension for efficient fuzzy string matching:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX requests_title_trgm_idx ON public.requests 
  USING gin (title gin_trgm_ops);
```

**Trigram matching**:
- Breaks strings into 3-character sequences
- Compares overlapping trigrams for similarity
- Fast with GIN index
- Handles typos and variations well

### 3. UI Panel

**File**: `src/components/request/SimilarRequestsPanel.tsx`

When similar requests are found, an inline panel appears in the composer:

```
┌─────────────────────────────────────────┐
│ 3 similar murmas nearby                 │
│ Joining forces makes the murmur louder  │
│                                     [✕] │
├─────────────────────────────────────────┤
│ • Late-night bakery in town center  [→] │
│   📈 12 upvotes · 👥 2 cosigners · 0.3km│
│                                  [Join] │
│                                         │
│ • Evening coffee place needed       [→] │
│   📈 8 upvotes · 👥 1 cosigner · 0.8km │
│                                  [Join] │
├─────────────────────────────────────────┤
│ Show 1 more                            │
└─────────────────────────────────────────┘
```

**Features**:
- Shows up to 2 results by default (expandable)
- Displays title, upvote count, cosigner count, distance, town
- "Join" button for each result
- "View full murma" link (external)
- Dismiss button ([✕]) to hide the panel
- Loading state while searching

### 4. Join Dialog

**File**: `src/components/request/JoinRequestDialog.tsx`

When a user clicks "Join", a dialog opens with three options:

#### Option 1: Add Voice (Upvote)

- Creates an upvote record
- Optional: Leave an "angle" (comment explaining why it matters to you)
- Angle persists as a comment on the request

```typescript
await supabase
  .from("upvotes")
  .insert({ request_id: target.id, user_id: user.id });

if (angle) {
  await supabase
    .from("request_comments")
    .insert({ 
      request_id: target.id, 
      user_id: user.id, 
      body: angle, 
      kind: "angle" 
    });
}
```

#### Option 2: Co-sign

- Becomes a named co-signer (appears publicly with the request)
- Optional note (max 200 characters) — appears next to your name
- Creates a `request_cosigners` record

```typescript
await supabase
  .from("request_cosigners")
  .insert({ 
    request_id: target.id, 
    user_id: user.id, 
    note: trimmed_note 
  });
```

#### Option 3: Suggest Merge

- Only available if the user has a draft composed
- Proposes merging their draft into the existing request
- The original poster can accept/reject
- Creates a `merge_suggestions` record

```typescript
await supabase.from("merge_suggestions").insert({
  target_request_id: target.id,
  suggester_id: user.id,
  proposed_title: draft.title,
  proposed_body: draft.body,
  proposed_category: draft.category,
});
```

**Merge workflow**:
1. Suggester proposes a merge
2. Original poster receives a merge suggestion
3. Original poster can:
   - **Accept**: Suggester becomes cosigner, their content added as comment
   - **Reject**: Merge is declined, suggester can create their own request
   - **Cancel** (as suggester): Withdraw the suggestion

## Database Schema

### Tables

#### `requests` (extended)

```sql
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS 
  cosigner_count integer NOT NULL DEFAULT 0;

CREATE INDEX requests_title_trgm_idx ON public.requests 
  USING gin (title gin_trgm_ops);
```

#### `request_comments`

```sql
CREATE TABLE public.request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  kind text NOT NULL DEFAULT 'comment' CHECK (kind IN ('angle','comment')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Kinds**:
- `'angle'`: User's perspective on why this request matters
- `'comment'`: General discussion comment

#### `request_cosigners`

```sql
CREATE TABLE public.request_cosigners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  note text CHECK (note IS NULL OR length(note) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);
```

**Unique constraint**: A user can only cosign each request once. If they try to cosign again, the insert is ignored (`ON CONFLICT DO NOTHING`).

#### `merge_suggestions`

```sql
CREATE TABLE public.merge_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_request_id uuid NOT NULL REFERENCES public.requests(id),
  suggester_id uuid NOT NULL REFERENCES auth.users(id),
  proposed_title text NOT NULL,
  proposed_body text,
  proposed_category public.request_category NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Status lifecycle**:
- `'pending'`: Awaiting decision from request owner
- `'accepted'`: Owner accepted the merge
- `'rejected'`: Owner rejected the merge
- `'cancelled'`: Suggester withdrew the suggestion

### Triggers

#### Cosigner Count Maintenance

```sql
CREATE OR REPLACE FUNCTION public.increment_cosigner_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.requests 
    SET cosigner_count = cosigner_count + 1 
    WHERE id = NEW.request_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER request_cosigners_inc
  AFTER INSERT ON public.request_cosigners
  FOR EACH ROW EXECUTE FUNCTION public.increment_cosigner_count();
```

Maintains `requests.cosigner_count` in sync with actual cosigner rows.

## Integration Points

### WishComposer Component

**File**: `src/components/request/WishComposer.tsx`

The composer integrates duplicate detection at lines 151–157:

```typescript
const { results: similar, loading: similarLoading } = useSimilarRequests({
  text: wish,
  category: effectiveCategory ?? null,
  lat: location?.lat ?? null,
  lng: location?.lng ?? null,
  enabled: wishReady && locationReady && !similarDismissed,
});
```

Then renders the panel (lines 245–252):

```typescript
{mode === 'create' && wishReady && locationReady && !similarDismissed && 
  (similarLoading || similar.length > 0) && (
  <SimilarRequestsPanel
    results={similar}
    loading={similarLoading}
    onJoin={(t) => setJoinTarget(t)}
    onDismiss={() => setSimilarDismissed(true)}
  />
)}
```

### API Calls

All join actions use upsert patterns to handle duplicates gracefully:

```typescript
// Upvote: ignore if already upvoted
const { error: upErr } = await supabase
  .from("upvotes")
  .insert({ request_id: target.id, user_id: user.id });
if (upErr && !/duplicate|unique/i.test(upErr.message)) throw upErr;

// Cosign: ignore if already cosigned
const { error } = await supabase
  .from("request_cosigners")
  .insert({ request_id: target.id, user_id: user.id, note: null });
if (error && !/duplicate|unique/i.test(error.message)) throw error;
```

## Performance Considerations

### Query Optimization

The RPC function is optimized for fast results:

1. **Trigram Index**: GIN index on `requests.title` enables fast fuzzy matching
2. **Indexed Filters**: Status and category filtering leverage table indexes
3. **Distance Calculation**: Haversine formula is computed in-database (no network overhead)
4. **Limit 5**: Results are bounded to prevent large result sets
5. **Security Definer**: Runs with service role permissions, no RLS overhead

### Expected Performance

- **Query time**: 50–150ms typical (depends on active request count)
- **Debounce**: 350ms prevents excessive calls
- **Cache**: Browser caches results during active composition

### Scaling Considerations

As the request count grows:

- Add indexes if filtering by category becomes slow: `CREATE INDEX requests_category_idx ON public.requests(category)`
- Monitor trigram index size; consider partial indexes for inactive requests
- Consider caching frequently-searched categories in Redis
- Pagination support could be added if > 5 results becomes limiting

## Configuration & Tuning

### Adjustable Parameters

Edit these in `find_similar_requests` function:

```sql
_limit int DEFAULT 5                    -- Max results returned
WHERE distance_km <= 5                  -- Search radius (km)
  AND trgm_score >= 0.15                -- Min similarity threshold
```

And in `useSimilarRequests` hook:

```typescript
debounceMs = 350,                       -- Wait time before API call
text.trim().length < 10                 -- Min text length
```

### Tuning Guide

**To show more results**: Increase `_limit` in RPC, but may impact load
**To widen search**: Increase `distance_km` limit (default 5km)
**To catch fewer false positives**: Increase `trgm_score` threshold (default 0.15)
**To catch more variations**: Decrease `trgm_score` threshold
**To be more aggressive**: Decrease `debounceMs` (but use responsibly)

## Testing

### Manual Testing

1. **Compose a murma** with text that matches an existing one nearby
2. **Verify the panel appears** with correct results after 350ms
3. **Test all three join modes**: Upvote, Cosign, Suggest Merge
4. **Dismiss the panel** and verify it stays gone
5. **Create the request** and verify it's saved (not merged)

### Query Testing

Test the RPC directly:

```sql
SELECT * FROM public.find_similar_requests(
  'late night coffee',
  'food'::public.request_category,
  51.5074,    -- lat
  -0.1278,    -- lng
  5           -- limit
);
```

### Edge Cases

- **No results**: Panel doesn't appear (loading goes away)
- **Exact match**: Should rank highest
- **Typos**: Should match with trigram similarity
- **Very short text** (< 10 chars): Panel doesn't appear
- **No location**: Panel doesn't appear
- **Duplicate join**: Ignored by unique constraint
- **Dismissed panel**: User can continue creating their request

## Future Enhancements

- [ ] **Semantic similarity**: Use embeddings for meaning-based matching, not just text similarity
- [ ] **Category-only search**: Allow users to browse all requests in a category within a radius
- [ ] **Merge preview**: Show what the merged request would look like before accepting
- [ ] **Auto-suggest merge**: Recommend merge to users creating duplicate requests
- [ ] **Merge analytics**: Track which merges succeed and help users understand patterns
- [ ] **Regional hubs**: Allow moderators to manually link requests across nearby towns
- [ ] **Notification on similar**: Alert request author when a similar request is created
- [ ] **Historical duplicates**: Show requests that were merged/archived
- [ ] **Language variants**: Handle alternate spellings and dialectal variations
- [ ] **Internationalization**: Multilingual trigram matching

## Related Documentation

- [Email Notifications](./EMAIL_NOTIFICATIONS.md) — Notifying users of relevant activity
- Request moderation and flagging system
- Merge suggestions workflow
