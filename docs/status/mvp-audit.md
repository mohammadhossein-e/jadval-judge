# MVP Audit Report

> **Date:** 2026-07-20
> **Version:** 0.1.0
> **Scope:** Full codebase review across packages/, apps/web/

---

## 1. Completed Features

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.1 | Home page with CTAs | Done | Two links: View Tournaments, Create Tournament |
| 1.2 | Tournament creation with inline categories | Done | Name, date, org, type (Kata/Kumite), add/edit/remove categories before submit |
| 1.3 | Tournament list page | Done | Card grid, sorted by createdAt desc, shows category count |
| 1.4 | Tournament dashboard | Done | Shows name/date/org, category cards with status badges, Manage links |
| 1.5 | Tournament editing | Done | Full management page: update fields, add/edit/remove categories via repository |
| 1.6 | Category management page | Done | Loads category name, renders CategoryCompetitorsManager |
| 1.7 | Competitor add/edit/remove | Done | Form validation (name uniqueness, club required, seed 1-128) |
| 1.8 | Competitor bulk add | Done | Tab-separated paste dialog, duplicate detection, 128 cap |
| 1.9 | Competitor list with search, reorder | Done | Search filter, move up/down, edit/delete with confirmation |
| 1.10 | Random draw (Fisher-Yates) | Done | Shuffles competitors, shows draw order, re-draw with confirmation |
| 1.11 | Manual draw (drag-and-drop) | Done | SlotGrid + UnplacedPool, drag/drop, swap, remove, clear all |
| 1.12 | Bracket preview card | Done | Shows competitor count, bracket size, BYE count, rounds, seeded BYEs |
| 1.13 | Bracket generation | Done | Power-of-2 padding, standard seeding, BYE auto-resolution |
| 1.14 | Interactive bracket (competitor version) | Done | Round columns, click-to-resolve dialog, undo, champion banner |
| 1.15 | Interactive bracket (standalone version) | Done | BracketRound/MatchCard/ChampionBanner with floating winner card |
| 1.16 | Match resolution with cascade undo | Done | Forward cascade on re-resolve, cascade undo on undo |
| 1.17 | Bracket reset | Done | Returns to pre-resolution state |
| 1.18 | Theme toggle (light/dark/system) | Done | next-themes integration |
| 1.19 | Navigation bar | Done | Home, Tournaments links with active state detection |
| 1.20 | localStorage persistence | Done | Tournaments and categories survive refresh |
| 1.21 | Repository abstraction | Done | TournamentRepository interface + LocalStorageRepository implementation |
| 1.22 | TypeScript throughout | Done | Strict types, no `any` in application code |
| 1.23 | Bracket engine package | Done | Pure, well-tested single-elimination engine (65 tests) |
| 1.24 | Draw utilities | Done | performDraw, placement converters, validation (24 tests) |
| 1.25 | Custom hooks tested | Done | useManualDraw (20 tests), useMatchResolution (19 tests) |
| 1.26 | Manual regression checklist | Done | docs/testing/manual-regression-checklist.md |

---

## 2. Features Partially Implemented

| # | Feature | What Exists | What Is Missing |
|---|---------|-------------|-----------------|
| 2.1 | Standalone bracket page (`/bracket`) | `BracketContainer` renders with **hardcoded `DEMO_COMPETITORS`** (7 fake competitors) | Does not load real competitors from repository. `tournamentId` and `categoryId` params are passed but unused (ignored via void). |
| 2.2 | Public bracket view (`/public`) | Server-rendered static placeholder page | Shows hardcoded "Spring Open 2026" with fake match data. Not connected to any data source. No live updates. |
| 2.3 | New category page (`/categories/new`) | Static HTML shell with name input and Create/Cancel buttons | Buttons are not wired. No form handler. No repository call. Page is unreachable from navigation (no link points to it). |
| 2.4 | Category status tracking | Category type has `SETUP \| IN_PROGRESS \| COMPLETED` | Status is set to `SETUP` on creation and **never updated** anywhere in the codebase. `BracketData` type exists in `packages/types` but is never used. |
| 2.5 | Competitor persistence | `Competitor` type defined in `packages/types` | Competitors exist only in React state (`useState` inside `CategoryCompetitorsManager`). Lost on page navigation or refresh. No repository methods for competitors. |
| 2.6 | Bracket/Match persistence | `Match`, `BracketData` types defined in `packages/types` | Bracket state lives in React state via `useBracketGeneration` and `useMatchResolution`. Lost on navigation. No repository methods for matches or brackets. |
| 2.7 | Tournament type selection | `TournamentType = 'kata' \| 'kumite'` stored on tournament | `tournamentType` field is set during creation but never read or used to alter behavior. No kumite-specific rules. |
| 2.8 | Tournament `editPin` | Generated on create (`generateId().slice(0, 6)`) | `PinDialog` component exists in `components/ui/pin-dialog.tsx` but is **never imported or used** by any page. |
| 2.9 | Bracket data types in `packages/types` | `BracketData`, `Match`, `MatchSlot` interfaces defined | These types model a **different** match structure (with `categoryId`, `competitorAId`, `resolvedAt`, etc.) than the bracket engine's `EngineMatch` (which uses embedded `EngineCompetitor` objects). The two type systems are incompatible and neither references the other. |

