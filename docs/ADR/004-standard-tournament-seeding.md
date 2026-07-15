# ADR-004: Standard Tournament Seeding Algorithm

**Status:** Accepted  
**Date:** 2026-07-01  
**Decision Makers:** Project Lead

## Context

Tournament brackets need a seeding algorithm that:
- Separates top seeds to opposite sides of the bracket
- Follows standard tournament conventions (1vN, 2v(N-1), etc.)
- Works for any power-of-2 bracket size
- Is deterministic and reproducible

## Decision

Use a recursive tournament seeding algorithm that produces the standard WBT (World Bridge Tournament) seeding pattern.

### Algorithm

```typescript
function standardSeeding(bracketSize: number): number[] {
  if (bracketSize === 2) return [1, 2];
  const half = standardSeeding(bracketSize / 2);
  const result: number[] = [];
  for (let i = 0; i < half.length; i++) {
    result.push(half[i]);
    result.push(bracketSize + 1 - half[i]);
  }
  return result;
}
```

### Example Output

| Bracket Size | Seeding Pattern |
|---|---|
| 2 | [1, 2] |
| 4 | [1, 4, 2, 3] |
| 8 | [1, 8, 4, 5, 2, 7, 3, 6] |
| 16 | [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11] |

### Properties

- Seed 1 and Seed 2 are always on opposite sides
- Seed 1 faces the highest seed in the first round
- Each subsequent round maintains separation
- The pattern is deterministic for a given bracket size

## Consequences

### Positive

- Follows international tournament standards
- Predictable and well-understood by tournament organizers
- Works recursively for any power-of-2 size

### Negative

- The recursive implementation may be less intuitive than iterative alternatives
- Fixed to standard seeding (cannot customize seed placement without override)
