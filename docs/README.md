# Documentation

Project documentation for the Jadval Karate Tournament Bracket Builder.

## Core Documents

- **PRD.md** — Product Requirements Document
  - Product vision, goals, and MVP scope
  - 18 user stories with acceptance criteria
  - Functional and non-functional requirements
  - Business rules and data model
  - Risk analysis and versioning strategy

- **ARCHITECTURE.md** — System Architecture
  - Layered monolith with standalone engine
  - Folder structure and route definitions
  - Component hierarchy and state management
  - Data models (ERD) and TypeScript types
  - Bracket engine design and API
  - Error handling strategy

- **AI_RULES.md** — Development Principles
  - Code quality standards and TypeScript conventions
  - Architecture guidelines and separation of concerns
  - Testing requirements
  - AI contribution workflow (10 rules)

## Project Status

- **PROJECT_STATE.md** — Current project status, completed features, known limitations, test status
- **ROADMAP.md** — Version roadmap (v1.0 through v2.0) with planned features
- **CHANGELOG.md** — Major completed milestones and architectural changes

## AI Development

- **AI_CONTEXT.md** — Complete context for AI assistants: architecture, conventions, key files, data flow, things that must never change without review

## Architecture Decision Records

Decision log for significant architectural choices:

- **ADR/001** — Standalone Bracket Engine Package
- **ADR/002** — Pure Function Architecture
- **ADR/003** — Layered Monolith with Turborepo
- **ADR/004** — Standard Tournament Seeding Algorithm
- **ADR/005** — Cascade Undo for Match Results
- **ADR/006** — Client-Side State Management with React Hooks
- **ADR/007** — Engine Input/Output Transformation Boundary
- **ADR/008** — Match ID Format Convention
- **ADR/009** — Manual Draw via Drag-and-Drop
- **ADR/010** — Shared cloneMatches Utility

## Reviews

Completed architecture and code quality reviews:

- **REVIEWS/002** — Tournament Execution Review (v0.2.0)
- **REVIEWS/003** — Final MVP Review (v0.2.0)

## Maintenance

- Update documentation before implementing new features
- Keep architecture decisions current with implementation
- Review and update PRD as product requirements evolve
- Create ADR for every significant architectural decision
- Log completed milestones in CHANGELOG
