# ADR-001: Standalone Bracket Engine Package

**Status:** Accepted  
**Date:** 2026-07-01  
**Decision Makers:** Project Lead

## Context

The bracket engine is the core business logic of the tournament system. It needs to be:
- Testable in isolation (no React, no database, no HTTP)
- Publishable to npm for other tournament apps
- Usable by React Native, CLI tools, edge functions
- Independent of any framework or runtime

## Decision

Create `@jadval/bracket-engine` as a standalone TypeScript package with zero runtime dependencies.

### Package Constraints

| Dependency Type | Allowed | Reason |
|---|---|---|
| React / Next.js | No | UI must not leak into business logic |
| Supabase / PostgreSQL | No | Database must not be in the engine |
| Node.js built-ins | No | Must work in browser, Node.js, and edge |
| HTTP / fetch | No | Engine must not make network calls |
| File system | No | Engine must not read/write files |
| Other npm packages | No | Zero dependencies for portability |
| TypeScript types only | Yes | Engine defines its own types |

### Engine Types Are Self-Contained

Engine types (`EngineCompetitor`, `EngineMatch`, `EngineBracket`) do not import from `packages/types` or any other package. This ensures independent npm publishing.

## Consequences

### Positive

- Complete isolation for unit testing
- Can be published to npm independently
- Framework-agnostic (React, React Native, Vue, Svelte, vanilla JS)
- Runtime-agnostic (browser, Node.js, Deno, Cloudflare Workers)
- Forces clean separation of business logic from UI

### Negative

- Type duplication between `packages/bracket-engine/src/types.ts` and `packages/types/`
- Must maintain type alignment manually
- Cannot use shared utility libraries

### Mitigation

- Engine types are intentionally minimal and stable
- App layer transforms between engine types and database types at the boundary
- Documentation clearly defines the transformation contract
