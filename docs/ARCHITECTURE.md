# System Architecture — Version 1.0

## Karate Tournament Bracket Builder

---

## 1. Overall Application Architecture

### Chosen Approach: Layered Monolith with Standalone Engine Package

The application is structured as a **Next.js monolith** with a **standalone bracket engine package** that has zero dependencies on any framework, UI library, or database. The engine is designed to be publishable as an independent npm package.

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                     │
│  Next.js App Router (Pages, Layouts, Server Components)  │
│  React Client Components (Interactive Bracket, Forms)     │
├─────────────────────────────────────────────────────────┤
│                    API / Data Layer                        │
│  Next.js Route Handlers (REST API)                        │
│  Supabase Client (Database queries, Realtime)             │
├─────────────────────────────────────────────────────────┤
│              @jadval/bracket-engine (Standalone)           │
│  Pure TypeScript — Zero Dependencies                       │
│  Input: Plain data → Output: Plain data                     │
│  Publishable to npm independently                          │
├─────────────────────────────────────────────────────────┤
│                    Data Layer                              │
│  Supabase (PostgreSQL, Auth, Storage, Realtime)           │
└─────────────────────────────────────────────────────────┘
```

### Why This Approach

**Alternatives Considered:**

| Alternative                         | Why Rejected                                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Full microservices**              | Overkill for MVP. Adds deployment complexity, network latency between services, and distributed data consistency problems.                                                                           |
| **Serverless functions (separate)** | Adds cold-start latency, harder to share types between frontend and API. Next.js route handlers give us serverless benefits inside a single deployment.                                              |
| **Turborepo monorepo**              | Tempting for package separation, but premature for MVP. The bracket engine can be a local package (`packages/bracket-engine`) without Turborepo complexity. Add Turborepo when we need a second app. |
| **Flat Next.js app**                | Violates the separation of business logic from UI. Bracket logic would leak into components and route handlers. Makes testing impossible without mocking Supabase.                                   |
| **Engine as part of the app**       | Violates the requirement for npm publishability. Tangles business logic with application-specific code.                                                                                              |

**Why this is best:** A layered monolith with a standalone engine package gives us:

- Clean separation without infrastructure overhead
- Publishable business logic as an independent npm package
- Testable engine in complete isolation (no React, no Supabase, no HTTP)
- Clear mental model for contributors
- Easy to extract into a microservice later if needed

---

## 2. Bracket Engine Independence (Critical Design Requirement)

### Core Principle: Zero Dependencies

The bracket engine (`@jadval/bracket-engine`) is a **pure TypeScript package** with:

| Dependency Type       | Allowed | Reason                                                                               |
| --------------------- | ------- | ------------------------------------------------------------------------------------ |
| React / Next.js       | ❌ No   | UI framework must not leak into business logic                                       |
| Supabase / PostgreSQL | ❌ No   | Database client must not be in the engine                                            |
| Node.js built-ins     | ❌ No   | Must work in browser, Node.js, and edge runtimes                                     |
| HTTP / fetch          | ❌ No   | Engine must not make network calls                                                   |
| File system           | ❌ No   | Engine must not read/write files                                                     |
| Other npm packages    | ❌ No   | Zero external dependencies for maximum portability                                   |
| TypeScript types only | ✅ Yes  | Engine may define its own types, import from `@jadval/types` if published separately |

### Engine Input/Output Contract

Every public function in the engine follows this pattern:

```
Input:  Plain JavaScript objects (no classes, no database models, no framework types)
Output: Plain JavaScript objects (serializable, can be sent over JSON)
```

**Allowed input types:**

- Primitive values (string, number, boolean, null)
- Plain objects (POJOs)
- Arrays
- Enums (string unions)

**Forbidden input types:**

- React components or elements
- Supabase client instances
- Request/Response objects
- Functions or callbacks
- DOM elements
- Database row types with UUID formatting

### npm Publishability Requirements

The engine must meet these criteria to be published as `@jadval/bracket-engine`:

| Requirement                 | Implementation                                             |
| --------------------------- | ---------------------------------------------------------- |
| **package.json**            | Valid npm package with name, version, main, types, exports |
| **TypeScript declarations** | `.d.ts` files generated for consumers                      |
| **ESM + CJS**               | Dual format build (or ESM-only for modern consumers)       |
| **Tree-shakeable**          | Each function exportable independently                     |
| **Zero dependencies**       | No `dependencies` in package.json (only `devDependencies`) |
| **Versioned API**           | Semantic versioning with clear changelog                   |
| **Documentation**           | JSDoc comments on all public functions                     |
| **Tests included**          | Test files excluded from publish, test script available    |

### Build Configuration

```
packages/bracket-engine/
├── package.json          # name: "@jadval/bracket-engine"
├── tsconfig.json         # Strict mode, declaration files
├── tsup.config.ts        # Build config (ESM + CJS, declaration files)
├── src/
│   ├── index.ts          # Public API (re-exports only)
│   └── ...
├── dist/                 # Built output
│   ├── index.js          # CJS
│   ├── index.mjs         # ESM
│   └── index.d.ts        # Type declarations
└── README.md             # Package documentation
```

### Why This Independence Matters

**Use Cases for Standalone Engine:**

1. **npm publishing** — Other tournament apps can use the engine without our UI
2. **Testing** — Complete isolation for unit testing without mocking anything
3. **Mobile app** — React Native app can import the same engine
4. **Backend-only tools** — CLI tools for bracket generation without a UI
5. **Third-party integrations** — Federations can embed bracket logic in their systems
6. **Edge functions** — Deploy bracket logic to Cloudflare Workers, Vercel Edge, etc.

---

## 3. Folder Structure

```
jadval/
├── apps/
│   └── web/                          # Next.js application
│       ├── app/                      # Next.js App Router
│       │   ├── layout.tsx            # Root layout (RTL support, fonts)
│       │   ├── page.tsx              # Homepage / Tournament list
│       │   ├── tournaments/
│       │   │   ├── new/
│       │   │   │   └── page.tsx      # Create tournament form
│       │   │   └── [tournamentId]/
│       │   │       ├── page.tsx      # Tournament dashboard
│       │   │       ├── edit/
│       │   │       │   └── page.tsx  # Edit tournament
│       │   │       └── categories/
│       │   │           ├── new/
│       │   │           │   └── page.tsx    # Create category
│       │   │           └── [categoryId]/
│       │   │               ├── page.tsx    # Category management (competitors)
│       │   │               ├── bracket/
│       │   │               │   └── page.tsx    # Bracket view (interactive)
│       │   │               └── public/
│       │   │                   └── page.tsx    # Public bracket (read-only)
│       │   └── api/
│       │       ├── tournaments/
│       │       │   ├── route.ts             # GET (list), POST (create)
│       │       │   └── [tournamentId]/
│       │       │       ├── route.ts         # GET, PUT, DELETE
│       │       │       └── categories/
│       │       │           ├── route.ts     # GET, POST
│       │       │           └── [categoryId]/
│       │       │               ├── route.ts
│       │       │               ├── competitors/
│       │       │               │   ├── route.ts
│       │       │               │   └── bulk/
│       │       │               │       └── route.ts
│       │       │               ├── bracket/
│       │       │               │   ├── route.ts       # POST (generate)
│       │       │               │   └── matches/
│       │       │               │       └── [matchId]/
│       │       │               │           └── resolve/
│       │       │               │               └── route.ts
│       │       │               └── public/
│       │       │                   └── route.ts
│       │       └── pin/
│       │           └── verify/
│       │               └── route.ts        # POST (verify PIN)
│       ├── components/                     # React components
│       │   ├── ui/                         # Generic UI primitives
│       │   ├── tournament/                 # Tournament-specific components
│       │   ├── category/                   # Category-specific components
│       │   ├── bracket/                    # Bracket visualization
│       │   └── shared/                     # Cross-cutting components
│       ├── hooks/                          # Custom React hooks
│       ├── lib/                            # Utilities, Supabase client
│       └── styles/                         # Global styles, Tailwind config
│
├── packages/
│   ├── bracket-engine/               # STANDALONE: Pure TypeScript, zero deps
│   │   ├── src/
│   │   │   ├── index.ts              # Public API exports
│   │   │   ├── types.ts              # Engine domain types (STANDALONE)
│   │   │   ├── utils.ts              # Pure helper functions
│   │   │   ├── single-elimination/   # Tournament format engine
│   │   │   │   ├── index.ts          # Format-specific public API
│   │   │   │   ├── generator.ts      # Bracket generation
│   │   │   │   ├── seeding.ts        # Seeding algorithm
│   │   │   │   ├── byes.ts           # BYE calculation
│   │   │   │   ├── advancement.ts    # Winner advancement logic
│   │   │   │   └── cascade.ts        # Undo cascade logic
│   │   │   └── (future formats)
│   │   │       ├── round-robin/      # v1.2
│   │   │       ├── repechage/        # v1.1
│   │   │       └── group-stage/      # v1.3
│   │   ├── __tests__/                # Unit tests
│   │   │   └── single-elimination/
│   │   ├── package.json              # Zero dependencies
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts            # Build configuration
│   │   └── README.md                 # Package documentation
│   │
│   ├── types/                        # Shared TypeScript types
│   │   ├── index.ts
│   │   ├── tournament.ts
│   │   ├── category.ts
│   │   ├── competitor.ts
│   │   ├── match.ts
│   │   └── bracket.ts
│   │
│   └── config/                       # Shared configuration
│       ├── tsconfig.base.json
│       └── package.json
│
├── docs/                             # Documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── AI_RULES.md
│
├── package.json                      # Workspace root
└── .gitignore
```

---

## 4. Route Structure

### Pages (App Router)

| Route                                         | Component  | Purpose                               | Auth         |
| --------------------------------------------- | ---------- | ------------------------------------- | ------------ |
| `/`                                           | `page.tsx` | Tournament list (homepage)            | Public       |
| `/tournaments/new`                            | `page.tsx` | Create tournament form                | PIN required |
| `/tournaments/[id]`                           | `page.tsx` | Tournament dashboard (categories list)| PIN required |
| `/tournaments/[id]/edit`                      | `page.tsx` | Edit tournament details               | PIN required |
| `/tournaments/[id]/categories/new`            | `page.tsx` | Create category form                  | PIN required |
| `/tournaments/[id]/categories/[catId]`        | `page.tsx` | Category management (competitors)     | PIN required |
| `/tournaments/[id]/categories/[catId]/bracket`| `page.tsx` | Interactive bracket (organizer)       | PIN required |
| `/tournaments/[id]/categories/[catId]/public` | `page.tsx` | Public bracket (read-only)            | None         |

### API Routes

| Endpoint                                                            | Method | Purpose                |
| ------------------------------------------------------------------- | ------ | ---------------------- |
| `/api/tournaments`                                                  | GET    | List all tournaments   |
| `/api/tournaments`                                                  | POST   | Create tournament      |
| `/api/tournaments/[id]`                                             | GET    | Get tournament details |
| `/api/tournaments/[id]`                                             | PUT    | Update tournament      |
| `/api/tournaments/[id]`                                             | DELETE | Delete tournament      |
| `/api/tournaments/[id]/categories`                                   | GET    | List categories        |
| `/api/tournaments/[id]/categories`                                   | POST   | Create category        |
| `/api/tournaments/[id]/categories/[catId]`                           | GET    | Get category details   |
| `/api/tournaments/[id]/categories/[catId]`                           | PUT    | Update category        |
| `/api/tournaments/[id]/categories/[catId]`                           | DELETE | Delete category        |
| `/api/tournaments/[id]/categories/[catId]/competitors`               | GET    | List competitors       |
| `/api/tournaments/[id]/categories/[catId]/competitors`               | POST   | Add competitor         |
| `/api/tournaments/[id]/categories/[catId]/competitors/[compId]`      | PUT    | Edit competitor        |
| `/api/tournaments/[id]/categories/[catId]/competitors/[compId]`      | DELETE | Remove competitor      |
| `/api/tournaments/[id]/categories/[catId]/competitors/bulk`          | POST   | Bulk add competitors   |
| `/api/tournaments/[id]/categories/[catId]/bracket`                   | POST   | Generate bracket       |
| `/api/tournaments/[id]/categories/[catId]/bracket`                   | DELETE | Reset bracket          |
| `/api/tournaments/[id]/categories/[catId]/matches/[matchId]/resolve` | POST   | Select match winner    |
| `/api/tournaments/[id]/categories/[catId]/public`                    | GET    | Public bracket data    |
| `/api/pin/verify`                                                   | POST   | Verify tournament PIN  |

---

## 5. Component Hierarchy

```
RootLayout
├── GlobalStyles
├── TooltipProvider
└── Page
    │
    ├── [Public Pages]
    │   ├── TournamentListPage
    │   │   └── TournamentCard[]
    │   │
    │   └── PublicBracketPage
    │       ├── TournamentHeader
    │       ├── CategorySelector
    │       └── BracketView (read-only)
    │
    ├── [Authenticated Pages - PIN Required]
    │   ├── TournamentDashboardPage
    │   │   ├── TournamentHeader
    │   │   ├── CategoryList
    │   │   │   └── CategoryCard[]
    │   │   └── CreateCategoryForm
    │   │
    │   ├── CategoryManagementPage
    │   │   ├── CategoryHeader
    │   │   ├── CompetitorTable
    │   │   │   └── CompetitorRow[]
    │   │   ├── AddCompetitorForm
    │   │   ├── BulkAddDialog
    │   │   ├── DrawTypeSelector (Random / Manual toggle)
    │   │   ├── RandomDrawCard (Fisher-Yates shuffle, re-draw with confirmation)
    │   │   ├── ManualDrawCard (drag & drop slot placement)
    │   │   ├── BracketPreview (shows BYE count before generation)
    │   │   └── GenerateBracketButton
    │   │
    │   └── BracketPage (routing + loading only)
    │       └── BracketContainer (data orchestration)
    │           ├── useBracketData hook
    │           ├── useBracketActions hook
    │           ├── BracketHeader (generic, composable)
    │           ├── BracketView (interactive)
    │           │   ├── BracketRound[] (column per round)
    │           │   │   └── BracketMatch[]
    │           │   │       ├── MatchSlot (competitor A or BYE)
    │           │   │       ├── MatchSlot (competitor B or BYE)
    │           │   │       └── MatchConnector (line to next round)
    │           │   └── ChampionDisplay
    │           └── BracketActions (composable, injected per view mode)
    │
    └── [Shared Components]
        ├── PinDialog (modal for PIN entry)
        ├── ConfirmDialog (generic confirmation)
        ├── LoadingSpinner
        ├── EmptyState
        └── Toast (success/error notifications)
