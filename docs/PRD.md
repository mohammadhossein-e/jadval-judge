# Product Requirements Document (PRD)

## Karate Tournament Bracket Builder

**Version:** 1.0 (MVP)
**Date:** July 2026
**Status:** Draft

---

## 1. Product Vision

A web-based SaaS platform that enables karate tournament organizers to create, manage, and run single-elimination kata brackets with minimal manual effort. The organizer inputs competitors, clicks a button, and gets a fair, properly seeded bracket that advances automatically as match results are recorded — determining a champion with zero paper-based workflows.

---

## 2. Problem Statement

Karate tournament organizers currently manage brackets using:

- **Spreadsheets** (Excel/Google Sheets) — error-prone, hard to update live, no automatic advancement
- **Paper brackets** — lost results, illegible handwriting, impossible to share in real-time
- **Generic bracket tools** (e.g., Challonge) — don't understand karate-specific rules (no kata scoring, no WKF category structure, no bye calculation per WKF category)

This causes:

- **Hours of manual work** setting up brackets before a tournament
- **Scoring and advancement errors** that damage tournament credibility
- **Delayed results** — competitors and coaches wait unnecessarily
- **No visibility** — spectators and coaches can't follow the bracket in real-time

---

## 3. Target Users

| User                     | Role                                   | Primary Need                                                            |
| ------------------------ | -------------------------------------- | ----------------------------------------------------------------------- |
| **Tournament Organizer** | Creates and runs the tournament        | Set up brackets quickly, advance winners accurately, determine champion |
| **Federation Official**  | Oversees multiple tournaments          | Standardized bracket format across events                               |
| **Coach**                | Registers competitors, tracks progress | See their competitors' bracket path and results                         |
| **Competitor**           | Participates in tournament             | Know their next match, opponent, and schedule                           |

> **Note:** For MVP, the primary user is the **Tournament Organizer**. Coaches and competitors are viewers only (no accounts needed for MVP — they view a public bracket page).

---

## 4. Goals

### Product Goals

1. Reduce bracket setup time from hours to **under 5 minutes**
2. Eliminate bracket errors (wrong advancement, incorrect byes)
3. Provide a **live, shareable bracket view** that updates in real-time as results are entered

### Business Goals

1. Validate product-market fit with 3+ tournament organizers within 3 months
2. Establish the platform as the default bracket tool for local/regional karate tournaments
3. Build the foundation for paid tiers (future: multi-category, federation accounts, analytics)

### Technical Goals

1. Ship a working MVP in **4-6 weeks**
2. Achieve **< 200ms** page load time for bracket view
3. Handle tournaments with up to **128 competitors** per category

---

## 5. MVP Scope

### What We're Building (In Scope)

**5.1 Tournament Setup**

- Create a tournament (name, date, location)
- Define categories (e.g., "Male Kata Under 12", "Female Kata 12-14")
- Each category is an independent bracket

**5.2 Competitor Management**

- Add competitors to a category (name, club/dojo, optional rank/belt)
- Bulk add via simple list (paste names, one per line)
- Edit and remove competitors

**5.3 Bracket Generation**

- **Random Draw**: Shuffle competitors randomly, place into bracket
- **Manual Draw**: Organizer places competitors into specific bracket positions
- **Automatic BYE calculation**: When competitor count ≠ power of 2, BYEs are distributed evenly across the bracket (top-half seeding, no two BYEs in the same initial match)
- **Seeding awareness**: If competitors are ranked (manual seed input for MVP), top seeds are placed to avoid meeting early

**5.4 Interactive Bracket Display**

- Visual single-elimination bracket (tree view)
- Rounds labeled: Round of 16, Quarterfinals, Semifinals, Final
- BYE matches shown as "BYE" vs. competitor (auto-advance)
- Click a match → record winner
- Winner automatically advances to next round
- Champion highlighted at the top/end of bracket
- Bracket is **responsive** — works on tablets (used courtside)

**5.5 Match Winner Selection**

- Organizer selects the winner of each match
- For MVP: simple "Winner A" / "Winner B" selection (no scoring integration)
- Winner is highlighted and advanced automatically

**5.6 Public Bracket View**

- Shareable URL for each category bracket
- Read-only view — no login required
- Auto-refreshes as results are entered (real-time via Supabase Realtime)
- Shows current round, completed matches, upcoming matches

### What We're NOT Building (Out of Scope for MVP)

