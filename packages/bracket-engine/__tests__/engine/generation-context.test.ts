import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { TournamentEngine } from '../../src/engine/tournament-engine';
import { SingleEliminationStrategy } from '../../src/single-elimination/single-elimination-strategy';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

// ─── buildGenerationContext ─────────────────────────────────────

describe('buildGenerationContext', () => {
  it('returns correct context for 2 competitors', () => {
    const ctx = buildGenerationContext(makeCompetitors(2));
    expect(ctx).toEqual({
      competitorCount: 2,
      bracketSize: 2,
      byeCount: 0,
      roundCount: 1,
    });
  });

  it('returns correct context for 4 competitors (power of 2)', () => {
    const ctx = buildGenerationContext(makeCompetitors(4));
    expect(ctx).toEqual({
      competitorCount: 4,
      bracketSize: 4,
      byeCount: 0,
      roundCount: 2,
    });
  });

  it('returns correct context for 8 competitors', () => {
    const ctx = buildGenerationContext(makeCompetitors(8));
    expect(ctx).toEqual({
      competitorCount: 8,
      bracketSize: 8,
      byeCount: 0,
      roundCount: 3,
    });
  });

  it('returns correct context for 3 competitors (non-power-of-2)', () => {
    const ctx = buildGenerationContext(makeCompetitors(3));
    expect(ctx).toEqual({
      competitorCount: 3,
      bracketSize: 4,
      byeCount: 1,
      roundCount: 2,
    });
  });

  it('returns correct context for 5 competitors', () => {
    const ctx = buildGenerationContext(makeCompetitors(5));
    expect(ctx).toEqual({
      competitorCount: 5,
      bracketSize: 8,
      byeCount: 3,
      roundCount: 3,
    });
  });

  it('returns correct context for 6 competitors', () => {
    const ctx = buildGenerationContext(makeCompetitors(6));
    expect(ctx).toEqual({
      competitorCount: 6,
      bracketSize: 8,
      byeCount: 2,
      roundCount: 3,
    });
  });

  it('returns correct context for 9 competitors', () => {
    const ctx = buildGenerationContext(makeCompetitors(9));
    expect(ctx).toEqual({
      competitorCount: 9,
      bracketSize: 16,
      byeCount: 7,
      roundCount: 4,
    });
  });

  it('returns correct context for 128 competitors', () => {
    const ctx = buildGenerationContext(makeCompetitors(128));
    expect(ctx).toEqual({
      competitorCount: 128,
      bracketSize: 128,
      byeCount: 0,
      roundCount: 7,
    });
  });

  it('returns correct context for 100 competitors', () => {
    const ctx = buildGenerationContext(makeCompetitors(100));
    expect(ctx).toEqual({
      competitorCount: 100,
      bracketSize: 128,
      byeCount: 28,
      roundCount: 7,
    });
  });

  it('returns correct context for empty array', () => {
    const ctx = buildGenerationContext([]);
    expect(ctx).toEqual({
      competitorCount: 0,
      bracketSize: 1,
      byeCount: 1,
      roundCount: 0,
    });
  });

  it('bracketSize is always a power of 2', () => {
    for (const count of [2, 3, 5, 6, 7, 9, 10, 15, 17, 33, 65, 100]) {
      const ctx = buildGenerationContext(makeCompetitors(count));
      expect(Math.log2(ctx.bracketSize)).toBe(Math.floor(Math.log2(ctx.bracketSize)));
    }
  });

  it('byeCount is always bracketSize minus competitorCount', () => {
    for (const count of [2, 3, 5, 8, 10, 16, 20, 100]) {
      const ctx = buildGenerationContext(makeCompetitors(count));
      expect(ctx.byeCount).toBe(ctx.bracketSize - ctx.competitorCount);
    }
  });

  it('roundCount is always log2 of bracketSize', () => {
    for (const count of [2, 4, 8, 16, 32, 64, 128]) {
      const ctx = buildGenerationContext(makeCompetitors(count));
      expect(ctx.roundCount).toBe(Math.log2(ctx.bracketSize));
    }
  });
});

// ─── TournamentEngine integration ───────────────────────────────

describe('TournamentEngine passes context to strategy', () => {
  it('engine.generate() succeeds with context being built internally', () => {
    const engine = new TournamentEngine(new SingleEliminationStrategy());
    const competitors = makeCompetitors(4);
    const result = engine.generate(competitors, 'random');
    expect(result.bracket.size).toBe(4);
    expect(result.bracket.totalRounds).toBe(2);
  });

  it('engine works without validators and builds context', () => {
    const engine = new TournamentEngine(new SingleEliminationStrategy());
    const competitors = makeCompetitors(8);
    const result = engine.generate(competitors, 'random');
    expect(result.bracket.size).toBe(8);
    expect(result.bracket.matches).toHaveLength(7);
  });

  it('engine with validators still produces correct results', () => {
    const engine = new TournamentEngine(new SingleEliminationStrategy(), {
      generateValidators: [],
    });
    const competitors = makeCompetitors(5);
    const result = engine.generate(competitors, 'random');
    expect(result.bracket.size).toBe(8);
    expect(result.byes).toHaveLength(3);
  });
});