```

---

## 6. Bracket UI Architecture (Sprint 1)

### 6.1 Container/Presentation Pattern

The BracketPage follows a strict separation of concerns:

```
BracketPage (routing + loading)
    ↓
BracketContainer (data orchestration)
    ↓
Hooks (useBracketData, useBracketActions)
    ↓
Presentation Components (pure, composable)
```

**BracketPage** responsibilities:
- Route parameters extraction (`tournamentId`, `categoryId`)
- Loading states and error boundaries
- Server-side data fetching (initial bracket load)
- Renders `BracketContainer` with required props

**BracketContainer** responsibilities:
- Data orchestration via hooks
- State management (selected match, optimistic updates)
- Real-time subscription setup
- Action handlers (generate, resolve, undo, share)
- Renders presentation components with props + callbacks

### 6.2 Presentation Components

#### BracketHeader (Generic, Composable)

A flexible header component that accepts composable slots:

```typescript
interface BracketHeaderProps {
  tournamentName: string
  categoryName: string
  // Composable slots (all optional)
  status?: React.ReactNode      // Category status badge
  currentRound?: React.ReactNode // Round indicator
  liveIndicator?: React.ReactNode // Live/realtime indicator
  tatami?: string               // Tatami/court assignment
  actions?: React.ReactNode     // Header actions (export, share)
}
```

#### BracketToolbar (Pure Presentation)

A toolbar that emits events, never executes actions:

```typescript
interface BracketToolbarProps {
  // State
  canGenerate: boolean
  canUndo: boolean
  canShare: boolean
  isLive: boolean
  // Event handlers (all callbacks)
  onGenerateRequested: () => void
  onUndoRequested: () => void
  onShareRequested: () => void
  onExportRequested?: () => void
}
```

**Key principle**: The toolbar never calls APIs or modifies state directly. It only signals intent via callbacks.

### 6.3 Composable Actions Architecture

Instead of a global `readOnly` mode, actions are injected per view context:

```typescript
// Actions are React nodes that can be composed/omitted
interface BracketActionsProps {
  primary?: React.ReactNode    // Main action (e.g., Select Winner)
  secondary?: React.ReactNode  // Secondary actions (e.g., Share, Export)
  danger?: React.ReactNode     // Destructive actions (e.g., Reset)
}

