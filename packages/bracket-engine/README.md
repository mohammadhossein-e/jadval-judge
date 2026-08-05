# @jadval/bracket-engine

Pure TypeScript bracket engine for tournament formats. Zero dependencies, framework-independent.

## Installation

```bash
npm install @jadval/bracket-engine
```

## Quick Start

### TournamentEngine (recommended)

```typescript
import { TournamentEngine, SingleEliminationStrategy, defaultGenerateValidators } from '@jadval/bracket-engine';

const engine = new TournamentEngine(new SingleEliminationStrategy(), {
  generateValidators: defaultGenerateValidators(),
});

const competitors = [
  { id: '1', name: 'Alice', seed: 1 },
  { id: '2', name: 'Bob', seed: 2 },
  { id: '3', name: 'Charlie', seed: 3 },
  { id: '4', name: 'Diana', seed: 4 },
];

// Generate bracket
const { bracket, byes } = engine.generate(competitors, 'random');

// Resolve matches round by round
const match = bracket.matches.find((m) => m.round === 1 && !m.isBye);
const updated = engine.resolve(bracket, match.id, match.competitorA.id);

// Undo a result
const undone = engine.undo(updated, match.id);

// Check state
engine.isComplete(updated);       // false
engine.getChampion(updated);      // null or EngineCompetitor

// Preview without generating
engine.getPreview(competitors.length, seeds);
```

### Legacy API

```typescript
import { generateBracket, resolveMatch, cascadeUndo, isBracketComplete, getChampion } from '@jadval/bracket-engine';

const { bracket } = generateBracket(competitors, 'random');
const updated = resolveMatch(bracket, 'R1P0', 'c1');
```

### Custom Strategy Injection

Replace the default BYE or competitor placement algorithms:

```typescript
import {
  SingleEliminationStrategy,
  BalancedByePlacementStrategy,
  type ByePlacementStrategy,
  type CompetitorPlacementStrategy,
} from '@jadval/bracket-engine';

class MyByeStrategy implements ByePlacementStrategy {
  placeByes(context, positionMap) {
    // Custom BYE position logic
    return [0, 3]; // positions that receive BYEs
  }
}

const strategy = new SingleEliminationStrategy({
  byePlacement: new BalancedByePlacementStrategy(),
  competitorPlacement: new MyCompetitorStrategy(),
});

const engine = new TournamentEngine(strategy);
```

## Features

- **Single Elimination** bracket generation with BYE handling
- **Tournament seeding** (standard bracket seeding)
- **Match resolution** with winner advancement
- **Cascade undo** — undo a result and propagate through subsequent rounds
- **Bracket preview** — compute bracket size, BYE count, and rounds without generating
- **Custom validation** — plug in validators for generate and resolve operations
- **DI-ready strategies** — swap BYE placement and competitor placement algorithms
- **7-step pipeline** — extensible architecture for custom tournament formats

## API Reference

### Types

| Type | Description |
|------|-------------|
| `EngineCompetitor` | `{ id, name, seed }` |
| `EngineMatch` | Match with competitors, winner, links |
| `EngineBracket` | Bracket with size, rounds, matches |
| `GenerationResult` | `{ bracket, byes }` |
| `BracketPreview` | Preview info for a competitor count |

### Engine

| Export | Description |
|--------|-------------|
| `TournamentEngine` | Primary API — orchestrates validation + strategy |
| `SingleEliminationStrategy` | Single-elimination format implementation |
| `SingleEliminationStrategyConfig` | Config for DI-injectable placement strategies |

### Strategies

| Export | Description |
|--------|-------------|
| `DefaultByePlacementStrategy` | Seeding-based BYE placement (default) |
| `DefaultCompetitorPlacementStrategy` | Seeding-based competitor placement (default) |
| `BalancedByePlacementStrategy` | Balanced recursive BYE distribution |

### Validation

| Export | Description |
|--------|-------------|
| `ValidationPipeline` | Runs a list of validators |
| `ValidationError` | Thrown when validation fails |
| `defaultGenerateValidators()` | Standard generate validators (min/max/unique/names) |
| `defaultResolveValidators()` | Standard resolve validators (non-empty IDs) |

## Philosophy

- **Pure functions** — input in, output out. No mutations, no side effects.
- **Zero dependencies** — no runtime dependencies. Builds to ESM + CJS + DTS.
- **Engine/Format separation** — `src/engine/` is format-agnostic; `src/single-elimination/` is format-specific. Engine never imports format code.
- **Backward compatible** — legacy `generateBracket`/`resolveMatch` API still works alongside the new `TournamentEngine` class.
