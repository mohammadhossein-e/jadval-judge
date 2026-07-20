# Manual Regression Checklist

> **Last updated:** 2026-07-20
> **App:** Jadval — Karate Tournament Bracket Builder
> **Stack:** Next.js (App Router), localStorage repository, bracket-engine

---

## How to Use This Checklist

1. Open the app in Chrome at `http://localhost:3000`.
2. Work through each section in order.
3. Every test step has a checkbox: mark **PASS** or **FAIL**.
4. If any step fails, file an issue before shipping.
5. Clear `localStorage` between major sections when noted.

---

## 1. Home

| # | Step | Result |
|---|------|--------|
| 1.1 | Navigate to `/`. Page loads without errors. | |
| 1.2 | Hero title reads "Karate Tournament Bracket Builder". | |
| 1.3 | Click **"View Tournaments"**. Navigates to `/tournaments`. | |
| 1.4 | Go back to `/`. Click **"Create Tournament"**. Navigates to `/tournaments/new`. | |
| 1.5 | Theme toggle (sun/moon) is visible in the navigation bar. Toggle it. Theme switches between light, dark, and system. | |

---

## 2. Tournament Creation

| # | Step | Result |
|---|------|--------|
| 2.1 | Navigate to `/tournaments/new`. Form renders with "Tournament Details" and "Categories" cards. | |
| 2.2 | Leave all fields empty. **Create Tournament** button is disabled. | |
| 2.3 | Enter a tournament name. **Create Tournament** button remains disabled (date and category still missing). | |
| 2.4 | Enter a name and a date. Button still disabled (no category yet). | |
| 2.5 | Click **Add Category**. `CategoryForm` appears inline. | |
| 2.6 | Click **Cancel** on the category form. Form closes. | |
| 2.7 | Click **Add Category** again. Fill in category name (required). Leave gender, age group, belt level unset. Click **Add Category** (submit). Category appears in the list with a "Category added" toast. | |
| 2.8 | Click **Add Category** again. Fill in name, select Male gender, select "Under 12" age group, select "White" belt. Submit. Second category appears in the list. | |
| 2.9 | Click the **edit** (pencil) icon on the first category. `CategoryForm` opens pre-filled with that category's data. | |
| 2.10 | Change the category name. Click **Save Changes**. Category name updates in the list. | |
| 2.11 | Click the **remove** (trash) icon on a category. `ConfirmDialog` appears. Click **Remove**. Category disappears from the list. | |
| 2.12 | Now that name, date, and at least one category exist, **Create Tournament** button is enabled. | |
| 2.13 | Select tournament type **Kumite**. | |
| 2.14 | Click **Create Tournament**. Toast "Tournament created" appears. Page navigates to the tournament dashboard (`/tournaments/{id}`). | |
| 2.15 | Verify the dashboard shows the correct name, date, and the categories that were added. | |

---

## 3. Tournament List

| # | Step | Result |
|---|------|--------|
| 3.1 | Navigate to `/tournaments`. If no tournaments exist, empty state is shown: "No tournaments yet". | |
| 3.2 | Create a tournament (per section 2). Return to `/tournaments`. Tournament card appears with name, date, organization, and category count. | |
| 3.3 | Create a second tournament. Both appear in the list, most recent first. | |
| 3.4 | Click the **"Create Tournament"** button on the list page. Navigates to `/tournaments/new`. | |

---

## 4. Tournament Editing

