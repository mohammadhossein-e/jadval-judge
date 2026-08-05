import { describe, it, expect } from 'vitest';
import type { EngineCompetitor, GenerationResult } from '../../src/types';
import type { CompetitorPlacementStrategy, PlacementInput } from '../../src/engine/competitor-placement-strategy';
import type { PositionMap } from '../../src/engine/position-map';
import {
  GenerationPipeline,
  createPipelineContext,
} from '../../src/engine/pipeline';
import { DefaultCompetitorPlacementStrategy } from '../../src/single-elimination/default-competitor-placement';
import {
  createCompetitorPlacementStep,
  createSingleEliminationSteps,
  SINGLE_ELIMINATION_STEPS,
} from '../../src/single-elimination/generation-steps';
import { generateBracket } from '../../src/single-elimination/generator';
import { calculateByeDistribution } from '../../src/single-elimination/bye-distribution';
import { DefaultByePlacementStrategy } from '../../src/single-elimination/default-bye-placement';

// ─── Helpers ──────────────────────────────────────────────────

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: i + 1,
  }));
}

function runPipeline(
  steps: readonly import('../../src/engine/pipeline').PipelineStep[],
  competitorCount: number,
): GenerationResult {
  const competitors = makeCompetitors(competitorCount);
  const ctx = createPipelineContext(competitors, 'manual');
  const pipeline = new GenerationPipeline(steps);
  const result = pipeline.run(ctx);
  return { bracket: result.bracket!, byes: result.byes! };
}

// ─── 1. Interface conformance ─────────────────────────────────

