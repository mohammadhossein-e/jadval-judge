import { describe, it, expect, vi } from 'vitest';
import type { EngineCompetitor, EngineBracket, GenerationResult, DrawType } from '../../src/types';
import type {
  PipelineContext,
  PipelineStep,
} from '../../src/engine/pipeline';
import {
  GenerationPipeline,
  createPipelineContext,
} from '../../src/engine/pipeline';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { buildSingleEliminationSkeleton } from '../../src/single-elimination/single-elimination-skeleton';
import { buildSingleEliminationPositionMap } from '../../src/single-elimination/single-elimination-position-map';
import { placeCompetitors } from '../../src/single-elimination/seeding';
import { buildBracketMatches } from '../../src/single-elimination/match-builder';
import { autoResolveByes } from '../../src/single-elimination/bye-resolution';
import { collectByeInfo } from '../../src/single-elimination/bye-info';
import {
  SkeletonBuilder,
  PositionMapBuilder,
  ByePlacement,
  CompetitorPlacement,
  MatchPopulation,
  ByeResolution,
  BracketAssembly,
  SINGLE_ELIMINATION_STEPS,
} from '../../src/single-elimination/generation-steps';
import { generateBracket } from '../../src/single-elimination/generator';
import { SingleEliminationStrategy } from '../../src/single-elimination/single-elimination-strategy';

// ─── Helpers ────────────────────────────────────────────────────

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

function makeSeededCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: i + 1,
  }));
}

function makeContext(competitorCount: number): PipelineContext {
  const competitors = makeCompetitors(competitorCount);
  return createPipelineContext(competitors, 'random');
}

function makeSeededContext(competitorCount: number): PipelineContext {
  const competitors = makeSeededCompetitors(competitorCount);
  return createPipelineContext(competitors, 'random');
}

function makeManualContext(
  competitors: readonly EngineCompetitor[],
  placements: Map<number, string>,
): PipelineContext {
  return createPipelineContext(competitors, 'manual', placements);
}

// ─── 1. GenerationPipeline runner ───────────────────────────────

describe('GenerationPipeline runner', () => {
  it('executes every registered step exactly once', () => {
    const calls: string[] = [];
    const step = (name: string): PipelineStep => ({
      name,
      execute: (ctx) => {
        calls.push(name);
        return ctx;
      },
    });

    const pipeline = new GenerationPipeline([
      step('A'),
      step('B'),
      step('C'),
    ]);
    pipeline.run(makeContext(4));

    expect(calls).toEqual(['A', 'B', 'C']);
  });

  it('steps execute in registration order', () => {
    const order: number[] = [];
    const step = (id: number): PipelineStep => ({
      name: `Step${id}`,
      execute: (ctx) => {
        order.push(id);
        return ctx;
      },
    });

    const pipeline = new GenerationPipeline([
      step(3),
      step(1),
      step(2),
    ]);
    pipeline.run(makeContext(2));

    expect(order).toEqual([3, 1, 2]);
  });

  it('each step receives the context returned by the previous step', () => {
    const received: PipelineContext[] = [];
    const step = (name: string): PipelineStep => ({
      name,
      execute: (ctx) => {
        received.push(ctx);
        return { ...ctx, skeleton: null };
      },
    });

    const pipeline = new GenerationPipeline([step('A'), step('B')]);
    const initial = makeContext(2);
    pipeline.run(initial);

    expect(received[0]).toBe(initial);
    expect(received[1]).not.toBe(initial);
    expect(received[1].skeleton).toBeNull();
  });

  it('final context is returned by run()', () => {
    const step: PipelineStep = {
      name: 'Marker',
      execute: (ctx) => ({ ...ctx, bracket: { size: 99, totalRounds: 5, matches: [] } }),
    };
    const pipeline = new GenerationPipeline([step]);
    const result = pipeline.run(makeContext(2));

    expect(result.bracket?.size).toBe(99);
    expect(result.bracket?.totalRounds).toBe(5);
  });

  it('empty pipeline returns the original context unchanged', () => {
    const pipeline = new GenerationPipeline([]);
    const initial = makeContext(4);
    const result = pipeline.run(initial);

    expect(result).toBe(initial);
  });

  it('propagates errors from a step and stops execution', () => {
    const calls: string[] = [];
    const step = (name: string, shouldFail = false): PipelineStep => ({
      name,
      execute: (ctx) => {
        calls.push(name);
        if (shouldFail) throw new Error(`${name} failed`);
        return ctx;
      },
    });

    const pipeline = new GenerationPipeline([
      step('A'),
      step('B', true),
      step('C'),
    ]);

    expect(() => pipeline.run(makeContext(2))).toThrow('B failed');
    expect(calls).toEqual(['A', 'B']);
  });
});

