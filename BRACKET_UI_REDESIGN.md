# Bracket UI Redesign — Architecture Proposal

## 1. Design Goals

- Render the **complete bracket** exactly as the engine produces it — every match, every BYE, every null slot, no filtering
- Visual tree structure that communicates progression at a glance
- Professional production UI for karate tournament operators
- Desktop-first, horizontal scroll acceptable for MVP
- Reuse existing Jadval design system (shadcn/ui base-nova, OKLCH palette, Tailwind CSS v4)
- CSS Grid / Flexbox layout, no SVG/Canvas
- Future-proof match nodes that can accommodate tatami, referee, time, score, status without redesign
- Accessible: keyboard navigation, winner selection, undo all preserved
- Testable: pure DOM rendering with predictable structure, no visual tricks

## 2. Current Problems

### 2.1 BYE Matches Render Correctly But Are Visually Invisible

The engine returns **all 7 matches** for a size-8 bracket. The current `BracketView` renders all 7. No filtering occurs. The problem is **visual, not data**:

- BYE matches (`isBye: true`) have the same `bg-card` background as regular matches
- No visual distinction signals "this is a BYE"
- After auto-resolution, the BYE winner appears in round 2 without visible provenance

### 2.2 Flat Card Columns, Not a Tree

Current layout (`BracketView.tsx:244`): horizontal `flex gap-6` with columns per round. Each round column stacks matches with `gap-3`. There is no visual connection between parent and child matches. The operator cannot trace "Match 1 → Semi-final 1 → Final" because there are no connectors.

### 2.3 Rigid Vertical Sizing

Line 257: `minHeight: round === 1 ? 'auto' : ${roundMatches.length * 120}px` — this is a brittle heuristic. For 128 competitors (64 round-1 matches), the round-2 minHeight would be `32 * 120 = 3840px`, which may not align with the actual rendered height of 64 cards.

### 2.4 No Spatial Relationship Between Rounds

In a real bracket tree, each round-2 match sits **between** its two round-1 parents. The current column layout places round-2 matches at the top of their column with `space-around`, which breaks the visual pairing for brackets larger than 8.

## 3. Inspiration Analysis — SportData

SportData (SET OVR) is the de facto standard for karate tournament management. Key UX patterns observed from their product pages, changelogs, and feature descriptions:

### What SportData Does Well

| Pattern | SportData Approach | What It Means |
|---------|--------------------|---------------|
| **Bracket tree visualization** | Column-based elimination trees with connector lines | Operators can trace advancement paths instantly |
| **BYE visibility** | BYEs shown as labeled slots with auto-advance arrows | No ambiguity about why a competitor advanced |
| **Tatami/scheduling integration** | Each match slot shows area assignment | Scheduling and bracket are unified |
| **Live match indicators** | Status indicators on matches (scheduled, ongoing, finished) | Operators know the state of the tournament at a glance |
| **Multiple competition formats** | Single elimination, double elimination, round robin, pools | System handles real-world complexity |
| **Draw animation** | Animated reveal for public draws | Builds anticipation for spectators |
| **Scalability** | Handles 100s of athletes per category | Layout doesn't break at scale |
| **Result book integration** | Brackets feed into official result reports | Tournament data flows end-to-end |

### What We Adopt

1. **Tree structure with connector lines** — rounds as columns, matches connected by lines
2. **BYE as explicit match state** — visually distinct, clearly labeled, auto-advance shown
3. **Match nodes as information-dense cards** — designed for future fields
4. **Round labels with match counts** — "Quarterfinals (4 matches)"
5. **Scalability mindset** — layout that works from 4 to 128 competitors

### What We Intentionally Improve

| SportData Limitation | Our Improvement |
|----------------------|-----------------|
| Desktop-only Java application | Web-based, responsive, accessible |
| Dense data tables | Clean card-based match nodes with Jadval design language |
| Monochrome utilitarian UI | OKLCH neutral palette with subtle state colors |
| No keyboard navigation | Full keyboard support, ARIA labels, focus management |
| Proprietary closed system | Open, testable component architecture |

## 4. Component Hierarchy