describe('CompetitorPlacementStrategy interface conformance', () => {
  it('DefaultCompetitorPlacementStrategy satisfies the interface', () => {
    const strategy: CompetitorPlacementStrategy = new DefaultCompetitorPlacementStrategy();
    expect(typeof strategy.placeCompetitors).toBe('function');
  });

  it('DefaultCompetitorPlacementStrategy returns an array of correct length', () => {
    const strategy = new DefaultCompetitorPlacementStrategy();
    const competitors = makeCompetitors(5);
    const ctx = createPipelineContext(competitors, 'manual');

    const input: PlacementInput = {
      competitors,
      generationContext: ctx.generationContext,
      positionMap: [],
      byePositions: new Set([1, 3, 5]),
      drawType: 'manual',
    };

    const result = strategy.placeCompetitors(input);
    expect(result).toHaveLength(8);
  });

  it('returns sorted position indices (placeholder)', () => {
    const strategy = new DefaultCompetitorPlacementStrategy();
    const competitors = makeCompetitors(5);
    const ctx = createPipelineContext(competitors, 'manual');

    const input: PlacementInput = {
      competitors,
      generationContext: ctx.generationContext,
      positionMap: [],
      byePositions: new Set([1, 3, 5]),
      drawType: 'manual',
    };

    const result = strategy.placeCompetitors(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(8);
  });
});

// ─── 2. Pipeline with DefaultCompetitorPlacementStrategy ──────

describe('pipeline with DefaultCompetitorPlacementStrategy', () => {
  const defaultSteps = createSingleEliminationSteps(
    new DefaultByePlacementStrategy(),
    new DefaultCompetitorPlacementStrategy(),
  );

  for (const count of [3, 5, 8, 13]) {
    it(`produces valid bracket for ${count} competitors`, () => {
      const { bracket, byes } = runPipeline(defaultSteps, count);

      expect(bracket.size).toBe(Math.max(2, 2 ** Math.ceil(Math.log2(count))));
      expect(bracket.matches.length).toBe(bracket.size - 1);
      expect(byes.length).toBe(bracket.size - count);
    });
  }

  it('matches generateBracket output exactly', () => {
    const competitors = makeCompetitors(8);
    const fromPipeline = runPipeline(defaultSteps, 8);
    const fromGenerate = generateBracket(competitors, 'manual');

    expect(fromPipeline.bracket).toEqual(fromGenerate.bracket);
    expect(fromPipeline.byes).toEqual(fromGenerate.byes);
  });

  it('matches SINGLE_ELIMINATION_STEPS output', () => {
    const fromFactory = runPipeline(defaultSteps, 13);
    const fromConstant = runPipeline(SINGLE_ELIMINATION_STEPS, 13);

    expect(fromFactory.bracket).toEqual(fromConstant.bracket);
    expect(fromFactory.byes).toEqual(fromConstant.byes);
  });
});

// ─── 3. Swapping strategy changes only placement behavior ─────

describe('strategy swap affects only placement', () => {
  /**
   * A deterministic strategy that places competitors in reverse
   * seed order at non-BYE positions.  All competitors go at the
   * front of the non-BYE list in reverse seed order.
   */
  class ReversePlacementStrategy implements CompetitorPlacementStrategy {
    placeCompetitors(input: PlacementInput): readonly (EngineCompetitor | null)[] {
      const { competitors, generationContext, byePositions } = input;

      const positions: (EngineCompetitor | null)[] = new Array(
        generationContext.bracketSize,
      ).fill(null);

      const nonByePositions: number[] = [];
      for (let pos = 0; pos < generationContext.bracketSize; pos++) {
        if (!byePositions.has(pos)) {
          nonByePositions.push(pos);
        }
      }

      const reversed = [...competitors].reverse();
      for (let i = 0; i < nonByePositions.length && i < reversed.length; i++) {
        positions[nonByePositions[i]] = reversed[i];
      }

      return positions;
    }
  }

  it('custom strategy is accepted by the pipeline', () => {
    const steps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new ReversePlacementStrategy(),
    );
    const { bracket, byes } = runPipeline(steps, 5);

    expect(bracket.size).toBe(8);
    expect(byes.length).toBe(3);
  });

  it('bracket structure is identical with different placement strategy', () => {
    const defaultSteps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new DefaultCompetitorPlacementStrategy(),
    );
    const reverseSteps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new ReversePlacementStrategy(),
    );

    const defaultResult = runPipeline(defaultSteps, 8);
    const reverseResult = runPipeline(reverseSteps, 8);

    expect(defaultResult.bracket.size).toBe(reverseResult.bracket.size);
    expect(defaultResult.bracket.totalRounds).toBe(reverseResult.bracket.totalRounds);
    expect(defaultResult.bracket.matches.length).toBe(reverseResult.bracket.matches.length);
    expect(defaultResult.byes.length).toBe(reverseResult.byes.length);
  });

  it('BYE positions are identical between different placement strategies', () => {
    const defaultSteps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new DefaultCompetitorPlacementStrategy(),
    );
    const reverseSteps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new ReversePlacementStrategy(),
    );

    const defaultResult = runPipeline(defaultSteps, 8);
    const reverseResult = runPipeline(reverseSteps, 8);

    const defaultByePositions = defaultResult.byes.map((b) => b.position).sort((a, b) => a - b);
    const reverseByePositions = reverseResult.byes.map((b) => b.position).sort((a, b) => a - b);

    expect(defaultByePositions).toEqual(reverseByePositions);
  });

  it('non-BYE match assignments differ between strategies', () => {
    const defaultSteps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new DefaultCompetitorPlacementStrategy(),
    );
    const reverseSteps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new ReversePlacementStrategy(),
    );

    const defaultResult = runPipeline(defaultSteps, 8);
    const reverseResult = runPipeline(reverseSteps, 8);

    const defaultNonBye = defaultResult.bracket.matches
      .filter((m) => !m.isBye)
      .map((m) => ({ id: m.id, a: m.competitorA?.id, b: m.competitorB?.id }));
    const reverseNonBye = reverseResult.bracket.matches
      .filter((m) => !m.isBye)
      .map((m) => ({ id: m.id, a: m.competitorA?.id, b: m.competitorB?.id }));

    expect(defaultNonBye).not.toEqual(reverseNonBye);
  });
});

// ─── 4. Pipeline does not require modification ────────────────

