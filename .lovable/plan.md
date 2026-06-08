# Frictionless Request Composer

Make posting a request feel like writing a wish on a postcard: one sentence, one place, one tap to file it. Everything else fades in only if it's useful.

## The new flow (one screen, progressive reveal)

```text
┌──────────────────────────────────────────────┐
│  I wish there was…                           │  ← big input, autofocus
│  ┌────────────────────────────────────────┐  │
│  │ a ramen shop near the station          │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ▸ suggestions appear as they type:          │
│    • a bakery   • bat boxes in the park      │
│    • a poetry night   • later library hours  │
│                                              │
│  ── reveals once sentence has substance ──   │
│  📍 Where?  [ this map view ▾ ]              │
│       └ town autocomplete · drop a pin       │
│                                              │
│  ── reveals once location is set ──          │
│  🏷  File under  [ auto-guessed ▾ ]          │
│       └ chips: Food · Nature · Culture …     │
│                                              │
│  [ Post wish ]   (disabled until 3 fields)   │
└──────────────────────────────────────────────┘
```

Only three required inputs: **wish**, **where**, **category**. Everything else (brand site, radius, opening hours, dynamic fields) becomes an optional "Add detail" chip that expands inline.

## Categories — expand to cover the full spectrum

Current 5 are commerce-heavy. Add 4 positive-only buckets:

| Slug | Label | Examples |
| --- | --- | --- |
| `nature_outdoors` | Nature & outdoors | wildflower meadow, bat boxes, tree planting, river clean-up |
| `culture_art` | Culture & art | murals, gigs, poetry nights, exhibitions, artist visits |
| `community_service` | Community & service | repair café, swap shop, community fridge, language exchange |
| `wild_idea` | Wild idea | sublime / whimsical asks with no template |

Reorder so the most uplifting/broad live above the commerce-specific ones. Keep existing 5 but rename `announcement` → `Good news / Announcement` to enforce the positive-only tone.

## Smart auto-guess

A small client-side classifier maps the sentence to a category before the user touches the chip row:

- keyword map (e.g. `bakery|gym|shop|store|restaurant|café` → existing types; `mural|gig|exhibition` → culture; `meadow|trees|bats|river` → nature; `repair|swap|fridge|exchange` → community; fallback → wild idea)
- if the sentence names a known business type or brand, we auto-set `new_branch` and pre-fill those sub-fields silently
- the chip row is always visible so the user can override in one tap

## Location, simplified

Three quiet options on a single popover, defaulted intelligently:

1. **This map view** — uses the current `ExplorePage` viewport centre and reverse-geocodes for a town label. Default when the composer is opened from the map.
2. **A town/city** — `PlaceAutocomplete` (already built).
3. **Drop a pin** — opens map pin-drop mode (existing `onRequestPin`).

No radius selector by default. Hidden behind "Add detail" for the few categories that need it (`new_branch`).

## Positive-only guardrails

- Placeholder cycles uplifting prompts: "I wish there was…", "Wouldn't it be lovely if…", "This town needs…".
- Lightweight client-side filter flags negative phrasings ("ban", "shut down", "get rid of", "stop") and shows a gentle nudge: "Hey, Open Up is for things you'd love to see. Try rephrasing as a wish." Not a hard block — just guidance.
- Microcopy on the submit button: **Post wish** instead of "Submit request".

## Files & changes

### New
- `src/components/request/WishComposer.tsx` — the new one-screen composer. Replaces the body of `CreateRequestDialog` for all categories.
- `src/components/request/CategoryChips.tsx` — horizontal scroll of category chips (uses existing `useCategories` + icon registry).
- `src/components/request/LocationPicker.tsx` — popover with three modes, defaulting to "this map view".
- `src/lib/wishClassifier.ts` — keyword map + `classifyWish(text): { category, hints }`.
- `src/lib/positivityCheck.ts` — `flagNegativePhrasing(text): string | null`.

### Edit
- `src/components/CreateRequestDialog.tsx` — slim wrapper that mounts `WishComposer`; keeps the existing draft-resume + auth-redirect logic.
- `src/components/request/NewBranchFields.tsx` — collapse into an inline "Add detail" panel (brand site, radius), no longer a standalone flow.
- `src/pages/ExplorePage.tsx` — pass map viewport centre + town to the composer so "this map view" works.

### Database (one migration)
- Insert 4 new rows into `request_categories` with icons + brand colours.
- Add the same 4 values to the `request_category` enum (required because `requests.category` is `enum`).
- Optional: rename `announcement` label to `Good news`.
- No schema column changes; existing dynamic-fields tables keep working for categories that want them later.

## Technical details

- `WishComposer` is a single controlled form; sections render conditionally based on `wish.length >= 8`, `location != null`, etc. No multi-step state.
- The auto-guess runs in a `useMemo` over `wish`; the user's manual chip pick wins and locks the override.
- "This map view" reads `mapCenter` from `ExplorePage` via a new prop on `CreateRequestDialog`; reverse geocode uses the existing `geocode` edge function (`mode: "reverse"`).
- For `new_branch`, the composer detects business-type/brand keywords and auto-fills `business_kind`/`typeSlug`/`brandName` so the user never sees the dedicated branch UI unless they tap "Add detail".
- Dynamic per-category fields (`request_category_fields`) stay supported but render inside the same "Add detail" expander — never as required up-front friction.
- All copy + chips use existing brand tokens (Signal green CTA, Bebas/Barlow type, paper surfaces).

## Out of scope

- Voice input, AI rewriting of the wish, image attachments — can layer on later without touching this structure.
- Changing how requests are displayed on the map or in lists.