// ─── 2. SkeletonBuilder ─────────────────────────────────────────

describe('SkeletonBuilder', () => {
  it('creates a skeleton with the correct match count', () => {
    const ctx = makeContext(8);
    const result = SkeletonBuilder.execute(ctx);

    expect(result.skeleton).not.toBeNull();
    expect(result.skeleton!.matches).toHaveLength(7);
  });

  it('sets correct size and totalRounds on the skeleton', () => {
    const ctx = makeContext(4);
    const result = SkeletonBuilder.execute(ctx);

    expect(result.skeleton!.size).toBe(4);
    expect(result.skeleton!.totalRounds).toBe(2);
  });

  it('existing context fields remain unchanged', () => {
    const ctx = makeContext(4);
    const result = SkeletonBuilder.execute(ctx);

    expect(result.competitors).toBe(ctx.competitors);
    expect(result.drawType).toBe(ctx.drawType);
    expect(result.generationContext).toBe(ctx.generationContext);
    expect(result.positionMap).toBeNull();
    expect(result.placements).toBeNull();
    expect(result.matches).toBeNull();
    expect(result.bracket).toBeNull();
    expect(result.byes).toBeNull();
  });

  it('does not modify unrelated fields', () => {
    const ctx = makeContext(8);
    const result = SkeletonBuilder.execute(ctx);

    expect(result.positionMap).toBe(ctx.positionMap);
    expect(result.placements).toBe(ctx.placements);
    expect(result.matches).toBe(ctx.matches);
  });
});

// ─── 3. PositionMapBuilder ──────────────────────────────────────

describe('PositionMapBuilder', () => {
  it('creates a position map matching the skeleton', () => {
    let ctx = makeContext(8);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);

    expect(ctx.positionMap).not.toBeNull();
    expect(ctx.positionMap).toHaveLength(8);
  });

  it('all entries reference round-1 matches from the skeleton', () => {
    let ctx = makeContext(8);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);

    const round1Ids = ctx.skeleton!.matches
      .filter((m) => m.round === 1)
      .map((m) => m.id);

    for (const entry of ctx.positionMap!) {
      expect(round1Ids).toContain(entry.matchId);
    }
  });

  it('skeleton remains unchanged', () => {
    let ctx = makeContext(4);
    ctx = SkeletonBuilder.execute(ctx);
    const before = ctx.skeleton!;
    ctx = PositionMapBuilder.execute(ctx);

    expect(ctx.skeleton).toBe(before);
  });

  it('previous context fields preserved', () => {
    let ctx = makeContext(4);
    ctx = SkeletonBuilder.execute(ctx);
    const before = { ...ctx };
    ctx = PositionMapBuilder.execute(ctx);

    expect(ctx.competitors).toBe(before.competitors);
    expect(ctx.drawType).toBe(before.drawType);
    expect(ctx.generationContext).toBe(before.generationContext);
    expect(ctx.skeleton).toBe(before.skeleton);
  });
});

// ─── 4. ByePlacement ────────────────────────────────────────────

