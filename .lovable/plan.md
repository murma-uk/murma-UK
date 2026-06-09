## Goal

When someone is about to post a wish that already exists nearby, the app should *help them join an existing movement* rather than fragment it. Detection happens live as they type and again right after posting, and "joining" can be as light as an upvote or as committed as becoming a named co-signer.

## User journey

```text
TYPE WISH ──► (≥10 chars, debounced)
                │
                ▼
        Similar wishes panel appears under the input
        "3 people near you already wished for this"
        ├─ [Card] Late-night bookshop · 0.8km · 42 backers   [Back this instead]
        ├─ [Card] Indie bookstore in town · 2.1km · 18 backers
        └─ [Show 1 more]
                │
   ┌────────────┴────────────┐
   ▼                         ▼
Back this instead       Keep writing mine
 (upvote + optional      │
  "add your angle"       ▼
  comment, dialog        POST WISH
  closes with toast)         │
                             ▼
                   Confirmation screen
                   "Looks similar to these — want to combine forces?"
                   ├─ Suggest merge into "Late-night bookshop" (owner approves)
                   ├─ Become a co-signer on "Indie bookstore" (instant)
                   └─ Keep mine separate
```

## Detection

Three cheap signals combined into a single ranked list — no AI/embeddings in this pass:

1. **Geo** — same category, within 5 km of the wish's location.
2. **Title fuzzy match** — Postgres trigram similarity on `title` (and `description` when short). Requires `pg_trgm` + a GIN index.
3. **Keyword / brand overlap** — re-use the existing `classifyWish` hints (brand name, business-type slug, category keywords) to boost matches that mention the same thing.

Scoring: `0.5 * trigram + 0.3 * keyword + 0.2 * proximity`. Show up to 3 matches scoring ≥ 0.35. All ranking happens in a single SQL function so the client makes one call.

## Join actions

Three ways to combine forces, in increasing commitment:

- **Upvote + optional comment** — the lightest join. Reuses existing `upvotes` table; comment goes into a new `request_comments` row tagged `kind = 'angle'` so it renders distinctly on the request page.
- **Co-signer with own note** — a named, visible endorsement. New `request_cosigners` table with a short note (≤200 chars). Cosigners appear as chips on the request page and count toward a "X people backing this" number alongside upvotes.
- **Merge request (owner approves)** — when the user has already typed a substantive wish and chooses "Suggest merge", their draft is saved as a `merge_suggestions` row pointing at the target request. The original author sees an inbox badge; on accept, the suggester is added as a co-signer and any extra detail is appended as an angle comment. On reject, the suggester is offered to post separately.

No auto-merge in this pass — too risky for false positives.

## Scope of this pass

In:
- Live duplicate suggestions panel in `WishComposer` (debounced, dismissible per session).
- Post-submit "combine forces" sheet on the success path.
- Co-signer + comment + merge-suggestion data model with full RLS.
- Request detail page surfaces co-signers and angle comments, plus an inbox for merge suggestions for the owner.

Out:
- AI / semantic similarity (revisit once we see how trigram performs).
- Cross-town merging (only suggest within 5 km).
- Automatic merging without owner consent.
- Notifications outside the app (email/push).

## Technical details

**Database migration** (single migration, with grants + RLS on every new table):

- `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- Index: `CREATE INDEX requests_title_trgm_idx ON requests USING gin (title gin_trgm_ops);`
- `request_comments(id, request_id, user_id, body, kind text check in ('angle','comment'), created_at)` — RLS: anyone authenticated can read, only author can insert/update/delete their own.
- `request_cosigners(id, request_id, user_id, note, created_at, unique(request_id, user_id))` — same RLS shape. Add `cosigner_count` denormalised onto `requests` with insert/delete triggers (mirrors existing `upvote_count` pattern).
- `merge_suggestions(id, target_request_id, suggester_id, proposed_title, proposed_body, proposed_category, status text check in ('pending','accepted','rejected'), decided_at, created_at)` — RLS: suggester can read/insert/cancel their own; target request owner can read and update status.
- SECURITY DEFINER function `public.find_similar_requests(_text text, _category request_category, _lat double precision, _lng double precision, _limit int)` returning ranked candidates using the scoring above. Granted to `authenticated` and `anon` (lookup is safe — only reads public-readable fields).
- SECURITY DEFINER function `public.accept_merge_suggestion(_id uuid)` that, when called by the target owner, inserts a cosigner row + an angle comment and flips status to `accepted`.

**Frontend**:

- `src/lib/similarRequests.ts` — debounced hook `useSimilarRequests(wish, category, location)` calling the new SQL function.
- `src/components/request/SimilarRequestsPanel.tsx` — appears inside `WishComposer` below the wish textarea once `wish.length ≥ 10` and a location is set; renders compact cards with **Back this** and **View** actions; dismissible per draft.
- `src/components/request/JoinRequestDialog.tsx` — sheet used by both "Back this" (light) and the post-submit step (heavier). Modes: `upvote`, `cosign`, `suggest_merge`.
- `src/components/CreateRequestDialog.tsx` — after a successful insert, if there are remaining matches with score ≥ 0.5 not already actioned, replace the success toast with the `JoinRequestDialog` in `suggest_merge` / `cosign` mode targeting the top match.
- `src/components/RequestDetail*` — new sections: **Co-signers** (chip row with notes on hover/expand), **Angles** (comments tagged `angle` rendered above generic comments), and an **Owner inbox** card when `merge_suggestions.status = 'pending'` exists for a request you own, with Accept / Reject buttons.
- `src/pages/ProfilePage.tsx` — small "Suggestions you sent" list so suggesters can see status.

**Non-goals reminder**: no schema changes to `requests` beyond adding `cosigner_count`; no changes to the map, categories, or auth.