---

## 3. Missing Features

| # | Feature | Impact |
|---|---------|--------|
| 3.1 | **Competitor persistence** | All competitor work is lost on navigation. This is the single largest gap in the MVP. |
| 3.2 | **Bracket/match persistence** | Bracket progress (resolved winners) is lost on navigation. |
| 3.3 | **Delete tournament** | No UI or repository method to delete a tournament. |
| 3.4 | **Update tournament type** | Cannot change kata/kumite after creation. |
| 3.5 | **Delete tournament's categories cascade** | `deleteCategory` does not clean up associated competitors or bracket data (neither of which are persisted, but this will matter once they are). |
| 3.6 | **Real public bracket view** | The `/public` route is a static mock. No server-side data fetching, no live updates, no polling. |
| 3.7 | **Real standalone bracket page** | The `/bracket` route uses hardcoded demo data. |
| 3.8 | **Error boundaries** | No `error.tsx` files exist for any route. Unhandled errors crash the page with no recovery UI. |
| 3.9 | **Loading states** | No `loading.tsx` files exist. Each page implements its own ad-hoc `"Loading..."` text. |
| 3.10 | **404 / not-found page** | No `not-found.tsx`. Invalid tournament/category IDs show a blank "Loading..." forever (the `if (!data)` guard never resolves). |
| 3.11 | **API routes** | Zero `route.ts` files. No server-side logic. No data validation layer. |
| 3.12 | **Search/filter tournaments** | Tournament list has no search, filter, or sort controls. |
| 3.13 | **Pagination** | Tournament list renders all items. No pagination or virtual scrolling. |
| 3.14 | **Mobile responsive bracket** | Bracket views use horizontal scroll (`overflow-x-auto`) but have no touch-friendly controls or responsive column count. |
| 3.15 | **Accessibility audit** | No ARIA labels on interactive elements (bracket match cards use `role="button"` on competitor version only). No keyboard navigation for drag-and-drop. |
| 3.16 | **i18n / localization** | All strings are hardcoded in English. |
| 3.17 | **Data export/import** | No backup, export, or import functionality. |

---

## 4. Known Technical Debt

| # | Debt | Location | Severity |
|---|------|----------|----------|
| 4.1 | **Debug `console.log` statements left in production code** | `local-storage-repository.ts` (lines 41, 43, 47, 57, 66-75), `tournaments/page.tsx` (lines 21-27, 34, 38) | Medium — performance and information leakage |
| 4.2 | **Two incompatible type systems** | `packages/types/src/match.ts` defines `Match` with string IDs (`competitorAId`). `packages/bracket-engine/src/types.ts` defines `EngineMatch` with embedded objects (`competitorA: EngineCompetitor`). They are never bridged. | High — will cause confusion when persistence is added |
| 4.3 | **Duplicate bracket UI components** | `components/bracket/` (BracketContainer, BracketView, BracketRound, MatchCard, MatchSlotRow, ChampionBanner) duplicates `components/competitor/` (BracketView, BracketResultSection). Two parallel implementations with different APIs. | Medium — maintenance burden |
| 4.4 | **`BracketContainer` receives unused props** | `BracketContainer` accepts `tournamentId` and `categoryId` but uses `void` to suppress unused-variable warnings (line 235-236 of `CategoryCompetitorsManager.tsx`). | Low |
| 4.5 | **State sync via render-time `if` checks** | `CategoryCompetitorsManager` lines 84-99 use `if (x !== prevX) { setPrev(x); setState(...) }` pattern instead of `useEffect`. This is a React anti-pattern that triggers extra renders. | Medium — subtle rendering bugs |
| 4.6 | **Singleton repository with no invalidation** | `repositories/index.ts` caches the `LocalStorageRepository` instance in module scope. If localStorage is modified in another tab, the in-memory singleton has no awareness. | Low — acceptable for MVP |
| 4.7 | **`CategoryList` used in two contexts with different semantics** | The same component serves `CreateTournamentForm` (local-only categories) and `EditTournamentPage` (persisted categories). The `requiresDeleteConfirmation` prop was added to bridge this, but the component still always shows a ConfirmDialog regardless. | Low |
| 4.8 | **`useBracketGeneration` preview fallback** | When `competitors.length < 2`, returns a zeroed preview (`bracketSize: 0, totalRounds: 0`). Downstream consumers (BracketPreviewCard) may render degenerate UI if this state is reached. | Low |

