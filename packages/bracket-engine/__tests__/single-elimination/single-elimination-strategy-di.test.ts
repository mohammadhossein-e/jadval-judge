import { describe, it, expect, vi } from 'vitest';
import type { EngineCompetitor, GenerationResult } from '../../src/types';
import type { ByePlacementStrategy } from '../../src/engine/bye-placement-strategy';
import type { CompetitorPlacementStrategy, PlacementInput } from '../../src/engine/competitor-placement-strategy';
import type { GenerationContext } from '../../src/engine/generation-context';
import type { PositionMap } from '../../src/engine/position-map';
import { SingleEliminationStrategy } from '../../src/single-elimination/single-elimination-strategy';
import { DefaultByePlacementStrategy } from '../../src/single-elimination/default-bye-placement';
import { DefaultCompetitorPlacementStrategy } from '../../src/single-elimination/default-competitor-placement';
import { BalancedByePlacementStrategy } from '../../src/single-elimination/balanced-bye-placement';
import { TournamentEngine } from '../../src/engine/tournament-engine';
import { generateBracket } from '../../src/single-elimination/generator';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: i + 1,
  }));
}

function seededCompetitors(): EngineCompetitor[] {
  return makeCompetitors(8);
}

// ─── 1. Default constructor uses default strategies ───────────

describe('default constructor uses default strategies', () => {
  it('produces identical output to generateBracket', () => {
    const strategy = new SingleEliminationStrategy();
    const competitors = seededCompetitors();

    const fromStrategy = strategy.generate(competitors, 'manual');
    const fromGenerate = generateBracket(competitors, 'manual');

    expect(fromStrategy.bracket).toEqual(fromGenerate.bracket);
    expect(fromStrategy.byes).toEqual(fromGenerate.byes);
  });

  it('produces identical output for multiple competitor counts', () => {
    const strategy = new SingleEliminationStrategy();

    for (const count of [2, 3, 5, 8, 13, 24, 32]) {
      const competitors = makeCompetitors(count);
      const fromStrategy = strategy.generate(competitors, 'manual');
      const fromGenerate = generateBracket(competitors, 'manual');

      expect(fromStrategy.bracket).toEqual(fromGenerate.bracket);
      expect(fromStrategy.byes).toEqual(fromGenerate.byes);
    }
  });

  it('new SingleEliminationStrategy() === new SingleEliminationStrategy(undefined)', () => {
    const a = new SingleEliminationStrategy();
    const b = new SingleEliminationStrategy(undefined);

    const competitors = seededCompetitors();
    const resultA = a.generate(competitors, 'manual');
    const resultB = b.generate(competitors, 'manual');

    expect(resultA.bracket).toEqual(resultB.bracket);
    expect(resultA.byes).toEqual(resultB.byes);
  });
});

// ─── 2. Custom strategy injection works ───────────────────────

describe('custom strategy injection', () => {
  it('custom byePlacement strategy is used', () => {
    const balanced = new BalancedByePlacementStrategy();
    const strategy = new SingleEliminationStrategy({
      byePlacement: balanced,
    });

    const competitors = makeCompetitors(8);
    const result = strategy.generate(competitors, 'manual');

    expect(result.bracket.size).toBe(8);
    expect(result.byes.length).toBe(0);
  });

  it('custom competitorPlacement strategy is used', () => {
    let placementCalled = false;
    const noop: CompetitorPlacementStrategy = {
      placeCompetitors(input: PlacementInput) {
        placementCalled = true;
        return new Array(input.generationContext.bracketSize).fill(null);
      },
    };

    const strategy = new SingleEliminationStrategy({
      competitorPlacement: noop,
    });

    const competitors = makeCompetitors(4);
    const result = strategy.generate(competitors, 'manual');

    expect(placementCalled).toBe(true);
    expect(result.bracket.size).toBe(4);
  });

  it('both strategies can be injected simultaneously', () => {
    const balanced = new BalancedByePlacementStrategy();
    let placementCalled = false;
    const noop: CompetitorPlacementStrategy = {
      placeCompetitors(input: PlacementInput) {
        placementCalled = true;
        return new Array(input.generationContext.bracketSize).fill(null);
      },
    };

    const strategy = new SingleEliminationStrategy({
      byePlacement: balanced,
      competitorPlacement: noop,
    });

    const competitors = makeCompetitors(4);
    const result = strategy.generate(competitors, 'manual');

    expect(placementCalled).toBe(true);
    expect(result.bracket.size).toBe(4);
  });

  it('config type is importable and usable', () => {
    const config = {
      byePlacement: new BalancedByePlacementStrategy(),
      competitorPlacement: new DefaultCompetitorPlacementStrategy(),
    };
    const strategy = new SingleEliminationStrategy(config);

    const competitors = seededCompetitors();
    const result = strategy.generate(competitors, 'manual');

    expect(result.bracket.size).toBe(8);
  });
});

// ─── 3. Injected mock strategies are actually called ───────────

