# AI Context

This document provides everything an AI assistant needs to continue development on the Jadval project without any previous conversation history.

---

## Project Overview

**Jadval** is a web-based SaaS platform for creating and managing single-elimination brackets for karate kata tournaments. It is designed as a Turborepo monorepo with a standalone bracket engine package that can be published to npm independently.

**Current status:** MVP (v1.0) — business logic complete, persistence layer pending.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui | latest |
| Icons | lucide-react | latest |
| Testing | Vitest | 1.x |
| Build | Turborepo + tsup | latest |
| Database (planned) | Supabase (PostgreSQL) | 2.x |
| Validation (planned) | zod | 3.x |

---

## Architecture

### Layered Monolith with Standalone Engine

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  Next.js App Router + React Components  │
├─────────────────────────────────────────┤
│         API / Data Layer                │
│  Route Handlers + Supabase Client       │
├─────────────────────────────────────────┤
│    @jadval/bracket-engine (Standalone)  │
│  Pure TypeScript — Zero Dependencies    │
├─────────────────────────────────────────┤
│         Data Layer                      │
│  Supabase (PostgreSQL, Auth, Realtime)  │
└─────────────────────────────────────────┘
```

### Monorepo Structure

```
jadval/
├── apps/
│   └── web/                    # Next.js application (@jadval/web)
│       ├── app/                # Next.js App Router pages
│       ├── components/         # React components
│       │   ├── ui/             # shadcn/ui primitives
│       │   ├── tournament/     # Tournament-specific components
│       │   ├── competitor/     # Competitor & bracket components
│       │   └── shared/         # Cross-cutting (navigation, theme)
│       ├── hooks/              # Custom React hooks
│       └── lib/                # Utilities, draw logic, constants
├── packages/
│   ├── bracket-engine/         # @jadval/bracket-engine (STANDALONE)
│   │   └── src/
│   │       ├── types.ts        # Engine domain types (self-contained)
│   │       ├── utils.ts        # Pure helpers (cloneMatches, shuffleArray)
│   │       └── single-elimination/
│   │           ├── generator.ts    # generateBracket(), isBracketComplete(), getChampion()
│   │           ├── seeding.ts      # standardSeeding(), placeCompetitors()
│   │           ├── byes.ts         # calculateBracketInfo(), getBracketPreview()
│   │           ├── advancement.ts  # resolveMatch()
│   │           ├── cascade.ts      # cascadeUndo()
│   │           └── cascade-utils.ts # cascadeForward()
│   ├── types/                  # @jadval/types (shared domain types)
│   ├── config/                 # @jadval/config (shared tsconfig)
│   └── db/                     # @jadval/db (placeholder)
└── docs/                       # Project documentation
```

---

## Key Files Reference

### Bracket Engine (packages/bracket-engine/src/)

| File | Exports | Purpose |
|---|---|---|
| `types.ts` | `EngineCompetitor`, `EngineMatch`, `EngineBracket`, `DrawType`, `GenerationResult`, `BracketPreview` | Self-contained engine types |
| `utils.ts` | `nextPowerOf2`, `logBase2`, `shuffleArray`, `cloneMatches` | Pure helper functions |
| `single-elimination/generator.ts` | `generateBracket()`, `isBracketComplete()`, `getChampion()` | Main entry point |
| `single-elimination/seeding.ts` | `standardSeeding()`, `placeCompetitors()` | Seeding algorithm |
| `single-elimination/byes.ts` | `calculateBracketInfo()`, `getBracketPreview()` | BYE calculation |
| `single-elimination/advancement.ts` | `resolveMatch()` | Winner resolution |
| `single-elimination/cascade.ts` | `cascadeUndo()` | Undo with cascade |
| `single-elimination/cascade-utils.ts` | `cascadeForward()` | Shared cascade helper |

### Application Layer (apps/web/)

| File | Purpose |
|---|---|
| `components/competitor/CategoryCompetitorsManager.tsx` | Main orchestrator for competitor management + bracket flow |
| `components/competitor/BracketView.tsx` | Interactive bracket visualization |
| `components/competitor/BracketResultSection.tsx` | Bracket display with champion + reset |
| `components/competitor/BracketPreviewCard.tsx` | Pre-generation bracket info |
| `components/competitor/RandomDrawCard.tsx` | Random draw UI |
| `components/competitor/ManualDrawCard.tsx` | Manual draw with drag-and-drop |
| `hooks/useBracketGeneration.ts` | Wraps `generateBracket()` + `getBracketPreview()` |
| `hooks/useMatchResolution.ts` | Wraps `resolveMatch()`, `cascadeUndo()`, `isBracketComplete()`, `getChampion()` |
| `hooks/useRandomDraw.ts` | Wraps `performDraw()` |
| `hooks/useManualDraw.ts` | Manual slot placement state management |
| `lib/draw.ts` | Draw utilities (performDraw, createEmptySlots, placement converters) |
| `lib/bracket-labels.ts` | Round label formatting |

---

## Project Conventions

### Code Style

- Strict TypeScript (`strict: true` in tsconfig)
- No `any` — use `unknown` and narrow with type guards
- Explicit return types on exported functions
- Named exports (no default exports except Next.js pages)
- Files max ~200 lines — extract if longer
- One component per file
- Props interface above component
- Destructure props in function signature

### Import Order

1. External libraries (react, next, etc.)
2. Internal packages (@jadval/*)
3. Local modules (@/components, @/lib, @/hooks)

### Testing

- Bracket engine: unit tests for every public function
- Web app: hook tests and utility function tests
- Run `npm run typecheck` and `npm run lint` after every change
- Tests must all pass before committing

### Component Patterns

- Server Components by default, add `'use client'` only when interactivity needed
- Accept data via props, emit events upward
- Use `useCallback` for event handlers passed as props
- Use `useMemo` for expensive computations
- Use `useRef` for mutable values that don't trigger re-renders

---

## Bracket Engine Contract

### Input/Output

Every public function follows: plain data in, plain data out. No classes, no side effects, no I/O.

### Key Functions

```typescript
// Generate a bracket from competitors
generateBracket(competitors, drawType, manualPlacements?) → GenerationResult

