import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import { generateBracket } from '../../src/single-elimination/generator';
import { calculateByeDistribution } from '../../src/single-elimination/bye-distribution';

/**
 * RED tests for the TRUE-seeding contract: a seed whose official
 * standard slot is an official BYE position must move to the OPPOSITE
 * slot of that same match (receiving the BYE) instead of sitting on the
 * BYE slot. BYE positions themselves are frozen and must never be
 * occupied by a competitor. The top k seeds (k = min(seedCount,
 * byeCount)) receive BYEs, each on the opposite slot of the i-th BYE in
 * BYE-priority order.
 */

function makeCompetitors(count: number, seeded: boolean): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: seeded ? i + 1 : null,
  }));
}

function officialByes(count: number): Set<number> {
  return new Set(calculateByeDistribution(count).byePositions);
}

function bracketSize(count: number): number {
  return 2 ** Math.ceil(Math.log2(count));
}

/** Build a position -> competitorId map for round 1 (leaf slots). */
function r1Placement(result: ReturnType<typeof generateBracket>): (string | null)[] {
  const size = result.bracket.size;
  const placement: (string | null)[] = new Array(size).fill(null);
  for (const m of result.bracket.matches.filter((m) => m.round === 1)) {
    if (m.competitorA) placement[m.position * 2] = m.competitorA.id;
    if (m.competitorB) placement[m.position * 2 + 1] = m.competitorB.id;
  }
  return placement;
}

function seedPositions(result: ReturnType<typeof generateBracket>, seedCount: number): number[] {
  const placement = r1Placement(result);
  return Array.from({ length: seedCount }, (_, i) => placement.indexOf(`c${i + 1}`));
}

