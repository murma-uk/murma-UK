## User Dashboard — `/me`

A personal home for anyone signed in. Shows their identity, headline metrics across all the requests they've posted, and a manageable list of those requests.

### Page layout

```text
┌─────────────────────────────────────────────────────┐
│  HEY!  Jane Doe                                     │
│  joined Mar 2026 · 12 requests live                 │
│  [Edit display name]   [New request]                │
├─────────────────────────────────────────────────────┤
│  TOTALS  (4 stat tiles, brand StatTile style)       │
│  [Upvotes] [Views] [Shares] [Live requests]         │
├─────────────────────────────────────────────────────┤
│  YOUR REQUESTS                                      │
│  Tabs: Active · Closed · All       Sort: New/Top    │
│                                                     │
│  ┌─ Request row ──────────────────────────────────┐ │
│  │ category chip · title                          │ │
│  │ town · live for 3d · 24 ▲ · 180 views · 6 ◔   │ │
│  │ [Open] [Share] [Close] [Delete]                │ │
│  └────────────────────────────────────────────────┘ │
│  …                                                  │
└─────────────────────────────────────────────────────┘
```

### Routing & access
- New route `/me` → `ProfilePage`, gated: if not signed in, redirect to `/auth?next=/me`.
- Add a "Profile" link/avatar button to `Navbar` (signed-in only) pointing to `/me`. Replace the lone sign-out icon with a small dropdown: My profile / Sign out.

### Sections

1. **Header card**
   - Display name (editable inline → updates `profiles.display_name`).
   - Member since (from `auth.user.created_at`).
   - Quick actions: New Request, Sign out.
   - Brand: paper card, BrickStripe accent, Wordmark-free.

2. **Totals row** — 4 StatTiles, summed across the user's requests:
   - Total upvotes (sum `upvote_count`)
   - Total views (sum `view_count`)
   - Total shares (sum `share_count`)
   - Live requests (count where `status = 'active'`)

3. **My requests list**
   - Query: `requests` where `user_id = auth.uid()`, ordered by `created_at desc`.
   - Tabs filter by status; sort toggles created_at vs upvote_count.
   - Each row shows category chip, title, town, live-since, and per-request metrics (upvotes / views / shares) using the same `formatLiveSince` helper from RequestDetailPage.
   - Row actions:
     - **Open** → navigate to request detail.
     - **Share** → reuse `ShareButton`.
     - **Close / Reopen** → updates `requests.status` between `active` and `closed` (RLS already allows owner update).
     - **Delete** → confirm dialog, deletes the row (RLS already allows owner delete).
   - Empty state: paper card with "No requests yet" + CTA to create one.

4. **Recently upvoted** (secondary section, collapsible)
   - Shows the 5 most recent rows from `upvotes` joined to `requests` for this user, so people can find things they've supported.

### Technical details
- New file `src/pages/ProfilePage.tsx`. Register in `src/App.tsx` at `/me`.
- New small components:
  - `src/components/profile/ProfileHeader.tsx`
  - `src/components/profile/ProfileTotals.tsx` (reuses the StatTile pattern from RequestDetailPage — extract it to `src/components/brand/StatTile.tsx` so both pages share it).
  - `src/components/profile/MyRequestRow.tsx`
- Data fetching with `@tanstack/react-query`:
  - `useMyRequests()` → `requests` filtered by `user_id`.
  - `useMyUpvotes()` → `upvotes` join `requests`.
  - Totals derived client-side from `useMyRequests` (no extra query needed).
- Mutations:
  - Update display name → `supabase.from('profiles').update({ display_name }).eq('user_id', user.id)`.
  - Toggle status → `supabase.from('requests').update({ status }).eq('id', ...)`.
  - Delete → `supabase.from('requests').delete().eq('id', ...)`; invalidate `useMyRequests`.
- No schema changes required; existing RLS on `requests`, `upvotes`, `profiles` already covers everything.
- Auth gating handled in-component via `useAuth()` + `<Navigate to="/auth?next=/me" />` when `!loading && !user`.

### Out of scope (call out, not built)
- Notifications / email digests.
- Public profile pages for other users.
- Avatar uploads (no storage bucket configured).