| Feature                        | Reason Deferred                                     | Target Version |
| ------------------------------ | --------------------------------------------------- | -------------- |
| Repechage brackets             | Complex WKF rules, not needed for basic tournaments | v1.1           |
| Round Robin format             | Different bracket type, adds significant complexity | v1.2           |
| Group Stage + Knockout         | Compound format, needs group management             | v1.3           |
| Kumite-specific logic          | Different match format (weighted points)            | v2.0           |
| Team Events                    | Multiple competitors per match, different structure | Future         |
| Online Registration            | Needs auth, payment, form builder                   | Future         |
| Live Scoreboard (TV display)   | Separate display system, complex real-time          | Future         |
| Referee Panel Assignment       | Needs user accounts, assignment logic               | Future         |
| PDF Export                     | Nice-to-have, not blocking core value               | Future         |
| Excel Import                   | Bulk add via paste is sufficient for MVP            | Future         |
| Tournament Dashboard/Analytics | Post-tournament value, not MVP-critical             | Future         |
| Multi-language (RTL)           | English-only for MVP, add localization in v2        | Future         |
| User Authentication            | Organizer uses app directly, no login for MVP       | Future         |
| Payment Processing             | Not needed until online registration exists         | Future         |

---

## 6. User Stories

### Tournament Setup

```
US-01: As an organizer, I want to create a tournament with a name, date, and location
       so that I can identify and share the event.

US-02: As an organizer, I want to create categories within my tournament
       so that I can manage separate brackets for each category
       (e.g., Male Kata Under 12, Female Kata 12-14).

US-03: As an organizer, I want to edit tournament and category details
       so that I can correct mistakes or update information.
```

### Competitor Management

```
US-04: As an organizer, I want to add competitors to a category one at a time
       (name, club/dojo) so that I can register participants.

US-05: As an organizer, I want to bulk-add competitors by pasting a list of names
       so that I can quickly register many competitors at once.

US-06: As an organizer, I want to edit or remove competitors from a category
       so that I can manage last-minute changes.

US-07: As an organizer, I want to assign an optional seed number (1-N) to competitors
       so that I can seed the bracket to avoid top competitors meeting early.
```

### Bracket Generation

```
US-08: As an organizer, I want to generate a bracket with a random draw
       so that competitors are placed fairly without bias.

US-09: As an organizer, I want to manually place competitors into specific bracket
       positions so that I can honor seeded placements or special requirements.

US-10: As an organizer, I want BYEs to be automatically calculated and placed
       when the number of competitors isn't a power of 2,
       so that the bracket is correct without manual math.

US-11: As an organizer, I want BYEs to be distributed evenly (top-half seeding)
       so that seeded competitors aren't disadvantaged by getting a BYE
       while others have to compete in the first round.
```

### Running the Tournament

```
US-12: As an organizer, I want to click a match and select the winner
       so that I can record results as matches complete.

US-13: As an organizer, I want the winner to automatically advance to the next
       round so that I don't have to manually update the bracket.

US-14: As an organizer, I want BYE matches to auto-resolve (competitor advances
       automatically) so that I don't have to process them manually.

US-15: As an organizer, I want the champion to be clearly displayed when the
       final match is completed so that the result is unambiguous.
```

### Viewing

```
US-16: As a coach, I want to view a public bracket URL so that I can follow
       my competitors' progress without needing an account.

US-17: As a viewer, I want the bracket to update in real-time so that I see
       results as soon as they're recorded.

US-18: As an organizer, I want the bracket to work well on a tablet
       so that I can use it courtside during the tournament.
```

---

## 7. Functional Requirements

### FR-01: Tournament CRUD

- **Create**: Organizer enters: Tournament Name (required), Date (required), Location (optional)
- **Read**: Tournament list page shows all tournaments sorted by date
- **Update**: All fields editable at any time
- **Delete**: Only possible if no categories have competitors added

### FR-02: Category Management

- Each tournament has 1+ categories
- Category fields: Name (required), optional age/weight/gender description
- Categories are independent — each gets its own bracket
- Can add/edit/delete categories until bracket is generated

### FR-03: Competitor Entry

- Competitor fields: Full Name (required), Club/Dojo (required), Seed (optional, integer 1-N)
- Minimum 2 competitors required to generate bracket
- Maximum 128 competitors per category (v1 limit)
- No duplicate names within a category (validation)
- Competitors can be reordered before bracket generation

### FR-04: Bracket Generation Algorithm

**Input**: List of competitors, optional seeds, draw type (random/manual)

**Process**:

