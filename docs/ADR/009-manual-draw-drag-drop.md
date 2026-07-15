# ADR-009: Manual Draw via Drag-and-Drop

**Status:** Accepted  
**Date:** 2026-07-10  
**Decision Makers:** Project Lead

## Context

The PRD specifies two draw modes:
1. **Random draw** — Fisher-Yates shuffle assigns competitors to positions
2. **Manual draw** — Organizer places competitors into specific bracket positions

The manual draw UX needs to be intuitive and efficient.

## Decision

Implement manual draw using HTML5 Drag and Drop API with three components:

1. **UnplacedPool** — Draggable competitor cards (drag source)
2. **SlotGrid** — Numbered slot grid (drop target)
3. **ManualDrawCard** — Orchestrator managing drag state and placement logic

### Interactions

- Drag from pool → slot: Place competitor
- Drag from slot → different slot: Swap competitors
- Drag from slot → pool: Remove competitor from slot
- Drag from slot → occupied slot: Swap competitors
- Click remove button on slot: Remove competitor

### State Management

`useManualDraw` hook manages:
- `slots: ManualSlots` — Array of `DrawEntry | null`
- `unplacedCompetitors` — Competitors not yet placed
- `isComplete` — All competitors placed
- Placement/removal/swap operations

## Consequences

### Positive

- Native browser drag-and-drop (no external library needed)
- Intuitive for organizers familiar with drag-and-drop interfaces
- Clear visual feedback (drag over highlighting, placement count)
- Supports reordering and swapping without extra UI

### Negative

- HTML5 Drag and Drop API has known accessibility limitations
- No touch support (drag-and-drop doesn't work well on mobile)
- Requires JavaScript (no progressive enhancement for drag)

### Mitigation

- Touch users can use the random draw instead
- Future: Could add click-to-place as an alternative to drag-and-drop
- ARIA labels and keyboard navigation for accessibility
