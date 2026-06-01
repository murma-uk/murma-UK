## Three small fixes to the New Branch flow

**1. Scrollable business-type list**
In `BusinessTypeCombobox` (`src/components/request/NewBranchFields.tsx`), cap the `CommandList` height so the ~46 entries scroll inside the popover:
- Add `className="max-h-64 overflow-y-auto"` to `<CommandList>`.

**2. Fix responsive width of the dialog card**
Mobile viewport (411px) currently shows the dialog stretched — the `DialogContent` uses `sm:max-w-md` but no explicit mobile sizing, and the new structured fields make it feel wide.
In `src/components/CreateRequestDialog.tsx`:
- Change `DialogContent` className from `sm:max-w-md max-h-[90vh] overflow-y-auto` to `w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6` so the card has clear side margins on mobile and tighter padding.

**3. Hide the optional Title field for New Branch**
We're auto-composing the title anyway. In `CreateRequestDialog.tsx`, remove the "Title (optional…)" block inside the `isNewBranch` branch (lines 369–377). Title state stays empty and `composeNewBranchTitle(newBranch)` is used at submit. No other branches affected.

## Out of scope
No changes to other categories, data model, or submit logic.
