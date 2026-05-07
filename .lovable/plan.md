## Goal

Reshape the New Request flow when category = **New Branch** so it reads like a natural sentence:

> "I want a **[bakery / Greggs]** near **[here / this town]**."

Other categories keep their existing dynamic-field flow.

## UX flow (New Branch only)

**Step 1 — What kind of business?**
A single combined search field with two modes the user toggles between (segmented control above the input):

- **A type of business** (default)
  - Combobox over a curated list (~40 entries: bakery, kids' shoe shop, CrossFit gym, coffee shop, pharmacy, bookshop, barber, vet, dry cleaner, ramen shop, etc.).
  - Free-typing filters; user must pick a list item (keeps data clean).
- **A named business** (brand)
  - Free text: "Greggs", "PC World".
  - On blur / debounce we show a confirmation card:
    > "Do you mean **Greggs**? — greggs.co.uk &nbsp; [Yes] [No, edit URL]"
  - "No" reveals an editable URL input pre-filled with the guess so the user can correct it.
  - URL is validated (must be a plausible domain).

**Step 2 — Where?**
Segmented control with three modes:

1. **In a town or city** (current behaviour) — Input + auto-fill from any dropped pin.
2. **At a specific spot** — "Drop pin on map" button (uses existing `onRequestPin` flow); shows "Pinned at lat,lng · town" once set.
3. **Near a point, within…** — "Pick centre on map" + radius selector (¼, ½, 1, 2, 5 miles). Stored as lat/lng + `radius_m`.

**Step 3 — Submit**
Title is auto-composed if blank ("New bakery in Hackney" / "Greggs in Hackney") but remains editable.

**Removed:** the "More details (optional)" textarea is gone for New Branch. Other categories keep theirs.

## Data model

Add to `requests`:
- `business_kind` text — `'type' | 'brand'`
- `business_type_slug` text — e.g. `bakery` (when kind = type)
- `brand_name` text — e.g. `Greggs`
- `brand_website` text — e.g. `https://greggs.co.uk`
- `radius_m` integer — only set when location mode = "near a point + radius"

All nullable; only relevant for New Branch but harmless on other rows.

Curated business types live in code at `src/lib/businessTypes.ts` — `{ slug, label, aliases?: string[] }`. Easy to extend later.

## Website-guess logic

Helper `guessBrandWebsite(name)`:
1. Slugify the name (lowercase, strip spaces/punctuation).
2. Try `https://{slug}.co.uk` first (UK/IE focus), fall back to `.com`.
3. Render the guess to the user with Yes / No-edit. We do **not** hit the network — this is a pure best-guess that the user confirms or overrides. (We can add real validation later via an edge function if needed.)

## File changes

- `supabase/migrations/<new>.sql` — add 5 nullable columns to `requests`.
- `src/lib/businessTypes.ts` *(new)* — curated list + helper.
- `src/lib/brandWebsite.ts` *(new)* — `guessBrandWebsite()` + URL validator.
- `src/components/CreateRequestDialog.tsx` — branch on `category === 'new_branch'`:
  - Render new `<NewBranchFields />` instead of dynamic fields + town input + business search + details.
  - Compose `title` and `description` from the structured answers; persist new columns.
- `src/components/request/NewBranchFields.tsx` *(new)* — the type/brand combobox + website confirm + location segmented control.
- `src/components/request/LocationPicker.tsx` *(new)* — encapsulates the three location modes (town input, pin button, pin + radius). Reuses existing `onRequestPin` callback.
- `src/components/RequestCard.tsx` and `src/pages/RequestDetailPage.tsx` — when a request has `business_kind`, surface brand link/website and "within X miles" badge.

## Out of scope

- No live website verification (HEAD request) — confirmed-by-user only for now.
- No new admin screen for business types — curated list is in code.
- Existing requests are unaffected.

## Open question

Currently `requests.description` is used for free-text. Removing the field for New Branch means description will be auto-composed (e.g. "Bakery requested within 1 mile of Mare Street, Hackney"). Confirm this auto-summary is fine — happy to make it richer or leave description null.
