## Remove comments + add request stats (live time, views, shares, upvotes)

### Database (migration)
- **Drop** `public.comments` table (CASCADE — removes its 3 RLS policies).
- **Add to `public.requests`**: `view_count int NOT NULL DEFAULT 0`, `share_count int NOT NULL DEFAULT 0`.
- **Functions** (SECURITY DEFINER, granted to anon + authenticated):
  - `increment_request_view(_request_id uuid)` → `UPDATE requests SET view_count = view_count + 1`
  - `increment_request_share(_request_id uuid)` → same for `share_count`

(`upvote_count` already exists; "live time" derives from `created_at`.)

### Frontend

**Remove comments**
- `RequestDetailPage.tsx` — drop the entire Comments section, all comment state/handlers, and the `comments`/`profiles` fetch block.
- `RequestCard.tsx` — drop the `commentCount` prop and the `<MessageCircle>` count chip.
- `PrivacyPage.tsx` — remove "comments" from two policy sentences.

**Stats panel on `RequestDetailPage`**
A compact 4-tile row under the title (mono labels, Bebas Neue numbers):

```text
┌──────────┬──────────┬──────────┬──────────┐
│  LIVE    │  VIEWS   │  SHARES  │ UPVOTES  │
│  3 days  │   142    │    18    │    27    │
└──────────┴──────────┴──────────┴──────────┘
```

- "Live" formatted as `Xh`, `Xd`, `Xw`, `Xmo` from `created_at`.
- Numbers come straight from the new columns + existing `upvote_count`.

**View tracking**
- On `RequestDetailPage` mount, after a request resolves, call `supabase.rpc('increment_request_view', { _request_id })` once per page-load (guard with a `useRef` so React StrictMode double-mount doesn't double-count).

**Share tracking**
- `ShareButton.tsx` — fire `supabase.rpc('increment_request_share', { _request_id: id })` whenever the user picks any share action (copy / WhatsApp / Facebook / X / Email / native). Add an optional `onShared` callback so the detail page can refresh its stat tile.

### Files touched
- new migration (drop comments, add counters + RPCs)
- `src/pages/RequestDetailPage.tsx` — strip comments, add stats row, view tracking
- `src/components/RequestCard.tsx` — remove commentCount prop/UI
- `src/components/ShareButton.tsx` — call share RPC, accept request id (already has it) + `onShared`
- `src/pages/ExplorePage.tsx` — drop any `commentCount` prop passed to cards
- `src/pages/PrivacyPage.tsx` — copy edit

Approve and I'll apply.