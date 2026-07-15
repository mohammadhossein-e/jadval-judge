# ADR-002: Pure Function Architecture

**Status:** Accepted  
**Date:** 2026-07-01  
**Decision Makers:** Project Lead

## Context

The bracket engine performs stateful-seeming operations (generating brackets, resolving matches, undoing results). These could be implemented as:
- Mutable classes with methods
- Stateful services with database persistence
- Pure functions that transform data

## Decision

All bracket engine functions are pure functions: plain data in, plain data out. No classes, no side effects, no I/O.

### Function Signatures

```typescript
generateBracket(competitors, drawType, placements?) → GenerationResult
resolveMatch(bracket, matchId, winnerId) → EngineBracket
cascadeUndo(bracket, matchId) → EngineBracket
```

Each function:
1. Accepts plain JavaScript objects (POJOs)
2. Returns new plain JavaScript objects
3. Never mutates the input
4. Has no side effects (no network, no file I/O, no global state)

## Consequences

### Positive

- Simple to test (no mocking needed)
- Easy to reason about (referential transparency)
- Safe for concurrent use (no shared mutable state)
- Compatible with React's immutability expectations
- Can be serialized to JSON and sent over the wire
- Enables optimistic updates in the UI

### Negative

- Requires deep cloning on every operation (performance cost)
- Cannot cache results internally
- Caller must manage bracket state (typically in React `useState`)

### Mitigation

- `cloneMatches()` utility handles deep cloning efficiently (shallow clone of matches array, shallow clone of each match, shallow clone of competitor objects)
- Bracket sizes are small (max 128 competitors = max 127 matches), so cloning cost is negligible
- React's `useState` + `useCallback` pattern manages state naturally