// View modes compose different action sets
const organizerActions = {
  primary: <SelectWinnerButton />,
  secondary: <><ShareButton /><ExportButton /></>,
  danger: <ResetButton />
}

const publicViewerActions = {
  // No actions - view only
}
```

**Benefits**:
- No global readOnly state to manage
- Actions are explicit per view context
- Easy to add/remove actions without conditional logic
- Testable in isolation

### 6.4 Sprint 1 Scope (Winner Selection)

For Sprint 1, winner selection remains simple:

- Click match → Inline winner selection (two buttons)
- No slide-over panel
- No score tracking
- No penalties
- No judge details

**Removed from Sprint 1**:
- `MatchDetailPanel` (slide-over component)
- Score input fields
- Penalty tracking
- Judge assignment UI

**Future sprints** will add:
- `MatchDetailPanel` with full scoring UI
- Penalty and judge integration
- Detailed match statistics

### 6.5 Component Implementation Notes

#### BracketView

The bracket visualization renders matches in a CSS Grid layout:

```
┌─────────────────────────────────────────────────────┐
│ Round 1        │ Quarterfinals │ Semifinals │ Final │
├────────────────┼───────────────┼────────────┼───────┤
│ Match 1        │               │            │       │
│ ├─ Slot A      │               │            │       │
│ └─ Slot B      │               │            │       │
│                ├───────────────┤            │       │
│ Match 2        │               │            │       │
│ ├─ Slot A      │               │            │       │
│ └─ Slot B      │               │            │       │
│                │               ├────────────┤       │
│ ...            │ ...           │ ...        │       │
│                │               │            ├───────┤
│                │               │            │Champion│
└────────────────┴───────────────┴────────────┴───────┘
```

Each `BracketMatch` component:
- Displays competitor slots (A and B)
- Shows BYE indicators
- Highlights the winner
- Emits `onMatchClick` for organizer interaction

---

## 7. State Management Strategy

### Server State (Source of Truth)

- **PostgreSQL via Supabase** — all data lives in the database
- **Server Components** fetch data directly via Supabase server client
- **Route Handlers** handle mutations (POST, PUT, DELETE)

### Client State (Minimal)

| State               | Location         | Mechanism                                                 |
| ------------------- | ---------------- | --------------------------------------------------------- |
| Current tournament  | Server Component | Fetched in layout, passed as props                        |
| Competitor list     | Server Component | Fetched in page, passed to Client Components              |
| Bracket data        | Client Component | Supabase Realtime subscription + initial server fetch     |
| Match selection UI  | Client Component | `useState` in `BracketPage` (which match is selected)     |
| PIN verification    | Client Component | `useState` in `PinDialog` (modal open/close, entered PIN) |
| Toast notifications | Client Context   | React Context with `useState` (success/error messages)    |

### Real-time State

- **Supabase Realtime** on the `matches` table
- Client subscribes to `postgres_changes` events filtered by `categoryId`
- When a match is updated (winner selected), all connected clients receive the event
- Client updates the bracket state optimistically, then confirms with server data

---

## 7. Data Models

### Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│    Tournament     │       │     Category      │
├──────────────────┤       ├──────────────────┤
│ id: UUID (PK)    │──1:N──│ id: UUID (PK)    │
│ name: text        │       │ tournamentId: UUID│
│ date: timestamptz │       │ name: text        │
│ organization: text│       │ status: enum      │
│ edit_pin: text    │       │ bracketSize: int  │
│ created_at        │       │ drawType: enum    │
│ updated_at        │       │ totalRounds: int  │
└──────────────────┘       │ slug: text (unique)│
                           │ created_at         │
                           │ updated_at         │
                           └────────┬───────────┘
                                    │
                           ┌────────┴───────────┐
                           │                     │
                  ┌────────┴──────────┐  ┌───────┴────────┐
                  │    Competitor      │  │     Match       │
                  ├──────────────────┤  ├────────────────┤
                  │ id: UUID (PK)    │  │ id: UUID (PK)  │
                  │ categoryId: UUID  │  │ categoryId: UUID│
                  │ name: text        │  │ round: int      │
                  │ club: text        │  │ position: int   │
                  │ seed: int (null)  │  │ competitorA: UUID│
                  │ createdAt         │  │ competitorB: UUID│
                  └──────────────────┘  │ winner: UUID (null)│
                                        │ isBye: boolean   │
                                        │ nextMatchId: UUID │
                                        │ nextSlot: A|B     │
                                        │ resolvedAt: tstamp│
                                        │ createdAt         │
                                        │ updatedAt         │
                                        └──────────────────┘
```