| # | Step | Result |
|---|------|--------|
| 4.1 | From the tournament dashboard, click **Edit Tournament**. Navigate to the manage page. | |
| 4.2 | Page title reads "Manage Tournament". Tournament name, date, and organization fields are pre-filled. | |
| 4.3 | Existing categories are listed in the Categories card with category count. | |
| 4.4 | Change the tournament name. Click **Save Changes**. Toast "Tournament updated" appears. Button becomes disabled (form is no longer dirty). | |
| 4.5 | Navigate to `/tournaments`. Verify the tournament name is updated. | |
| 4.6 | Go back to the manage page. Change the date. Click **Save Changes**. | |
| 4.7 | Change the organization. **Save Changes** works. Clear the organization field. **Save Changes** works (organization becomes null). | |
| 4.8 | Click **Cancel**. Navigates back without saving. | |
| 4.9 | Click **Add Category** in the Categories card. `CategoryForm` appears. Add a new category. Verify it appears in the list and the count increments. | |
| 4.10 | Click **edit** on an existing category. Change the name. Click **Save Changes**. Name updates in the list. | |
| 4.11 | Click **remove** on a category whose status is SETUP (freshly created). Category is removed immediately (no confirmation dialog). | |
| 4.12 | Verify the category is also gone from the tournament dashboard. | |

---

## 5. Category Management

| # | Step | Result |
|---|------|--------|
| 5.1 | From the tournament dashboard, click **Manage** on a category card. Navigates to `/tournaments/{id}/categories/{id}`. | |
| 5.2 | Category name is displayed in the header. Competitor count shows "0 / 128". | |
| 5.3 | Empty state is shown for the competitor list. | |
| 5.4 | **Add Competitor** button is enabled. Click it. `CompetitorForm` appears. | |
| 5.5 | Click **Cancel**. Form closes. | |

---

## 6. Competitor Management

| # | Step | Result |
|---|------|--------|
| 6.1 | Click **Add Competitor**. Leave name empty. Submit button is disabled. | |
| 6.2 | Enter name "Alice", leave club empty. Submit disabled. | |
| 6.3 | Enter club "Tokyo Dojo". Enter seed "1". Click **Add Competitor**. Competitor appears in the list. Toast "Competitor added". | |
| 6.4 | Add a second competitor: "Bob", "Osaka Dojo", no seed. | |
| 6.5 | Add a third competitor: "Carol", "Kyoto Club", seed 2. | |
| 6.6 | Verify competitor count shows "3 / 128". | |
| 6.7 | Click **edit** on Alice. Change name to "Alice Tanaka". Click **Save Changes**. Name updates. | |
| 6.8 | Click **remove** on Bob. `ConfirmDialog` appears. Click **Remove**. Bob disappears. Count is now 2. | |
| 6.9 | Use the **move up / move down** arrows to reorder competitors. | |
| 6.10 | Type in the **search** box. Competitor list filters by name. Clear search. Full list returns. | |
| 6.11 | Try adding a duplicate name. Validation error: "A competitor with this name already exists in this category." | |
| 6.12 | Click **Bulk Add**. Dialog opens with a textarea. | |
| 6.13 | Paste tab-separated data: `Name\tClub\tSeed` (header) then two rows of valid data. Click **Add N Competitors**. Competitors are added. | |
| 6.14 | Close the dialog. Add competitors until near the 128 limit. At 128, **Add Competitor** and **Bulk Add** buttons are disabled. | |

---

## 7. Random Draw

| # | Step | Result |
|---|------|--------|
| 7.1 | With at least 2 competitors added, the **Draw Type Selector** appears. "Random" is selected by default. | |
| 7.2 | The **Random Draw Card** is visible. Click **Random Draw** button. | |
| 7.3 | Draw order list appears showing competitors in shuffled order with position badges. "Re-draw" button appears. | |
| 7.4 | Click **Re-draw**. `ConfirmDialog` appears. Click **Re-draw**. Order changes. | |
| 7.5 | Click **Re-draw**, click **Cancel** on the dialog. Order remains unchanged. | |
| 7.6 | After draw, the **Bracket Preview Card** appears showing competitor count, bracket size, BYE count, rounds, and "Generate Bracket" button. | |

---

## 8. Manual Draw