// Resolve a match winner
resolveMatch(bracket, matchId, winnerId) → EngineBracket

// Undo a match result with cascade
cascadeUndo(bracket, matchId) → EngineBracket

// Preview bracket info before generation
getBracketPreview(competitorCount, seeds) → BracketPreview

// Check if all matches resolved
isBracketComplete(bracket) → boolean

// Get the champion
getChampion(bracket) → EngineCompetitor | null
```

### Immutability

All engine functions return new objects. They never mutate the input bracket.

---

## Data Flow

### Bracket Generation

```
1. User performs draw (random shuffle or manual placement)
2. App layer converts draw result to Map<number, string>
   - Random: DrawEntry[] → drawEntriesToPlacements()
   - Manual: ManualSlots → manualSlotsToPlacements()
3. useBracketGeneration.generate(placements) called
4. Engine: generateBracket(engineCompetitors, drawType, placements)
5. Engine returns GenerationResult { bracket, byes }
6. BracketView renders the bracket
```

### Match Resolution

```
1. User clicks match → WinnerSelectionDialog opens
2. User selects winner → useMatchResolution.resolveWinner(matchId, winnerId)
3. Hook calls engine: resolveMatch(bracket, matchId, winnerId)
4. Engine clones bracket, sets winner, advances to next match
5. BracketView re-renders with updated bracket
```

### Cascade Undo

```
1. User clicks undo button on resolved match
2. useMatchResolution.undoMatch(matchId) called
3. Hook calls engine: cascadeUndo(bracket, matchId)
4. Engine clones bracket, clears winner, removes old winner from downstream matches
5. BracketView re-renders with cleaned bracket
```

---

## Things an AI Must Never Change Without Review

### Critical (Never Change Without Explicit Approval)

1. **Bracket engine public API** — `generateBracket`, `resolveMatch`, `cascadeUndo`, `getBracketPreview`, `isBracketComplete`, `getChampion` signatures. These are the core contract.
2. **Engine type definitions** — `EngineCompetitor`, `EngineMatch`, `EngineBracket`. These are self-contained and must not import from other packages.
3. **Seeding algorithm** — `standardSeeding()` produces a specific deterministic pattern. Changes affect all bracket generation.
4. **Cascade logic** — `cascadeForward()` and `cascadeUndo()` handle complex downstream cleanup. Incorrect cascade = corrupted brackets.
5. **BYE resolution** — `autoResolveByes()` in generator.ts. Incorrect BYE handling = broken brackets.
6. **Immutability contract** — Engine functions must never mutate input objects.

### Important (Require Review Before Merging)

7. **Component prop interfaces** — Changes to `BracketViewProps`, `UseMatchResolutionReturn`, etc. affect multiple consumers.
8. **Hook return types** — Especially `useMatchResolution` which returns nullable bracket.
9. **Draw logic** — `performDraw()`, placement converters. Affects bracket generation input.
10. **Round labels** — `getRoundLabel()` mapping. Affects all bracket displays.
11. **Test coverage** — Never delete tests. Never reduce coverage.
12. **Package dependencies** — Engine must stay zero-dependency. Web app dependencies need review.

### Sensitive (May Break Existing Functionality)

13. **Match ID format** — IDs follow `R{round}P{position}` pattern (e.g., `R1P0`, `R2P1`). Changing this breaks match lookup.
14. **Winner advancement** — `nextMatchId` and `nextSlot` logic. Incorrect advancement = broken tournament flow.
15. **Touch target sizes** — Accessibility requirement: minimum 44×44px for interactive elements.

---

## Current Priorities

1. **Supabase integration** — Database schema, RLS policies, real-time subscriptions
2. **API route handlers** — CRUD for tournaments, categories, competitors, bracket, matches
3. **PIN authentication** — Organizer access control
4. **Page wiring** — Connect tournament list, dashboard, bracket, and public pages to data
5. **Form validation** — Add zod schemas for all forms
6. **Error handling** — Error boundaries, loading states, proper error messages

---

## Running the Project

```bash
# Install dependencies
npm install

# Development
npm run dev                    # Start all apps via Turborepo
npm run dev --workspace=apps/web  # Start only the web app

# Testing
npm run test                   # Run all tests
npm run test --workspace=packages/bracket-engine  # Engine tests only
npm run test --workspace=apps/web                 # Web app tests only

# Type checking
npm run typecheck              # Check all packages
npm run typecheck --workspace=apps/web           # Web app only

# Linting
npm run lint                   # Lint all packages
npm run lint --workspace=apps/web                # Web app only

# Build
npm run build                  # Build all packages
```