### Detailed Table Definitions

#### Tournament

| Column       | Type        | Constraints                     | Notes                              |
| ------------ | ----------- | ------------------------------- | ---------------------------------- |
| `id`         | UUID        | PK, default `gen_random_uuid()` |                                    |
| `name`       | TEXT        | NOT NULL                        | Tournament name                    |
| `date`       | DATE        | NOT NULL                        | Tournament date                    |
| `organization` | TEXT        | NULLABLE                        | Organization name                |
| `edit_pin`   | TEXT        | NOT NULL                        | 4-6 digit PIN for organizer access |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()`                 |                                    |
| `updated_at` | TIMESTAMPTZ | DEFAULT `now()`                 |                                    |

#### Category

| Column          | Type        | Constraints                        | Notes                                            |
| --------------- | ----------- | ---------------------------------- | ------------------------------------------------ |
| `id`            | UUID        | PK                                 |                                                  |
| `tournament_id` | UUID        | FK → Tournament, ON DELETE CASCADE |                                                  |
| `name`          | TEXT        | NOT NULL                           | Category name                                    |
| `status`        | ENUM        | NOT NULL, DEFAULT `SETUP`          | `SETUP`, `IN_PROGRESS`, `COMPLETED`              |
| `bracket_size`  | INT         | NULLABLE                           | Computed: smallest power of 2 ≥ competitor count |
| `draw_type`     | ENUM        | NULLABLE                           | `RANDOM`, `MANUAL`                               |
| `total_rounds`  | INT         | NULLABLE                           | Computed: log2(bracketSize)                      |
| `slug`          | TEXT        | UNIQUE, NOT NULL                   | URL-safe identifier for public view              |
| `created_at`    | TIMESTAMPTZ | DEFAULT `now()`                    |                                                  |
| `updated_at`    | TIMESTAMPTZ | DEFAULT `now()`                    |                                                  |

#### Competitor

| Column        | Type        | Constraints                      | Notes                |
| ------------- | ----------- | -------------------------------- | -------------------- |
| `id`          | UUID        | PK                               |                      |
| `category_id` | UUID        | FK → Category, ON DELETE CASCADE |                      |
| `name`        | TEXT        | NOT NULL                         | Competitor full name |
| `club`        | TEXT        | NOT NULL                         | Club/dojo name       |
| `seed`        | INT         | NULLABLE                         | Manual seed (1-N)    |
| `created_at`  | TIMESTAMPTZ | DEFAULT `now()`                  |                      |

**Constraints:**

- Unique constraint on `(category_id, name)` — no duplicate names within a category
- Check constraint: `seed > 0 AND seed <= 128`

#### Match

| Column            | Type        | Constraints                      | Notes                                     |
| ----------------- | ----------- | -------------------------------- | ----------------------------------------- |
| `id`              | UUID        | PK                               |                                           |
| `category_id`     | UUID        | FK → Category, ON DELETE CASCADE |                                           |
| `round`           | INT         | NOT NULL                         | 1 = first round, 2 = quarterfinals, etc.  |
| `position`        | INT         | NOT NULL                         | Position within the round (0-indexed)     |
| `competitor_a_id` | UUID        | FK → Competitor, NULLABLE        | NULL = BYE slot or empty                  |
| `competitor_b_id` | UUID        | FK → Competitor, NULLABLE        | NULL = BYE slot or empty                  |
| `winner_id`       | UUID        | FK → Competitor, NULLABLE        | NULL = unresolved                         |
| `is_bye`          | BOOLEAN     | NOT NULL, DEFAULT FALSE          | TRUE if this match is an auto-resolve BYE |
| `next_match_id`   | UUID        | FK → Match, NULLABLE             | NULL for Final match                      |
| `next_slot`       | ENUM        | NULLABLE                         | `A` or `B` — which slot in the next match |
| `resolved_at`     | TIMESTAMPTZ | NULLABLE                         | When winner was selected                  |
| `created_at`      | TIMESTAMPTZ | DEFAULT `now()`                  |                                           |
| `updated_at`      | TIMESTAMPTZ | DEFAULT `now()`                  |                                           |

**Constraints:**

- Unique constraint on `(category_id, round, position)` — one match per position per round
- Check constraint: `round > 0 AND position >= 0`

---

## 8. TypeScript Types

### Application Types (`packages/types`)

```typescript
// tournament.ts
export interface Tournament {
  id: string;
  name: string;
  date: string;
  organization: string | null;
  tournamentType: 'kata' | 'kumite';
  editPin: string;
  createdAt: string;
  updatedAt: string;
}

