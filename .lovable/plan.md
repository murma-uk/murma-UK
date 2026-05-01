## Plan: Move request categories into a database table

Today categories live in two places: a Postgres enum `request_category` and a hardcoded map in `src/lib/categories.ts`. We'll introduce a `request_categories` table as the source of truth for **labels, icons, colors, sort order, and active state**, while keeping the existing enum as the stable slug used by `requests.category`. This keeps every existing request working and avoids a risky enum migration.

An **admin-only management page** will let users with the `admin` role add, edit, reorder, and disable categories.

### Database (migration)

New table `public.request_categories`:

| column | type | notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `slug` | text UNIQUE NOT NULL | matches `request_category` enum values for the seeded 5 |
| `label` | text NOT NULL | display name |
| `icon_name` | text NOT NULL | Lucide component name, e.g. `"Clock"` |
| `color` | text NOT NULL | HSL string, e.g. `"hsl(210, 100%, 50%)"` |
| `sort_order` | int NOT NULL DEFAULT 0 | for ordering in pickers/filters |
| `is_active` | bool NOT NULL DEFAULT true | hides without deleting |
| `created_at` / `updated_at` | timestamptz | `update_updated_at_column` trigger |

**RLS policies:**
- `SELECT`: public — needed so the explore page, filters, and dialog can render.
- `INSERT` / `UPDATE` / `DELETE`: only when `public.has_role(auth.uid(), 'admin')`.

**Seed rows** (slugs match the existing enum, so `requests.category` keeps validating):
- `opening_hours` — Opening Hours, `Clock`, `hsl(210, 100%, 50%)`
- `new_branch` — New Branch, `MapPin`, `hsl(145, 65%, 42%)`
- `classes_sessions` — Classes & Sessions, `GraduationCap`, `hsl(280, 70%, 55%)`
- `artist_visit` — Artist Visit, `Palette`, `hsl(12, 90%, 60%)`
- `announcement` — Announcement, `Megaphone`, `hsl(38, 92%, 50%)`

**No change** to the `request_category` enum or to `requests.category`. New categories added later will require an enum value to be added (one-line migration) and a row in this table — we'll document this trade-off in `mem://`.

### Frontend changes

**`src/lib/iconRegistry.ts` (new)** — small whitelist mapping Lucide icon names to components (`Clock`, `MapPin`, `GraduationCap`, `Palette`, `Megaphone`, plus a starter set like `Coffee`, `ShoppingBag`, `Music`, `Calendar`, `Star`, `Heart`, `Bell` for admin choice). Falls back to a default icon if an unknown name is stored.

**`src/lib/categories.ts`** — replace the hardcoded `CATEGORIES` constant with:
- `useCategories()` hook that fetches active rows from `request_categories` ordered by `sort_order`, caches in React Query (or a lightweight context), and exposes `{ slug, label, color, Icon }`.
- A `getCategory(slug)` helper for lookups.
- Keeps exporting `RequestCategory` type for compile-time safety on the enum-bound column.

**Components updated to consume the hook** (no logic changes, just swap the import):
- `src/components/CategoryFilter.tsx`
- `src/components/CreateRequestDialog.tsx`
- `src/components/RequestCard.tsx`
- `src/components/MapView.tsx` (icon rendering for markers)
- `src/pages/RequestDetailPage.tsx`
- `src/pages/LandingPage.tsx`

Loading state: filters and pickers render a small skeleton while the hook resolves; `MapView` defers marker creation until categories load (already async-friendly).

### Admin management page

**`src/pages/AdminCategoriesPage.tsx` (new)** at route `/admin/categories`:
- Guarded by `useAuth()` + a `useIsAdmin()` hook (`select 1 from user_roles where role='admin'`). Non-admins get a 403 message; unauthenticated users redirect to `/auth`.
- Table of categories with inline edit for `label`, `color` (color picker), `icon_name` (combobox of registry icons with live preview), `sort_order` (drag handle or number), `is_active` (switch).
- "Add category" button — note in the UI that adding a brand-new slug also requires a developer to add the enum value (we won't try to ALTER TYPE from the client). For now, admins can only edit existing categories; "Add" is disabled with a tooltip explaining this. (If you later want to allow adding new categories from the UI, we'd add a backend function that runs `ALTER TYPE request_category ADD VALUE`.)
- Soft delete via `is_active = false` (hard delete blocked because requests reference the slug).

**Navbar:** show an "Admin" link only when `useIsAdmin()` is true.

### Files touched

- **New:** migration, `src/lib/iconRegistry.ts`, `src/pages/AdminCategoriesPage.tsx`, `src/hooks/useIsAdmin.tsx`
- **Modified:** `src/lib/categories.ts`, `src/App.tsx` (route), `src/components/Navbar.tsx`, the 6 components/pages listed above
- **Memory:** add `mem://features/categories` documenting the slug-mirrors-enum rule and how to add a new category end-to-end

### What this does **not** do

- Does not remove the `request_category` enum.
- Does not let admins create entirely new category slugs from the UI (requires enum migration).
- Does not change any existing request data.