describe('ByePlacement', () => {
  it('sets byePositions with correct size', () => {
    const ctx = makeContext(5);
    const result = ByePlacement.execute(ctx);

    expect(result.byePositions).not.toBeNull();
    expect(result.byePositions!.size).toBe(ctx.generationContext.byeCount);
  });

  it('byePositions count equals byeCount', () => {
    const ctx = makeContext(5);
    const result = ByePlacement.execute(ctx);

    expect(result.byePositions!.size).toBe(ctx.generationContext.byeCount);
  });

  it('output is deterministic for same context', () => {
    const competitors = makeSeededCompetitors(6);
    const ctxA = createPipelineContext(competitors, 'manual');
    const ctxB = createPipelineContext(competitors, 'manual');
    const a = ByePlacement.execute(ctxA);
    const b = ByePlacement.execute(ctxB);

    expect([...a.byePositions!].sort()).toEqual([...b.byePositions!].sort());
  });

  it('previous context layers are preserved', () => {
    const ctx = makeContext(6);
    const result = ByePlacement.execute(ctx);

    expect(result.competitors).toBe(ctx.competitors);
    expect(result.drawType).toBe(ctx.drawType);
    expect(result.generationContext).toBe(ctx.generationContext);
  });

  it('does not set placements (competitor placement is a separate step)', () => {
    const ctx = makeContext(3);
    const result = ByePlacement.execute(ctx);

    expect(result.byePositions!.size).toBe(1);
    expect(result.placements).toBeNull();
  });
});

// ─── 5. CompetitorPlacement ─────────────────────────────────────

describe('CompetitorPlacement', () => {
  it('produces placements from byePositions and competitors', () => {
    let ctx = makeContext(8);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);
    ctx = ByePlacement.execute(ctx);

    const result = CompetitorPlacement.execute(ctx);

    expect(result.placements).not.toBeNull();
    expect(result.placements).toHaveLength(8);
  });

  it('sets placements based on strategy, does not modify existing fields', () => {
    let ctx = makeContext(4);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);
    ctx = ByePlacement.execute(ctx);

    const before = { ...ctx };
    const result = CompetitorPlacement.execute(ctx);

    expect(result).not.toBe(ctx);
    expect(result.skeleton).toBe(before.skeleton);
    expect(result.positionMap).toBe(before.positionMap);
    expect(result.byePositions).toBe(before.byePositions);
    expect(result.placements).not.toBeNull();
  });

  it('requires positionMap', () => {
    const ctx = makeContext(4);
    expect(() => CompetitorPlacement.execute(ctx)).toThrow('PositionMapBuilder');
  });

  it('requires byePositions', () => {
    let ctx = makeContext(4);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);
    expect(() => CompetitorPlacement.execute(ctx)).toThrow('ByePlacement');
  });
});

// ─── 6. MatchPopulation ─────────────────────────────────────────

describe('MatchPopulation', () => {
  function runUpToMatchPopulation(competitorCount: number): PipelineContext {
    let ctx = makeContext(competitorCount);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);
    ctx = ByePlacement.execute(ctx);
    ctx = CompetitorPlacement.execute(ctx);
    return ctx;
  }

  it('consumes context.positionMap', () => {
    const ctx = runUpToMatchPopulation(4);
    expect(ctx.positionMap).not.toBeNull();

    const result = MatchPopulation.execute(ctx);
    expect(result.matches).not.toBeNull();
  });

  it('fails when positionMap is missing', () => {
    let ctx = makeContext(4);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = ByePlacement.execute(ctx);

    expect(() => MatchPopulation.execute(ctx)).toThrow('PositionMapBuilder');
  });

  it('fails when skeleton is missing', () => {
    const ctx = makeContext(4);
    expect(() => MatchPopulation.execute(ctx)).toThrow('SkeletonBuilder');
  });

  it('fails when placements are missing', () => {
    let ctx = makeContext(4);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);

    expect(() => MatchPopulation.execute(ctx)).toThrow('CompetitorPlacement');
  });

  it('round 1 matches contain competitors', () => {
    const ctx = runUpToMatchPopulation(4);
    const result = MatchPopulation.execute(ctx);

    const round1 = result.matches!.filter((m) => m.round === 1);
    for (const match of round1) {
      const hasA = match.competitorA !== null;
      const hasB = match.competitorB !== null;
      expect(hasA || hasB).toBe(true);
    }
  });

  it('later rounds remain empty', () => {
    const ctx = runUpToMatchPopulation(8);
    const result = MatchPopulation.execute(ctx);

    const laterRounds = result.matches!.filter((m) => m.round > 1);
    for (const match of laterRounds) {
      expect(match.competitorA).toBeNull();
      expect(match.competitorB).toBeNull();
    }
  });

  it('does not use hardcoded index arithmetic (positionMap is authoritative)', () => {
    const ctx = runUpToMatchPopulation(6);
    const result = MatchPopulation.execute(ctx);

    const round1 = result.matches!.filter((m) => m.round === 1);
    const allCompetitors = round1.flatMap((m) => [m.competitorA, m.competitorB]).filter(Boolean);
    expect(allCompetitors).toHaveLength(6);
  });
});