// category.ts
export type CategoryStatus = 'SETUP' | 'IN_PROGRESS' | 'COMPLETED';
export type DrawType = 'RANDOM' | 'MANUAL';
export type Gender = 'male' | 'female';
export type AgeGroup = 'under-12' | '12-14' | '15-17' | '18-34' | '35-44' | '45-54' | '55-64' | '65-plus';
export type BeltLevel = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black' | 'all';

export interface Category {
  id: string;
  tournamentId: string;
  name: string;
  status: CategoryStatus;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  beltLevel: BeltLevel | null;
  bracketSize: number | null;
  drawType: DrawType | null;
  totalRounds: number | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// competitor.ts
export interface Competitor {
  id: string;
  categoryId: string;
  name: string;
  club: string;
  seed: number | null;
  createdAt: string;
}

// match.ts
export type MatchSlot = 'A' | 'B';

export interface Match {
  id: string;
  categoryId: string;
  round: number;
  position: number;
  competitorAId: string | null;
  competitorBId: string | null;
  winnerId: string | null;
  isBye: boolean;
  nextMatchId: string | null;
  nextSlot: MatchSlot | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// bracket.ts — API response types
export interface BracketData {
  category: Category;
  competitors: Competitor[];
  matches: Match[];
}

export interface BracketPreview {
  competitorCount: number;
  bracketSize: number;
  byeCount: number;
  totalRounds: number;
  seededByes: number[];
}
```

### Standalone Engine Types (`packages/bracket-engine/src/types.ts`)

These types are **completely independent** — they do not import from `packages/types` or any other package:

```typescript
// types.ts — Engine-internal types (STANDALONE)

/**
 * Competitor input for the engine.
 * Plain data — no database IDs, no timestamps, no framework types.
 */
export interface EngineCompetitor {
  id: string;
  name: string;
  seed: number | null;
}

/**
 * Match within the bracket.
 * Plain data — serializable to JSON.
 */
export interface EngineMatch {
  id: string;
  round: number;
  position: number;
  competitorA: EngineCompetitor | null;
  competitorB: EngineCompetitor | null;
  winner: EngineCompetitor | null;
  isBye: boolean;
  nextMatchId: string | null;
  nextSlot: 'A' | 'B' | null;
}

/**
 * Complete bracket structure.
 * Plain data — can be sent over JSON, stored in any database, rendered by any UI.
 */
export interface EngineBracket {
  size: number;
  totalRounds: number;
  matches: EngineMatch[];
}

/**
 * Draw type for bracket generation.
 */
export type DrawType = 'random' | 'manual';

/**
 * Result of bracket generation.
 */
export interface GenerationResult {
  bracket: EngineBracket;
  byes: { competitorId: string; position: number }[];
}

/**
 * Bracket preview information.
 */
export interface BracketPreview {
  competitorCount: number;
  bracketSize: number;
  byeCount: number;
  totalRounds: number;
  seededByes: number[];
}
```

---

## 9. Business Logic Separation

### Principle: Zero Framework Dependencies in Business Logic

The bracket engine (`packages/bracket-engine`) must:

- Have ZERO npm dependencies (no `dependencies` in package.json)
- NOT import from `next/*`, `react`, `supabase`, or any database library
- NOT use Node.js built-ins (no `fs`, `path`, `crypto`, `http`)
- NOT have side effects (no file I/O, no network calls, no database queries)
- Be a collection of **pure functions** — input in, output out
- Work in any JavaScript runtime (browser, Node.js, Deno, Cloudflare Workers)

### Where Each Responsibility Lives

| Responsibility               | Location                                               | Why                                                                             |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Bracket generation algorithm | `bracket-engine/src/single-elimination/generator.ts`   | Pure function. Takes competitor list → returns bracket structure.               |
| BYE calculation              | `bracket-engine/src/single-elimination/byes.ts`        | Pure function. Takes competitor count + seeds → returns BYE positions.          |
| Seeding algorithm            | `bracket-engine/src/single-elimination/seeding.ts`     | Pure function. Takes bracket size + seed assignments → returns placement array. |
| Winner advancement           | `bracket-engine/src/single-elimination/advancement.ts` | Pure function. Takes bracket + match result → returns updated bracket.          |
| Cascade undo                 | `bracket-engine/src/single-elimination/cascade.ts`     | Pure function. Takes bracket + changed match → returns cleaned bracket.         |
| Database queries             | `apps/web/lib/supabase/`                               | Supabase client queries. Never in components or engine.                         |
| API validation               | `apps/web/app/api/*/route.ts`                          | Request validation before calling engine or database.                           |
| UI rendering                 | `apps/web/components/`                                 | React components. Never contain domain logic.                                   |

### Data Flow for "Generate Bracket"

```
1. User performs a draw (random shuffle or manual placement)
2. App layer converts draw result to Map<number, string> (position → competitorId)
   - Random draw: DrawEntry[] → drawEntriesToPlacements() in lib/draw.ts
   - Manual draw: ManualSlots → manualSlotsToPlacements() in lib/draw.ts
3. App calls useBracketGeneration.generate(placements)
4. Hook calls bracketEngine.generateBracket(engineCompetitors, drawType, placements)
   - When `placements` is provided and non-empty, the engine uses it directly,
     regardless of drawType. The displayed draw order = the generated bracket order.
   - When `placements` is absent, the engine applies its own logic:
     drawType='random' → internal shuffle + seeded placement
     drawType='manual' (no placements) → standard seeding
5. Engine returns GenerationResult { bracket, byes }
6. BracketView renders the bracket from engine output
```

### The Transformation Boundary

The route handler acts as a **translation layer** between the database world and the engine world:

```
Database World                    Engine World
─────────────────────────────────────────────────
Competitor {                      EngineCompetitor {
  id: UUID,                         id: string,
  categoryId: UUID,                  name: string,
  name: string,                      seed: number | null
  club: string,                    }
  seed: number | null,
  createdAt: TIMESTAMPTZ          }
}           ──── transform ────>

Engine World                      Database World
─────────────────────────────────────────────────
EngineMatch {                     Match {
  id: string,                       id: UUID,
  round: number,                    categoryId: UUID,
  position: number,                 round: number,
  competitorA: EngineCompetitor,    position: number,
  competitorB: EngineCompetitor,    competitorAId: UUID | null,
  winner: EngineCompetitor | null,  competitorBId: UUID | null,
  isBye: boolean,                   winnerId: UUID | null,
  nextMatchId: string | null,       isBye: boolean,
  nextSlot: 'A' | 'B' | null       nextMatchId: UUID | null,
}                                   nextSlot: MatchSlot | null,
                                    resolvedAt: TIMESTAMPTZ | null,
                                    createdAt: TIMESTAMPTZ,
                                    updatedAt: TIMESTAMPTZ
                                  }
}
```

---

## 10. Bracket Engine Architecture

### Package API

```typescript
// Public API — what consumers import

