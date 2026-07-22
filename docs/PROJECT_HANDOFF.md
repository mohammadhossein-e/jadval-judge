# Project Handoff

Living documentation of the Jadval project. This document captures the current state, architecture, decisions, and path forward. It is updated continuously as the project evolves.

---

# Table of Contents

- [Current Project Purpose](#current-project-purpose)
- [Current Implementation Status](#current-implementation-status)
- [Current Architecture](#current-architecture)
- [Monorepo Overview](#monorepo-overview)
- [Folder Structure](#folder-structure)
- [Package Responsibilities](#package-responsibilities)
- [Existing Features](#existing-features)
- [Missing Features](#missing-features)
- [Current Roadmap](#current-roadmap)
- [Development Roadmap](#development-roadmap)
- [Architecture Decisions (ADR Summary)](#architecture-decisions-adr-summary)
- [Technical Debt](#technical-debt)
- [Known Limitations](#known-limitations)
- [Future Plans](#future-plans)
- [TODO List](#todo-list)
- [Current Priorities](#current-priorities)
- [Git Workflow](#git-workflow)
- [Coding Conventions](#coding-conventions)
- [Testing Strategy](#testing-strategy)
- [Release Strategy](#release-strategy)
- [Deployment Notes](#deployment-notes)
- [How to Continue Development](#how-to-continue-development)
- [Important Project Decisions](#important-project-decisions)
- [Future Tournament Engine Plan](#future-tournament-engine-plan)
- [Backend Roadmap](#backend-roadmap)
- [Database Roadmap](#database-roadmap)
- [SaaS Roadmap](#saas-roadmap)
- [AI Roadmap](#ai-roadmap)

---

# Current Project Purpose

Jadval is a web-based SaaS platform for creating and managing single-elimination brackets for karate kata tournaments. It automates bracket generation, match management, and result tracking — tasks that tournament organizers currently handle manually or with inflexible legacy software.

The immediate goal is a working MVP: a tournament organizer can create a tournament, add competitors, generate a bracket, resolve matches, and determine a champion. Persistence, authentication, and public sharing are the next layer.

---

# Current Implementation Status

**Phase: MVP v1.0 — Business Logic Complete, Persistence Layer Pending**

## What Is Working

- Complete single-elimination bracket engine (2–128 competitors, zero dependencies)
- Bracket generation with automatic BYE calculation and standard tournament seeding
- Random draw (Fisher-Yates shuffle) and manual draw (drag-and-drop placement)
- Match winner resolution with automatic advancement to next round
- Cascade undo — changing a match result clears all downstream results
- Champion determination
- Bracket preview showing BYE count, round structure, and seeded BYE positions
- Round labels for all bracket sizes (Final through Round of 128)
- Tournament creation form with inline category management
- Category management (name, gender, age group, belt level)
- Competitor management (add, edit, remove, bulk add from Excel paste, search, reorder)
- Interactive bracket view with winner selection dialog
- Winner change indication in dialog ("changing result" label)
- Undo button with 44px touch target for accessibility
- Theme toggle (light/dark)
- 128 unit tests, all passing (65 engine + 63 web app)

## What Is Not Working

- All data is ephemeral — page refresh loses everything (localStorage only, no persistence)
- Tournament list page uses hardcoded demo data
- Tournament dashboard page is hardcoded
- Bracket page uses hardcoded `DEMO_COMPETITORS`
- Public bracket page is a static HTML mock
- API route files exist as empty stubs — zero route handlers implemented
- No Supabase integration — no database, no realtime, no auth
- PIN authentication UI exists (`PinDialog`) but is unused
- Two incompatible type systems exist in parallel (`@jadval/types` with string IDs vs bracket-engine `EngineMatch` with embedded objects)
- Debug `console.log` statements remain in production code (localStorage repository)
- No error boundaries, no loading states, no 404 handling

---

# Current Architecture

## Layered Monolith with Standalone Engine

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│        Next.js App Router + React Components         │
│    (pages, components, hooks, client-side state)     │
├─────────────────────────────────────────────────────┤
│                    API Layer                         │
│        Next.js Route Handlers (not yet wired)        │
├─────────────────────────────────────────────────────┤
│              @jadval/bracket-engine                  │
│     Pure TypeScript — Zero Dependencies              │
│   (generation, seeding, advancement, cascade, etc.)  │
├─────────────────────────────────────────────────────┤
│                  Data Layer                          │
│    Repository Pattern (localStorage impl exists)     │
│    Supabase/PostgreSQL (planned, not integrated)     │
└─────────────────────────────────────────────────────┘
```

## Key Boundaries

- **Engine** never imports from UI, API, or data layers. It is fully self-contained.
- **UI** reads state and emits events. It never contains domain rules.
- **Repository** abstracts data access. Swapping localStorage for Supabase changes only the repository implementation.
- **Types** (`@jadval/types`) define the shared domain model. The engine has its own parallel types (`EngineMatch`, `EngineBracket`) for independence.

---

# Monorepo Overview

- **Tool:** Turborepo 2.x with npm workspaces
- **Build:** tsup for packages (ESM + CJS + DTS), Next.js for apps
- **Testing:** Vitest with @testing-library/react and jsdom
- **Linting:** ESLint (next core-web-vitals + typescript) + Prettier
- **Package Manager:** npm 11.6.2

---

# Folder Structure

```
jadval/
├── apps/
│   ├── web/                          # @jadval/web — Next.js 16 App Router
│   │   ├── app/                      # Pages and route handlers
│   │   │   ├── layout.tsx            # Root layout (ThemeProvider, Navigation, Toaster)
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── api/                  # Empty route stubs
│   │   │   └── tournaments/          # Tournament pages
│   │   ├── components/               # React components
│   │   │   ├── ui/                   # 16 shadcn/ui primitives
│   │   │   ├── bracket/              # 6 bracket visualization components
│   │   │   ├── competitor/           # 13 competitor/bracket flow components
│   │   │   ├── tournament/           # 3 tournament form components
│   │   │   └── shared/               # 3 shared (navigation, theme)
│   │   ├── hooks/                    # Custom React hooks (bracket, match, draw)
│   │   ├── lib/                      # Utilities, constants, repositories
│   │   │   ├── repositories/         # Repository abstraction layer
│   │   │   │   ├── types.ts          # TournamentRepository interface
│   │   │   │   ├── index.ts          # Singleton factory
│   │   │   │   └── local-storage-repository.ts
│   │   │   ├── draw.ts               # Draw utilities (143 lines)
│   │   │   ├── bracket-labels.ts     # Round label formatting
│   │   │   └── constants.ts          # Gender/age/belt/type options
│   │   ├── stores/                   # Empty (.gitkeep)
│   │   ├── services/                 # Empty (.gitkeep)
│   │   └── styles/                   # Empty (.gitkeep)
│   └── admin/                        # @jadval/admin — Empty placeholder
├── packages/
│   ├── bracket-engine/               # @jadval/bracket-engine — Standalone engine
│   │   └── src/
│   │       ├── index.ts              # Public API exports
│   │       ├── types.ts              # Self-contained engine types
│   │       ├── utils.ts              # Utilities (nextPowerOf2, shuffleArray, etc.)
│   │       └── single-elimination/   # Single elimination strategy
│   │           ├── generator.ts      # generateBracket, isBracketComplete, getChampion
│   │           ├── seeding.ts        # standardSeeding, placeCompetitors
│   │           ├── byes.ts           # calculateBracketInfo, getBracketPreview
│   │           ├── advancement.ts    # resolveMatch
│   │           ├── cascade.ts        # cascadeUndo
│   │           └── cascade-utils.ts  # cascadeForward
│   ├── types/                        # @jadval/types — Shared domain types
│   │   └── src/
│   │       ├── tournament.ts         # Tournament, TournamentType
│   │       ├── category.ts           # Category, CategoryStatus, Gender, AgeGroup, BeltLevel
│   │       ├── competitor.ts         # Competitor
│   │       ├── match.ts              # Match, MatchSlot
│   │       └── bracket.ts            # BracketData, BracketPreview
│   ├── config/                       # @jadval/config — Shared TypeScript config
│   ├── db/                           # @jadval/db — Empty placeholder (Supabase planned)
│   └── ui/                           # @jadval/ui — Empty placeholder (shared UI planned)
└── docs/                             # Documentation
    ├── ARCHITECTURE.md               # System Architecture (1100+ lines)
    ├── PRD.md                        # Product Requirements Document (688 lines)
    ├── AI_RULES.md                   # AI development rules
    ├── AI_CONTEXT.md                 # Full AI context file
    ├── PROJECT_STATE.md              # Current project status
    ├── ROADMAP.md                    # Version roadmap
    ├── CHANGELOG.md                  # Milestone log
    ├── ADR/                          # 10 Architecture Decision Records
    ├── REVIEWS/                      # Code quality reviews
    └── status/                       # Audit documents
```

---

# Package Responsibilities

| Package | Name | Purpose | Dependencies | Status |
|---|---|---|---|---|
| `packages/bracket-engine` | `@jadval/bracket-engine` | Pure tournament business logic — bracket generation, seeding, match resolution, cascade undo, champion determination. Framework-independent, npm-publishable. | Zero runtime deps | Complete, 65 tests |
| `packages/types` | `@jadval/types` | Shared TypeScript type definitions for domain models (Tournament, Category, Competitor, Match, BracketData). | Zero deps | Complete, not consumed by web app |
| `packages/config` | `@jadval/config` | Shared TypeScript configuration (tsconfig.base.json). | None | Complete |
| `packages/db` | `@jadval/db` | Database client (Supabase). Will contain schema, migrations, RLS policies. | TODO | Empty placeholder |
| `packages/ui` | `@jadval/ui` | Shared UI components. Will extract reusable components from apps/web. | TODO | Empty placeholder |
| `apps/web` | `@jadval/web` | Next.js 16 App Router application. Pages, components, hooks, repositories. | Next.js 16, React 19, shadcn/ui | Partially complete |
| `apps/admin` | `@jadval/admin` | Admin dashboard. | TODO | Empty placeholder |

---

# Existing Features

## Tournament Management
- Create tournament with name, date, organization, and type (kata/kumite)
- Edit tournament details
- Inline category creation during tournament creation
- Category management from tournament edit page (add, edit, remove with confirmation)

## Category Management
- Category fields: name, gender, age group, belt level
- Category statuses: SETUP, IN_PROGRESS, COMPLETED
- Category slug generation

## Competitor Management
- Add individual competitors (name, club, optional seed)
- Edit and remove competitors
- Bulk add from pasted Excel data
- Search competitors by name
- Reorder competitors (move up/down)

## Bracket System
- Random draw (Fisher-Yates shuffle)
- Manual draw (HTML5 drag-and-drop placement)
- Bracket preview (BYE count, round structure, seeded BYE positions)
- Bracket generation from drawn competitors
- Interactive bracket view with round grouping
- Winner selection dialog with current winner highlight
- Match undo with cascade (clears downstream results)
- Champion display
- Bracket reset

## Testing
- 65 bracket engine unit tests (generation, seeding, byes, advancement, cascade, champion)
- 39 web app hook tests (bracket generation, match resolution)
- 24 web app lib tests (draw utilities)

---

# Missing Features

## Critical (MVP Completion)
- Supabase database integration (schema, RLS policies, connection)
- API route handlers (CRUD for tournaments, categories, competitors, matches)
- PIN-based authentication
- Wire tournament list page to database
- Wire tournament dashboard to database
- Wire bracket page to use BracketView with real data
- Wire public bracket page to use BracketView (read-only)
- Form validation with zod
- Error boundaries
- Loading states / skeleton screens

## Important
- Component tests (currently zero)
- Integration tests
- E2E tests (Playwright or similar)
- Repository tests
- Page-level tests
- Resolve the dual type system (`@jadval/types` vs engine types)
- Remove debug `console.log` statements from production code
- Remove hardcoded `DEMO_COMPETITORS` from bracket page

## Nice to Have
- Real-time updates (Supabase Realtime)
- Mobile app (React Native) using the same bracket engine
- Multi-language support (i18n)
- Tournament templates
- Export bracket as PDF/image
- Spectator mode with real-time updates
- Tournament statistics and analytics

---

# Current Roadmap

| Version | Goal | Status |
|---|---|---|
| v1.0 | Working single-elimination kata bracket builder with persistence | In Progress — business logic done, persistence pending |
| v1.1 | Repechage format (double-elimination-style brackets) | Not Started |
| v1.2 | Round-robin group stages | Not Started |
| v1.3 | Combined group stage + knockout rounds | Not Started |
| v2.0 | Kumite (sparring) with score tracking | Not Started |

---

# Development Roadmap

## Phase 1: Complete MVP (v1.0)
1. Integrate Supabase — schema, connection, environment config
2. Implement API route handlers (tournaments, categories, competitors, matches)
3. Implement PIN-based authentication
4. Wire all pages to database (replace hardcoded data)
5. Add form validation with zod
6. Add error boundaries and loading states
7. Remove debug code and hardcoded data
8. Resolve dual type system

## Phase 2: Repechage (v1.1)
1. Design repechage bracket engine module
2. Implement as a new Strategy in bracket-engine
3. Build repechage-specific UI components
4. Update bracket view for repechage display

## Phase 3: Round Robin (v1.2)
1. Design round-robin engine module
2. Implement as a new Strategy
3. Build round-robin table component
4. Implement group-to-knockout transition logic

## Phase 4: Group Stage + Knockout (v1.3)
1. Design group stage engine module
2. Implement group standings display
3. Implement group-to-bracket qualification logic

## Phase 5: Kumite (v2.0)
1. Add score tracking logic to bracket engine
2. Build score input UI with timer integration
3. Implement kumite-specific rules (ippon, waza-ari, etc.)

---

# Architecture Decisions (ADR Summary)

| ADR | Decision | Rationale |
|---|---|---|
| 001 | Standalone bracket engine package | Zero dependencies, npm-publishable, usable in any JS environment |
| 002 | Pure function architecture | Input → output, no side effects. Testable, predictable, composable |
| 003 | Layered monolith with Turborepo | Not microservices. Simple deployment, clear boundaries, shared build tooling |
| 004 | Standard tournament seeding (recursive WBT) | Industry-standard algorithm, ensures fair bracket placement |
| 005 | Cascade undo | Changing a match result clears all downstream matches. Prevents inconsistent bracket state |
| 006 | Client-side state with React hooks | No Redux/Zustand. Hooks are sufficient for current scope, avoid unnecessary abstraction |
| 007 | Engine input/output transformation boundary | DB types ↔ Engine types at route handler. Keeps engine independent of data layer |
| 008 | Match ID format: `R{round}P{position}` | Human-readable, deterministic, no UUIDs needed for engine-internal IDs |
| 009 | Manual draw via HTML5 drag-and-drop | No external library. Native browser API, accessible, performant |
| 010 | Shared `cloneMatches` utility | Extracted from duplicated code in advancement.ts and cascade.ts. DRY principle |

---

# Technical Debt

1. **Dual type system.** `@jadval/types` defines `Match` with string IDs (`competitorAId: string | null`). The bracket engine defines `EngineMatch` with embedded objects (`competitorA: EngineCompetitor | null`). These two systems are not connected. The web app duplicates types inline rather than importing from `@jadval/types`. This must be resolved before adding persistence.

2. **Debug console.log statements.** The `LocalStorageRepository` contains extensive `console.log` calls from development debugging. These must be removed before production deployment.

3. **Hardcoded demo data.** The bracket page uses `DEMO_COMPETITORS` instead of real data from the repository. The tournament list and dashboard pages are similarly hardcoded.

4. **Empty route stubs.** API route files exist at `app/api/pin/verify/` and `app/api/tournaments/[tournamentId]/` but contain no implementation.

5. **No component tests.** All 63 web app tests cover hooks and utilities. Zero tests exist for React components, pages, or integration flows.

6. **Duplicate bracket components.** Components exist in both `components/bracket/` and `components/competitor/` with overlapping functionality. The split was part of an extraction refactor but the old components were not removed.

7. **Empty placeholder packages.** `@jadval/db`, `@jadval/ui`, and `@jadval/admin` exist as empty shells. They add monorepo weight without contributing functionality.

---

# Known Limitations

1. **No persistence.** All data lives in localStorage (or React state). Page refresh, browser change, or device change loses everything.
2. **Single tournament type.** Only single-elimination is implemented. No repechage, round robin, pool, or other formats.
3. **No real-time.** No way for spectators or co-organizers to see live updates.
4. **No authentication.** No user accounts, no PIN-based access control. Anyone with the URL can edit.
5. **No public sharing.** The public bracket page is a static mock. There is no way to share a bracket with spectators.
6. **Client-side only.** No server-side rendering of tournament data. No SEO. No link sharing that works.
7. **Kata only.** No score tracking, no timer, no kumite-specific features.
8. **No mobile optimization.** Bracket view works but is not optimized for small screens. Drag-and-drop manual draw may not work on touch devices.
9. **TypeScript version mismatch.** README says "Next.js 14+" but the actual version is 16.2.10. The README is outdated.

---

# Future Plans

- **SaaS Platform.** Multi-tenant, user accounts, organization management, billing.
- **Mobile App.** React Native using the same bracket engine package.
- **Custom Tournament Builder.** Visual tool for composing tournament formats from building blocks.
- **Multi-sport.** Eventually support any sport that uses brackets, pools, or round-robin.
- **Real-time Spectator Mode.** Live bracket updates via Supabase Realtime.
- **PDF/Image Export.** Generate printable bracket sheets.
- **Tournament Templates.** Pre-configured tournament setups for common formats.
- **Analytics.** Tournament statistics, competitor performance tracking.

---

# TODO List

## Immediate (v1.0 completion)
- [ ] Integrate Supabase (schema, RLS, connection)
- [ ] Implement all API route handlers
- [ ] Implement PIN authentication
- [ ] Wire tournament list page to database
- [ ] Wire tournament dashboard to database
- [ ] Wire bracket page to real data
- [ ] Wire public bracket page
- [ ] Add zod validation
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Remove debug console.log statements
- [ ] Remove hardcoded DEMO_COMPETITORS
- [ ] Resolve dual type system
- [ ] Add component tests

## Short-term
- [ ] Add integration tests
- [ ] Add E2E tests (Playwright)
- [ ] Clean up duplicate bracket components
- [ ] Remove or fill empty placeholder packages
- [ ] Update README to reflect actual versions

## Medium-term
- [ ] Repechage engine module (v1.1)
- [ ] Round-robin engine module (v1.2)
- [ ] Group stage + knockout module (v1.3)
- [ ] Kumite score tracking (v2.0)

## Long-term
- [ ] Admin dashboard
- [ ] Mobile app (React Native)
- [ ] Custom tournament builder
- [ ] Multi-sport support
- [ ] SaaS infrastructure

---

# Current Priorities

1. **Persistence.** Without a database, nothing else matters. The app loses all data on refresh.
2. **API layer.** Route handlers must be implemented to connect the UI to the database.
3. **Page wiring.** Replace all hardcoded data with real data from the repository/API.
4. **Type system unification.** Resolve the `@jadval/types` vs engine types split before it causes data transformation bugs at the persistence boundary.
5. **Testing gaps.** Component and integration tests before the feature set grows.

---

# Git Workflow

- **Branching:** TODO — no branching convention is documented. Current history shows direct commits to main.
- **Commits:** Conventional commits style observed (feat:, fix:, docs:, refactor:, chore:, style:).
- **PRs:** No PR templates or review process documented.
- **Releases:** No release tags or versioning strategy implemented yet.

---

# Coding Conventions

## TypeScript
- Strict TypeScript (`"strict": true`)
- Explicit return types on exported functions
- No `any` — use `unknown` and narrow with type guards
- Prefer interfaces over type aliases for extensible object shapes
- Discriminated unions for state machines and variant types

## Formatting
- Prettier: singleQuote, trailingComma (all), 100 char width
- ESLint: next core-web-vitals + typescript

## React
- Functional components only
- Hooks for state management (no Redux/Zustand)
- `'use client'` directive for client components
- Props in, events out — no reaching into external state from presentational components

## Naming
- Files: kebab-case for utilities, PascalCase for components
- Functions: camelCase, descriptive names
- Types/Interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE for true constants, camelCase for configuration objects

## File Organization
- One component per file (generally)
- Co-locate tests with source (`__tests__/` directories)
- Hooks in `hooks/`, utilities in `lib/`, components in `components/`

---

# Testing Strategy

## Current
- **Engine:** 65 unit tests covering generation, seeding, byes, advancement, cascade, champion
- **Web hooks:** 39 unit tests for bracket generation and match resolution hooks
- **Web lib:** 24 unit tests for draw utilities
- **Framework:** Vitest with @testing-library/react and jsdom

## Gaps
- No component tests
- No integration tests
- No E2E tests
- No repository tests
- No page-level tests
- No API route tests

## Desired State
- Unit tests for all business logic (engine, hooks, utilities)
- Component tests for critical UI components (bracket view, winner dialog, competitor manager)
- Integration tests for user flows (create tournament → add competitors → generate bracket → resolve matches)
- E2E tests for critical paths (Playwright)
- Repository tests for data access layer

## Running Tests
```bash
npm run test --workspace=packages/bracket-engine  # 65 tests
npm run test --workspace=apps/web                  # 63 tests
npm run typecheck --workspace=packages/bracket-engine  # clean
npm run typecheck --workspace=apps/web                 # clean
npm run lint --workspace=apps/web                      # clean
```

---

# Release Strategy

- **Current:** No releases. Pre-MVP development.
- **Planned:** TODO — no release strategy documented. Suggested approach:
  - Semantic versioning
  - GitHub releases with changelogs
  - Staging environment on Vercel for pre-release validation
  - Production deploys on merge to main

---

# Deployment Notes

- **Platform:** Vercel (planned, per README)
- **Runtime:** Node.js 20+
- **Build:** `npm run build` (Turborepo orchestrates package builds, then app build)
- **Environment Variables:** TODO — no `.env.example` file exists. Supabase URL and anon key will be needed.
- **Current state:** No deployment configured. Local development only.

---

# How to Continue Development

## First Steps for New Contributor

1. Read `docs/PROJECT_BIBLE.md` for architectural principles
2. Read `docs/ARCHITECTURE.md` for detailed system design
3. Read `docs/AI_RULES.md` for development standards
4. Read `docs/PRD.md` for product requirements
5. Run `npm install` and verify all 128 tests pass
6. Start with the persistence layer — it is the critical path

## Recommended First Task

Integrate Supabase:
1. Set up Supabase project
2. Create schema (tournaments, categories, competitors, matches tables)
3. Implement SupabaseRepository implementing `TournamentRepository`
4. Wire API route handlers
5. Replace localStorage with Supabase in the web app
6. Add environment variable configuration

## Key Files to Understand

| File | Why It Matters |
|---|---|
| `packages/bracket-engine/src/types.ts` | Engine's self-contained type system |
| `packages/bracket-engine/src/single-elimination/generator.ts` | Core bracket generation logic |
| `apps/web/lib/repositories/types.ts` | Repository interface — the data access contract |
| `apps/web/hooks/useBracketGeneration.ts` | How UI consumes the engine |
| `apps/web/hooks/useMatchResolution.ts` | How UI manages bracket state |
| `apps/web/components/competitor/CategoryCompetitorsManager.tsx` | Main orchestrator component (368 lines) |
| `apps/web/lib/draw.ts` | Draw utilities and placement converters |

---

# Important Project Decisions

1. **Engine independence.** The bracket engine has zero dependencies and its own type system. This is intentional — it must be usable in React Native, Node.js, or any other environment without pulling in React or Next.js.

2. **Transformation boundary.** Database types and engine types are different by design. The route handler layer converts between them. This keeps the engine clean and the database schema flexible.

3. **Client-side state first.** The initial implementation uses React hooks for bracket state. This will be supplemented (not replaced) by server-side persistence. The hooks remain the source of truth for in-flight bracket operations.

4. **Single elimination first.** The engine is built as a strategy pattern specifically so other formats can be added later without modifying existing code. The first strategy (single elimination) is complete and tested.

5. **Turborepo monolith.** The project is a monorepo, not microservices. The packages share a build pipeline and type system. Deployment is a single unit.

---

# Future Tournament Engine Plan

The engine is designed for extensibility. Each tournament format will be a new strategy module:

```
packages/bracket-engine/src/
├── types.ts                          # Shared engine types
├── utils.ts                          # Shared utilities
├── single-elimination/               # ✅ Complete
│   ├── generator.ts
│   ├── seeding.ts
│   ├── byes.ts
│   ├── advancement.ts
│   ├── cascade.ts
│   └── cascade-utils.ts
├── repechage/                        # Planned (v1.1)
│   └── TODO
├── round-robin/                      # Planned (v1.2)
│   └── TODO
├── pool/                             # Planned (v1.3)
│   └── TODO
└── kumite/                           # Planned (v2.0)
    └── TODO
```

Each strategy will implement a common engine interface (to be defined). The engine's public API will dispatch to the appropriate strategy based on tournament type.

---

# Backend Roadmap

1. **Supabase integration** — Database client, schema, connection management
2. **API route handlers** — Full CRUD for tournaments, categories, competitors, matches
3. **Server-side data fetching** — Replace client-side localStorage with server-side queries
4. **PIN authentication** — Tournament-specific edit pins for access control
5. **Real-time subscriptions** — Supabase Realtime for live bracket updates
6. **Rate limiting** — Prevent abuse of API endpoints
7. **Audit logging** — Track who changed what and when

---

# Database Roadmap

1. **Schema design** — Tables for tournaments, categories, competitors, matches, pins
2. **Row Level Security** — RLS policies for tournament isolation and PIN-based access
3. **Migrations** — Versioned schema changes via Supabase CLI
4. **Indexes** — Optimize queries for tournament listing, category lookup, bracket queries
5. **Seed data** — Development seed data for testing
6. **Backup strategy** — Automated backups, point-in-time recovery

---

# SaaS Roadmap

1. **User accounts** — Supabase Auth (email, OAuth)
2. **Organization management** — Multi-tenant support
3. **Subscription billing** — Stripe integration for paid tiers
4. **Usage limits** — Tournament limits per plan
5. **Custom domains** — Allow organizers to use their own domains
6. **White-label** — Customizable branding for large organizations
7. **API access** — Public API for third-party integrations

---

# AI Roadmap

1. **Smart seeding** — AI-assisted seeding based on competitor history and rankings
2. **Schedule optimization** — Optimal match scheduling for venue and time constraints
3. **Bracket prediction** — Predict likely outcomes based on competitor data
4. **Anomaly detection** — Detect unusual results or potential issues
5. **Natural language bracket creation** — "Create a 16-person single elimination kata tournament for under-18 brown belts"
6. **Automated rule checking** — Verify bracket compliance with WKF or other governing body rules

---

Last Updated: 2026-07-21