1. Determine bracket size: Find smallest power of 2 ≥ competitor count
   - 2 → 2, 3-4 → 4, 5-8 → 8, 9-16 → 16, 17-32 → 32, 33-64 → 64, 65-128 → 128
2. Calculate BYEs: `BYEs = bracketSize - competitorCount`
3. Place BYEs: Distributed using top-half seeding:
   - Position 1 gets BYE if needed, then last position in first half, etc.
   - No two BYEs should be in the same initial match
   - Seeded competitors should receive BYEs preferentially (highest seeds first)
4. Place competitors:
   - If seeded: Use standard tournament seeding pattern (1 vs 16, 8 vs 9, etc.)
   - If random: Shuffle remaining slots, place competitors
   - If manual: Respect organizer's placement
5. Generate round structure:
   - Round 1: Matches with competitors (excluding auto-advance BYEs)
   - Round 2+: Empty, awaiting results

**Output**: Complete bracket data structure with all rounds and initial matches

### FR-05: Single Elimination Bracket Rules

- Winner of each match advances to the predetermined next slot
- Loser is eliminated
- BYE matches auto-resolve: competitor advances without playing
- Bracket is fully binary — no byes after Round 1

### FR-06: Match Winner Selection

- Organizer clicks match → modal/panel with "Select Winner" option
- Two buttons: Competitor A name, Competitor B name
- On selection:
  1. Match result recorded (winner, timestamp)
  2. Winner name populated in next-round match slot
  3. If next-round match now has both competitors → match becomes "ready"
  4. If this was the Final → Champion is declared
- **Undo**: Organizer can change a match winner (which cascades: removes the incorrectly advanced competitor from subsequent matches)

### FR-07: Champion Determination

- When the Final match has a winner → that competitor is the Champion
- Champion is displayed with special styling (crown/trophy icon, highlighted)
- Category status changes to "Completed"

### FR-08: Public Bracket View

- URL format: `/{tournamentId}/{categoryId}` (or similar public slug)
- No authentication required
- Read-only — no ability to modify data
- Auto-refreshes via Supabase Realtime subscriptions
- Shows:
  - Tournament name, category name
  - Bracket tree with all rounds
  - Completed matches (with winner highlighted)
  - Current/upcoming matches
  - Champion (if determined)

---

## 8. Non-Functional Requirements

### Performance

- **Page load**: < 2 seconds for bracket view (initial load)
- **Real-time update**: < 500ms from winner selection to viewer seeing the change
- **Bracket generation**: < 1 second for up to 128 competitors
- **Concurrent viewers**: Support 100+ simultaneous viewers per bracket

### Usability

- **Tablet-optimized**: Functional on iPad (1024x768 and up)
- **Touch-friendly**: All interactive elements ≥ 44px touch target
- **Intuitive**: An organizer with no training should be able to create a tournament and generate a bracket in < 5 minutes
- **Error-resistant**: Confirmation before generating bracket; undo for winner selection

### Reliability

- **Data persistence**: No data loss on browser crash — all state server-side
- **Availability**: 99.5% uptime during business hours (tournament events)
- **Recovery**: Organizer can resume where they left off if browser is closed

### Accessibility

- **Keyboard navigation**: Bracket can be navigated via keyboard (for accessibility)
- **Color contrast**: WCAG AA compliant for all text
- **Screen reader**: Match information accessible to screen readers

### Security (MVP)

- Organizer actions (create, edit, select winners) require a simple PIN/code per tournament (no full auth system for MVP)
- Public view is truly read-only
- Rate limiting on API endpoints

---

## 9. User Flow

### Flow 1: Create Tournament and Generate Bracket

