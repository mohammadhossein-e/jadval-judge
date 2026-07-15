# Project Status

Last updated: 2026-07-15

## Current Phase

**MVP (v1.0) — Business Logic Complete, Persistence Layer Pending**

## Completed Features

### Bracket Engine (`packages/bracket-engine/`)

- Single-elimination bracket generation (2–128 competitors)
- Automatic BYE calculation with standard tournament seeding
- Random draw (Fisher-Yates shuffle) and manual draw (drag-and-drop placement)
- Match winner resolution with automatic advancement
- Cascade undo for changing match results
- Champion determination
- Bracket preview (BYE count, round structure, seeded BYE positions)
- Round labels for all bracket sizes (Final, Semifinals, Quarterfinals, Round of 16/32/64/128)
- Pure TypeScript, zero runtime dependencies, npm-publishable
- 65 unit tests, all passing

### Application Layer (`apps/web/`)

- Tournament creation form with inline category management
- Category form (name, gender, age group, belt level)
- Category list with edit/remove and confirmation dialogs
- Competitor management (add, edit, remove, bulk add from Excel paste)
- Competitor list with search, reorder (up/down)
- Random draw card with re-draw confirmation
- Manual draw card with drag-and-drop slot placement
- Bracket preview card (BYE count, round structure, seeded BYEs)
- Interactive bracket view with winner selection dialog
- Winner change indication in dialog
- Undo button with 44px touch target
- Champion display
- Reset bracket capability
- 63 unit tests, all passing

### Infrastructure

- Turborepo monorepo with npm workspaces
- Shared TypeScript config (`packages/config`)
- Shared type definitions (`packages/types`)
- ESLint + Prettier configuration
- Vitest for testing (both packages)
- Typecheck and lint pass cleanly

## Not Yet Implemented

### Persistence Layer

- Supabase database integration
- API route handlers (CRUD for tournaments, categories, competitors, matches)
- PIN-based authentication
- Server-side data fetching

### Page Wiring

- Tournament list page (currently hardcoded)
- Tournament dashboard page (currently hardcoded)
- Bracket page (currently hardcoded — interactive bracket exists in CategoryCompetitorsManager)
- Public bracket page (currently hardcoded — should use BracketView read-only)

### Production Readiness

- Error boundaries
- Loading states / skeleton screens
- Real-time updates (Supabase Realtime)
- Form validation with zod
- Environment variable configuration

## Test Status

| Package | Tests | Status |
|---|---|---|
| `@jadval/bracket-engine` | 65 | All passing |
| `@jadval/web` | 63 | All passing |
| **Total** | **128** | **All passing** |

```
npm run test --workspace=packages/bracket-engine  # 65 tests
npm run test --workspace=apps/web                  # 63 tests
npm run typecheck --workspace=packages/bracket-engine  # clean
npm run typecheck --workspace=apps/web                 # clean
npm run lint --workspace=apps/web                      # clean
```

## Known Limitations

1. All data is ephemeral client-side state — page refresh loses everything
2. Bracket page and public bracket page are static HTML, not wired to the engine
3. No API layer means tournament creation form will fail on submit
4. `@jadval/types` package is defined but not consumed by the web app (types are duplicated inline)
