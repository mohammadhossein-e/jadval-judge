# System Architecture — Tournament Management Platform

## Jadval

> This document describes the long-term product architecture of Jadval. It defines what the platform is, how it is organized, and the principles that guide its evolution. Implementation details, technology choices, and version-specific roadmaps belong in ARCHITECTURE.md and ROADMAP.md respectively. This document should remain stable even as implementations change.

---

## Product Vision

Jadval is a tournament management platform for combat sports. It serves as the central nervous system for karate tournaments — from registration through scheduling, bracket generation, live scoring, and results publication.

The platform replaces spreadsheets, paper brackets, and ad-hoc tools with a unified system that serves every stakeholder: organizers, judges, competitors, teams, and spectators.

### Who It Serves

| Stakeholder | Need |
|---|---|
| **Tournament Organizer** | Create, configure, and run tournaments with minimal friction |
| **Judge / Referee** | Score matches accurately with real-time feedback |
| **Competitor / Athlete** | View brackets, results, and schedules |
| **Team Manager** | Register athletes, track team performance |
| **Spectator / Public** | Follow live brackets and results |
| **Federation / Governing Body** | Aggregate data across tournaments for rankings and analytics |

### What Makes It Different

- **Real-time everywhere** — All views update live as matches resolve
- **Multi-format support** — Single elimination, repechage, round robin, group stage, kumite
- **Judge scoring integration** — Digital scorecards with real-time tabulation
- **Public-facing displays** — Arena screens, public brackets, live leaderboards
- **API-first** — Every capability accessible via API for third-party integrations
- **Offline-capable** — Core scoring functions work without internet connectivity

---

## Core Product Principles

### Platform First

Every feature is designed as a platform capability, not an application feature. Modules expose services that any application — web, mobile, or third-party — can consume. No capability is locked to a single interface.

### Modular by Design

The system is decomposed into modules with explicit boundaries. Each module owns its data, exposes a public API, and communicates with others through events. Modules can be developed, tested, deployed, and scaled independently.

### One Source of Truth

Every piece of data has exactly one owner. Bracket logic lives in the Bracket Engine. Competitor data lives in the Competitor Registry. No module duplicates another module's responsibilities. When modules need data they do not own, they request it through the owning module's API.

### No Duplicate Business Logic

Business rules are defined once, in the module responsible for that domain. The same seeding algorithm is not reimplemented in the UI. The same validation rules are not duplicated across forms and API handlers. Changes to business logic propagate automatically through the single implementation.

### Keep Business Logic Independent from UI

The Bracket Engine and all core modules are decoupled from any user interface. Business logic must be executable without a browser, without a DOM, without rendering frameworks. This independence enables testing, reuse across applications, and long-term maintainability.

### Incremental Releases

The platform evolves through additive, non-breaking increments. Each release adds capability without destabilizing what exists. New tournament formats, new applications, and new integrations are added alongside the existing system, not instead of it.

### Production-Ready at Every Release

Every release is deployable and usable. There are no "beta" features that degrade the production experience. Incomplete features are behind capability flags, not shipped as broken functionality. The system maintains backward compatibility at every step.

### Simplicity Before Complexity

A simple bracket that works is better than a complex system that doesn't. Every feature must justify its complexity. The platform should be operable by a tournament organizer with minimal technical knowledge. When in doubt, choose the simpler approach and add complexity only when the simpler approach proves insufficient.

---

## High-Level Architecture

### Platform Decomposition

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Applications                               │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Admin   │ │  Judge   │ │ Display  │ │ Public   │ │   API    │  │
│  │  Panel   │ │ Scoring  │ │  Screens │ │  Portal  │ │ Gateway  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │            │            │          │
├───────┴────────────┴────────────┴────────────┴────────────┴──────────┤
│                        Shared Services                               │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │    Auth     │ │ Real-time   │ │  Scoring    │ │   Analytics  │  │
│  │  & Access   │ │  Engine     │ │  Engine     │ │   & Reports  │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬───────┘  │
│         │               │               │               │           │
├─────────┴───────────────┴───────────────┴───────────────┴───────────┤
│                          Core Modules                                │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Tournament│ │Bracket   │ │Schedule  │ │Competitor│ │Results & │  │
│  │ Registry │ │ Engine   │ │ Planner  │ │ Registry │ │ Rankings │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          Data Layer                                  │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │   Primary    │ │    Cache     │ │   Object     │                │
│  │   Database   │ │    Layer     │ │   Storage    │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### Architectural Style

