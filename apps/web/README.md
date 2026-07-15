# Jadval Web Application

Next.js application for the Karate Tournament Bracket Builder.

## Purpose

This is the main web application that provides:

- Tournament creation and management
- Category and competitor management
- Interactive bracket visualization
- Public bracket viewing
- Real-time updates via Supabase

## Structure

```
app/              - Next.js App Router pages and API routes
components/       - React components
  ui/             - Reusable UI primitives (shadcn/ui)
  tournament/     - Tournament-specific components
  category/       - Category-specific components
  bracket/        - Bracket visualization components
  shared/         - Cross-cutting components
hooks/            - Custom React hooks
lib/              - Utilities and Supabase client
styles/           - Global styles
```

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript type checking
```

## Architecture

This application follows the architecture defined in `docs/ARCHITECTURE.md`.

Key principles:

- Business logic lives in `packages/bracket-engine`
- UI components are presentational only
- Server Components by default, Client Components only when needed
- All data flows through the database (Supabase)
