# ADR-010: Shared cloneMatches Utility

**Status:** Accepted  
**Date:** 2026-07-15  
**Decision Makers:** Project Lead

## Context

Both `resolveMatch()` (advancement.ts) and `cascadeUndo()` (cascade.ts) need to deep-clone the matches array before mutating. The clone logic was duplicated in both files.

## Decision

Extract `cloneMatches()` into `packages/bracket-engine/src/utils.ts` and import it from both consumers.

### Implementation

```typescript
// utils.ts
export function cloneMatches(matches: readonly EngineMatch[]): EngineMatch[] {
  return matches.map((m) => ({
    ...m,
    competitorA: m.competitorA ? { ...m.competitorA } : null,
    competitorB: m.competitorB ? { ...m.competitorB } : null,
    winner: m.winner ? { ...m.winner } : null,
  }));
}
```

### Clone Strategy

- Shallow clone of the matches array (new array, same object references)
- Shallow clone of each match object (new object, same competitor references)
- Shallow clone of each competitor object (new object, same primitive values)

This creates a new array and new match objects, but shares competitor objects between the original and cloned bracket. This is safe because competitors are never mutated — only match properties (winner, competitorA, competitorB) are modified.

## Consequences

### Positive

- Eliminates code duplication
- Single source of truth for clone logic
- Easy to modify clone strategy in one place
- Exported from `utils.ts` for use across the engine

### Negative

- `utils.ts` now contains a mix of public utilities and internal helpers
- `cloneMatches` is exported but not part of the public API (not re-exported from `index.ts`)

### Mitigation

- `cloneMatches` is exported from `utils.ts` for engine-internal use but not from the public `index.ts`
- Could be moved to a separate `internal-utils.ts` if the public API surface grows