The platform follows a **modular architecture** with well-defined module boundaries. Modules communicate through internal APIs and events, not through shared database tables. This enables:

- Independent evolution of each module
- Clear ownership boundaries
- Future extraction into services if scaling demands it
- Testable modules in isolation

---

## Core Modules

### Tournament Registry

Manages the lifecycle of tournaments and their organizational structure.

**Responsibilities:**
- Tournament creation, configuration, and metadata
- Category definition (age groups, weight classes, belt levels, gender)
- Tournament status workflow (draft → registration → seeding → in-progress → completed)
- Multi-day tournament scheduling
- Organization and federation management

**Key Concepts:**
- Tournament — A single event (e.g., "Spring Open 2026")
- Category — A competition bracket within a tournament (e.g., "Male Kata Under 12")
- Organization — The entity running the tournament
- Federation — The governing body oversight

### Bracket Engine

The mathematical core of the platform. Generates and manages competition brackets across all supported formats.

**Responsibilities:**
- Bracket generation from competitor lists
- Format-specific logic (single elimination, repechage, round robin, group stage)
- BYE calculation and distribution
- Seeding algorithms (standard, manual, random)
- Match structure and linking
- Winner advancement and progression

**Key Property:**
Pure functions. No database, no network, no side effects. Input in, output out. This module is independently publishable and testable.

**Supported Formats:**

| Format | Use Case |
|---|---|
| Single Elimination | Default for most kata tournaments |
| Repechage | Second-chance bracket for losers |
| Round Robin | Small groups, every competitor faces every other |
| Group Stage + Knockout | Large tournaments with qualification rounds |
| Kumite Scoring | Sparring with point tracking |

### Schedule Planner

Manages the temporal dimension of tournaments — when and where matches happen.

**Responsibilities:**
- Match scheduling across tatami (mats) and time slots
- Conflict detection (same competitor, same time)
- Break and ceremony scheduling
- Live schedule updates when matches run long
- Multi-tatami parallel execution

### Competitor Registry

Manages competitor and team data across tournaments.

**Responsibilities:**
- Individual competitor profiles
- Team/dojo registration
- Cross-tournament competitor history
- Seed calculation from historical results
- Weight class and category eligibility
- Document verification (medical, license)

### Results & Rankings

Aggregates match results into meaningful outcomes.

**Responsibilities:**
- Match result recording and verification
- Podium determination (1st, 2nd, 3rd place)
- Historical results archival
- Points calculation for rankings
- Federation-level rankings aggregation
- Statistical analysis (win rates, scoring patterns)

---

## Shared Services

### Authentication & Access Control

Manages identity, roles, and permissions across the platform.

**Roles:**

| Role | Scope | Capabilities |
|---|---|---|
| Platform Admin | Global | System configuration, user management |
| Federation Admin | Federation | Tournament oversight, rankings |
| Tournament Organizer | Tournament | Full tournament management |
| Judge / Referee | Assigned matches | Scoring, match resolution |
| Team Manager | Registered teams | Registration, athlete management |
| Competitor | Self | Profile, results viewing |
| Spectator | Public | Bracket viewing, results |

**Access Model:**
- Progressive authentication (simple access for early phases, full identity verification at scale)
- Role-based access control (RBAC) with fine-grained permissions
- Data isolation between organizations and federations

### Real-time Engine

Provides live data synchronization across all connected clients.

**Responsibilities:**
- Match state changes propagated to all viewers
- Score updates visible instantly on displays
- Bracket advancement reflected in real-time
- Schedule changes pushed to all devices
- Presence awareness (who is viewing what)

