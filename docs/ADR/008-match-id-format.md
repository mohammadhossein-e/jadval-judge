# ADR-008: Match ID Format Convention

**Status:** Accepted  
**Date:** 2026-07-10  
**Decision Makers:** Project Lead

## Context

Matches need unique identifiers that:
- Are human-readable for debugging
- Encode round and position information
- Are deterministic (same bracket = same IDs)
- Work with the Map-based lookup pattern

## Decision

Use the format `R{round}P{position}` where:
- `round` is 1-indexed (1 = first round)
- `position` is 0-indexed within the round

### Examples

| Match | ID |
|---|---|
| Round 1, Position 0 | `R1P0` |
| Round 1, Position 3 | `R1P3` |
| Round 2, Position 0 | `R2P0` |
| Final (round 3), Position 0 | `R3P0` |

### ID Generation

IDs are generated in `buildMatches()` within `generator.ts`:
```typescript
// Round 1
`R1P${p}`  // where p = 0, 1, 2, ...

// Subsequent rounds
`R${r}P${p}`  // where r = round, p = position
```

## Consequences

### Positive

- Human-readable in debugging and logs
- Deterministic (same bracket size + same structure = same IDs)
- Easy to parse for debugging (extract round and position from string)
- Compact and URL-safe

### Negative

- IDs are not UUIDs (cannot be used as primary keys in PostgreSQL without a mapping)
- If bracket structure changes, IDs change (not stable across regeneration)

### Mitigation

When Supabase is integrated, database matches will use UUID primary keys. The engine's `R{round}P{position}` IDs will be used internally and mapped to database UUIDs at the route handler boundary.