describe('pipeline unchanged when strategy is swapped', () => {
  it('createCompetitorPlacementStep returns a step named CompetitorPlacement', () => {
    const step = createCompetitorPlacementStep(new DefaultCompetitorPlacementStrategy());
    expect(step.name).toBe('CompetitorPlacement');
  });

  it('createSingleEliminationSteps returns 7 steps', () => {
    const steps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new DefaultCompetitorPlacementStrategy(),
    );
    expect(steps).toHaveLength(7);
  });

  it('step names match expected order', () => {
    const steps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new DefaultCompetitorPlacementStrategy(),
    );
    expect(steps.map((s) => s.name)).toEqual([
      'SkeletonBuilder',
      'PositionMapBuilder',
      'ByePlacement',
      'CompetitorPlacement',
      'MatchPopulation',
      'ByeResolution',
      'BracketAssembly',
    ]);
  });

  it('pipeline with custom strategy runs all steps', () => {
    class NoopPlacement implements CompetitorPlacementStrategy {
      placeCompetitors(input: PlacementInput): readonly (EngineCompetitor | null)[] {
        return new Array(input.generationContext.bracketSize).fill(null);
      }
    }

    const steps = createSingleEliminationSteps(
      new DefaultByePlacementStrategy(),
      new NoopPlacement(),
    );
    const competitors = makeCompetitors(4);
    const ctx = createPipelineContext(competitors, 'manual');
    const pipeline = new GenerationPipeline(steps);
    const result = pipeline.run(ctx);

    expect(result.bracket).not.toBeNull();
    expect(result.byes).not.toBeNull();
    expect(result.matches).not.toBeNull();
  });
});

// ─── 5. Supplied placements respect BYE positions (real UI path) ──

/**
 * Mirrors how the web app draws: it supplies a full placements map
 * covering positions 0..n-1 (see apps/web/lib/draw.ts). The official
 * BYE positions must stay reserved and the competitors must keep their
 * supplied draw order among the non-BYE positions.
 */
describe('DefaultCompetitorPlacementStrategy with supplied placements', () => {
  const cases: Array<{ n: number; bracketSize: number }> = [
    { n: 5, bracketSize: 8 },
    { n: 9, bracketSize: 16 },
    { n: 13, bracketSize: 16 },
    { n: 17, bracketSize: 32 },
  ];

  function slotsByMatch(matches: GenerationResult['bracket']['matches']): Map<number, string> {
    const slots = new Map<number, string>();
    for (const match of matches) {
      if (match.round !== 1) continue;
      if (match.competitorA) slots.set(match.position * 2, match.competitorA.id);
      if (match.competitorB) slots.set(match.position * 2 + 1, match.competitorB.id);
    }
    return slots;
  }

  function emptySlots(matches: GenerationResult['bracket']['matches']): number[] {
    const slots: number[] = [];
    for (const match of matches) {
      if (match.round !== 1) continue;
      if (!match.competitorA) slots.push(match.position * 2);
      if (!match.competitorB) slots.push(match.position * 2 + 1);
    }
    return slots;
  }

  it.each(cases)(
    '$n competitors: BYE positions match calculateByeDistribution, order preserved, no double occupancy',
    ({ n, bracketSize }) => {
      const competitors = makeCompetitors(n);
      const placements = new Map(competitors.map((c, i) => [i, c.id]));
      const { bracket, byes } = generateBracket(competitors, 'random', placements);

      expect(bracket.size).toBe(bracketSize);

      const official = calculateByeDistribution(n);
      const reported = byes.map((b) => b.position).sort((a, b) => a - b);
      expect(reported).toEqual([...official.byePositions].sort((a, b) => a - b));

      const slots = slotsByMatch(bracket.matches);

      for (const pos of slots.keys()) {
        expect(official.byePositions.includes(pos)).toBe(false);
      }

      const ids = [...slots.values()];
      expect(ids).toHaveLength(n);
      expect(new Set(ids).size).toBe(n);
      expect(ids).toEqual(competitors.map((c) => c.id));
    },
  );

  it('9 competitors: does NOT produce 7 consecutive empty positions at the end (regression)', () => {
    const competitors = makeCompetitors(9);
    const placements = new Map(competitors.map((c, i) => [i, c.id]));
    const { bracket } = generateBracket(competitors, 'random', placements);

    const official = calculateByeDistribution(9);
    const empties = emptySlots(bracket.matches).sort((a, b) => a - b);

    expect(empties).toEqual([...official.byePositions].sort((a, b) => a - b));
    expect(empties).not.toEqual([9, 10, 11, 12, 13, 14, 15]);
    expect(empties.every((pos) => official.byePositions.includes(pos))).toBe(true);
  });
});
