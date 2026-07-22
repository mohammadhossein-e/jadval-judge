# Project Bible

The constitution of Jadval. Every decision, every contribution, every architectural choice must align with the principles in this document.

---

# Project Vision

Jadval is a tournament management platform built for karate, designed to eventually serve any sport that uses brackets, pools, or round-robin formats. It exists because tournament organizers deserve a modern, open, and extensible tool — not the brittle, closed-source software they currently rely on.

The long-term direction is a SaaS platform where organizers can build any tournament format through a composable engine architecture. Karate kata is the first use case, not the only one.

---

# Core Philosophy

## Domain First

The domain — tournament management — is the center of everything. Technology choices, frameworks, and infrastructure serve the domain, not the other way around. Business logic is expressed in terms the domain expert would recognize.

## Simplicity Over Complexity

Every abstraction must earn its place. The simplest solution that works is the correct one. Complexity is tolerated only when it produces clear, measurable benefit. YAGNI is a principle, not a suggestion.

## Modular Architecture

The system is decomposed into small, focused modules. Each module has a single responsibility and a clear boundary. Modules communicate through well-defined interfaces, not shared mutable state.

## Extensibility

New tournament formats, new sports, new deployment targets — all should be possible without modifying existing, working code. The architecture must welcome new features rather than resist them.

## Scalability

Scalability here is not about handling millions of requests. It is about the system's ability to grow in functionality without collapsing under its own weight. The codebase must remain navigable and maintainable as features are added.

## Testability

Every piece of business logic must be testable in isolation. If a function cannot be tested without setting up a browser, a database, or a network, it is in the wrong layer.

---

# Non-Negotiable Rules

These rules are permanent. They apply to every contributor — human or AI. No feature, no deadline, no shortcut justifies breaking them.

1. Business logic must never live inside UI components.
2. The bracket engine must be framework-independent. It must never import React, Next.js, or any UI library.
3. Tournament engines must be pluggable. Adding a new tournament format must not require modifying the engine core.
4. Every new tournament system must be added as a Strategy. A new format is a new module, not a new branch in an existing function.
5. Never modify an existing strategy to support a different tournament type. Strategies are immutable once proven correct.
6. Prefer composition over inheritance. Assemble behavior from small, pure functions rather than building deep class hierarchies.
7. Data access must go through the Repository Pattern. No business logic or UI code may directly access the database.
8. Pure business logic. Engine functions take input and return output. No side effects, no mutations, no I/O.
9. UI should only render state. Components read state, display it, and emit events. They do not compute domain rules.
10. Single Source of Truth. Every piece of data must have exactly one authoritative location. Duplicated state is a bug.
11. Every feature should be independently replaceable. Swapping the bracket engine for a different implementation should require changing only the engine package and its direct consumers.
12. Adding a new feature should require adding modules, not modifying existing ones. If a change requires editing five existing files, the architecture is wrong.
13. Avoid large switch/if statements based on tournament type. Use polymorphism or strategy dispatch instead.
14. Follow SOLID principles where appropriate. "Where appropriate" is key — do not over-engineer for hypothetical future needs.
15. Keep architecture future-proof, but do not build for a future that may never arrive. Solve today's problems with tomorrow's extensibility in mind.

---

# Product Principles

The product evolves in a deliberate sequence. Each phase builds on the last.

1. **Start with WKF Kata.** Single-elimination brackets for karate kata tournaments. This is the foundation. Everything else is built on top of it.
2. **Then Kumite.** Score tracking, timer integration, kumite-specific rules (ippon, waza-ari, etc.).
3. **Then Round Robin.** Group stages where every competitor faces every other competitor.
4. **Then Pool.** Pool-based formats with advancement criteria.
5. **Then Custom Tournament Builder.** A visual tool where organizers compose tournament formats from building blocks.
6. **Eventually support any sport.** The architecture must make this possible, even if it is years away.

---

# Development Principles

1. **Architecture first, code second.** Understand the structure before writing a line.
2. **No premature optimization.** Measure before optimizing. Most performance problems are actually architecture problems.
3. **Small iterative changes.** Ship working increments. Avoid large, risky refactors.
4. **Every feature should be testable.** If you cannot write a test for it, you do not understand it well enough to implement it.

---

# Architecture Principles

## Tournament Engine

The engine is the heart of the system. It is a standalone, zero-dependency package that contains all tournament business logic. It must be publishable to npm and usable in any JavaScript environment — browser, Node.js, Deno, React Native.

## Strategy Pattern

Each tournament format (single elimination, repechage, round robin, pool) is implemented as a Strategy. Strategies implement a common interface. The engine delegates to the appropriate strategy based on the tournament type. New formats are new strategies, not modifications to existing code.

## Repository Pattern

All data access is abstracted behind a Repository interface. The same business logic works with localStorage, Supabase, a REST API, or any future data source. The repository is the seam between business logic and infrastructure.

## Clean Boundaries

The boundaries between layers are sacred. The presentation layer never imports from the data layer. The engine never imports from the presentation layer. Dependencies point inward — toward the domain, away from infrastructure.

## Dependency Inversion

High-level modules (business logic) must not depend on low-level modules (database, UI). Both must depend on abstractions. This is not theoretical — it is the reason the bracket engine has zero dependencies.

---

# Documentation Rules

1. Documentation is a living artifact, not a one-time deliverable.
2. Architectural decisions must be recorded before implementation begins (ADR format).
3. The project bible (this document) changes rarely. When it does, the change must be deliberate and justified.
4. Implementation details belong in handoff documents, not in the bible.
5. Every significant decision gets an ADR. No exceptions.
6. Documentation should evolve with the code. Stale documentation is worse than no documentation.

---

Last Updated: 2026-07-21