```
BracketView (orchestrator — replaces current)
│
├── BracketTree (layout engine — new)
│   │  Responsibilities:
│   │  - Computes spatial positions for all matches
│   │  - Renders round columns with connector lines
│   │  - Manages horizontal scroll container
│   │
│   ├── RoundHeader × totalRounds (new)
│   │     Responsibilities:
│   │     - Displays round name ("Quarterfinals")
│   │     - Displays match count ("4 matches")
│   │     - Sticky header during horizontal scroll
│   │
│   ├── TreeMatch × totalMatches (new, replaces MatchCard)
│   │     Responsibilities:
│   │     - Renders a single bracket match node
│   │     - Delegates to TreeMatchSlot for each competitor slot
│   │     - Shows match number, status, future metadata
│   │     - Handles click/keyboard for winner selection
│   │     - Shows undo control when applicable
│   │
│   │   ├── TreeMatchSlot × 2 per match (new, replaces MatchSlotRow)
│   │   │     Responsibilities:
│   │   │     - Renders competitor name, seed badge
│   │   │     - Renders BYE label when applicable
│   │   │     - Renders "TBD" for unresolved slots
│   │   │     - Highlights winner with primary color
│   │   │     - Accessible slot with ARIA role
│   │   │
│   │   └── (implicit: connector stubs — CSS borders on the match edges)
│   │
│   └── ConnectorLines (new)
│         Responsibilities:
│         - Renders the visual lines connecting child matches to parent matches
│         - Pure CSS: border-right on children + border-left on parents + vertical bar
│         - Handles the "fork" shape where two matches merge into one
│
├── ChampionBanner (extracted from BracketResultSection)
│     Responsibilities:
│     - Shows champion name with crown icon
│     - Positioned at the rightmost column (after the final)
│     - Only visible when isComplete && champion
│
├── WinnerSelectionDialog (existing, unchanged)
│     - Modal for selecting match winner
│     - Reuses existing Dialog + Button components
│
└── MatchDetailPanel (future — not implemented in MVP)
      Responsibilities:
      - Expanded match info (tatami, referee, time, score)
      - Triggered by match click on future iteration
```

### File Structure

```
apps/web/components/competitor/
├── BracketView.tsx                  # REWRITE — orchestrator
├── BracketTree.tsx                  # NEW — layout engine
├── RoundHeader.tsx                  # NEW — column header
├── TreeMatch.tsx                    # NEW — match node
├── TreeMatchSlot.tsx                # NEW — competitor slot
├── ChampionBanner.tsx               # NEW — extracted from BracketResultSection
├── WinnerSelectionDialog.tsx        # EXTRACT from BracketView.tsx (already exists inline)
├── BracketResultSection.tsx         # MODIFY — remove champion banner, delegate to BracketView
├── BracketPreviewCard.tsx           # UNCHANGED
├── __tests__/
│   ├── BracketTree.test.tsx         # NEW
│   ├── TreeMatch.test.tsx           # NEW
│   ├── TreeMatchSlot.test.tsx       # NEW
│   └── ChampionBanner.test.tsx      # NEW
```

## 5. Rendering Algorithm

### Input

```
EngineBracket {
  size: 8,
  totalRounds: 3,
  matches: EngineMatch[7]  // never filtered
}
```

### Step 1: Group Matches by Round

```typescript
const roundGroups = groupMatchesByRound(bracket.matches);
// Map<number, EngineMatch[]>
// Round 1: [R1P0, R1P1, R1P2, R1P3]
// Round 2: [R2P0, R2P1]
// Round 3: [R3P0]
```

### Step 2: Verify Completeness

Assert `roundGroups.size === bracket.totalRounds` and total match count equals `bracket.size - 1`. This is a render-time invariant check for development safety.

### Step 3: Render Round Columns Left-to-Right

Each round becomes a flex column. Rounds are ordered left-to-right (Round 1 on the left, Final on the right). Each column contains its matches stacked vertically with computed spacing.

### Step 4: Render All Matches Per Round

No filtering. Every match in each round group is rendered, regardless of `isBye`, `competitorA/B` null status, or `winner` state.

## 6. Layout Algorithm

### Core Insight

In a single-elimination bracket tree, each match in round `r` at position `p` feeds into match position `floor(p/2)` in round `r+1`. This creates a binary tree where:
- Round 1 has `bracketSize / 2` matches (the leaves)
- Each subsequent round has half the matches
- A match's vertical center should be exactly between its two children's centers

### Algorithm: Computed Vertical Positions

