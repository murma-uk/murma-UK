
## Plan: Plan-before-sign-in flow with clear auth messaging

Let guests draft a full request — drop a pin, fill all fields — and only require sign-in at the final submit step. Make the auth requirement visible throughout so there are no surprises.

### Changes

**1. `src/pages/ExplorePage.tsx` — remove auth gates on pin drop**
- Remove the `if (!user)` redirects in `handleMapClick` and the "Drop pin to request" button. Guests can drop pins and open the dialog freely.
- On mount, if `user` is now present and `sessionStorage.pendingRequest` exists, rehydrate `droppedPin` and reopen `CreateRequestDialog` with a new `initialDraft` prop prefilled. Clear the storage key after successful create.

**2. `src/components/CreateRequestDialog.tsx` — defer auth, signal it clearly**
- Accept new optional `initialDraft` prop that prefills every field (for the resume-after-auth flow).
- Allow the dialog to open and accept input regardless of auth state.
- **Visible auth cues for guests** (only shown when `!user`):
  - **Header banner** at the top of the dialog: a soft `Alert` with a lock icon — "You can plan your request now. You'll need to sign in to post it — your draft will be saved."
  - **Submit button label** changes from "Submit request" to "Continue to sign in" with a lock/arrow icon.
  - **Helper text** under the submit button: "We'll save your draft and bring you back here after sign-in."
- On submit:
  - Logged in → insert as today.
  - Guest → save full payload (title, description, category, lat, lng, town, category fields, business link) to `sessionStorage.pendingRequest`, then redirect to `/auth?redirect=/explore&resume=request`.

**3. `src/pages/AuthPage.tsx` — honour redirect + show draft notice**
- Read `redirect` from query string; after sign-in/sign-up, navigate there instead of always `/explore`.
- If `sessionStorage.pendingRequest` exists, show a small banner at the top of the auth form: "Your request draft is saved — sign in to post it."

**4. `src/pages/ExplorePage.tsx` — pre-submit hint on the floating control**
- When `!user`, change the floating button's secondary helper text (or tooltip on the pin-mode banner) to "You can plan your request — sign in required to post."

### UX summary

```text
Guest taps "Drop pin"  →  drops pin  →  dialog opens
                                         │
                          ┌──────────────┴──────────────┐
                          │ Banner: "Sign in needed     │
                          │  to post — draft is saved." │
                          └──────────────┬──────────────┘
                                         │
                              fills full form
                                         │
                       ┌─────────────────┴───────────────┐
                       │                                 │
            logged in: "Submit request"     guest: "Continue to sign in"
                       │                                 │
                       │                       save draft → /auth
                       │                                 │
                       │                  banner: "Draft saved — sign in"
                       │                                 │
                       │                       sign in / sign up
                       │                                 │
                       │              back to /explore, dialog reopens
                       │              with all fields prefilled
                       └────────► request created ◄──────┘
```

### Files to edit
- `src/pages/ExplorePage.tsx` — drop auth gates, resume-from-storage logic, update floating control copy.
- `src/components/CreateRequestDialog.tsx` — defer auth to submit, accept `initialDraft`, add header alert + change CTA label/helper for guests.
- `src/pages/AuthPage.tsx` — honour `?redirect=` and show "draft saved" banner when pending request exists.

### Notes
- Drafts live in `sessionStorage` (cleared on tab close) — no GDPR implications beyond existing disclosures.
- RLS still enforces `auth.uid() = user_id` server-side; we're only relaxing the client UX gate.
- Email confirmation is on by default — for new sign-ups the resume only fires once they return authenticated. The "draft saved" banner on `/auth` sets that expectation.