```
┌─────────────────────────────────────────────────────────────┐
│  1. LAND ON HOMEPAGE                                        │
│     └── Click "Create Tournament"                           │
├─────────────────────────────────────────────────────────────┤
│  2. FILL TOURNAMENT FORM                                    │
│     ├── Tournament Name: "Spring Open 2026"                 │
│     ├── Date: March 15, 2026                                │
│     └── Location: "Tokyo Karate Center"                     │
│     └── Click "Create"                                      │
├─────────────────────────────────────────────────────────────┤
│  3. TOURNAMENT DASHBOARD                                    │
│     ├── Shows tournament info                               │
│     ├── "Add Category" button                               │
│     │                                                      │
│     └── Click "Add Category"                                │
├─────────────────────────────────────────────────────────────┤
│  4. CREATE CATEGORY                                         │
│     ├── Name: "Male Kata Under 12"                          │
│     └── Click "Create"                                      │
├─────────────────────────────────────────────────────────────┤
│  5. CATEGORY MANAGEMENT PAGE                                │
│     ├── Empty competitor list                               │
│     ├── "Add Competitor" button                             │
│     ├── "Bulk Add" button                                   │
│     │                                                      │
│     └── Add 8 competitors (mix of single + bulk)            │
├─────────────────────────────────────────────────────────────┤
│  6. COMPETITOR LIST (8 competitors)                         │
│     ├── Optional: Assign seeds (1-8)                        │
│     ├── "Generate Bracket" button                           │
│     │                                                      │
│     └── Click "Generate Bracket"                            │
├─────────────────────────────────────────────────────────────┤
│  7. BRACKET GENERATION MODAL                                │
│     ├── Draw Type: ○ Random  ○ Manual                       │
│     │                                                      │
│     ├── If Random:                                         │
│     │   └── Click "Generate" → bracket created instantly   │
│     │                                                      │
│     ├── If Manual:                                         │
│     │   └── Show empty bracket slots                        │
│     │       └── Drag competitors into positions             │
│     │           └── Click "Finalize"                        │
│     │                                                      │
│     └── Result: Bracket displayed                           │
├─────────────────────────────────────────────────────────────┤
│  8. INTERACTIVE BRACKET VIEW                                │
│     ├── Round 1: 4 matches (1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7)│
│     │   (or with BYEs if count ≠ power of 2)               │
│     ├── Semifinals: 2 empty slots                           │
│     ├── Final: 1 empty slot                                 │
│     │                                                      │
│     ├── Organizer: Click Match 1 → Select Winner            │
│     │   └── Winner advances to Semifinal                    │
│     │                                                      │
│     ├── Continue selecting winners round by round           │
│     │                                                      │
│     └── Final match completed → CHAMPION DISPLAYED 🏆       │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: View Bracket (Coach/Spectator)

```
Coach receives link → Opens public URL → Sees live bracket →
Auto-refreshes as organizer records results → Sees champion at end
```

### Flow 3: Undo a Result

```
Organizer realizes Match 3 winner was wrong →
Click Match 3 → "Change Winner" → Select correct winner →
Incorrectly advanced competitor removed from subsequent matches →
Correct competitor now in their place → Bracket is consistent
```

---

## 10. Core Business Rules

### BR-01: Bracket Size

- Always a power of 2 (2, 4, 8, 16, 32, 64, 128)
- Minimum competitors: 2
- Maximum competitors: 128

### BR-02: BYE Distribution

- BYEs = Bracket Size - Competitor Count
- BYEs are assigned to the **highest-seeded** competitors first
- BYE placement follows **top-half seeding** pattern:
  - Slot positions are filled from the top of the bracket first
  - BYE vs. competitor matches should not cluster in one section
- **Rule**: No two BYE opponents (competitors facing a BYE) should meet before the earliest possible round

### BR-03: Seeding Pattern (Standard Tournament Seeding)

For an 8-slot bracket with seeds 1-8:

```
Match 1: Seed 1 vs Seed 8
Match 2: Seed 4 vs Seed 5
Match 3: Seed 3 vs Seed 6
Match 4: Seed 2 vs Seed 7
```

This ensures:

- Seed 1 and Seed 2 are in opposite halves
- Seed 1 and Seed 2 can only meet in the Final
- Seed 3 and Seed 4 are separated (meet 1/2 in Semifinals at earliest)

### BR-04: BYE + Seeding Interaction

- A seeded competitor who receives a BYE should get it in their first-round position
- The competitor who would have faced them in Round 1 is not placed — the BYE slot is empty
- Example: Seed 1 gets BYE → Match 1 shows "Seed 1 (BYE)" → Seed 1 advances to Round 2 automatically

### BR-05: Match Resolution

- A match can only be resolved when both slots are filled (no BYE involved)
- BYE matches auto-resolve instantly
- Once a match is resolved, the result is final (but can be changed by organizer — see BR-06)

### BR-06: Winner Undo

- Organizer can change any resolved match at any time
- **Cascade rule**: Changing a match result:
  1. Removes the old winner from all subsequent matches they appeared in
  2. Places the new winner in the correct advancement slot
  3. If the old winner had won subsequent matches, those results are also cleared (cascade)
  4. This ensures bracket consistency at all times
- Champion can be "undone" if the Final result is changed

### BR-07: Category Independence

- Each category is completely independent
- A competitor can appear in multiple categories (different categories)
- Category brackets don't interact

### BR-08: Tournament States

- **Draft**: Tournament created, no categories or competitors
- **Setup**: Categories exist, competitors being added
- **In Progress**: Bracket generated, matches being resolved
- **Completed**: All matches resolved, champion determined
- Status is per-category (one category can be completed while another is in progress)

---

## 11. Data Model (Simplified)

```
Tournament
├── id: UUID
├── name: String
├── date: DateTime
├── location: String (optional)
├── createdAt: DateTime
├── updatedAt: DateTime
└── categories: Category[]

