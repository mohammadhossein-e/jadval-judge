import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { buildSingleEliminationSkeleton } from '../../src/single-elimination/single-elimination-skeleton';
import { generateBracket } from '../../src/single-elimination/generator';
import type { BracketSkeleton, SkeletonMatch } from '../../src/engine/bracket-skeleton';

function ctx(competitorCount: number) {
  const competitors: EngineCompetitor[] = Array.from({ length: competitorCount }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Name ${i + 1}`,
    seed: null,
  }));
  return buildGenerationContext(competitors);
}

// ─── Match count ────────────────────────────────────────────────

describe('skeleton match count', () => {
  it('2 competitors → 1 match', () => {
    const s = buildSingleEliminationSkeleton(ctx(2));
    expect(s.matches).toHaveLength(1);
  });

  it('4 competitors → 3 matches', () => {
    const s = buildSingleEliminationSkeleton(ctx(4));
    expect(s.matches).toHaveLength(3);
  });

  it('8 competitors → 7 matches', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    expect(s.matches).toHaveLength(7);
  });

  it('16 competitors → 15 matches', () => {
    const s = buildSingleEliminationSkeleton(ctx(16));
    expect(s.matches).toHaveLength(15);
  });

  it('128 competitors → 127 matches', () => {
    const s = buildSingleEliminationSkeleton(ctx(128));
    expect(s.matches).toHaveLength(127);
  });

  it('3 competitors → 3 matches (bracketSize 4)', () => {
    const s = buildSingleEliminationSkeleton(ctx(3));
    expect(s.matches).toHaveLength(3);
  });

  it('5 competitors → 7 matches (bracketSize 8)', () => {
    const s = buildSingleEliminationSkeleton(ctx(5));
    expect(s.matches).toHaveLength(7);
  });

  it('100 competitors → 127 matches (bracketSize 128)', () => {
    const s = buildSingleEliminationSkeleton(ctx(100));
    expect(s.matches).toHaveLength(127);
  });
});

// ─── Bracket metadata ───────────────────────────────────────────

describe('skeleton metadata', () => {
  it('sets size and totalRounds from context', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    expect(s.size).toBe(8);
    expect(s.totalRounds).toBe(3);
  });

  it('sets size to 4 for 3 competitors', () => {
    const s = buildSingleEliminationSkeleton(ctx(3));
    expect(s.size).toBe(4);
    expect(s.totalRounds).toBe(2);
  });

  it('sets size to 128 for 100 competitors', () => {
    const s = buildSingleEliminationSkeleton(ctx(100));
    expect(s.size).toBe(128);
    expect(s.totalRounds).toBe(7);
  });
});

// ─── Round structure ────────────────────────────────────────────

describe('skeleton round structure', () => {
  it('2-slot bracket: 1 round with 1 match', () => {
    const s = buildSingleEliminationSkeleton(ctx(2));
    const round1 = s.matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(1);
  });

  it('4-slot bracket: round 1 has 2 matches, round 2 has 1', () => {
    const s = buildSingleEliminationSkeleton(ctx(4));
    expect(s.matches.filter((m) => m.round === 1)).toHaveLength(2);
    expect(s.matches.filter((m) => m.round === 2)).toHaveLength(1);
  });

  it('8-slot bracket: 4, 2, 1 matches per round', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    expect(s.matches.filter((m) => m.round === 1)).toHaveLength(4);
    expect(s.matches.filter((m) => m.round === 2)).toHaveLength(2);
    expect(s.matches.filter((m) => m.round === 3)).toHaveLength(1);
  });

  it('16-slot bracket: 8, 4, 2, 1 matches per round', () => {
    const s = buildSingleEliminationSkeleton(ctx(16));
    expect(s.matches.filter((m) => m.round === 1)).toHaveLength(8);
    expect(s.matches.filter((m) => m.round === 2)).toHaveLength(4);
    expect(s.matches.filter((m) => m.round === 3)).toHaveLength(2);
    expect(s.matches.filter((m) => m.round === 4)).toHaveLength(1);
  });
});

// ─── Match IDs ──────────────────────────────────────────────────

describe('skeleton match IDs', () => {
  it('uses R{round}P{position} format', () => {
    const s = buildSingleEliminationSkeleton(ctx(4));
    const ids = s.matches.map((m) => m.id);
    expect(ids).toEqual(['R1P0', 'R1P1', 'R2P0']);
  });

  it('IDs are unique', () => {
    const s = buildSingleEliminationSkeleton(ctx(16));
    const ids = s.matches.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('round 1 IDs start with R1', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    const round1 = s.matches.filter((m) => m.round === 1);
    for (const m of round1) {
      expect(m.id).toMatch(/^R1P\d+$/);
    }
  });

  it('final match ID is R{totalRounds}P0', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    const final = s.matches.find((m) => m.round === 3);
    expect(final?.id).toBe('R3P0');
  });
});

// ─── Match positions ────────────────────────────────────────────

describe('skeleton match positions', () => {
  it('positions are 0-indexed within each round', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    const round1 = s.matches.filter((m) => m.round === 1);
    expect(round1.map((m) => m.position)).toEqual([0, 1, 2, 3]);
  });

  it('final match has position 0', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    const final = s.matches.find((m) => m.round === 3);
    expect(final?.position).toBe(0);
  });
});

// ─── Parent/child relationships ─────────────────────────────────

describe('skeleton next-match links', () => {
  it('round 1 matches link to round 2', () => {
    const s = buildSingleEliminationSkeleton(ctx(4));
    const round1 = s.matches.filter((m) => m.round === 1);
    for (const m of round1) {
      expect(m.nextMatchId).toMatch(/^R2P/);
    }
  });

  it('final match has no next match', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    const final = s.matches.find((m) => m.round === 3);
    expect(final?.nextMatchId).toBeNull();
    expect(final?.nextSlot).toBeNull();
  });

  it('round 1 position 0 and 1 feed into round 2 position 0', () => {
    const s = buildSingleEliminationSkeleton(ctx(4));
    const m0 = s.matches.find((m) => m.round === 1 && m.position === 0)!;
    const m1 = s.matches.find((m) => m.round === 1 && m.position === 1)!;
    expect(m0.nextMatchId).toBe('R2P0');
    expect(m1.nextMatchId).toBe('R2P0');
  });

  it('even positions feed into slot A, odd into slot B', () => {
    const s = buildSingleEliminationSkeleton(ctx(4));
    const m0 = s.matches.find((m) => m.round === 1 && m.position === 0)!;
    const m1 = s.matches.find((m) => m.round === 1 && m.position === 1)!;
    expect(m0.nextSlot).toBe('A');
    expect(m1.nextSlot).toBe('B');
  });

  it('8-slot bracket: round 1 positions 0-3 feed into round 2 positions 0-1', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    const round1 = s.matches.filter((m) => m.round === 1).sort((a, b) => a.position - b.position);

    expect(round1[0].nextMatchId).toBe('R2P0');
    expect(round1[0].nextSlot).toBe('A');
    expect(round1[1].nextMatchId).toBe('R2P0');
    expect(round1[1].nextSlot).toBe('B');
    expect(round1[2].nextMatchId).toBe('R2P1');
    expect(round1[2].nextSlot).toBe('A');
    expect(round1[3].nextMatchId).toBe('R2P1');
    expect(round1[3].nextSlot).toBe('B');
  });

  it('8-slot bracket: round 2 feeds into final', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    const round2 = s.matches.filter((m) => m.round === 2).sort((a, b) => a.position - b.position);
    expect(round2[0].nextMatchId).toBe('R3P0');
    expect(round2[0].nextSlot).toBe('A');
    expect(round2[1].nextMatchId).toBe('R3P0');
    expect(round2[1].nextSlot).toBe('B');
  });

  it('all nextMatchIds point to existing matches', () => {
    const s = buildSingleEliminationSkeleton(ctx(16));
    const ids = new Set(s.matches.map((m) => m.id));
    for (const m of s.matches) {
      if (m.nextMatchId) {
        expect(ids.has(m.nextMatchId)).toBe(true);
      }
    }
  });
});

// ─── Empty slots ────────────────────────────────────────────────

describe('skeleton has no competitors or winners', () => {
  it('skeleton matches have no competitor fields', () => {
    const s = buildSingleEliminationSkeleton(ctx(4));
    for (const m of s.matches) {
      expect(m).not.toHaveProperty('competitorA');
      expect(m).not.toHaveProperty('competitorB');
      expect(m).not.toHaveProperty('winner');
      expect(m).not.toHaveProperty('isBye');
    }
  });

  it('skeleton is purely structural', () => {
    const s = buildSingleEliminationSkeleton(ctx(8));
    const matchKeys = Object.keys(s.matches[0]);
    expect(matchKeys).toEqual(['id', 'round', 'position', 'nextMatchId', 'nextSlot']);
  });
});

// ─── Immutability ───────────────────────────────────────────────

describe('skeleton immutability', () => {
  it('returns readonly matches array', () => {
    const s = buildSingleEliminationSkeleton(ctx(4));
    expect(Array.isArray(s.matches)).toBe(true);
  });

  it('matches are independent objects', () => {
    const s1 = buildSingleEliminationSkeleton(ctx(4));
    const s2 = buildSingleEliminationSkeleton(ctx(4));
    expect(s1.matches).not.toBe(s2.matches);
    for (let i = 0; i < s1.matches.length; i++) {
      expect(s1.matches[i]).not.toBe(s2.matches[i]);
    }
  });
});

// ─── 2-slot bracket edge case ──────────────────────────────────

describe('2-slot bracket (single match)', () => {
  it('has exactly 1 match with no next match', () => {
    const s = buildSingleEliminationSkeleton(ctx(2));
    expect(s.matches).toHaveLength(1);
    expect(s.matches[0].nextMatchId).toBeNull();
    expect(s.matches[0].nextSlot).toBeNull();
    expect(s.matches[0].round).toBe(1);
    expect(s.matches[0].position).toBe(0);
  });
});

// ─── Consistency with existing generator ────────────────────────

describe('skeleton matches generator match structure', () => {
  it('same number of matches as generateBracket for 2-slot', () => {
    const competitors: EngineCompetitor[] = [
      { id: 'c1', name: 'A', seed: null },
      { id: 'c2', name: 'B', seed: null },
    ];
    const gen = generateBracket(competitors);
    const skel = buildSingleEliminationSkeleton(ctx(2));
    expect(skel.matches).toHaveLength(gen.bracket.matches.length);
  });

  it('same number of matches as generateBracket for 4-slot', () => {
    const competitors: EngineCompetitor[] = Array.from({ length: 4 }, (_, i) => ({
      id: `c${i + 1}`,
      name: `Name ${i + 1}`,
      seed: null,
    }));
    const gen = generateBracket(competitors);
    const skel = buildSingleEliminationSkeleton(ctx(4));
    expect(skel.matches).toHaveLength(gen.bracket.matches.length);
  });

  it('same number of matches as generateBracket for 8-slot', () => {
    const competitors: EngineCompetitor[] = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i + 1}`,
      name: `Name ${i + 1}`,
      seed: null,
    }));
    const gen = generateBracket(competitors);
    const skel = buildSingleEliminationSkeleton(ctx(8));
    expect(skel.matches).toHaveLength(gen.bracket.matches.length);
  });

  it('same IDs and links as generateBracket', () => {
    const competitors: EngineCompetitor[] = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i + 1}`,
      name: `Name ${i + 1}`,
      seed: null,
    }));
    const gen = generateBracket(competitors);
    const skel = buildSingleEliminationSkeleton(ctx(8));

    for (const skelMatch of skel.matches) {
      const genMatch = gen.bracket.matches.find(
        (m) => m.id === skelMatch.id,
      );
      expect(genMatch).toBeDefined();
      expect(genMatch!.round).toBe(skelMatch.round);
      expect(genMatch!.position).toBe(skelMatch.position);
      expect(genMatch!.nextMatchId).toBe(skelMatch.nextMatchId);
      expect(genMatch!.nextSlot).toBe(skelMatch.nextSlot);
    }
  });
});