```
MATCH_HEIGHT = 80px    // fixed height per match card
ROUND_GAP = 80px       // horizontal gap between rounds (includes connector space)
MATCH_GAP = 16px       // minimum gap between matches in same round

For round r (1-indexed), match count N_r:
  cellHeight = MATCH_HEIGHT + MATCH_GAP  // 96px per match slot

For round 1 (the anchor):
  match[i].y = i * cellHeight

For round r > 1:
  match[i].y = average(
    childA.y,   // round r-1, position 2*i
    childB.y    // round r-1, position 2*i+1
  )
  // This centers the parent between its two children
```

### Visual Spacing Strategy

```
Round 1 (4 matches):   y = 0, 96, 192, 288   (cellHeight = 96)
Round 2 (2 matches):
  R2P0.y = avg(R1P0.y, R1P1.y) = avg(0, 96) = 48
  R2P1.y = avg(R1P2.y, R1P3.y) = avg(192, 288) = 240
Round 3 (1 match):
  R3P0.y = avg(R2P0.y, R2P1.y) = avg(48, 240) = 144
```

### CSS Implementation

Use a container with `position: relative` and each match with `position: absolute; top: {y}px`. This avoids the complexity of CSS Grid row calculations for arbitrary bracket sizes.

```css
.bracket-tree {
  position: relative;
  display: inline-flex;
  gap: var(--round-gap);
  padding: 0 1rem;
}

.round-column {
  position: relative;
  display: flex;
  flex-direction: column;
}

.tree-match {
  position: absolute;
  top: var(--computed-y);
  width: var(--match-width);  /* 200px */
  height: var(--match-height); /* 80px */
}
```

### Total Bracket Dimensions

For bracket size 128:
- Round 1: 64 matches × 96px = 6144px vertical
- Rounds: 7 columns × (200 + 80)px = 1960px horizontal
- Total: ~6144px × 1960px (scrollable)

For bracket size 8:
- Round 1: 4 matches × 96px = 384px vertical
- Rounds: 3 columns × 280px = 840px horizontal
- Total: ~384px × 840px (fits on screen)

## 7. Connector Algorithm

### Visual Pattern

Each pair of child matches connects to their parent via a "fork" shape:

```
Child A ─────┐
             ├── Parent
Child B ─────┘
```

### CSS Implementation (No SVG)

For each match at `(round=r, position=p)` where `r < totalRounds`:

1. **Right stub** — a 20px horizontal line extending from the match's right edge, at vertical center
2. **Vertical bar** — a vertical line connecting the two right stubs of sibling matches
3. **Left stub** — a 20px horizontal line from the vertical bar's midpoint to the parent match's left edge

This is implemented using CSS pseudo-elements and borders:

```css
/* Right stub on each match */
.tree-match::after {
  content: '';
  position: absolute;
  right: -20px;
  top: 50%;
  width: 20px;
  height: 2px;
  background: var(--border);
}

/* Vertical bar between siblings — positioned on the parent column */
.connector-bar {
  position: absolute;
  left: -20px;
  top: var(--child-a-center-y);
  height: var(--child-b-center-y - child-a-center-y);
  width: 2px;
  background: var(--border);
}
```

### Connector Data Structure

Pre-compute connector positions during layout:

```typescript
interface Connector {
  /** Vertical midpoint of the two children */
  x: number;
  /** Y range of the vertical bar */
  yStart: number;
  yEnd: number;
}
```

One connector per non-final-round match (each parent that has two children gets one connector). Total connectors = `totalMatches - matchesInFinalRound`.

## 8. CSS Strategy

### Approach

- **No CSS modules** — the codebase uses zero `.module.css` files. Continue with Tailwind utility classes exclusively.
- Use the `cn()` utility (clsx + tailwind-merge) for conditional class composition.
- Inline `style` for computed layout values (`top`, `left`, `height`) since these are dynamic per bracket size.

### Design Token Usage

| Element | Tailwind Classes | Maps To |
|---------|-----------------|---------|
| Match card | `rounded-lg border border-border bg-card p-2` | Existing `MatchCard` style |
| BYE match card | `rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-2` | Dashed border, muted background |
| Winner highlight | `bg-primary/10 font-semibold` | Matches existing `MatchSlotRow` winner style |
| TBD slot | `bg-muted/20 text-muted-foreground` | Existing TBD style |
| Connector line | `bg-border` (2px height/width) | Uses `--border` token |
| Round header | `text-sm font-semibold text-muted-foreground text-center` | Existing round header style |
| Champion banner | `border-yellow-500/30 bg-yellow-500/5` | Existing champion style |

### BYE Visual Treatment