/**
 * Generate a bracket from a competitor list.
 *
 * When `manualPlacements` is provided and non-empty, it takes priority
 * over `drawType` — the engine places competitors at the specified
 * positions regardless of whether drawType is 'random' or 'manual'.
 * This allows the app layer to provide pre-shuffled orders (random draw)
 * or user-chosen positions (manual draw) that the engine respects exactly.
 */
export function generateBracket(
  competitors: EngineCompetitor[],
  drawType: DrawType,
  manualPlacements?: Map<number, string>,
): GenerationResult;

export function resolveMatch(
  bracket: EngineBracket,
  matchId: string,
  winnerId: string,
): EngineBracket;

export function cascadeUndo(bracket: EngineBracket, changedMatchId: string): EngineBracket;

export function getBracketPreview(
  competitorCount: number,
  seeds: (number | null)[],
): BracketPreview;

export function isBracketComplete(bracket: EngineBracket): boolean;

export function getChampion(bracket: EngineBracket): EngineCompetitor | null;

/** General-purpose Fisher-Yates shuffle. Used by app layer for draw operations. */
export function shuffleArray<T>(array: readonly T[]): T[];
```

### Internal Module Structure

```
packages/bracket-engine/
├── src/
│   ├── index.ts                    # Re-exports public API
│   ├── types.ts                    # Engine domain types (STANDALONE)
│   ├── utils.ts                    # Pure helpers (nextPowerOf2, shuffleArray, etc.)
│   ├── single-elimination/
│   │   ├── index.ts                # Single elimination public API
│   │   ├── generator.ts            # generateBracket()
│   │   ├── seeding.ts              # Standard tournament seeding algorithm
│   │   ├── byes.ts                 # BYE calculation and placement
│   │   ├── advancement.ts          # resolveMatch() — winner → next slot
│   │   ├── cascade.ts              # cascadeUndo() — clean dependent matches
│   │   └── cascade-utils.ts        # cascadeForward() — shared cascade helper
│   └── (future formats — v1.1+)
│       ├── round-robin/
│       ├── repechage/
│       └── group-stage/
├── __tests__/
│   └── single-elimination/
│       ├── generator.test.ts
│       ├── seeding.test.ts
│       ├── byes.test.ts
│       ├── advancement.test.ts
│       └── cascade.test.ts
├── package.json                    # Zero dependencies
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

