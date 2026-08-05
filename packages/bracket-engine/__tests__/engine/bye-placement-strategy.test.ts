import { describe, it, expect } from 'vitest';
import type { EngineCompetitor, EngineBracket, GenerationResult } from '../../src/types';
import type { ByePlacementStrategy } from '../../src/engine/bye-placement-strategy';
import type { GenerationContext } from '../../src/engine/generation-context';
import type { PositionMap } from '../../src/engine/position-map';
import {
  GenerationPipeline,
  createPipelineContext,
} from '../../src/engine/pipeline';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { buildSingleEliminationSkeleton } from '../../src/single-elimination/single-elimination-skeleton';
import { buildSingleEliminationPositionMap } from '../../src/single-elimination/single-elimination-position-map';
import { DefaultByePlacementStrategy } from '../../src/single-elimination/default-bye-placement';
import { BalancedByePlacementStrategy } from '../../src/single-elimination/balanced-bye-placement';
import {
  createByePlacementStep,
  createSingleEliminationSteps,
  SINGLE_ELIMINATION_STEPS,
} from '../../src/single-elimination/generation-steps';
import { generateBracket } from '../../src/single-elimination/generator';

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

describe('ByePlacementStrategy interface conformance', () => {
  it('DefaultByePlacementStrategy implements ByePlacementStrategy', () => {
    const strategy: ByePlacementStrategy = new DefaultByePlacementStrategy();
    const gc = buildGenerationContext(makeCompetitors(5));
    const skeleton = buildSingleEliminationSkeleton(gc);
    const pm = buildSingleEliminationPositionMap(skeleton);

    const result = strategy.placeByes(gc, pm);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(gc.byeCount);
  });

  it('BalancedByePlacementStrategy implements ByePlacementStrategy', () => {
    const strategy: ByePlacementStrategy = new BalancedByePlacementStrategy();
    const gc = buildGenerationContext(makeCompetitors(5));
    const skeleton = buildSingleEliminationSkeleton(gc);
    const pm = buildSingleEliminationPositionMap(skeleton);

    const result = strategy.placeByes(gc, pm);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(gc.byeCount);
  });

  it('balanced strategy returns sorted position indices', () => {
    const gc = buildGenerationContext(makeCompetitors(13));
    const skeleton = buildSingleEliminationSkeleton(gc);
    const pm = buildSingleEliminationPositionMap(skeleton);

    const balancedResult = new BalancedByePlacementStrategy().placeByes(gc, pm);

    for (let i = 1; i < balancedResult.length; i++) {
      expect(balancedResult[i]).toBeGreaterThan(balancedResult[i - 1]);
    }
  });
});

// ─── 2. Pipeline with DefaultByePlacementStrategy ─────────────