// ─── 7. ByeResolution ──────────────────────────────────────────

describe('ByeResolution', () => {
  function runUpToByeResolution(competitorCount: number): PipelineContext {
    let ctx = makeContext(competitorCount);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);
    ctx = ByePlacement.execute(ctx);
    ctx = CompetitorPlacement.execute(ctx);
    ctx = MatchPopulation.execute(ctx);
    return ctx;
  }

  it('BYE winners are advanced correctly', () => {
    const ctx = runUpToByeResolution(5);
    const result = ByeResolution.execute(ctx);

    const byeMatches = result.matches!.filter((m) => m.isBye);
    for (const match of byeMatches) {
      expect(match.winner).not.toBeNull();
      if (match.nextMatchId) {
        const next = result.matches!.find((m) => m.id === match.nextMatchId)!;
        if (match.nextSlot === 'A') {
          expect(next.competitorA?.id).toBe(match.winner!.id);
        } else {
          expect(next.competitorB?.id).toBe(match.winner!.id);
        }
      }
    }
  });

  it('only match state changes — no bracket assembled', () => {
    const ctx = runUpToByeResolution(5);
    const result = ByeResolution.execute(ctx);

    expect(result.bracket).toBeNull();
    expect(result.byes).toBeNull();
    expect(result.matches).toBeDefined();
  });

  it('no BYE metadata is collected here', () => {
    const ctx = runUpToByeResolution(3);
    const result = ByeResolution.execute(ctx);

    expect(result.byes).toBeNull();
  });

  it('non-BYE matches remain unresolved', () => {
    const ctx = runUpToByeResolution(8);
    const result = ByeResolution.execute(ctx);

    const nonBye = result.matches!.filter((m) => !m.isBye);
    for (const match of nonBye) {
      expect(match.winner).toBeNull();
    }
  });
});

// ─── 8. BracketAssembly ─────────────────────────────────────────

describe('BracketAssembly', () => {
  function runUpToBracketAssembly(
    competitorCount: number,
    drawType: DrawType = 'random',
    manualPlacements?: Map<number, string>,
  ): PipelineContext {
    let ctx = createPipelineContext(makeCompetitors(competitorCount), drawType, manualPlacements);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);
    ctx = ByePlacement.execute(ctx);
    ctx = CompetitorPlacement.execute(ctx);
    ctx = MatchPopulation.execute(ctx);
    ctx = ByeResolution.execute(ctx);
    return ctx;
  }

  it('assembles EngineBracket correctly', () => {
    const ctx = runUpToBracketAssembly(8);
    const result = BracketAssembly.execute(ctx);

    expect(result.bracket).not.toBeNull();
    expect(result.bracket!.size).toBe(8);
    expect(result.bracket!.totalRounds).toBe(3);
    expect(result.bracket!.matches).toHaveLength(7);
  });

  it('collects BYE metadata', () => {
    const ctx = runUpToBracketAssembly(5);
    const result = BracketAssembly.execute(ctx);

    expect(result.byes).not.toBeNull();
    expect(result.byes!.length).toBe(3);
    for (const bye of result.byes!) {
      expect(typeof bye.competitorId).toBe('string');
      expect(typeof bye.position).toBe('number');
    }
  });

  it('does not resolve BYEs — matches come in already resolved', () => {
    const ctx = runUpToBracketAssembly(5);
    const byeMatches = ctx.matches!.filter((m) => m.isBye);
    for (const m of byeMatches) {
      expect(m.winner).not.toBeNull();
    }
    const result = BracketAssembly.execute(ctx);
    expect(result.bracket!.matches).toBe(ctx.matches);
  });

  it('if BracketAssembly runs before ByeResolution, unresolved matches remain', () => {
    let ctx = makeContext(5);
    ctx = SkeletonBuilder.execute(ctx);
    ctx = PositionMapBuilder.execute(ctx);
    ctx = ByePlacement.execute(ctx);
    ctx = CompetitorPlacement.execute(ctx);
    ctx = MatchPopulation.execute(ctx);
    // Skip ByeResolution
    const result = BracketAssembly.execute(ctx);

    expect(result.bracket).not.toBeNull();
    expect(result.byes).toEqual([]);
    const byeMatches = result.bracket!.matches.filter((m) => m.isBye);
    for (const m of byeMatches) {
      expect(m.winner).toBeNull();
    }
  });
});