---

## 5. Architecture Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 5.1 | **No data integrity layer** | High | All writes go directly to localStorage via `JSON.stringify`/`JSON.parse`. Corrupted data (partial writes, schema drift) silently degrades to empty state via the `catch {}` in `readStore`. No schema validation, no migration strategy. |
| 5.2 | **localStorage is per-origin and per-browser** | High | Data is not shareable. No multi-device support. Clearing browser data destroys everything. Acceptable for single-user local-only MVP, but blocks any collaboration features. |
| 5.3 | **Bracket state in React state only** | High | `useBracketGeneration` and `useMatchResolution` store bracket state in `useState`. A page refresh after generating a bracket loses all progress. The `BracketContainer` standalone page is affected the same way. |
| 5.4 | **Race condition on concurrent tabs** | Medium | Two tabs editing the same tournament will overwrite each other's localStorage writes. No locking or conflict detection. |
| 5.5 | **No CSRF / no auth** | Medium | `editPin` is generated but never enforced. The `PinDialog` component exists but is unused. Any user with the URL can edit any tournament. Acceptable for local-only deployment. |
| 5.6 | **Bracket engine is pure but UI state is not** | Medium | The engine correctly clones data before mutation (`cloneMatches`). However, `useMatchResolution` mutates bracket state via `setBracket` callbacks that depend on `sourceBracket` closure, which can go stale. The `prevSource` sync pattern (lines 28-33) is fragile. |
| 5.7 | **No error boundary coverage** | Medium | A thrown error in any child component (e.g., bracket generation with malformed data) will crash the entire page with no recovery. Next.js App Router supports `error.tsx` per-segment but none are defined. |
| 5.8 | **Hydration mismatch potential** | Low | `readStore` returns `{}` during SSR (when `typeof window === 'undefined'`). If any server-rendered content depends on localStorage, hydration will mismatch. Currently mitigated by `'use client'` on all data-dependent pages. |

---

## 6. Potential Edge Cases

| # | Edge Case | Current Behavior | Risk |
|---|-----------|-----------------|------|
| 6.1 | Navigate to tournament ID that doesn't exist | Dashboard shows "Loading..." forever (no not-found handling) | User thinks app is broken |
| 6.2 | Navigate to category ID that doesn't exist | Category page shows "Loading..." forever | Same as above |
| 6.3 | localStorage quota exceeded | `writeStore` calls `localStorage.setItem` which throws `QuotaExceededError`. The `readStore` has a try/catch but `writeStore` does not. Tournament creation will crash mid-operation (tournament written but categories not). | Data corruption: partial write |
| 6.4 | Two competitors with same name in same category | `CompetitorForm` validates uniqueness. But `BulkAddDialog` does case-insensitive dedup while `CompetitorForm` uses case-sensitive comparison (`n !== initialData?.name`) for edit mode. | Inconsistent duplicate detection |
| 6.5 | Bracket with exactly 2 competitors | `calculateBracketInfo(2)` → `bracketSize: 2, totalRounds: 1`. No BYEs. Single final match. Works correctly. | None |
| 6.6 | Bracket with exactly 128 competitors | `generateBracket` has explicit guard: `competitors.length > 128` throws. `CategoryCompetitorsManager` enforces `MAX_COMPETITORS = 128`. Two guards at different layers. | None — correctly prevented |
| 6.7 | Bracket with exactly 129 competitors | Blocked by UI (128 limit) and engine (throws). But `localStorage` stores categories and tournaments with no competitor count check, so if a future feature bypasses the UI, the engine guard is the only protection. | Low — correctly double-guarded |
| 6.8 | Empty tournament name after trimming | `handleSaveTournament` and `handleSubmit` both guard with `!name.trim()`. Save button is disabled when empty. | None |
| 6.9 | Category with bracket in progress is deleted | `deleteCategory` removes the category from storage. No cascade to competitors or bracket data. Once competitor/bracket persistence is added, orphaned data will accumulate. | Medium — data orphaning |
| 6.10 | Switching draw type mid-workflow | `CategoryCompetitorsManager` detects draw type change and resets the inactive draw's state (lines 91-99). Random draw status is cleared when switching to manual and vice versa. | None — correctly handled |
| 6.11 | Adding a competitor after draw is performed | The `competitorSignature` change detection (lines 84-89) resets draw status when the competitor list changes. This correctly invalidates stale draws. | None |
| 6.12 | `standardSeeding` called with `bracketSize = 1` | Caused the REG-003 crash. Now guarded in `useBracketPreview` but the engine function itself still has no guard — any future direct call with `bracketSize < 2` will stack overflow. | Low — engine is meant to be called by `generateBracket` which guards `< 2` |
| 6.13 | Browser tab closed mid-edit | All unsaved React state is lost. Persisted data (tournament, categories) is safe. Bracket progress and competitor lists are lost. | Expected — acceptable for localStorage-only architecture |
| 6.14 | Tournament date in the past | No validation. Date picker allows selecting any date. | Design decision — not necessarily a bug |