describe('pipeline with DefaultByePlacementStrategy', () => {
  const defaultSteps = createSingleEliminationSteps(
    new DefaultByePlacementStrategy(),
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

// ─── 3. Pipeline with BalancedByePlacementStrategy ────────────

describe('pipeline with BalancedByePlacementStrategy', () => {
  const balancedSteps = createSingleEliminationSteps(
    new BalancedByePlacementStrategy(),
  );

  for (const count of [3, 5, 8, 13]) {
    it(`produces valid bracket for ${count} competitors`, () => {
      const { bracket, byes } = runPipeline(balancedSteps, count);

      expect(bracket.size).toBe(Math.max(2, 2 ** Math.ceil(Math.log2(count))));
      expect(bracket.matches.length).toBe(bracket.size - 1);
      expect(byes.length).toBe(bracket.size - count);
    });
  }

  it('all BYE matches have winners advanced', () => {
    const { bracket } = runPipeline(balancedSteps, 5);

    const byeMatches = bracket.matches.filter((m) => m.isBye);
    for (const match of byeMatches) {
      expect(match.winner).not.toBeNull();
      if (match.nextMatchId) {
        const next = bracket.matches.find((m) => m.id === match.nextMatchId)!;
        const winner = match.winner!;
        expect(
          next.competitorA?.id === winner.id || next.competitorB?.id === winner.id,
        ).toBe(true);
      }
    }
  });

  it('all competitors appear in the bracket', () => {
    const { bracket } = runPipeline(balancedSteps, 8);
    const placed = bracket.matches
      .filter((m) => !m.isBye)
      .flatMap((m) => [m.competitorA, m.competitorB])
      .filter(Boolean)
      .map((c) => c!.id)
      .sort();

    expect(placed).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']);
  });
});

// ─── 4. Swapping strategies changes only BYE placement ────────

describe('strategy swap affects only BYE placement', () => {
  const defaultSteps = createSingleEliminationSteps(
    new DefaultByePlacementStrategy(),
  );
  const balancedSteps = createSingleEliminationSteps(
    new BalancedByePlacementStrategy(),
  );

  for (const count of [5, 8, 13, 24]) {
    it(`bracket structure identical for ${count} competitors`, () => {
      const defaultResult = runPipeline(defaultSteps, count);
      const balancedResult = runPipeline(balancedSteps, count);

      expect(defaultResult.bracket.size).toBe(balancedResult.bracket.size);
      expect(defaultResult.bracket.totalRounds).toBe(balancedResult.bracket.totalRounds);
      expect(defaultResult.bracket.matches.length).toBe(balancedResult.bracket.matches.length);
    });
  }

  for (const count of [5, 13]) {
    it(`BYE count identical for ${count} competitors`, () => {
      const defaultResult = runPipeline(defaultSteps, count);
      const balancedResult = runPipeline(balancedSteps, count);

      expect(defaultResult.byes.length).toBe(balancedResult.byes.length);
    });
  }

  it('BYE positions differ between strategies', () => {
    const defaultResult = runPipeline(defaultSteps, 5);
    const balancedResult = runPipeline(balancedSteps, 5);

    const defaultByePositions = defaultResult.byes.map((b) => b.position).sort((a, b) => a - b);
    const balancedByePositions = balancedResult.byes.map((b) => b.position).sort((a, b) => a - b);

    expect(defaultByePositions).not.toEqual(balancedByePositions);
  });

  it('all non-BYE matches identical between strategies', () => {
    const defaultResult = runPipeline(defaultSteps, 8);
    const balancedResult = runPipeline(balancedSteps, 8);

    const defaultNonBye = defaultResult.bracket.matches
      .filter((m) => !m.isBye)
      .map((m) => ({ id: m.id, a: m.competitorA?.id, b: m.competitorB?.id }));
    const balancedNonBye = balancedResult.bracket.matches
      .filter((m) => !m.isBye)
      .map((m) => ({ id: m.id, a: m.competitorA?.id, b: m.competitorB?.id }));

    expect(defaultNonBye).toEqual(balancedNonBye);
  });
});

// ─── 5. No other pipeline step requires modification ──────────

describe('other pipeline steps unchanged', () => {
  it('createByePlacementStep returns a step named ByePlacement', () => {
    const step = createByePlacementStep(new DefaultByePlacementStrategy());
    expect(step.name).toBe('ByePlacement');
  });

  it('createSingleEliminationSteps returns 7 steps', () => {
    const steps = createSingleEliminationSteps(new DefaultByePlacementStrategy());
    expect(steps).toHaveLength(7);
  });

  it('step names match expected order', () => {
    const steps = createSingleEliminationSteps(new DefaultByePlacementStrategy());
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
    const steps = createSingleEliminationSteps(new BalancedByePlacementStrategy());
    const competitors = makeCompetitors(5);
    const ctx = createPipelineContext(competitors, 'manual');
    const pipeline = new GenerationPipeline(steps);
    const result = pipeline.run(ctx);

    expect(result.bracket).not.toBeNull();
    expect(result.byes).not.toBeNull();
    expect(result.matches).not.toBeNull();
  });
});

// ─── 6. Custom strategy (third-party) ─────────────────────────

describe('third-party strategy injection', () => {
  /**
   * A custom strategy that places BYEs at slot A of matches 0, 1, 3.
   * For 5 competitors (bracket size 8), BYE positions = [0, 2, 6].
   * This produces 3 BYE matches (R1P0, R1P1, R1P3) and is different
   * from the default (which uses slot B: [1, 3, 5]).
   */
  class SlotAByeStrategy implements ByePlacementStrategy {
    placeByes(context: GenerationContext, _positionMap: PositionMap): readonly number[] {
      const { bracketSize, byeCount } = context;
      if (byeCount === 0) return [];
      const half = bracketSize / 2;
      const positions: number[] = [];
      for (let match = 0; match < half && positions.length < byeCount; match++) {
        positions.push(match * 2);
      }
      return positions;
    }
  }

  it('custom strategy is accepted by the pipeline', () => {
    const steps = createSingleEliminationSteps(new SlotAByeStrategy());
    const { bracket, byes } = runPipeline(steps, 5);

    expect(bracket.size).toBe(8);
    expect(byes.length).toBe(3);
  });

  it('custom strategy BYE positions are respected', () => {
    const steps = createSingleEliminationSteps(new SlotAByeStrategy());
    const { byes } = runPipeline(steps, 5);

    const positions = byes.map((b) => b.position).sort((a, b) => a - b);
    expect(positions).toEqual([0, 2, 4]);
  });

  it('pipeline structure valid with custom strategy', () => {
    const steps = createSingleEliminationSteps(new SlotAByeStrategy());
    const { bracket } = runPipeline(steps, 5);

    const byeMatches = bracket.matches.filter((m) => m.isBye);
    expect(byeMatches.length).toBe(3);

    for (const match of byeMatches) {
      expect(match.winner).not.toBeNull();
    }
  });
});
