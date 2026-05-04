## Goal

Pivot the entire app from its current electric-blue / Space Grotesk identity to the **Hey! Open Up · Light · Paste-up Paper** moodboard. Light mode only, full texture/decoration treatment.

## Design tokens (the source of truth)

Rewrite `src/index.css` `:root` and remove `.dark`. Map moodboard values into the existing shadcn token names so all UI components inherit automatically.

```text
Brand
  --signal     1A7A3C  → primary           (open / go / CTA)
  --demand     D4420F  → accent + destructive (alert / threshold)
  --civic      1F5FA6  → (new) civic
  --gate       7A4A00  → warning            (pending)

Surface
  --page       F2EFE8  → background
  --surface    FAF8F3  → card / popover
  --surface-2  FFFFFF  → input bg

Text
  --text-hi    18160F  → foreground
  --text-mid   5A5446  → muted-foreground
  --text-lo    9A9080  → text-lo (new utility)

Border
  --border     DDD9CF  → border / input
  --border-mid C8C3B5

Radius
  --radius:    0.375rem (6px)  // shadcn `lg` becomes 6px, `md` 4px, `sm` 2px

Shadows
  --shadow-card / --shadow-card-hover / --shadow-glow-signal / --shadow-glow-demand
```

Add semantic helper colors `civic`, `gate` to `tailwind.config.ts` alongside existing primary/accent so we can write `bg-civic`, `text-civic`, etc.

## Typography

Replace the Space Grotesk / Inter pair with the moodboard stack:

- **Bebas Neue** — display (`font-display`), used for hero titles, big stat numerics.
- **Barlow Condensed** — `font-heading`, used for h1–h6, card titles, button labels (uppercase, tracked).
- **Barlow** — `font-body`, body text.
- **DM Mono** — `font-mono`, labels, data values, eyebrows, location strings.

Swap the `@fontsource/space-grotesk` imports in `src/index.css` for Google Fonts `<link>` in `index.html` (matches moodboard) or add `@fontsource` packages for Bebas Neue, Barlow, Barlow Condensed, DM Mono. Tailwind `fontFamily` updated accordingly.

Global base: body uses Barlow; `h1–h6` use Barlow Condensed 700, uppercase, tracked +0.05em.

## Global texture

Add to `src/index.css`:

- **Paper grain** — fixed `body::after` SVG turbulence, `mix-blend-mode: multiply`, opacity 0.055. Pointer-events none.
- **Brick stripe** utility class `.brick-stripe` — repeating 4-color band, used on top edge of `Navbar` and section dividers.
- **Spray stencil** utility class `.spray-hey` — outputs the giant transparent "HEY!" stencil for hero sections (LandingPage hero + page headers).
- **Live pip** keyframe `pip-pulse` for the green "live signal" indicator.

## Component reskin

Update the shadcn primitives in `src/components/ui/` so the new identity flows through every existing usage — minimal per-page edits needed.

- **button.tsx** — variants:
  - `default` → primary green, white text, uppercase Barlow Condensed 700, `rounded-sm`, signal shadow on hover, lift `-1px`.
  - `destructive` → demand orange.
  - `outline`/`ghost` → ghost: transparent + 1.5px border-mid, hover swaps to signal green.
  - New `civic` and `demand` variants.
  - Add `pip` slot prop or a small `<Pip />` child for the animated dot.
- **badge.tsx** — pill, mono 12px tracked, semantic variants `open`, `demand`, `civic`, `gate`, `muted` mirroring moodboard tones, optional pip dot.
- **input.tsx / textarea.tsx** — surface-2 bg, 1.5px border-mid, mono 14px text, focus ring uses `--shadow-glow-signal`, error state uses demand color + glow.
- **card.tsx** — surface bg, 1.5px border, `--shadow-card`, on hover lift + shadow-card-hover. Add optional left accent strip variants (`signal`, `demand`, `civic`) used by `RequestCard`.
- **popover.tsx / dialog.tsx / sheet.tsx** — pick up new surface + border tokens automatically; only touch where the moodboard needs different treatment (slightly stronger shadow, mono header label).
- **label.tsx** — mono 12px uppercase tracked.
- **toast.tsx / sonner.tsx** — surface-2 bg, mono labels, signal/demand left strip per variant.

## App-shell + page edits

- **`index.html`** — Google Fonts link for the four families; meta theme-color `#f2efe8`.
- **`src/components/Navbar.tsx`** — surface-2 bg, brick stripe across the very top, Bebas Neue wordmark "HEY! OPEN UP" with green `OPEN`, mono nav links uppercase tracked, live chip showing borough/signal count.
- **`src/components/Footer.tsx`** — surface-2 bg, top border, Bebas Neue wordmark in text-lo, mono notes.
- **`src/pages/LandingPage.tsx`** — hero with the spray stencil, `<live-chip>` eyebrow, big Bebas display title with `<em class="text-primary">OPEN</em>` and outlined second line, mono meta row underneath. Rebuild feature/section blocks using the new card, badge, button styles.
- **`src/pages/ExplorePage.tsx`** — section heading style (`// LIVE SIGNALS`), category chips become moodboard badges, list/map toggle as ghost buttons.
- **`src/components/RequestCard.tsx`** — apply demand-card pattern: 4px left signal strip, condensed bold title, mono location row with 📍, big Bebas number for upvotes (replacing rounded button), demand-bar showing progress to a threshold, badges for category + state. Keep existing upvote/share handlers and props.
- **`src/components/CategoryFilter.tsx`** — moodboard pill badges with category color tinted via existing per-category color but mapped through the new opacity system.
- **`src/components/MapView.tsx`** — keep Leaflet, restyle popups with surface-2 + mono labels + signal accent. Add a thin border on the map container.
- **`src/pages/RequestDetailPage.tsx`** — hero block with brick stripe, page-title styling for the request title, mono meta row (borough · category · created), upvote becomes a big Bebas number + signal CTA, share button restyled as ghost.
- **`src/pages/AuthPage.tsx`** — paste-up form: spray accent, mono labels, signal CTA, demand error state.
- **`src/pages/AdminCategoriesPage.tsx`** + admin dialogs — section heading style, demand-cards for each category row, ghost edit / demand delete buttons.
- **`src/components/CreateRequestDialog.tsx`** + `DynamicFieldRenderer.tsx` — inherit input/label/button restyle automatically; just verify spacing.
- **`src/components/CookieBanner.tsx`** — surface-2 panel with civic blue accent border.
- **`src/components/ShareButton.tsx`** — popover content already uses tokens, just confirm the icon row hovers feel right.

## New shared bits

- `src/components/brand/Wordmark.tsx` — Bebas display "HEY! OPEN UP" with optional sizes.
- `src/components/brand/LiveChip.tsx` — `<live-chip>` reusable for navbar, hero, section eyebrows.
- `src/components/brand/SectionHeading.tsx` — `// SOMETHING` mono eyebrow used across pages.
- `src/components/brand/Pip.tsx` — animated dot used in chips, badges, buttons.
- `src/components/brand/BrickStripe.tsx` — the 4-color repeating bar.

## Out of scope

- No backend, schema, or routing changes.
- No new icons library — keep Lucide; categories keep their existing `iconRegistry` icons but render at moodboard sizes.
- Dark mode is removed (no theme toggle UI exists today, so nothing user-facing to delete).

## Memory updates

After implementation, rewrite `mem://index.md` Core to reflect the new identity (paste-up paper, Bebas/Barlow/DM Mono, signal green primary, demand orange accent, civic blue, gate amber) and remove the old "electric blue / Space Grotesk" line.
