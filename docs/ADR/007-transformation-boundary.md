# ADR-007: Engine Input/Output Transformation Boundary

**Status:** Accepted  
**Date:** 2026-07-10  
**Decision Makers:** Project Lead

## Context

The database world and the engine world use different type shapes:

**Database world:**
```typescript
Competitor { id: UUID, categoryId: UUID, name: string, club: string, seed: number | null }
Match { id: UUID, competitorAId: UUID | null, competitorBId: UUID | null, winnerId: UUID | null }
```

**Engine world:**
```typescript
EngineCompetitor { id: string, name: string, seed: number | null }
EngineMatch { competitorA: EngineCompetitor | null, competitorB: EngineCompetitor | null, winner: EngineCompetitor | null }
```

## Decision

The route handler layer acts as a transformation boundary between database types and engine types.

### Transformation Rules

1. **Database → Engine**: Route handler fetches competitors from DB, transforms to `EngineCompetitor[]` (strips `categoryId`, `club`, `createdAt`). Fetches matches, transforms to `EngineMatch[]` (replaces ID references with embedded competitor objects).

2. **Engine → Database**: After engine operations, route handler extracts IDs from engine results and updates database records.

3. **App Layer (current)**: Since there is no database yet, the app layer maintains its own state and transforms directly to engine types.

### App Layer Transformation

```typescript
// In useBracketGeneration.ts
function toEngineCompetitor(c: CompetitorInput): EngineCompetitor {
  return { id: c.id, name: c.name, seed: c.seed };
}
```

## Consequences

### Positive

- Engine remains completely independent of database schema
- Engine types are simple and focused (no timestamps, no foreign keys)
- Clear boundary between persistence and business logic

### Negative

- Transformation code must be maintained in the route handler layer
- Type alignment between engine and database types must be kept in sync
- Additional code for each new field that crosses the boundary

### Future Consideration

When Supabase is integrated, the transformation will move to route handlers. The current app-layer transformation will be replaced.