**Channel Topics:**
- Tournament-level events
- Category-level bracket updates
- Match-level score and result updates
- Schedule change notifications
- Tatami-specific updates

### Scoring Engine

Handles the real-time scoring workflow for matches.

**Responsibilities:**
- Digital scorecard management
- Real-time score tabulation
- Round/time management
- Decision (hantei) recording
- Score validation and rules enforcement
- Integration with display screens

### Analytics & Reports

Generates insights from tournament data.

**Responsibilities:**
- Tournament summary reports
- Competitor performance analytics
- Judge performance metrics
- Attendance and participation statistics
- Export to PDF, CSV, and federation formats
- Historical trend analysis

---

## Applications

### Admin Panel

**Purpose:** Tournament configuration and management interface.

**Users:** Tournament organizers, federation administrators

**Capabilities:**
- Tournament creation and configuration
- Category setup and competitor registration
- Draw management (random, manual)
- Bracket generation and monitoring
- Schedule creation and management
- Results verification and publication
- Report generation and export

### Judge Scoring

**Purpose:** Digital scoring interface for tatami-side judges.

**Users:** Judges, referees, timekeepers

**Capabilities:**
- Match assignment and queue
- Real-time score entry
- Round management (start, stop, overtime)
- Decision recording (flags, hantei)
- Match completion and submission
- Offline scoring with sync-on-reconnect

### Display Screens

**Purpose:** Arena and venue display screens for live information.

**Users:** Spectators, competitors, organizers

**Capabilities:**
- Live bracket visualization
- Current match scoreboard
- Upcoming match queue
- Schedule display
- Results and podium announcements
- Sponsor and event branding

### Public Portal

**Purpose:** Web-based public access to tournament information.

**Users:** Spectators, competitors, team managers, media

**Capabilities:**
- Tournament search and discovery
- Live bracket viewing
- Real-time results
- Competitor profiles and history
- Schedule browsing
- Shareable bracket links

### API Gateway

**Purpose:** Programmatic access to all platform capabilities.

**Users:** Third-party integrations, mobile apps, federation systems

**Capabilities:**
- API for all CRUD operations
- Real-time subscriptions for live data
- Webhook support for event notifications
- Rate limiting and authentication
- API key management
- Documentation and SDKs

---

## Data Flow

### Tournament Lifecycle

```
1. CREATION
   Organizer creates tournament → defines categories → opens registration

2. REGISTRATION
   Competitors/teams register → eligibility verified → competitors assigned to categories

3. SEEDING
   Seed rankings calculated → competitors ordered → seed assignments confirmed

4. DRAW
   Random or manual draw → competitors placed into bracket positions

5. GENERATION
   Bracket generated → BYEs calculated → match structure created

6. EXECUTION
   Matches resolved → winners advanced → bracket progresses

7. COMPLETION
   Champion determined → results verified → podium announced

8. ARCHIVAL
   Results published → rankings updated → tournament archived
```

### Match Resolution Flow

```
Judge scores match → Score submitted → Winner determined
    ↓
Bracket engine resolves match → Winner advanced to next slot
    ↓
Real-time engine pushes update → All connected clients see result
    ↓
If final match → Champion declared → Results published
```

### Data Propagation

```
Action                →  Source Module        →  Affected Views
──────────────────────────────────────────────────────────────
Match resolved        →  Bracket Engine       →  Bracket, Schedule, Display
Score updated         →  Scoring Engine       →  Display, Public Portal
Schedule changed      →  Schedule Planner     →  Judge Queue, Display, Public
Competitor registered →  Competitor Registry  →  Bracket Preview, Display
Tournament completed  →  Tournament Registry  →  Rankings, Analytics, Public
```

---

## Module Boundaries

### Communication Patterns

**Synchronous (within request cycle):**
- Module A calls Module B's public function
- Used for: validation, state checks, data transformation
- Example: Bracket Engine called during match resolution

**Asynchronous (event-driven):**
- Module A emits an event → Platform routes to subscribers
- Used for: notifications, real-time updates, analytics
- Example: Match resolved event triggers display update and analytics recording

### Isolation Rules

