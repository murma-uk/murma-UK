# Share Buttons for Requests

Add a share control on each request so people can spread the word across the channels that matter for community campaigns.

## Where it appears

- **Request detail page** — primary placement, next to the Upvote button. Full-size button labeled "Share".
- **Request card** (Explore feed) — small icon-only share button in the bottom meta row, next to the date.

## Share options menu

Tapping Share opens a popover with these options:

1. **Copy link** — copies the canonical pretty URL, shows a "Copied!" toast.
2. **WhatsApp** — opens `https://wa.me/?text=...` with title + link.
3. **Facebook** — opens Facebook share dialog with the link.
4. **X (Twitter)** — opens tweet intent with title + link.
5. **Email** — `mailto:` with prefilled subject (request title) and body (description excerpt + link).
6. **Native share** — on mobile devices that support `navigator.share`, show a "More…" option that opens the OS share sheet (gives access to SMS, Instagram DM, Signal, etc.).

The native share option is shown only when the API is available (mostly mobile / Safari). On desktop the menu shows the explicit channel list above.

## Shared link format

Use the canonical pretty URL built from `buildRequestPath(id, slug)` with the current origin, e.g. `https://app.example.com/request/later-library-hours-1c3b322b`. This already redirects legacy UUID links, so shared links stay stable.

## Design

- Use the existing `Popover` + `Button` (ghost / outline variant on detail, ghost icon on the card).
- Each option is a row with a Lucide icon + label, hover uses `bg-accent/10`.
- Channel brand colors are used only for the icon tint (kept subtle to fit the design system); labels stay in `foreground`.
- Toast confirmation on copy uses the existing `useToast` hook.

## Technical details

New file:

- `src/components/ShareButton.tsx` — accepts `{ id, slug, title, description?, variant?: "full" | "icon" }`. Builds the absolute URL via `${window.location.origin}${buildRequestPath(id, slug)}`. Renders a `Popover` with the option list. Handles `navigator.clipboard.writeText`, `navigator.share` feature detection, and `window.open(..., "_blank", "noopener")` for the social intents.

Edits:

- `src/pages/RequestDetailPage.tsx` — add `<ShareButton variant="full" .../>` in the action row beside the Upvote button.
- `src/components/RequestCard.tsx` — add `<ShareButton variant="icon" .../>` in the meta row; wrap in a `span` with `onClick={(e) => e.stopPropagation()}` so it doesn't trigger card navigation.

No backend changes, no new dependencies (Lucide already provides `Share2`, `Copy`, `Mail`, `MessageCircle`; we'll use `Share2` as the trigger icon and a simple text label for WhatsApp/Facebook/X to avoid adding a brand-icon library).