BYE matches get a distinct but non-distracting appearance:
- **Dashed border**: `border-dashed` signals "this is not a regular match"
- **Muted background**: `bg-muted/20` reduces visual weight
- **"BYE" label**: prominent badge replacing "Match N"
- **Single competitor shown**: The competitor name appears in the A slot, "BYE" appears in the B slot
- **Winner auto-indicated**: The competitor row gets `bg-primary/10` + `font-semibold` (winner style) because the engine auto-resolves BYEs

### Responsive Behavior (MVP)

- Bracket container: `overflow-x-auto` for horizontal scrolling
- Match card width: fixed `min-w-[200px]`
- Vertical: fits content, no vertical scroll needed for brackets up to 64 competitors
- For 128 competitors (64 round-1 matches): vertical content ~6144px, browser scrolls naturally within the card

## 9. Future Extensibility

### Match Node Expansion Points

The `TreeMatch` component is designed with an information-dense card that naturally accommodates future fields without layout changes:

```
┌──────────────────────────────────────┐
│ M3 · Tatami 2 · 14:30        ● Live │  ← match number, area, time, status
├──────────────────────────────────────┤
│ ▸ Ali (1)                  [12] [W] │  ← competitor A: name, seed, score, winner
├──────────────────────────────────────┤
│ ▸ BYE                               │  ← competitor B: BYE or name
└──────────────────────────────────────┘
```

Future fields are added as new elements inside the existing match card flexbox. The 200px width accommodates name + seed + score. For wider content, `min-w-[200px]` allows natural expansion.

### Adding Status Indicators

Status badges (Scheduled, Live, Finished) are added as a small dot or badge in the match header row. No layout change needed.

### Adding Scores

Score display is added as a numeric badge next to each competitor name. Already supported by the `MatchSlotRow`-equivalent flex layout.

### Match Detail Panel (Phase 2)

Click a match → expand or open a side panel with full match details (tatami, referee, time, penalties, WKF flags). The `TreeMatch` component emits an `onSelect` event that the orchestrator can handle with either inline expansion or a side sheet.

## 10. Migration Plan

### Phase 1: Component Extraction (non-breaking)

1. Extract `WinnerSelectionDialog` from `BracketView.tsx` into its own file
2. Create `TreeMatchSlot.tsx` (pure presentation, same props as current `MatchSlotRow`)
3. Create `TreeMatch.tsx` (wraps `TreeMatchSlot`, same props as current `MatchCard`)
4. Create `ChampionBanner.tsx` (extract from `BracketResultSection.tsx`)
5. Write tests for each extracted component

### Phase 2: Layout Engine (new, additive)

1. Create `BracketTree.tsx` with the position computation algorithm
2. Create connector rendering logic
3. Create `RoundHeader.tsx`
4. Write tests for position computation (assert correct y-positions for known bracket sizes)

### Phase 3: Integration (swap)

1. Rewrite `BracketView.tsx` to use `BracketTree` instead of the flat flex layout
2. Update `BracketResultSection.tsx` to use `ChampionBanner`
3. Verify all existing tests pass
4. Manual verification with bracket sizes 4, 8, 16, 32

### Phase 4: Polish

1. BYE visual treatment refinement
2. Keyboard navigation verification
3. Screen reader testing
4. Performance check for 128-competitor brackets

## 11. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Absolute positioning creates z-index issues | Low | Use `z-index` layering: connectors behind matches |
| Computed y-positions misalign on edge cases | Medium | Test with all bracket sizes 2-128; snapshot tests |
| Horizontal scroll janky on large brackets | Low | Use CSS `overflow-x: auto` with `-webkit-overflow-scrolling: touch` |
| Existing tests break during migration | Medium | Phase 1 extracts without changing behavior; run tests after each phase |
| Connector lines look messy at scale | Medium | Use subtle `border-border` color; consider hiding connectors below certain zoom |
| BYE treatment confuses operators | Low | Show competitor name prominently; "BYE" as small label; auto-win clearly indicated |