### Engine package.json Requirements

```json
{
  "name": "@jadval/bracket-engine",
  "version": "1.0.0",
  "description": "Pure TypeScript bracket engine for tournament formats",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsup": "^8.0.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=18"
  },
  "license": "MIT"
}
```

### Why This Engine Design

**Alternatives Considered:**

| Alternative                         | Why Rejected                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Class-based engine**              | Stateful classes add complexity. Operations are stateless — bracket in, bracket out. Functions are simpler. |
| **Plugin system for formats**       | Abstract plugin registry is premature. We know the formats. Directory-per-format is simpler.                |
| **Engine depends on shared types**  | Violates publishability requirement. Engine types must be self-contained for independent npm publishing.    |
| **Engine exports React components** | Couples UI to business logic. Engine must be usable without React.                                          |

**Why this is best:**

- **Zero dependencies** — can be published to npm, used anywhere
- **Self-contained types** — no imports from other packages
- **Pure functions** — testable without mocking anything
- **JSON-serializable** — all inputs and outputs can be sent over the wire
- **Runtime agnostic** — works in browser, Node.js, Deno, edge runtimes

### Future Format Extension Pattern

When adding a new tournament format:

1. Create a new directory under `src/` (e.g., `src/round-robin/`)
2. Implement the format-specific logic (generate, resolve, etc.)
3. Export from `src/index.ts`
4. No existing code changes — Single Elimination code is untouched

This follows the **Open/Closed Principle** — open for extension, closed for modification.

---

## 11. Future Extensibility for New Tournament Formats

### Version Evolution

| Version | Format                 | Engine Addition           | UI Addition                       |
| ------- | ---------------------- | ------------------------- | --------------------------------- |
| 1.0     | Single Elimination     | `src/single-elimination/` | `BracketView` component           |
| 1.1     | Repechage              | `src/repechage/`          | Additional bracket panels         |
| 1.2     | Round Robin            | `src/round-robin/`        | `RoundRobinTable` component       |
| 1.3     | Group Stage + Knockout | `src/group-stage/`        | `GroupTableView` + combined view  |
| 2.0     | Kumite                 | Score tracking logic      | Score input UI, timer integration |

### Extensibility Contracts

Every tournament format engine must implement:

```typescript
// Conceptual contract — not actual code
interface TournamentFormat {
  generate(competitors, options): GenerationResult;
  resolve(bracket, matchId, winnerId): EngineBracket;
  getPreview(competitorCount): BracketPreview;
  isComplete(bracket): boolean;
  getChampion(bracket): EngineCompetitor | null;
}
```

### Database Extensibility

The `Category` table has a `format` field (future) that determines which engine to use. The `Match` table is generic enough to represent any format's matches.

---

## 12. Suggested Libraries

### Required for MVP

| Library                   | Version | Purpose              | Why Necessary                    |
| ------------------------- | ------- | -------------------- | -------------------------------- |
| **next**                  | 14+     | Framework            | Core application framework       |
| **react** / **react-dom** | 18+     | UI library           | Required by Next.js              |
| **@supabase/supabase-js** | 2.x     | Database client      | Official Supabase client         |
| **@supabase/ssr**         | latest  | Server-side Supabase | Cookie-based auth for App Router |
| **tailwindcss**           | 3.x     | Styling              | Rapid development, RTL support   |
| **zod**                   | 3.x     | Request validation   | Type-safe API input validation   |
| **lucide-react**          | latest  | Icons                | Lightweight, tree-shakeable      |
| **typescript**            | 5.x     | Type safety          | Strict TypeScript throughout     |
| **vitest**                | 1.x     | Testing              | Bracket engine unit tests        |
| **tsup**                  | 8.x     | Build tool           | Build bracket engine for npm     |

### Engine devDependencies Only

The bracket engine's `devDependencies` are:

- `typescript` — type checking
- `tsup` — build for ESM + CJS
- `vitest` — unit testing

No runtime dependencies.

---

## 13. Error Handling Strategy

### Layered Error Handling

#### Database Layer

- Supabase client throws on connection failures, constraint violations
- Route handlers catch database errors and translate to HTTP responses

#### API Layer (Route Handlers)

```
1. Parse and validate request (zod schema)
   → Invalid: 400 Bad Request
2. Verify PIN (if mutating operation)
   → Invalid: 401 Unauthorized
3. Fetch required data from database
   → Not found: 404 Not Found
4. Execute business logic (bracket engine)
   → Invalid state: 409 Conflict
5. Persist results to database
   → Database error: 500 Internal Server Error
6. Return success response
```

#### Business Logic Layer (Bracket Engine)

- Engine functions throw descriptive errors for invalid states
- Errors are typed (custom error classes or discriminated unions)
- Engine never catches its own errors — callers decide how to handle them

