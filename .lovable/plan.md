## Add the "Open Door" logo across the app

The uploaded SVG is a presentation sheet showing 4 variants of a single brand mark — a stylized open-door panel ("opening up"). I'll extract the mark as a reusable component, pair it with the existing `HEY! OPEN UP` wordmark, and place it in the natural lockup spots: navbar, footer, auth page, and favicon/social.

### What I'll build

1. **`src/components/brand/LogoMark.tsx`** — React component rendering just the door mark (frame + ajar panel + knob + light spill + hinge pips), no sheet/labels/grain.
   - Props: `variant: "light" | "dark" | "solidGreen" | "ink"` (default `"light"`), `size` (px), `className`.
   - Pure SVG, color-aware (uses brand tokens via inline fills mapped to the chosen variant).

2. **Update `src/components/brand/Wordmark.tsx`** — add an optional `withMark?: boolean` prop. When true, renders `LogoMark` (size matched to the wordmark size) immediately to the left of the text, forming the standard lockup.

3. **Placements**
   - **Navbar** (`src/components/Navbar.tsx`) — Wordmark gets `withMark` (light variant) so the door sits before "HEY! OPEN UP".
   - **Footer** (`src/components/Footer.tsx`) — Wordmark gets `withMark` (light, muted tone).
   - **AuthPage** (`src/pages/AuthPage.tsx`) — large centered LogoMark above the form (solid-green variant for emphasis).
   - **LandingPage hero** — small LogoMark chip near the "Live · v0.1" eyebrow row (light variant). The big spray "HEY! OPEN UP YOUR TOWN" headline stays as-is.
   - **NotFound page** — small mark above the 404 text.

4. **Favicon + social**
   - Generate `public/favicon.svg` containing only the ink variant of the mark (square, 64×64 viewBox).
   - Update `index.html` `<link rel="icon">` to point at `/favicon.svg` and remove the default `favicon.ico` reference.
   - (OG image stays untouched — out of scope unless you want a regenerated one.)

### Variant → use map
```text
light       → navbar, footer, landing chip   (paper bg)
solidGreen  → auth hero                       (signal accent)
ink         → favicon                         (high contrast, small)
dark        → kept available, not placed yet
```

### Out of scope
- Replacing the spray "HEY!" stencil in the landing hero.
- Regenerating OG/Twitter share images.
- Any copy or layout changes beyond inserting the mark.

Approve and I'll implement.