## 12. Wireframe — Size 8, 5 Competitors

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Bracket                                                                    [↻]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Quarterfinals              Semifinals              Final                       │
│  (4 matches)                (2 matches)             (1 match)                   │
│                                                                                 │
│  ┌──────────────┐ ───┐     ┌──────────────┐ ───┐                              │
│  │ Ali      [1] │   │     │              │   │                               │
│  │  ─────────── │   │     │              │   │                              │
│  │ BYE          │ ──┤     │              │   │                              │
│  └──────────────┘   │     │              │   │                              │
│                     ├─── │ Semifinal 1   │ ──┤                              │
│  ┌──────────────┐   │     │              │   │                              │
│  │ Competitor D │   │     │              │   │                              │
│  │  ─────────── │ ──┤     │              │   │                              │
│  │ Competitor E │     │     │              │   │                              │
│  └──────────────┘     │     │              │   │                              │
│                       │     │              │   │                              │
│  ┌──────────────┐ ───┘     └──────────────┘   │   ┌──────────────┐          │
│  │ Competitor B │   │                          │   │              │          │
│  │  ─────────── │   │                          ├── │              │          │
│  │ BYE          │ ──┤                          │   │              │          │
│  └──────────────┘   │     ┌──────────────┐ ───┘   │              │          │
│                     │     │              │         │              │          │
│  ┌──────────────┐   │     │              │ ────────│   FINAL      │          │
│  │ Competitor C │ ──┤     │              │         │              │          │
│  │  ─────────── │   │     │              │         │              │          │
│  │ BYE          │     │     │              │         │              │          │
│  └──────────────┘     │     │              │         │              │          │
│                       └─── │ Semifinal 2   │ ────────│              │          │
│                             │              │         │              │          │
│                             │              │         │   CHAMPION   │          │
│                             └──────────────┘         │              │          │
│                                                      │   🏆        │          │
│                                                      │              │          │
│                                                      └──────────────┘          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Match Card Detail

```
┌──────────────────────┐
│ M3 · BYE        [↻] │  ← match label + undo button (when applicable)
├──────────────────────┤
│ ▸ Ali           [1] │  ← seed badge, winner highlight
├──────────────────────┤
│ ▸ BYE                │  ← labeled BYE slot
└──────────────────────┘

┌──────────────────────┐
│ M10                   │  ← regular match (no BYE)
├──────────────────────┤
│ ▸ Competitor D   [4] │
├──────────────────────┤
│ ▸ Competitor E   [5] │
└──────────────────────┘
```

## 13. Testing Strategy

### Unit Tests (Component Level)

- **TreeMatchSlot**: renders competitor name, seed badge, BYE label, TBD state, winner highlight
- **TreeMatch**: renders match number, two slots, undo button conditionally, keyboard accessibility
- **BracketTree**: computes correct y-positions for bracket sizes 2, 4, 8, 16
- **ChampionBanner**: renders champion name when present, hidden when null

### Integration Tests

- **BracketView**: renders all matches for a 5-competitor bracket (7 matches total)
- **BracketView**: BYE matches visible with dashed border
- **BracketView**: clicking resolvable match opens WinnerSelectionDialog
- **BracketView**: winner selection updates match and cascades to next round
- **BracketView**: undo button appears only on resolved non-BYE matches
- **BracketView**: champion banner appears when bracket is complete

### Snapshot Tests

- Bracket size 4 (2 rounds, 3 matches)
- Bracket size 8 with 5 competitors (3 rounds, 7 matches, 3 BYEs)
- Bracket size 16 (4 rounds, 15 matches)
- Bracket after partial resolution (some matches decided, others pending)

## 14. Summary of Changes

| File | Action | Scope |
|------|--------|-------|
| `BracketView.tsx` | **REWRITE** | Replace flat flex layout with BracketTree |
| `BracketTree.tsx` | **CREATE** | Layout engine with position computation |
| `RoundHeader.tsx` | **CREATE** | Round column headers |
| `TreeMatch.tsx` | **CREATE** | Match node component |
| `TreeMatchSlot.tsx` | **CREATE** | Competitor slot component |
| `ChampionBanner.tsx` | **CREATE** | Champion display (extracted) |
| `WinnerSelectionDialog.tsx` | **EXTRACT** | Move from inline in BracketView to separate file |
| `BracketResultSection.tsx` | **MODIFY** | Remove inline champion banner, use ChampionBanner import |
| `useMatchResolution.ts` | **UNCHANGED** | Hook interface preserved |
| `packages/bracket-engine/` | **UNCHANGED** | Engine untouched |

### Lines Changed (Estimate)

- New files: ~600 lines total
- Rewritten `BracketView.tsx`: ~290 lines → ~80 lines (delegates to BracketTree)
- Modified `BracketResultSection.tsx`: ~62 lines → ~45 lines (simplified)
- Net change: +550 lines new, -145 lines removed = ~+400 lines
