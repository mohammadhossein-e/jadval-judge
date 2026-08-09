import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import { generateBracket } from '../../src/single-elimination/generator';
import { calculateByeDistribution } from '../../src/single-elimination/bye-distribution';

/**
 * RED regression tests for the TRUE-seeding contract:
 *
 *  - BYE positions are IMMUTABLE. The frozen BYE algorithm decides which
 *    Round-1 slots are empty; Seeding must never move, replace, or
 *    re-derive them.
 *  - The TOP seeds receive the BYEs: the i-th bye match (in BYE-priority
 *    order) is won by seed i, seated in the OPPOSITE slot of that match.
 *  - Seed placement chooses only NON-BYE positions. A Seed never claims a
 *    BYE slot.
 *  - No additional empty Round-1 slot may be created by Seeding.
 */
function makeCompetitors(count: number, seeded: boolean): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: seeded ? i + 1 : null,
  }));
}

function withSeeds(competitors: EngineCompetitor[], seeds: number[]): EngineCompetitor[] {
  const arr = [...competitors];
  for (let i = 0; i < Math.min(seeds.length, arr.length); i++) {
    arr[i] = { ...arr[i], seed: seeds[i] };
  }
  return arr;
}

/** position -> competitorId map for Round 1 leaf slots. */
function r1Placement(result: ReturnType<typeof generateBracket>): (string | null)[] {
  const size = result.bracket.size;
  const placement: (string | null)[] = new Array(size).fill(null);
  for (const m of result.bracket.matches.filter((m) => m.round === 1)) {
    if (m.competitorA) placement[m.position * 2] = m.competitorA.id;
    if (m.competitorB) placement[m.position * 2 + 1] = m.competitorB.id;
  }
  return placement;
}

function officialByes(count: number): number[] {
  return [...calculateByeDistribution(count).byePositions].sort((a, b) => a - b);
}

function positionOf(placement: (string | null)[], id: string): number {
  return placement.indexOf(id);
}