| Rule | Description |
|---|---|
| No shared database tables | Each module owns its data. Cross-module queries go through public APIs. |
| No cross-module imports | Modules import only from shared services and types. Never from another module's internals. |
| Public API only | Modules expose a typed public API. Internal implementation is hidden. |
| Event-driven coupling | Modules communicate through events, not direct calls, for side effects. |
| Own your data | If Module A needs data from Module B, it requests it through Module B's API. |

---

## Guiding Principles

### 1. Bracket Engine Is Sacred

The bracket engine is the mathematical heart of the platform. It must remain:
- **Pure** — No side effects, no I/O, no framework dependencies
- **Correct** — Every tournament format produces mathematically valid brackets
- **Testable** — Complete coverage with deterministic tests
- **Independent** — Publishable to npm, usable without the platform

### 2. Real-time Is Not Optional

Every state change must propagate to all connected clients. A spectator in the arena, a judge on the tatami, and a team manager at home must see the same state at the same time.

### 3. Offline Resilience

Judges must be able to score matches without internet connectivity. Data syncs when connectivity is restored. The platform degrades gracefully, never catastrophically.

### 4. Data Belongs to the Federation

Tournament data is owned by the organizing federation, not the platform. Export, migration, and portability are first-class concerns. No vendor lock-in.

### 5. Security Is Not a Feature

Authentication, authorization, and data protection are foundational, not bolted on. Every API endpoint, every database query, every real-time message must be authorized.

### 6. The Platform Serves the Sport

Technology enables the sport; it does not replace it. The platform must enhance the tournament experience for athletes, judges, and organizers without adding friction. If a feature makes the tournament harder to run, it is the wrong feature.

---

## Long-term Scalability

### Horizontal Scaling

| Component | Scaling Strategy |
|---|---|
| Applications | Stateless, load-balanced |
| API Gateway | Horizontal scaling with rate limiting |
| Real-time Engine | Pub/sub with channel partitioning |
| Primary Database | Read replicas, connection pooling |
| Cache Layer | Distributed cache with cluster mode |
| Scoring Engine | Per-tatami isolation, offline-capable |

### Performance Targets

| Metric | Target | Context |
|---|---|---|
| Bracket generation | < 100ms | 128 competitors |
| Match resolution | < 50ms | Single match |
| Real-time propagation | < 200ms | All connected clients |
| Score submission | < 100ms | Judge to server |
| Public bracket load | < 500ms | Initial page load |
| Concurrent viewers | 10,000+ | Per tournament |

### Data Growth

| Data Type | Growth Rate | Retention |
|---|---|---|
| Tournament metadata | ~100 bytes per tournament | Indefinite |
| Match results | ~500 bytes per match | Indefinite |
| Score events | ~200 bytes per score, high volume | 1 year raw, aggregated thereafter |
| Real-time messages | Transient | No retention (fire-and-forget) |
| Analytics aggregates | Computed daily | Indefinite |

### Geographic Distribution

- Primary region for all write operations
- Read replicas in regions with high user density
- Data residency controls for regulatory compliance

---

## Possible Evolution

The platform will grow through additive, non-breaking increments. The following is a general direction, not a fixed roadmap. Specific timing depends on adoption and feedback.

### Format Expansion

Start with single elimination. Add repechage, round robin, group stage, and kumite scoring as demand requires. Each format is an addition to the Bracket Engine, not a replacement.

### Application Expansion

Start with the Admin Panel and Public Portal. Add Judge Scoring, Display Screens, and the API Gateway as tournament complexity grows. Each application consumes existing modules — no module changes required.

### Federation Integration

As the platform matures, integrate with national and international federation systems. Rankings, licensing, and sanctioning data flow between the platform and federation databases.

### Multi-sport Expansion

The module architecture is sport-agnostic at the tournament management layer. Extending to judo, taekwondo, or other combat sports requires sport-specific rules in the Scoring Engine and Bracket Engine, not changes to the platform core.

### Intelligence Layer

Add analytics, predictions, and insights as data accumulates. Historical tournament data enables seeding intelligence, scheduling optimization, and competitive analysis.