describe('TRUE seeding vs frozen BYEs (hybrid contract)', () => {
  describe('a seed whose standard slot is a BYE moves to the opposite slot', () => {
    it('count=9: seed 1 sits at position 1 (opposite of official BYE at 0)', () => {
      const result = generateBracket(makeCompetitors(9, true), 'manual');
      const placement = r1Placement(result);
      expect(placement[0]).toBeNull();
      expect(placement[1]).toBe('c1');
    });

    it('count=9: seed 2 sits at position 14 (opposite of official BYE at 15)', () => {
      const result = generateBracket(makeCompetitors(9, true), 'manual');
      const placement = r1Placement(result);
      expect(placement[14]).toBe('c2');
    });

    it('count=17: seed 1 sits at position 1 and seed 2 at position 30', () => {
      const result = generateBracket(makeCompetitors(17, true), 'manual');
      const placement = r1Placement(result);
      expect(placement[1]).toBe('c1');
      expect(placement[30]).toBe('c2');
    });

    it('count=25: seed 3 sits at position 17 (opposite of official BYE at 16)', () => {
      const result = generateBracket(makeCompetitors(25, true), 'manual');
      const placement = r1Placement(result);
      expect(placement[17]).toBe('c3');
    });

    it('count=9: top-k seed 4 moves to the BYE-recipient slot at position 6 (opposite of official BYE at 7)', () => {
      const result = generateBracket(makeCompetitors(9, true), 'manual');
      const placement = r1Placement(result);
      expect(placement[6]).toBe('c4');
    });
  });

  describe('no competitor ever occupies an official BYE position', () => {
    for (const count of [3, 5, 6, 7, 9, 13, 17, 25, 33]) {
      it(`fully seeded count=${count}: every BYE slot stays empty`, () => {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const placement = r1Placement(result);
        for (const pos of officialByes(count)) {
          expect(placement[pos]).toBeNull();
        }
      });
    }

    it('partial seeding (count=9, seeds 1 and 2 only) keeps BYE slots empty', () => {
      const competitors = makeCompetitors(9, false);
      competitors[0] = { ...competitors[0], seed: 1 };
      competitors[1] = { ...competitors[1], seed: 2 };
      const result = generateBracket(competitors, 'manual');
      const placement = r1Placement(result);
      for (const pos of officialByes(9)) {
        expect(placement[pos]).toBeNull();
      }
    });
  });

  describe('reported BYEs stay on official positions even when seeded', () => {
    for (const count of [3, 5, 9, 13, 17, 25, 33]) {
      it(`fully seeded count=${count}: bye positions equal official positions`, () => {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const official = [...officialByes(count)].sort((a, b) => a - b);
        const actual = result.byes.map((b) => b.position).sort((a, b) => a - b);
        expect(actual).toEqual(official);
      });
    }

    it('partial seeding (count=9, seed 1 only) keeps every BYE on an official position', () => {
      const competitors = makeCompetitors(9, false);
      competitors[0] = { ...competitors[0], seed: 1 };
      const result = generateBracket(competitors, 'manual');
      const actual = result.byes.map((b) => b.position).sort((a, b) => a - b);
      expect(actual).toEqual([0, 3, 7, 8, 11, 12, 15]);
    });
  });

  describe('the top seed never plays round 1', () => {
    for (const count of [3, 5, 6, 7, 9, 13, 17, 25, 33]) {
      it(`count=${count} with seed 1: seed 1 is in a BYE match`, () => {
        const competitors = makeCompetitors(count, false);
        competitors[0] = { ...competitors[0], seed: 1 };
        const result = generateBracket(competitors, 'manual');
        const r1 = result.bracket.matches.filter((m) => m.round === 1);
        const seed1Match = r1.find(
          (m) => m.competitorA?.id === 'c1' || m.competitorB?.id === 'c1',
        )!;
        expect(seed1Match.isBye).toBe(true);
      });
    }
  });

  describe('structural seeding invariants (fully seeded)', () => {
    const half = (p: number, size: number) => Math.floor(p / (size / 2));
    const quarter = (p: number, size: number) => Math.floor(p / (size / 4));
    const eighth = (p: number, size: number) => Math.floor(p / (size / 8));

    for (const count of [9, 13, 17, 25, 33]) {
      const size = bracketSize(count);

      it(`count=${count}: seeds 1 and 2 are in opposite halves`, () => {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        const pos = seedPositions(result, 2);
        expect(half(pos[0], size)).not.toBe(half(pos[1], size));
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
      const pos = seedPositions(result, 8);
      const eighths = pos.slice(4, 8).map((p) => eighth(p, 32));
      expect(eighths[1]).toBe(eighth(6, 32));
      expect(new Set(eighths).size).toBe(3);
    });
  });

  describe('exact round-1 outcomes (fully seeded)', () => {
    function r1Pairing(
      competitors: EngineCompetitor[],
    ): { byes: string[]; real: string[][] } {
      const result = generateBracket(competitors, 'manual');
      const r1 = result.bracket.matches.filter((m) => m.round === 1);
      const byes = r1
        .filter((m) => m.isBye)
        .map((m) => m.competitorA?.id ?? m.competitorB?.id!)
        .sort();
      const real = r1
        .filter((m) => !m.isBye)
        .map((m) => [m.competitorA?.id!, m.competitorB?.id!].sort());
      return { byes, real };
    }

    it('3 competitors: seed 1 gets the BYE; seeds 2 and 3 face each other', () => {
      const { byes, real } = r1Pairing(makeCompetitors(3, true));
      expect(byes).toEqual(['c1']);
      expect(real).toEqual([['c2', 'c3']]);
    });

    it('5 competitors: seeds 1-3 get BYEs; seeds 4 and 5 face each other', () => {
      const { byes, real } = r1Pairing(makeCompetitors(5, true));
      expect(byes).toEqual(['c1', 'c2', 'c3']);
      expect(real).toEqual([['c4', 'c5']]);
    });

    it('9 competitors: seeds 1-7 get BYEs; seeds 8 and 9 face each other', () => {
      const { byes, real } = r1Pairing(makeCompetitors(9, true));
      expect(byes).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']);
      expect(real).toEqual([['c8', 'c9']]);
    });

    it('17 competitors: seeds 1-15 get BYEs; seeds 16 and 17 face each other', () => {
      const { byes, real } = r1Pairing(makeCompetitors(17, true));
      const expected = Array.from({ length: 15 }, (_, i) => i + 1).map((s) => `c${s}`);
      expect(byes).toEqual([...expected].sort());
      expect(real).toEqual([['c16', 'c17']]);
    });
  });

  describe('no malformed round-1 matches', () => {
    it('partial seeding (count=9, seed 1 only) leaves no match with both sides empty', () => {
      const competitors = makeCompetitors(9, false);
      competitors[0] = { ...competitors[0], seed: 1 };
      const result = generateBracket(competitors, 'manual');
      const r1 = result.bracket.matches.filter((m) => m.round === 1);
      for (const m of r1) {
        expect(m.competitorA !== null || m.competitorB !== null).toBe(true);
      }
    });
  });
});
