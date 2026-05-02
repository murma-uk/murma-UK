## Plan: Admin-managed categories + per-category custom fields

Two related upgrades to the existing admin categories system:

1. **Categories** — let admins add new rows in the UI, with a clear note about the enum constraint (any new slug must be one of the existing enum values, or a developer adds a new enum value via migration first).
2. **Custom fields** — replace the hardcoded per-category field blocks in `CreateRequestDialog` with a fully data-driven schema builder. Admins design the questions; the dialog renders them dynamically; answers are stored as JSONB on each request.

---

### Database changes

**New table `public.request_category_fields`**

| column | type | notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `category_id` | uuid NOT NULL | FK → `request_categories.id`, on delete cascade |
| `key` | text NOT NULL | machine name, unique per category (e.g. `open_time`) |
| `label` | text NOT NULL | shown to users |
| `field_type` | text NOT NULL | one of `text`, `textarea`, `number`, `date`, `time`, `select`, `multiselect`, `days` |
| `options` | jsonb | array of `{value,label}` for select/multiselect; null otherwise |
| `placeholder` | text | optional |
| `help_text` | text | optional |
| `required` | bool NOT NULL DEFAULT false |
| `sort_order` | int NOT NULL DEFAULT 0 |
| `is_active` | bool NOT NULL DEFAULT true |
| `created_at` / `updated_at` | timestamptz | trigger-managed |

Validation trigger (not CHECK) on `field_type` and on `options` shape when type is select/multiselect.

UNIQUE(`category_id`, `key`).

**RLS**: public SELECT; admin-only INSERT/UPDATE/DELETE via `has_role(auth.uid(), 'admin')`.

**`requests` table**: add `field_values jsonb NOT NULL DEFAULT '{}'::jsonb`. Existing rows default to `{}`.

**Seed**: migration inserts the current 5 categories' field definitions so behavior is unchanged on day one:
- `opening_hours`: `open_time` (time), `close_time` (time), `days` (days)
- `classes_sessions`: `class_type` (text), `skill_level` (select: beginner/intermediate/advanced/all)
- `artist_visit`: `artist_name` (text), `event_date` (date), `audience_size` (number)
- `new_branch`, `announcement`: no fields (description-only, as today)

### Frontend

**Dynamic form renderer**
- New `src/components/DynamicFieldRenderer.tsx` — given a list of field definitions and a `values`/`onChange`, renders the right control per `field_type` (reuses existing Input/Textarea/Select; `days` reuses the day-pill pattern already in `CreateRequestDialog`).
- New hook `src/lib/categoryFields.ts` → `useCategoryFields(categoryId)` (TanStack Query, keyed by category id, fetches active fields ordered by `sort_order`).

**`CreateRequestDialog` refactor**
- Remove the hardcoded `openTime/closeTime/days/classType/...` state and the `renderCategoryFields` switch.
- Hold a single `fieldValues: Record<string, unknown>` state.
- When category changes, fetch its fields and render them via `DynamicFieldRenderer`.
- On submit:
  - Validate required fields client-side with zod built from the field definitions.
  - Build the description preview by concatenating field key/value pairs (same UX as today) and also save the structured values to `requests.field_values`.
- Update the draft (`RequestDraft`) saved to sessionStorage to use `fieldValues` instead of the old per-field props. Old drafts are ignored if shape doesn't match.

**`RequestDetailPage`**
- If the request has `field_values`, render them as a small definition-list (label → value) above the description, looking up labels from the category's fields.

**Admin UI** (`src/pages/AdminCategoriesPage.tsx`)
- **Add category** button — opens a dialog asking for slug (dropdown of unused enum values: computed as `enum values – existing categories`), label, icon, color, sort order. If no enum values are available, the button is disabled with a tooltip explaining a developer needs to extend the enum first. This preserves the "keep current trade-off" decision while giving admins room to add a category whenever an enum slot is free.
- **Manage fields** button per category row — opens a side panel listing that category's fields, with inline edit, drag-to-reorder (using `sort_order`), add/remove field, and a small preview that renders `DynamicFieldRenderer` against the current draft list.
- Field editor controls: label, key (auto-slugified from label, editable), type (select), options editor (only for select/multiselect), placeholder, help text, required switch, active switch.

### Files

**New**
- migration: `request_category_fields` table + `requests.field_values` column + seed
- `src/lib/categoryFields.ts`
- `src/components/DynamicFieldRenderer.tsx`
- `src/components/admin/CategoryFieldsPanel.tsx`
- `src/components/admin/AddCategoryDialog.tsx`

**Modified**
- `src/components/CreateRequestDialog.tsx` — dynamic field rendering, JSONB submit, draft shape change
- `src/pages/AdminCategoriesPage.tsx` — add-category + manage-fields entry points
- `src/pages/RequestDetailPage.tsx` — render structured `field_values`
- `src/integrations/supabase/types.ts` — auto-regenerated
- `mem://features/categories` — document the new field schema and the enum-availability rule for adding categories

### Non-goals

- Not removing the `request_category` enum (per your "keep current trade-off" choice).
- Not adding ALTER TYPE from the client.
- Not migrating historical request descriptions back into structured `field_values` — only new submissions populate it.
- No conditional/visibility logic between fields in v1.
