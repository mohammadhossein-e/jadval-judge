# Bracket Engine

Pure TypeScript bracket engine for tournament formats.

## Purpose

This package contains the core business logic for tournament bracket generation, match resolution, and winner advancement. It is **framework-independent** and has **zero dependencies**.

## Key Features

- Single Elimination bracket generation
- BYE calculation and distribution
- Tournament seeding algorithms
- Match winner advancement
- Cascade undo for result changes

## Usage

```typescript
import { generateBracket, resolveMatch } from '@jadval/bracket-engine';

// Generate a bracket from competitors
const result = generateBracket(competitors, 'random');

// Resolve a match winner
const updatedBracket = resolveMatch(bracket, matchId, winnerId);
```

## Architecture

This package is designed to be publishable as an independent npm package. All functions are pure — they receive plain data as input and return plain data as output.

See `docs/ARCHITECTURE.md` for detailed design decisions.