// ─── 9. Full pipeline integration ───────────────────────────────

describe('Full pipeline integration', () => {
  const COMPETITOR_COUNTS = [2, 3, 5, 8, 13, 24, 32, 65, 128];

  for (const count of COMPETITOR_COUNTS) {
    it(`pipeline output matches generateBracket for ${count} seeded competitors`, () => {
      const competitors = makeSeededCompetitors(count);
      const fromPipeline = runFullPipeline(competitors);
      const fromGenerate = generateBracket(competitors, 'manual');

      expect(fromPipeline.bracket).toEqual(fromGenerate.bracket);
      expect(fromPipeline.byes).toEqual(fromGenerate.byes);
    });
  }

  it('pipeline with manual placements matches generateBracket', () => {
    const competitors = makeCompetitors(8);
    const placements = new Map<number, string>([
      [0, 'c5'],
      [1, 'c3'],
      [2, 'c7'],
      [3, 'c1'],
    ]);
    const ctx = createPipelineContext(competitors, 'manual', placements);
    const pipeline = new GenerationPipeline(SINGLE_ELIMINATION_STEPS);
    const result = pipeline.run(ctx);
    const fromGenerate = generateBracket(competitors, 'manual', placements);

    expect(result.bracket).toEqual(fromGenerate.bracket);
    expect(result.byes).toEqual(fromGenerate.byes);
  });
});

function runFullPipeline(competitors: readonly EngineCompetitor[]): GenerationResult {
  const ctx = createPipelineContext(competitors, 'manual');
  const pipeline = new GenerationPipeline(SINGLE_ELIMINATION_STEPS);
  const result = pipeline.run(ctx);
  return { bracket: result.bracket!, byes: result.byes! };
}

// ─── 10. Strategy integration ───────────────────────────────────

describe('Strategy integration', () => {
  const strategy = new SingleEliminationStrategy();

  it('strategy.generate matches generateBracket for seeded competitors', () => {
    const competitors = makeSeededCompetitors(8);
    const fromStrategy = strategy.generate(competitors, 'manual');
    const fromGenerate = generateBracket(competitors, 'manual');

    expect(fromStrategy.bracket).toEqual(fromGenerate.bracket);
    expect(fromStrategy.byes).toEqual(fromGenerate.byes);
  });

  it('strategy.generate matches generateBracket for manual draw', () => {
    const competitors = makeCompetitors(8);
    const placements = new Map<number, string>([
      [0, 'c4'],
      [1, 'c2'],
      [6, 'c8'],
      [7, 'c1'],
    ]);
    const fromStrategy = strategy.generate(competitors, 'manual', placements);
    const fromGenerate = generateBracket(competitors, 'manual', placements);

    expect(fromStrategy.bracket).toEqual(fromGenerate.bracket);
    expect(fromStrategy.byes).toEqual(fromGenerate.byes);
  });

  it('strategy matches generateBracket for seeded competitors across sizes', () => {
    for (const count of [2, 5, 8, 16, 33, 64, 128]) {
      const competitors = makeSeededCompetitors(count);
      const fromStrategy = strategy.generate(competitors, 'manual');
      const fromGenerate = generateBracket(competitors, 'manual');

      expect(fromStrategy.bracket).toEqual(fromGenerate.bracket);
      expect(fromStrategy.byes).toEqual(fromGenerate.byes);
    }
  });
});
