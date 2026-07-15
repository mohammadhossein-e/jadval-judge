# Changelog

All notable changes to the Jadval project are documented here.

## [Unreleased]

### Infrastructure

- Created permanent project documentation (PROJECT_STATE, ROADMAP, CHANGELOG, AI_CONTEXT)
- Created Architecture Decision Records (ADR) for all major decisions
- Created versioned review documents

## [0.2.0] — 2026-07-15

### Tournament Execution Review Fixes

#### Important Issues Fixed

- **Undo button touch target**: Increased from 20×20px to 44×44px (`BracketView.tsx`)
- **useMatchResolution return type**: Changed `bracket` from `EngineBracket` to `EngineBracket | null`, removed non-null assertion
- **WinnerSelectionDialog**: Current winner now highlighted with `variant="default"` button; dialog shows "(changing result)" when changing a result

#### Code Quality Improvements

- **Extracted `cloneMatches`**: Moved duplicated deep-clone function from `advancement.ts` and `cascade.ts` to shared `utils.ts`
- **Split CategoryCompetitorsManager**: Extracted `CategoryHeader`, `DrawTypeSelector`, `BracketResultSection` into separate components
- **Map-based match lookups**: Replaced `Array.find()` with `Map.get()` via `useMemo` in `useMatchResolution` and `BracketView`

#### Suggested Improvements Implemented

- **ARIA labels**: Added descriptive `aria-label` to MatchCard and undo button
- **Memoized round grouping**: Round grouping in BracketView now uses `useMemo` with Map, avoiding O(n²) re-filter
- **Improved round labels**: Added Round of 16, 32, 64, 128 labels for large brackets

## [0.1.0] — 2026-07-10

### Initial MVP Implementation

#### Bracket Engine (`@jadval/bracket-engine`)

- Single-elimination bracket generation (2–128 competitors)
- Standard tournament seeding algorithm
- Automatic BYE calculation and resolution
- Match winner resolution with advancement
- Cascade undo for result changes
- Champion determination
- Bracket preview (BYE count, round structure)
- Zero runtime dependencies, npm-publishable

#### Application Layer (`@jadval/web`)

- Next.js 16 App Router with React 19
- Tournament creation with inline category management
- Category management (name, gender, age group, belt level)
- Competitor management (CRUD, bulk add, search, reorder)
- Random draw (Fisher-Yates shuffle)
- Manual draw (drag-and-drop slot placement)
- Interactive bracket view with winner selection
- Bracket preview card
- Theme toggle (light/dark)
- Turborepo monorepo structure

#### Shared Packages

- `@jadval/types`: TypeScript type definitions for domain models
- `@jadval/config`: Shared TypeScript configuration

#### Testing

- 65 bracket engine unit tests
- 63 web application unit tests (hooks, draw logic)
- All tests passing, typecheck clean, lint clean

### Key Architectural Decisions

- Standalone bracket engine with zero dependencies
- Engine types are self-contained (no imports from `packages/types`)
- Pure function architecture (input → output, no side effects)
- Layered monolith: Presentation → API → Engine → Data