---

## 7. Suggested Priority Order for Next Development Phase

| Priority | Item | Rationale |
|----------|------|-----------|
| **P0** | Competitor persistence | Without this, the core workflow is broken. Users add competitors, navigate away, and lose everything. This blocks all real usage. |
| **P0** | Bracket/match persistence | Without this, bracket progress is lost on refresh. Required for any real tournament operation. |
| **P0** | 404 / not-found handling | Users hitting invalid IDs see an infinite "Loading..." state. Add `not-found.tsx` or redirect. |
| **P1** | Error boundaries | Add `error.tsx` to key route segments. A single thrown error should not crash the entire app. |
| **P1** | Remove debug console.logs | 15+ `console.log` statements in `local-storage-repository.ts` and `tournaments/page.tsx` should be stripped before any production deployment. |
| **P1** | Delete tournament | No way to remove a tournament once created. Basic CRUD completeness. |
| **P1** | Wire up standalone bracket page | Replace hardcoded `DEMO_COMPETITORS` with real competitor data from the repository. |
| **P1** | Wire up public bracket view | Replace static mock with real bracket data. Add auto-refresh or polling for live spectators. |
| **P2** | Reconcile type systems | Align `packages/types` `Match`/`BracketData` with `packages/bracket-engine` `EngineMatch`/`EngineBracket`. Decide on one canonical representation. |
| **P2** | Remove duplicate bracket components | Consolidate `components/bracket/` and `components/competitor/` bracket views into a single set of shared components. |
| **P2** | Write-once storage safety | Add `try/catch` to `writeStore`. Add `localStorage` quota check before large writes. |
| **P2** | Category status lifecycle | Implement actual status transitions: `SETUP → IN_PROGRESS` when competitors are added, `IN_PROGRESS → COMPLETED` when bracket is finalized. |
| **P2** | Enforce or remove `editPin` | Either wire the `PinDialog` into the tournament edit flow, or remove the field from the `Tournament` type to avoid dead code. |
| **P3** | Loading states | Add `loading.tsx` to route segments for consistent loading UI. |
| **P3** | Tournament search/filter | Add search and filter controls to the tournament list page. |
| **P3** | Accessibility | Add ARIA labels to all interactive elements. Implement keyboard navigation for bracket views. Audit drag-and-drop for screen readers. |
| **P3** | Mobile bracket layout | Improve bracket rendering on small screens (stacked rounds, tap-to-select instead of hover). |
| **P3** | Data export/import | Add JSON export/import for backup and cross-device migration. |

---

## Appendix: Test Coverage Summary

| Package | Test Files | Tests | Status |
|---------|-----------|-------|--------|
| `packages/bracket-engine` | 5 | 65 | All passing |
| `apps/web` (hooks) | 2 | 39 | All passing |
| `apps/web` (lib) | 1 | 24 | All passing |
| **Total** | **8** | **128** | **All passing** |

**Untested areas:** No component tests (render tests). No integration tests. No E2E tests. No repository tests (localStorage). No page-level tests.

---

## Appendix: File Count Summary

| Directory | Source Files | Test Files |
|-----------|-------------|------------|
| `packages/types/src` | 5 | 0 |
| `packages/bracket-engine/src` | 8 | 5 |
| `apps/web/app` | 9 pages + 1 layout | 0 |
| `apps/web/components` | 25 components | 0 |
| `apps/web/hooks` | 4 hooks | 2 |
| `apps/web/lib` | 6 modules | 1 |
| **Total** | **58** | **8** |