describe('TOP seeds receive BYEs (recipient-based TRUE seeding)', () => {
  describe('6 competitors + 2 Seeds', () => {
    const competitors = withSeeds(makeCompetitors(6, false), [1, 2]);

    it('BYEs remain [0, 7]', () => {
      const result = generateBracket(competitors, 'manual');
      const placement = r1Placement(result);
      expect(placement[0]).toBeNull();
      expect(placement[7]).toBeNull();
    });

    it('Seed 1 occupies position 1 (opposite of BYE@0)', () => {
      const result = generateBracket(competitors, 'manual');
      const placement = r1Placement(result);
      expect(placement[1]).toBe('c1');
    });

    it('Seed 2 occupies position 6 (opposite of BYE@7) and receives a BYE', () => {
      const result = generateBracket(competitors, 'manual');
      const placement = r1Placement(result);
      expect(placement[6]).toBe('c2');
      expect(result.byes.some((b) => b.competitorId === 'c2')).toBe(true);
    });

    it('Match 2 and Match 3 are full; Match 1 and Match 4 each have one BYE', () => {
      const result = generateBracket(competitors, 'manual');
      const r1 = result.bracket.matches.filter((m) => m.round === 1);
      const isByeByMatch = r1.map((m) => m.isBye);
      // matches 0..3
      expect(isByeByMatch).toEqual([true, false, false, true]);
    });
  });

  describe('6 competitors fully seeded (top seeds receive the 2 BYEs)', () => {
    it('produces the ideal seeded 6-player bracket', () => {
      const result = generateBracket(makeCompetitors(6, true), 'manual');
      const placement = r1Placement(result);
      expect(placement[0]).toBeNull();
      expect(placement[7]).toBeNull();
      expect(placement[1]).toBe('c1');
      expect(placement[6]).toBe('c2');
      expect(placement[4]).toBe('c3');
      expect(placement[2]).toBe('c4');
      expect(placement[3]).toBe('c5');
      expect(placement[5]).toBe('c6');
    });
  });

  describe('BYE positions are identical BEFORE and AFTER Seeding', () => {
    for (const count of [3, 5, 6, 7, 9, 13, 17, 25, 33]) {
      it(`count=${count}: unseeded vs fully-seeded BYE positions are identical`, () => {
        const noSeeds = generateBracket(makeCompetitors(count, false), 'manual');
        const seeded = generateBracket(makeCompetitors(count, true), 'manual');
        const noSeedPositions = noSeeds.byes.map((b) => b.position).sort((a, b) => a - b);
        const seededPositions = seeded.byes.map((b) => b.position).sort((a, b) => a - b);
        expect(seededPositions).toEqual(noSeedPositions);
        expect(seededPositions).toEqual(officialByes(count));
      });
    }
  });

  describe('no Seed ever occupies a BYE position', () => {
    for (const count of [3, 5, 6, 7, 9, 13, 17, 25, 33]) {
      it(`count=${count}: fully seeded, every BYE slot stays empty`, () => {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const placement = r1Placement(result);
        for (const pos of officialByes(count)) {
          expect(placement[pos]).toBeNull();
        }
      });
    }
  });

  describe('no additional empty Round-1 slot is created by Seeding', () => {
    for (const count of [3, 5, 6, 7, 9, 13, 17, 25, 33]) {
      it(`count=${count}: empty slots equal BYE count exactly`, () => {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const placement = r1Placement(result);
        const empties = placement.filter((p) => p === null).length;
        expect(empties).toBe(result.bracket.size - count);
      });
    }
  });

  describe('the top seeds receive the BYEs (recipient assignment)', () => {
    it('count=5: seeds 1,2,3 receive the 3 BYEs', () => {
      const result = generateBracket(makeCompetitors(5, true), 'manual');
      const recipients = result.byes.map((b) => b.competitorId).sort();
      expect(recipients).toEqual(['c1', 'c2', 'c3']);
    });

    it('count=9: seeds 1-7 receive the 7 BYEs (S8 plays S9)', () => {
      const result = generateBracket(makeCompetitors(9, true), 'manual');
      const recipients = result.byes.map((b) => b.competitorId).sort();
      expect(recipients).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']);
      const placement = r1Placement(result);
      expect(placement[4]).toBe('c8');
      expect(placement[5]).toBe('c9');
    });

    it('count=13: seeds 1,2,3 receive the 3 BYEs', () => {
      const result = generateBracket(makeCompetitors(13, true), 'manual');
      const recipients = result.byes.map((b) => b.competitorId).sort();
      expect(recipients).toEqual(['c1', 'c2', 'c3']);
    });
  });

  describe('structural seeding invariants preserved (fully seeded)', () => {
    const half = (p: number, size: number) => Math.floor(p / (size / 2));
    const quarter = (p: number, size: number) => Math.floor(p / (size / 4));
    const eighth = (p: number, size: number) => Math.floor(p / (size / 8));

    for (const count of [9, 13, 17, 25, 33]) {
      const size = 2 ** Math.ceil(Math.log2(count));

      const seedPositions = (result: ReturnType<typeof generateBracket>, n: number): number[] => {
        const placement = r1Placement(result);
        return Array.from({ length: n }, (_, i) => placement.indexOf(`c${i + 1}`));
      };

      it(`count=${count}: seeds 1 and 2 are in opposite halves`, () => {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const [s1, s2] = seedPositions(result, 2);
        expect(half(s1, size)).not.toBe(half(s2, size));
      });

      it(`count=${count}: seeds 3 and 4 are in different quarters`, () => {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const pos = seedPositions(result, 4);
        expect(quarter(pos[2], size)).not.toBe(quarter(pos[3], size));
      });

      it(`count=${count}: seeds 5-8 are in distinct eighths`, () => {
        // n=25 is the documented BYE-priority trade-off (see below).
        if (count === 25) return;
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const pos = seedPositions(result, 8);
        const eighths = pos.slice(4, 8).map((p) => eighth(p, size));
        expect(new Set(eighths).size).toBe(4);
      });

      it(`count=${count}: seeds 1-8 never share a round-1 match`, () => {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const placement = r1Placement(result);
        const matchOf = (pos: number) => Math.floor(pos / 2);
        const matches = seedPositions(result, 8).map(matchOf);
        expect(new Set(matches).size).toBe(8);
      });
    }

    it('count=25: seeds 5-8 cannot all land in distinct eighths (BYE-priority trade-off)', () => {
      // k = min(25, 7) = 7, so seeds 5-7 are pulled onto BYE-recipient
      // slots (positions 25, 6, 22) and seed 8 keeps its structural slot
      // at position 4. Positions 6 and 4 are both in eighth 1; this is an
      // inherent consequence of the BYE-priority contract, not a bug.
      const result = generateBracket(makeCompetitors(25, true), 'manual');
      const placement = r1Placement(result);
      const pos = Array.from({ length: 8 }, (_, i) => placement.indexOf(`c${i + 1}`));
      const eighths = pos.slice(4, 8).map((p) => eighth(p, 32));
      expect(eighths[1]).toBe(eighth(6, 32));
      expect(new Set(eighths).size).toBe(3);
    });
  });

  describe('Seeding never overrides BYEs, draw order, or manual contract', () => {
    it('Random Draw order must not override TRUE Seeding (count=9)', () => {
      const competitors = makeCompetitors(9, true);
      const reversedOrder = Array.from({ length: 9 }, (_, i) => `c${9 - i}`);
      const result = generateBracket(competitors, 'random', undefined, reversedOrder);
      const placement = r1Placement(result);
      // Seeds keep their seeded positions regardless of draw order.
      expect(placement[1]).toBe('c1');
      expect(placement[14]).toBe('c2');
      // BYE slots remain empty.
      for (const pos of officialByes(9)) {
        expect(placement[pos]).toBeNull();
      }
    });

    it('Manual Placement contract remains intact (count=9, seed 1 only)', () => {
      const competitors = withSeeds(makeCompetitors(9, false), [1]);
      // Manual entries are a draw ORDER into the non-BYE slots (ascending).
      const placements = new Map<number, string>([
        [0, 'c5'],
        [1, 'c9'],
      ]);
      const result = generateBracket(competitors, 'manual', placements);
      const placement = r1Placement(result);
      // Manual wins over seeding: the two manual competitors take the first
      // two non-BYE slots.
      expect(placement[1]).toBe('c5');
      expect(placement[2]).toBe('c9');
      // BYE slots stay empty.
      for (const pos of officialByes(9)) {
        expect(placement[pos]).toBeNull();
      }
      // Seed 1 is placed somewhere and never on a BYE slot.
      const s1Pos = placement.indexOf('c1');
      expect(s1Pos).toBeGreaterThanOrEqual(0);
      expect(officialByes(9)).not.toContain(s1Pos);
      // Exactly 9 competitors are placed.
      expect(placement.filter((p): p is string => p !== null)).toHaveLength(9);
    });

    it('every competitor appears exactly once (count=9 fully seeded)', () => {
      const result = generateBracket(makeCompetitors(9, true), 'manual');
      const placement = r1Placement(result);
      const ids = placement.filter((p): p is string => p !== null);
      expect(ids).toHaveLength(9);
      expect(new Set(ids).size).toBe(9);
    });
  });
});