#### Client Layer (React)

- API errors displayed via Toast notifications
- Optimistic updates rolled back on failure
- Loading states prevent duplicate submissions

### Error Types

| Error                    | HTTP Status | Client Behavior          |
| ------------------------ | ----------- | ------------------------ |
| Validation error         | 400         | Show field-level errors  |
| PIN required / invalid   | 401         | Show PIN dialog          |
| Resource not found       | 404         | Show "not found" page    |
| Conflict (invalid state) | 409         | Show explanation message |
| Server error             | 500         | Show generic error toast |

---

## 14. Project Conventions

### Naming Conventions

| Item                    | Convention        | Example                           |
| ----------------------- | ----------------- | --------------------------------- |
| Files (components)      | PascalCase        | `BracketView.tsx`                 |
| Files (utilities/hooks) | camelCase         | `useBracketData.ts`               |
| Files (API routes)      | `route.ts`        | `app/api/tournaments/route.ts`    |
| Database tables         | snake_case        | `competitor`, `category`, `match` |
| TypeScript interfaces   | PascalCase        | `Tournament`, `BracketData`       |
| API routes              | kebab-case in URL | `/api/tournaments/[id]/bracket`   |

### File Conventions

| Rule                   | Detail                                                   |
| ---------------------- | -------------------------------------------------------- |
| One component per file | `BracketView.tsx` exports `BracketView` only             |
| Exports at top of file | Named exports, no default exports (except Next.js pages) |
| Imports ordered        | 1. External libs, 2. Internal packages, 3. Local modules |
| Max file length        | ~200 lines. If longer, extract.                          |
| No barrel exports      | Only `index.ts` at package root                          |

### Component Conventions

| Rule                            | Detail                                                               |
| ------------------------------- | -------------------------------------------------------------------- |
| Server Components by default    | Only add `"use client"` when interactivity needed                    |
| Props interface above component | `interface Props { ... }` then `export function Foo({ ... }: Props)` |
| Destructure props               | `function Foo({ bar, baz }: Props)`                                  |
| Early returns                   | Handle empty state before main render                                |

### API Conventions

| Rule                             | Detail                                                     |
| -------------------------------- | ---------------------------------------------------------- |
| Consistent response shape        | `{ data: T }` for success, `{ error: string }` for failure |
| Validate before processing       | Zod schema at route handler entry                          |
| Return created/updated resources | POST returns created, PUT returns updated                  |
| Use HTTP status codes correctly  | 201 created, 200 success, 400/401/404/409 errors           |

---

## 15. Architecture Decision Summary

| Decision                  | Choice                                      | Confidence |
| ------------------------- | ------------------------------------------- | ---------- |
| Application framework     | Next.js 14+ App Router                      | High       |
| Database + Realtime       | Supabase (PostgreSQL)                       | High       |
| Styling                   | Tailwind CSS                                | High       |
| Business logic separation | Standalone `bracket-engine` package         | Critical   |
| Engine independence       | Zero dependencies, npm-publishable          | Critical   |
| Engine types              | Self-contained, no external imports         | Critical   |
| State management          | Server Components + useState                | High       |
| Type validation           | Zod for API inputs, TypeScript strict       | High       |
| Error handling            | Layered (route handler catches, translates) | High       |
| Bracket rendering         | Custom CSS Grid component                   | Medium     |
| Authentication            | PIN-based (MVP), Supabase Auth (v2)         | High       |
| Bracket UI pattern        | Container/Presentation                      | High       |
| Actions architecture      | Composable (injected per view)              | High       |

---

## 16. Feature-based Organization (Recommendation)

### Current Structure (Recommended for Sprint 1)

```
apps/web/
├── components/
│   ├── ui/           # Generic primitives
│   ├── tournament/   # Tournament-specific
│   ├── category/     # Category-specific
│   ├── bracket/      # Bracket visualization
│   └── shared/       # Cross-cutting
├── hooks/
├── lib/
└── app/              # Next.js App Router
```

### Alternative: Feature-based Structure

```
apps/web/
├── features/
│   ├── tournament/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   ├── bracket/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   └── shared/
├── lib/
└── app/
```

### Recommendation: Postpone Feature-based Organization

**Rationale**:

| Factor | Current Structure | Feature-based |
|--------|-------------------|---------------|
| **Sprint 1 fit** | ✅ Appropriate | ⚠️ Overhead |
| **Team size** | ✅ Small team | ⚠️ Better for larger teams |
| **Complexity** | ✅ Lower | ⚠️ Higher |
| **Cross-feature reuse** | ⚠️ Requires discipline | ✅ Explicit boundaries |
| **Scalability** | ⚠️ Needs refactoring later | ✅ Ready for growth |

**Tradeoffs**:

**Keep current structure (Recommended)**:
- ✅ Lower cognitive load for Sprint 1
- ✅ Faster initial development
- ✅ Simpler imports and navigation
- ⚠️ May need refactoring when adding v1.1 features
- ⚠️ Requires discipline to keep features separated

**Switch to feature-based now**:
- ✅ Clear feature boundaries from day one
- ✅ Easier to add new features without touching existing code
- ✅ Better test organization (co-located tests)
- ⚠️ More directories to navigate
- ⚠️ May be premature optimization for single-developer MVP
- ⚠️ Adds structural complexity before product complexity

**Decision**: Postpone feature-based organization until v1.1 (Repechage). By then:
- We'll have real experience with feature boundaries
- The cost of refactoring will be justified by multiple features
- Team size may justify the organizational overhead

**Migration trigger**: When adding the second tournament format (Repechage in v1.1), evaluate if feature-based organization provides clear benefits. If yes, migrate then.

---

**End of Architecture Document.**
