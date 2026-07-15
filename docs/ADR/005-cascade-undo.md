# ADR-005: Cascade Undo for Match Results

**Status:** Accepted  
**Date:** 2026-07-05  
**Decision Makers:** Project Lead

## Context

When a match winner is changed or undone, all downstream matches that advanced the old winner must also be updated. This creates a cascade effect:

```
Round 1: A beats B → A advances to Round 2
Round 2: A beats C → A advances to Finals
Finals: A beats D → A is champion

If Round 1 is undone:
- A is removed from Round 2
- If A won Round 2, Round 2 result is cleared and A is removed from Finals
- If A won Finals, Finals result is cleared
```

## Decision

Implement cascade undo as a forward-walking algorithm:

1. Clear the winner from the specified match
2. Walk forward through the bracket:
   - Remove the old winner from the next match's slot (A or B)
   - If the old winner was the next match's winner, clear that winner too and continue walking
3. Stop when the old winner is not found as a winner in the next match

### Implementation

- `cascadeForward()` — shared helper that walks forward removing the old winner
- `cascadeUndo()` — clears match winner, then calls `cascadeForward()`
- `resolveMatch()` — also calls `cascadeForward()` when changing a winner (re-resolve)

### Key Property

The cascade only clears the old winner. It does not automatically re-resolve or re-advance. The organizer must manually re-select winners for affected matches.

## Consequences

### Positive

- Simple, predictable behavior
- No automatic re-resolution that could produce unexpected results
- Organizer maintains full control over match outcomes
- Consistent between undo and re-resolve operations

### Negative

- Organizer must re-resolve all downstream matches after undo
- For deep brackets, this could require many clicks
- No "undo all" or "batch undo" capability

### Future Consideration

A "reset bracket from round N" feature could batch-undo all matches from a specific round forward.