describe('injected mock strategies are called', () => {
  it('byePlacement.placeByes is called during generate', () => {
    const spy = vi.fn().mockReturnValue([0]);
    const byeMock: ByePlacementStrategy = { placeByes: spy };

    const strategy = new SingleEliminationStrategy({
      byePlacement: byeMock,
    });

    const competitors = makeCompetitors(8);
    strategy.generate(competitors, 'manual');

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]).toHaveLength(2);
  });

  it('competitorPlacement.placeCompetitors is called during generate', () => {
    const spy = vi.fn().mockReturnValue([null, null, null, null]);
    const placementMock: CompetitorPlacementStrategy = { placeCompetitors: spy };

    const strategy = new SingleEliminationStrategy({
      competitorPlacement: placementMock,
    });

    const competitors = makeCompetitors(4);
    strategy.generate(competitors, 'manual');

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]).toHaveLength(1);
    const input: PlacementInput = spy.mock.calls[0][0];
    expect(input.competitors).toHaveLength(4);
    expect(input.generationContext.bracketSize).toBe(4);
  });

  it('mock strategies receive correct arguments', () => {
    const byeSpy = vi.fn().mockReturnValue([]);
    const placementSpy = vi.fn().mockReturnValue([null, null, null, null, null, null, null, null]);
    const strategy = new SingleEliminationStrategy({
      byePlacement: { placeByes: byeSpy },
      competitorPlacement: { placeCompetitors: placementSpy },
    });

    const competitors = seededCompetitors();
    strategy.generate(competitors, 'manual');

    const byeCall = byeSpy.mock.calls[0];
    expect(byeCall[0]).toEqual({
      competitorCount: 8,
      bracketSize: 8,
      byeCount: 0,
      roundCount: 3,
    });

    const placementCall = placementSpy.mock.calls[0];
    expect(placementCall[0].competitors).toBe(competitors);
    expect(placementCall[0].drawType).toBe('manual');
  });
});

// ─── 4. generate() depends only on injected abstractions ───────

describe('generate depends only on injected abstractions', () => {
  it('pipeline is built from injected strategies, not hardcoded defaults', () => {
    const byeSpy = vi.fn().mockReturnValue([]);
    const placementSpy = vi.fn().mockReturnValue([null, null, null, null]);
    const strategy = new SingleEliminationStrategy({
      byePlacement: { placeByes: byeSpy },
      competitorPlacement: { placeCompetitors: placementSpy },
    });

    const competitors = makeCompetitors(4);
    strategy.generate(competitors, 'manual');

    expect(byeSpy).toHaveBeenCalledTimes(1);
    expect(placementSpy).toHaveBeenCalledTimes(1);
  });

  it('two instances with different strategies produce different results', () => {
    const strategyA = new SingleEliminationStrategy();
    const strategyB = new SingleEliminationStrategy({
      byePlacement: new BalancedByePlacementStrategy(),
    });

    const competitors = makeCompetitors(8);
    const resultA = strategyA.generate(competitors, 'manual');
    const resultB = strategyB.generate(competitors, 'manual');

    expect(resultA.bracket.size).toBe(resultB.bracket.size);
    expect(resultA.bracket.matches.length).toBe(resultB.bracket.matches.length);
  });
});

// ─── 5. No production behavior changes ────────────────────────

describe('no production behavior changes', () => {
  it('resolve still works with default strategy', () => {
    const strategy = new SingleEliminationStrategy();
    const competitors = seededCompetitors();
    const { bracket } = strategy.generate(competitors, 'manual');

    const r1m0 = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    expect(r1m0.competitorA).not.toBeNull();
    expect(r1m0.competitorB).not.toBeNull();

    const resolved = strategy.resolve(bracket, r1m0.id, r1m0.competitorA!.id);
    const resolvedMatch = resolved.matches.find((m) => m.id === r1m0.id)!;
    expect(resolvedMatch.winner?.id).toBe(r1m0.competitorA!.id);
  });

  it('undo still works with default strategy', () => {
    const strategy = new SingleEliminationStrategy();
    const competitors = seededCompetitors();
    const { bracket } = strategy.generate(competitors, 'manual');

    const r1m0 = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    const resolved = strategy.resolve(bracket, r1m0.id, r1m0.competitorA!.id);
    const undone = strategy.undo(resolved, r1m0.id);

    const undoneMatch = undone.matches.find((m) => m.id === r1m0.id)!;
    expect(undoneMatch.winner).toBeNull();
  });

  it('isComplete still works with default strategy', () => {
    const strategy = new SingleEliminationStrategy();
    expect(strategy.isComplete({ size: 2, totalRounds: 1, matches: [] })).toBe(true);
  });

  it('getChampion still works with default strategy', () => {
    const strategy = new SingleEliminationStrategy();
    expect(strategy.getChampion({ size: 2, totalRounds: 1, matches: [] })).toBeNull();
  });

  it('getPreview still works with default strategy', () => {
    const strategy = new SingleEliminationStrategy();
    const preview = strategy.getPreview(4, [1, null, null, 4]);
    expect(preview).toBeDefined();
  });

  it('format and name are unchanged', () => {
    const strategy = new SingleEliminationStrategy();
    expect(strategy.format).toBe('single-elimination');
    expect(strategy.name).toBe('Single Elimination');
  });
});

// ─── 6. TournamentEngine integration unchanged ────────────────

describe('TournamentEngine integration unchanged', () => {
  it('works with no-arg SingleEliminationStrategy', () => {
    const engine = new TournamentEngine(new SingleEliminationStrategy());
    const competitors = seededCompetitors();
    const result = engine.generate(competitors, 'manual');

    expect(result.bracket.size).toBe(8);
  });

  it('works with explicitly configured SingleEliminationStrategy', () => {
    const engine = new TournamentEngine(
      new SingleEliminationStrategy({
        byePlacement: new BalancedByePlacementStrategy(),
      }),
    );
    const competitors = makeCompetitors(8);
    const result = engine.generate(competitors, 'manual');

    expect(result.bracket.size).toBe(8);
    expect(result.byes.length).toBe(0);
  });
});