| # | Step | Result |
|---|------|--------|
| 8.1 | With at least 2 competitors, switch draw type to **Manual**. | |
| 8.2 | **Unplaced Pool** is visible on first render, showing all competitors as draggable chips. | |
| 8.3 | **Slot Grid** shows numbered empty slots (2 columns). Each reads "Empty". | |
| 8.4 | Drag a competitor from the pool into an empty slot. Competitor name appears in the slot. Slot is no longer "Empty". | |
| 8.5 | The competitor is removed from the unplaced pool. Unplaced count decrements. | |
| 8.6 | Drag a second competitor into another slot. | |
| 8.7 | Drag a competitor from one slot to another (occupied) slot. Competitors swap positions. | |
| 8.8 | Drag a competitor from a slot back to the pool. Slot becomes "Empty". Competitor reappears in the pool. | |
| 8.9 | Click the **X** (remove) button on a filled slot. Competitor returns to the pool. | |
| 8.10 | Place all competitors. Slot grid shows all filled. Pool disappears (`unplacedCount === 0`). Progress shows "N/N placed". | |
| 8.11 | **Bracket Preview Card** appears with "Generate Bracket" button. | |
| 8.12 | Click **Clear All**. `ConfirmDialog` appears. Click **Clear**. All slots reset to "Empty". All competitors return to the pool. | |
| 8.13 | Place one competitor, click **Clear All**, confirm. All slots reset. | |
| 8.14 | With no placements, **Clear All** button is disabled. | |

---

## 9. Bracket

| # | Step | Result |
|---|------|--------|
| 9.1 | After a completed draw (random or manual), click **Generate Bracket**. Toast "Bracket generated". Interactive bracket appears. | |
| 9.2 | Bracket shows rounds: Round 1, Semifinals, Quarterfinals (if applicable), Final. | |
| 9.3 | BYE matches are pre-resolved. Single competitor advances automatically. | |
| 9.4 | Click a resolvable match (two competitors, no winner). `WinnerSelectionDialog` opens. | |
| 9.5 | Select a winner. Dialog closes. Winner is highlighted green with a checkmark. Loser is struck through. | |
| 9.6 | Click the **undo** button on a resolved match. Match resets to unresolved state. Downstream matches that depended on this winner also reset. | |
| 9.7 | Resolve all matches up to the Final. Champion banner appears: gold card with champion name. | |
| 9.8 | Click **Reset Bracket**. Bracket returns to initial generated state. All match results cleared. | |
| 9.9 | Switch to **Manual** draw. Redo the draw. Generate bracket. Verify bracket uses the manual placement order. | |

---

## 10. Persistence

> **Important:** Clear localStorage before this section: open DevTools > Application > Local Storage > right-click `http://localhost:3000` > **Clear**.

| # | Step | Result |
|---|------|--------|
| 10.1 | Create a tournament with 2 categories. Verify `localStorage.getItem("jadval:tournaments")` contains the tournament. | |
| 10.2 | Verify `localStorage.getItem("jadval:categories")` contains the 2 categories with correct `tournamentId`. | |
| 10.3 | Refresh the page. Navigate to `/tournaments`. Tournament appears in the list. | |
| 10.4 | Navigate to the tournament dashboard. Categories are shown. | |
| 10.5 | Edit the tournament name. Refresh. Verify the name persisted. | |
| 10.6 | Add a category from the manage page. Refresh. Category persists. | |
| 10.7 | Edit a category name. Refresh. Change persists. | |
| 10.8 | Delete a category. Refresh. Category is gone. | |
| 10.9 | Navigate to a category page. Add 3 competitors. Refresh. **Note:** Competitors are in-memory only (React state) and are expected to be lost on refresh. | |
| 10.10 | Verify `Object.keys(localStorage)` contains only `jadval:tournaments`, `jadval:categories`, and `theme`. No stale or unexpected keys. | |

---

## 11. Release Checklist

Before shipping a release, verify all of the following:

| # | Item | Result |
|---|------|--------|
| 11.1 | `npm run typecheck` passes with 0 errors. | |
| 11.2 | `npm run lint` passes with 0 errors. | |
| 11.3 | `npm run test` passes — all tests green. | |
| 11.4 | `npm run build` completes without errors. | |
| 11.5 | All sections above (1–10) pass on a fresh browser profile. | |
| 11.6 | No `console.error` output in the browser console during any workflow. | |
| 11.7 | Theme toggle works across all pages (light/dark/system). | |
| 11.8 | Navigation links work on every page. Browser back/forward buttons work. | |
| 11.9 | Toast notifications appear and auto-dismiss correctly. | |
| 11.10 | Empty states display correctly when no data exists. | |

---

## Regression History

Documented bugs that were found and fixed. Re-test these specific scenarios on every release.

### REG-001: Tournament not appearing in View Tournaments

| | |
|---|---|
| **Symptom** | After creating a tournament, navigating to `/tournaments` showed an empty state. The tournament existed in localStorage but the list page did not display it. |
| **Root cause** | The tournament list page read from localStorage on mount, but the create flow navigated before the write was committed to the storage layer. |
| **Fix** | Ensured the repository `createTournament` method completes its `localStorage.setItem` call before returning, and the list page re-reads on mount. |
| **Verify** | Create a tournament. Navigate to `/tournaments`. Tournament card appears immediately. |

### REG-002: Nested form prevented category creation

| | |
|---|---|
| **Symptom** | On the Create Tournament page, clicking "Add Category" did not open the category form, or clicking submit on the category form did nothing. |
| **Root cause** | The `CategoryForm` submit button was nested inside the tournament form's `<form>` element. Clicking the category submit button triggered the parent form's submit event, which called `handleSubmit` for tournament creation instead of category addition. |
| **Fix** | Changed the category form's submit button `type` to `"button"` so it does not trigger the parent `<form>` submit. |
| **Verify** | On `/tournaments/new`, click "Add Category", fill in a name, click submit. Category appears in the list. Tournament form is not submitted. |

### REG-003: Category page crashed with fewer than two competitors

| | |
|---|---|
| **Symptom** | Navigating to a category page with 0 competitors caused `RangeError: Maximum call stack size exceeded` in `packages/bracket-engine/src/single-elimination/seeding.ts`. |
| **Root cause** | The `useBracketGeneration` hook called `getBracketPreview(competitors.length, seeds)` unconditionally via `useMemo`. With 0 competitors, `getBracketPreview(0, ...)` called `calculateBracketInfo(0)` which returned `bracketSize = 1`. `standardSeeding(1)` has a base case of `bracketSize === 2`, so it recursed with 0.5, 0.25, ... forever. |
| **Fix** | In `useBracketGeneration.ts`, guarded the `getBracketPreview` call: only invokes the engine when `competitors.length >= 2`; otherwise returns a zeroed-out preview object. |
| **Verify** | Navigate to a category page with 0 competitors. Page loads without errors. Add 1 competitor. No crash. Add a 2nd competitor. Bracket preview renders correctly. |

### REG-004: Manual Draw competitor pool hidden on first render

| | |
|---|---|
| **Symptom** | Switching to Manual Draw type showed empty slots but no unplaced competitors pool. No competitors could be dragged because the only drag source was invisible. |
| **Root cause** | `ManualDrawCard` rendered `<UnplacedPool showPool={placedCount > 0} />`. On initial render, `placedCount` is 0, so the pool returned `null`. The only draggable elements in the system were hidden. |
| **Fix** | Changed to `showPool={unplacedCount > 0}`. The pool is now visible whenever there are unplaced competitors (always true on initial render, hides itself once all are placed). |
| **Verify** | Select Manual Draw with 3 competitors. Unplaced pool appears immediately with all 3 competitors. Drag one into a slot. Pool updates. Drag all into slots. Pool disappears. |
