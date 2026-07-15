# ADR-003: Layered Monolith with Turborepo

**Status:** Accepted  
**Date:** 2026-07-01  
**Decision Makers:** Project Lead

## Context

The project needs:
- Separation of concerns (UI, API, business logic, data)
- Independent packages (bracket engine publishable to npm)
- Shared configuration (TypeScript, linting)
- Single deployment unit for MVP simplicity

## Decision

Use a Turborepo monorepo with npm workspaces, structured as a layered monolith.

### Layers

1. **Presentation Layer** — Next.js App Router (pages, layouts, server components, client components)
2. **API Layer** — Next.js Route Handlers (REST API, request validation)
3. **Business Logic Layer** — `@jadval/bracket-engine` (pure TypeScript, zero dependencies)
4. **Data Layer** — Supabase (PostgreSQL, Auth, Realtime)

### Workspace Structure

```
jadval/
├── apps/web/              # Next.js application
├── packages/bracket-engine/  # Standalone bracket logic
├── packages/types/           # Shared TypeScript types
├── packages/config/          # Shared TypeScript config
└── packages/db/              # Database client (placeholder)
```

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| Full microservices | Overkill for MVP. Adds deployment complexity and network latency. |
| Serverless functions (separate) | Cold-start latency, harder to share types. Next.js route handlers give serverless benefits inside a single deployment. |
| Flat Next.js app | Violates separation of business logic from UI. Makes testing impossible without mocking Supabase. |
| Engine as part of the app | Violates publishability requirement. Tangles business logic with application code. |

## Consequences

### Positive

- Clean separation without infrastructure overhead
- Publishable business logic as an independent npm package
- Testable engine in complete isolation
- Clear mental model for contributors
- Easy to extract into a microservice later if needed

### Negative

- Turborepo adds build tooling complexity
- Must maintain workspace linking
- Package versioning requires coordination
