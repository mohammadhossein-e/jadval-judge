# Shared Types

TypeScript type definitions shared across the application.

## Purpose

This package contains type definitions used by both the Next.js application and the bracket engine. It serves as the single source of truth for data shapes.

## Structure

- `tournament.ts` - Tournament entity types
- `category.ts` - Category entity types and status enums
- `competitor.ts` - Competitor entity types
- `match.ts` - Match entity types and slot definitions
- `bracket.ts` - Bracket data and preview types

## Usage

```typescript
import type { Tournament, Category, Competitor } from '@jadval/types';
```

## Guidelines

- All types should be defined as interfaces (for extensibility)
- Use string unions for enum-like values
- Keep types focused and modular
- Export from `index.ts` for convenience
