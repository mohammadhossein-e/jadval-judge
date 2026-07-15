# Karate Tournament Bracket Builder

A web-based SaaS platform for creating and managing single-elimination brackets for karate kata tournaments.

## Overview

Jadval simplifies tournament organization by automatically creating and managing competition brackets. Tournament organizers can:

- Create tournaments with multiple categories
- Add competitors with optional seeding
- Generate fair single-elimination brackets with automatic BYE calculation
- Record match results with automatic winner advancement
- Share brackets publicly with real-time updates

## Project Structure

```
jadval/
├── apps/
│   └── web/                  # Next.js application
├── packages/
│   ├── bracket-engine/       # Pure TypeScript bracket logic
│   ├── types/                # Shared TypeScript types
│   ├── config/               # Shared configuration
│   ├── db/                   # Database client (Supabase)
│   └── ui/                   # Shared UI components
├── docs/                     # Documentation
│   ├── PRD.md                # Product Requirements Document
│   ├── ARCHITECTURE.md       # System Architecture
│   └── AI_RULES.md           # Development Principles
└── turbo.json                # Turborepo configuration
```

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: Supabase Realtime
- **Hosting**: Vercel

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
cd apps/web
npm run dev
```

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build all packages
npm run lint       # Lint all packages
npm run typecheck  # Type check all packages
npm run test       # Run all tests
```

## Architecture

This project follows a layered architecture with strict separation of concerns:

- **Presentation Layer**: Next.js pages and React components
- **API Layer**: Next.js route handlers
- **Business Logic Layer**: Pure TypeScript bracket engine
- **Data Layer**: Supabase (PostgreSQL)

See `docs/ARCHITECTURE.md` for detailed design decisions.

## Versioning

- **v1.0 (MVP)**: Single Elimination Kata
- **v1.1**: Repechage
- **v1.2**: Round Robin
- **v1.3**: Group Stage + Knockout
- **v2.0**: Kumite

## License

MIT
