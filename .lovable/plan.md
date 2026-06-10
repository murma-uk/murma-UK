## Moderation: flag, auto-hide, trusted reviewers

### User-facing flow

**Flag this post**
- Button on `RequestCard` (icon, low-emphasis) and prominently on `RequestDetailPage`.
- Opens a small dialog. Reason is **required**: `spam`, `off_topic`, `hateful_or_harassing`, `duplicate`, `illegal_or_unsafe`, `other`. Optional 280-char note.
- One flag per user per post (toggleable: re-open dialog shows "You've flagged this — withdraw?").
- After submit: toast "Thanks — moderators will take a look."

**Auto-hide at 3 flags**
- Post stays in DB but disappears from Explore, map, search, similar-request panel.
- Author still sees it on their profile with a clear "Hidden pending review — reason: …" banner and can edit + resubmit (which clears flags and re-queues).
- Direct link shows a "This post is hidden pending review" placeholder (except to author / admin / trusted reviewer).

**Trusted user tier**
- A user becomes trusted automatically when **all** are true:
  - ≥ 10 own posts that are `active` (not hidden/removed)
  - account age ≥ 14 days
  - ≥ N upvotes received across their posts (default **20**, tunable)
  - 0 of their own posts currently auto-hidden or removed
- Status is computed by a SQL function and cached on `profiles.is_trusted` (refreshed by triggers on `requests`, `upvotes`, `flags`, `request_moderation`). Shown as a small "Trusted" pip on their profile.

**Review queue**
- New page `/admin/moderation` visible to admins **and** trusted users.
- Lists currently hidden posts with flag reasons/counts, author, preview.
- Actions: **Restore** (clears flags, post becomes active) or **Remove** (status → `removed`, author notified on their profile).
- Trusted-user decisions are final for borderline content but admins can override.
- All decisions written to `request_moderation` audit log (who, action, note, timestamp).

### Data model

New enums:
- `flag_reason`: spam | off_topic | hateful | duplicate | illegal | other
- `moderation_action`: restore | remove | hide
- extend `request_status` (or equivalent) with `hidden`, `removed` if not already present

New tables (all in `public`, with GRANTs + RLS + service_role):

- **`request_flags`** — `request_id`, `user_id`, `reason flag_reason`, `note text`, `created_at`. Unique `(request_id, user_id)`.
  - RLS: authenticated users can insert/delete their own; select limited to admins + trusted (`has_role('admin')` or `is_trusted(auth.uid())`); author can see counts via aggregate function but not who flagged.

- **`request_moderation`** — audit log: `request_id`, `actor_id`, `action moderation_action`, `note`, `created_at`.
  - RLS: insert by admins/trusted via RPC only; select by admins/trusted + the post's author.

Profile change:
- `profiles.is_trusted boolean default false`

### Functions & triggers

- `public.is_trusted(_user_id uuid) returns boolean` — SECURITY DEFINER, checks the four criteria live (used as fallback / source of truth).
- `public.refresh_trusted_status(_user_id uuid)` — recomputes and updates `profiles.is_trusted`.
- Triggers calling `refresh_trusted_status` on insert/update/delete of `requests`, `upvotes`, `request_flags`, `request_moderation` (for the affected user).
- Trigger on `request_flags` AFTER INSERT: if active flag count for the post ≥ 3 and status is `active`, set `requests.status = 'hidden'` and insert a `request_moderation` row with action `hide`, actor = NULL (system).
- RPC `public.moderate_request(_request_id uuid, _action moderation_action, _note text)` — SECURITY DEFINER, requires caller is admin OR trusted, writes audit row, updates status, clears flags on `restore`.

### Frontend changes

- New `src/components/moderation/FlagDialog.tsx` (reason select + note + zod validation).
- Add flag button to `RequestCard.tsx` and `RequestDetailPage.tsx`.
- New `src/hooks/useIsTrusted.tsx` (mirrors `useIsAdmin`).
- New `src/pages/ModerationQueuePage.tsx` at `/admin/moderation`, registered in `App.tsx`. Navbar dropdown shows "Moderation queue" for admin OR trusted.
- Update Explore/Map/Similar queries to filter `status = 'active'`.
- `ProfilePage.tsx`: surface own hidden posts with reason + edit/resubmit action; show "Trusted reviewer" pip if applicable.
- `RequestDetailPage.tsx`: handle hidden-state placeholder for non-privileged viewers.

### Out of scope (this pass)

- Email notifications, appeal threads, shadow-banning users, IP/device fingerprinting, ML auto-classification, weighted trusted flags (your call: all flags equal).

### Validation

- After migration, run security scan + linter and fix anything new from the added tables/RPCs.