Category
├── id: UUID
├── tournamentId: UUID (FK)
├── name: String
├── status: Enum (SETUP | IN_PROGRESS | COMPLETED)
├── bracketSize: Integer (power of 2, computed)
├── drawType: Enum (RANDOM | MANUAL)
├── createdAt: DateTime
├── updatedAt: DateTime
├── competitors: Competitor[]
└── matches: Match[]

Competitor
├── id: UUID
├── categoryId: UUID (FK)
├── name: String
├── club: String
├── seed: Integer (optional)
└── bracketPosition: Integer (optional, set after draw)

Match
├── id: UUID
├── categoryId: UUID (FK)
├── round: Integer (1 = first round, 2 = quarterfinals, etc.)
├── position: Integer (position within the round)
├── competitorAId: UUID (FK, nullable — null if BYE)
├── competitorBId: UUID (FK, nullable — null if BYE)
├── winnerId: UUID (FK, nullable — null if unresolved)
├── isBye: Boolean (auto-detected)
├── nextMatchId: UUID (FK, nullable — which match the winner advances to)
├── nextSlot: Enum (A | B — which slot in the next match)
├── createdAt: DateTime
└── updatedAt: DateTime
```

---

## 12. Technical Considerations

### Architecture Recommendation

| Layer     | Technology                    | Rationale                                                                               |
| --------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| Frontend  | **Next.js 14+ (App Router)**  | SSR for SEO on public bracket pages, React for interactive bracket, built-in routing    |
| Database  | **PostgreSQL (via Supabase)** | Relational data fits perfectly, Supabase gives auth + realtime + RLS for free           |
| Real-time | **Supabase Realtime**         | Public bracket viewers get live updates without polling, zero additional infrastructure |
| Hosting   | **Vercel**                    | Automatic deploys, edge network, perfect Next.js integration                            |
| Styling   | **Tailwind CSS**              | Fast development, responsive utilities, works great for bracket visualization           |

### Key Technical Decisions

1. **Bracket Rendering**: Build a custom React component that renders the bracket as an SVG or CSS Grid. The bracket tree is well-structured data — CSS Grid with fixed column widths per round is the most maintainable approach.

2. **State Management**: Server-side state (database) is the source of truth. Client-side uses React Query for caching + Supabase Realtime for live updates. No complex client state needed.

3. **BYE Algorithm**: Pure TypeScript function, independently testable. Input: competitor list + seed data. Output: bracket structure (array of matches). This is the core business logic — must be thoroughly tested.

4. **Cascade Undo**: When changing a match result, walk the match tree forward from the affected match, clearing all dependent results. This is a recursive operation — implement carefully with clear termination conditions.

5. **Public Bracket URL**: Use short, shareable slugs (e.g., `/t/spring-open-2026/male-kata-u12`). Server-side rendered for SEO and fast initial load. Client hydrates for realtime updates.

6. **No Auth (MVP)**: Organizer access is controlled via a simple edit PIN stored with the tournament. This avoids auth complexity while still preventing casual tampering. Full auth system in v2.

### Database Schema (Key Relationships)

```
Tournament (1) ──< (N) Category
Category (1) ──< (N) Competitor
Category (1) ──< (N) Match
Match (N) ──> (N) Competitor  (via competitorA, competitorB, winner FKs)
Match (1) ──> (1) Match       (via nextMatch FK — self-referential tree)
```

---

## 13. Future Roadmap

| Version        | Features                                                                                                                   | Timeline            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **v1.0 (MVP)** | Single Elimination Kata, BYEs, Manual/Random Draw, Interactive Bracket, Winner Selection, Champion, Public View, Real-time | **Now** — 4-6 weeks |
| **v1.1**       | Repechage                                                                                                                  | TBD                 |
| **v1.2**       | Round Robin                                                                                                                | TBD                 |
| **v1.3**       | Group Stage + Knockout                                                                                                     | TBD                 |
| **v2.0**       | Kumite                                                                                                                     | TBD                 |

---

## 14. Risks

| Risk                                                                                  | Impact                        | Likelihood                    | Mitigation                                                                                                               |
| ------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **BYE placement algorithm bugs** — incorrect seeding leads to unfair brackets         | High (tournament credibility) | Medium                        | Comprehensive unit tests for all bracket sizes (2-128), test with edge cases (1, 3, 5, 7, 9, 15, 33, 65 competitors)     |
| **Cascade undo complexity** — changing results deep in bracket causes inconsistencies | High (data corruption)        | Medium                        | Model match tree as a directed graph, clear all descendants on undo, test with multi-round undo scenarios                |
| **Tablet usability** — bracket too small to interact with on iPad                     | Medium (courtside usability)  | Medium                        | Design for 1024x768 minimum, use pinch-zoom on bracket, ensure touch targets ≥ 44px                                      |
| **Real-time sync conflicts** — two organizers editing same bracket simultaneously     | Medium (data conflict)        | Low (MVP is single-organizer) | Last-write-wins for MVP, add optimistic locking in v2                                                                    |
| **Scope creep** — pressure to add Kumite/Repechage before v1 is stable                | High (timeline slip)          | High                          | Strict MVP discipline, maintain "Future" list, say no to v2 features until v1 is shipped and validated                   |
| **Low adoption** — organizers don't see value over spreadsheets                       | Critical (product failure)    | Medium                        | Get 3 organizers to beta test before full launch, iterate on feedback, emphasize real-time sharing as key differentiator |

---

## 15. PRD Review & Improvements

After reviewing this PRD, I recommend the following adjustments before development begins:

### Suggestion 1: Require Confirmation Before Bracket Generation

**Why**: Generating a bracket is a "destructive" action — once generated, competitors are locked into positions. If the organizer made a mistake in the competitor list, they'd need to regenerate.

**Recommendation**: Add a confirmation step that shows:

- "You are about to generate a bracket for 12 competitors. This will create a 16-slot bracket with 4 BYEs. Competitors will be locked into positions. Continue?"

### Suggestion 2: Add "Reset Bracket" Capability

**Why**: Even with confirmation, an organizer might generate a bracket and realize the draw was wrong (e.g., forgot a competitor, wrong category).

**Recommendation**: Allow resetting a bracket to "Setup" status, which clears the bracket but keeps the competitor list. This is safer than requiring deletion and re-creation.

### Suggestion 3: Show BYE Count and Bracket Info Before Generation

**Why**: Organizers need to know upfront how many BYEs there will be. If there are too many BYEs (e.g., 9 competitors in a 16-slot bracket = 7 BYEs), the organizer might want to restructure.

**Recommendation**: Show a preview: "12 competitors → 16-slot bracket → 4 BYEs → Seed 1, 2, 3, 4 receive BYEs"

### Suggestion 4: Consider "Competitor Review" Step Before Bracket Generation

**Why**: Organizers should be able to review and confirm the competitor list before generating. Accidental duplicates or misspellings are easier to fix here.

**Recommendation**: Show a "Review Competitors" step between adding competitors and generating bracket.

### Suggestion 5: Add Timestamp to Match Results

**Why**: Useful for tiebreaker analysis, tournament pacing analytics (future), and dispute resolution.

**Recommendation**: Store `resolvedAt` timestamp on Match. Display time on hover/tap for completed matches.

### Suggestion 6: Clarify "Manual Draw" UX

**Why**: The PRD says "manual draw" allows placing competitors into positions, but doesn't specify the interaction model.

**Recommendation**: For MVP, manual draw = drag-and-drop competitors into bracket slots. If drag-and-drop is too complex for the timeline, fall back to: click a slot → pick a competitor from a dropdown.

---

## 16. Design Principles

- The application must be modular and extensible.
- Business logic must be completely separated from the UI.
- Every tournament format should be implemented as an independent engine.
- The system should support adding new tournament formats without modifying existing ones.
- The bracket engine should be reusable.
- Every feature should be designed with future scalability in mind.
- Components should be reusable and loosely coupled.

---

## 17. Versioning Strategy

### Version 1.0 (MVP)

- Kata
- Single Elimination

### Version 1.1

- Repechage

### Version 1.2

- Round Robin

### Version 1.3

- Group Stage + Knockout

### Version 2.0

- Kumite

---

**End of PRD. Ready for technical design and development.**
