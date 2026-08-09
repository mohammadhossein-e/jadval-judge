import { describe, it, expect } from 'vitest';
import {
  generateBracket,
  type EngineCompetitor,
  type EngineBracket,
  type GenerationResult,
} from '@jadval/bracket-engine';

/**
 * Regression tests for TRUE seeding + BYE placement through the REAL
 * production path: the `@jadval/bracket-engine` package entry point,
 * which the web app resolves to the built `dist/` bundle (the same code
 * the browser runs).
 *
 * These tests reproduce the reported UI bugs:
 *   - 6 competitors with seeds enabled: BYEs disappear or move
 *   - seeds sit on standard positions (which are BYE slots)
 *   - the last round-1 match is left completely empty
 *   - NEW: only the first 3 seeds are guaranteed BYEs
 *     (GUARANTEED_RECIPIENT_SEEDS = 3); seeds after S3 can miss a BYE
 *     even when enough BYEs exist.
 *
 * The generalized rule under test:
 *
 *   k = min(seedCount, byeCount)
 *
 * The top k seeds MUST receive the existing BYEs. They must occupy the
 * OPPOSITE slot (position ^ 1) of an existing BYE. BYE positions never
 * change. If seedCount < byeCount the leftover BYEs belong to unseeded
 * competitors.
 *
 * These are intentionally RED tests for the known bug: n=9 with 4+ seeds
 * currently seats S4 on a plain match instead of a BYE, and n=25 with
 * 4+ seeds currently only gives BYEs to S1..S3.
 */

interface CompetitorSeedConfig {
  readonly n: number;
  /** seed values for competitors 1..n (null = unseeded). */
  readonly seeds: readonly (number | null)[];
}

function makeCompetitors(n: number, seeds: readonly (number | null)[]): EngineCompetitor[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i + 1}`,
    name: `C${i + 1}`,
    seed: seeds[i] ?? null,
  }));
}

/** competitors 1..seedCount seeded 1..seedCount, the rest unseeded. */
function seedsArray(n: number, seedCount: number): (number | null)[] {
  return Array.from({ length: n }, (_, i) => (i < seedCount ? i + 1 : null));
}

interface BracketAnalysis {
  readonly byes: number[];
  readonly byeCount: number;
  readonly slots: (EngineCompetitor | null)[];
  readonly occupied: number[];
  readonly empty: number[];
  readonly competitorIds: string[];
  readonly positionBySeed: Map<number, number>;
}

function analyze(result: GenerationResult): BracketAnalysis {
  const bracket = result.bracket;
  const byeSet = new Set(result.byes.map((b) => b.position));
  const slots: (EngineCompetitor | null)[] = Array(bracket.size).fill(null);
  const positionBySeed = new Map<number, number>();

  for (const match of bracket.matches) {
    if (match.round !== 1) continue;
    const sides = [match.competitorA, match.competitorB];
    for (let s = 0; s < 2; s++) {
      const competitor = sides[s];
      if (!competitor) continue;
      const position = match.position * 2 + s;
      slots[position] = competitor;
      if (competitor.seed !== null) {
        positionBySeed.set(competitor.seed, position);
      }
    }
  }

  const occupied: number[] = [];
  const empty: number[] = [];
  for (let i = 0; i < slots.length; i++) {
    if (byeSet.has(i)) continue;
    if (slots[i]) occupied.push(i);
    else empty.push(i);
  }

  return {
    byes: [...byeSet].sort((a, b) => a - b),
    byeCount: byeSet.size,
    slots,
    occupied,
    empty,
    competitorIds: slots.filter((c): c is EngineCompetitor => c !== null).map((c) => c.id),
    positionBySeed,
  };
}

function generateRandomDraw(
  n: number,
  seedCount: number,
  placementOrder?: readonly string[],
): GenerationResult {
  const competitors = makeCompetitors(n, seedsArray(n, seedCount));
  // Simulate a random draw: placementOrder defines fill order only.
  const order = placementOrder ?? competitors.map((c) => c.id);
  return generateBracket(competitors, 'random', undefined, order);
}

/** Frozen BYE positions per competitor count — source of truth. */
const FROZEN_BYES: Record<number, number[]> = {
  3: [0],
  5: [0, 7, 4],
  6: [0, 7],
  7: [0],
  9: [0, 15, 8, 7, 12, 3, 11],
  13: [0, 15, 8],
  17: [0, 31, 16, 15, 24, 7, 23, 8, 28, 3, 27, 4, 20, 11, 19],
  25: [0, 31, 16, 15, 24, 7, 23],
};

function assertValidBracket(
  result: GenerationResult,
  n: number,
  seeds: readonly (number | null)[],
): BracketAnalysis {
  const a = analyze(result);

  // 1. BYE positions are exactly the frozen set (order-insensitive).
  expect(a.byes).toEqual([...FROZEN_BYES[n]].sort((x, y) => x - y));

  // 2. BYE count is exact.
  expect(a.byeCount).toBe(FROZEN_BYES[n].length);

  // 3. Every competitor appears exactly once.
  expect(a.competitorIds).toHaveLength(n);
  expect(new Set(a.competitorIds).size).toBe(n);

  // 4. No extra empty slots outside BYEs.
  expect(a.empty).toEqual([]);

  // 5. No seed occupies a BYE slot (BYE positions stay reserved).
  for (const bye of a.byes) {
    expect(a.slots[bye]).toBeNull();
  }

  // 6. No round-1 match is double-empty.
  for (const match of result.bracket.matches) {
    if (match.round !== 1) continue;
    expect(match.competitorA !== null || match.competitorB !== null).toBe(true);
  }

  // 7. S1 and S2 (when present) are in different round-1 matches.
  const p1 = a.positionBySeed.get(1);
  const p2 = a.positionBySeed.get(2);
  if (p1 !== undefined && p2 !== undefined) {
    expect(Math.floor(p1 / 2)).not.toBe(Math.floor(p2 / 2));
  }

  void seeds;
  return a;
}

/**
 * The seeds that occupy the opposite slot (`position ^ 1`) of an
 * existing BYE — i.e. the seeds that actually receive a BYE.
 */
function seedRecipientsOf(result: GenerationResult): number[] {
  const byeSet = new Set(result.byes.map((b) => b.position));
  const recipients: number[] = [];
  for (const match of result.bracket.matches) {
    if (match.round !== 1) continue;
    const sides: [number, EngineCompetitor | null][] = [
      [match.position * 2, match.competitorA],
      [match.position * 2 + 1, match.competitorB],
    ];
    for (const [position, competitor] of sides) {
      if (!competitor || competitor.seed === null) continue;
      if (byeSet.has(position ^ 1)) recipients.push(competitor.seed);
    }
  }
  return [...new Set(recipients)].sort((a, b) => a - b);
}

/** Expected BYE recipients under k = min(seedCount, byeCount). */
function expectedRecipients(n: number, seedCount: number): number[] {
  const k = Math.min(seedCount, FROZEN_BYES[n].length);
  return Array.from({ length: k }, (_, i) => i + 1);
}

function byePositionsOf(result: GenerationResult): number[] {
  return [...new Set(result.byes.map((b) => b.position))].sort((a, b) => a - b);
}

/**
 * Core RED assertion: generate with `seedCount` seeds, verify the
 * bracket is valid AND exactly the top k = min(seedCount, byeCount)
 * seeds receive the existing BYEs (each on the opposite slot of a BYE),
 * AND the BYE positions are identical to the zero-seed generation.
 */
function assertRecipientRule(n: number, seedCount: number): BracketAnalysis {
  const a = assertValidBracket(generateRandomDraw(n, seedCount), n, seedsArray(n, seedCount));

  const expected = expectedRecipients(n, seedCount);
  const actual = seedRecipientsOf(generateRandomDraw(n, seedCount));

  // BYE invariance: seeding must NEVER change BYE distribution.
  expect(byePositionsOf(generateRandomDraw(n, seedCount))).toEqual(
    byePositionsOf(generateRandomDraw(n, 0)),
  );

  // Seed priority: exactly [S1..S(k)] receive the BYEs.
  expect(actual).toEqual(expected);
  return a;
}

/** S1/S2 and S3/S4 must be separated into different round-1 matches. */
function assertSeedSeparation(a: BracketAnalysis): void {
  const p1 = a.positionBySeed.get(1);
  const p2 = a.positionBySeed.get(2);
  if (p1 !== undefined && p2 !== undefined) {
    expect(Math.floor(p1 / 2)).not.toBe(Math.floor(p2 / 2));
  }
  const p3 = a.positionBySeed.get(3);
  const p4 = a.positionBySeed.get(4);
  if (p3 !== undefined && p4 !== undefined) {
    expect(Math.floor(p3 / 2)).not.toBe(Math.floor(p4 / 2));
  }
}

describe('TRUE seeding + BYE placement (production path)', () => {
  const cases: CompetitorSeedConfig[] = [
    { n: 6, seeds: [null, null, null, null, null, null] },
    { n: 6, seeds: [1, null, null, null, null, null] },
    { n: 6, seeds: [1, 2, null, null, null, null] },
    { n: 6, seeds: [1, 2, 3, null, null, null] },
    { n: 6, seeds: [1, 2, 3, 4, 5, 6] },
    { n: 5, seeds: [1, 2, null, null, null] },
    { n: 7, seeds: [1, 2, null, null, null, null, null] },
    { n: 9, seeds: [1, 2, 3, null, null, null, null, null, null] },
    { n: 13, seeds: [1, 2, 3, null, null, null, null, null, null, null, null, null, null] },
    { n: 17, seeds: [1, 2, 3, 4, null, null, null, null, null, null, null, null, null, null, null, null, null] },
    { n: 25, seeds: [1, 2, 3, 4, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
  ];

  for (const { n, seeds } of cases) {
    it(`n=${n}, ${seeds.filter((s) => s !== null).length} seed(s): BYEs stay frozen, bracket fully packed`, () => {
      const result = generateRandomDraw(n, seeds.filter((s) => s !== null).length);
      assertValidBracket(result, n, seeds);
    });
  }

  it('n=6, 2 seeds: S1 at slot 1 and S2 at slot 6 (opposite the bottom BYE)', () => {
    const result = generateRandomDraw(6, 2);
    const a = analyze(result);

    expect(a.byes).toEqual([0, 7]);
    expect(a.positionBySeed.get(1)).toBe(1);
    expect(a.positionBySeed.get(2)).toBe(6);
    expect(a.occupied).toEqual([1, 2, 3, 4, 5, 6]);
    expect(a.empty).toEqual([]);
  });

  it('n=6, 1 seed: S1 at slot 1, all 6 competitors packed', () => {
    const result = generateRandomDraw(6, 1);
    const a = analyze(result);

    expect(a.byes).toEqual([0, 7]);
    expect(a.positionBySeed.get(1)).toBe(1);
    expect(a.occupied).toEqual([1, 2, 3, 4, 5, 6]);
    expect(a.empty).toEqual([]);
  });

  it('n=6, 0 seeds: byte-identical behavior to BYE-only placement', () => {
    const result = generateRandomDraw(6, 0);
    const a = analyze(result);

    expect(a.byes).toEqual([0, 7]);
    expect(a.occupied).toEqual([1, 2, 3, 4, 5, 6]);
    expect(a.empty).toEqual([]);
  });

  it('n=6, all seeds: every playable slot occupied, BYEs untouched', () => {
    const result = generateRandomDraw(6, 6);
    const a = analyze(result);

    expect(a.byes).toEqual([0, 7]);
    expect(a.positionBySeed.get(1)).toBe(1);
    expect(a.positionBySeed.get(2)).toBe(6);
    expect(a.occupied).toEqual([1, 2, 3, 4, 5, 6]);
    expect(a.empty).toEqual([]);
  });
});

describe('k = min(seedCount, byeCount): top k seeds receive the existing BYEs', () => {
  // Test A — 6 competitors, 1 seed.
  it('n=6, 1 seed: S1 receives a BYE on the opposite slot of an existing BYE', () => {
    const a = assertRecipientRule(6, 1);
    const result = generateRandomDraw(6, 1);
    const byeSet = new Set(result.byes.map((b) => b.position));
    const s1 = a.positionBySeed.get(1);
    expect(s1).toBeDefined();
    expect(byeSet.has(s1! ^ 1)).toBe(true);
  });

  // Test B — 6 competitors, 2 seeds.
  it('n=6, 2 seeds: S1 and S2 receive the BYEs, no unseeded competitor steals one', () => {
    const a = assertRecipientRule(6, 2);
    const result = generateRandomDraw(6, 2);
    const recipients = seedRecipientsOf(result);
    expect(recipients).toEqual([1, 2]);
    expect(a.byeCount).toBe(2);
  });

  // Test C — 6 competitors, 3 seeds: only 2 BYEs exist.
  it('n=6, 3 seeds: S1 and S2 receive BYEs, S3 does NOT (k = 2)', () => {
    const a = assertRecipientRule(6, 3);
    const result = generateRandomDraw(6, 3);
    expect(seedRecipientsOf(result)).toEqual([1, 2]);
    expect(a.positionBySeed.get(3)).toBeDefined();
  });

  // Test D — 6 competitors, 4 seeds.
  it('n=6, 4 seeds: S1 and S2 receive BYEs, S3 and S4 do NOT (k = 2)', () => {
    const a = assertRecipientRule(6, 4);
    const result = generateRandomDraw(6, 4);
    expect(seedRecipientsOf(result)).toEqual([1, 2]);
    expect(a.positionBySeed.get(3)).toBeDefined();
    expect(a.positionBySeed.get(4)).toBeDefined();
  });

  // Critical regression group — 9 competitors, 7 BYEs. The current
  // implementation fails here starting at S4.
  const n9 = [4, 5, 6, 7, 8];
  for (const seedCount of n9) {
    it(`n=9, ${seedCount} seed(s): exactly the top ${Math.min(seedCount, 7)} seeds receive BYEs`, () => {
      assertRecipientRule(9, seedCount);
    });
  }

  it('n=9, 4 seeds: S4 receives a BYE (current implementation seats it on a match)', () => {
    const a = assertRecipientRule(9, 4);
    const result = generateRandomDraw(9, 4);
    expect(seedRecipientsOf(result)).toEqual([1, 2, 3, 4]);
    expect(a.positionBySeed.get(4)).toBeDefined();
  });

  it('n=9, 8 seeds: S1..S7 receive BYEs, S8 does NOT (k = 7, 8 seeds > 7 BYEs)', () => {
    const a = assertRecipientRule(9, 8);
    const result = generateRandomDraw(9, 8);
    expect(seedRecipientsOf(result)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(a.positionBySeed.get(8)).toBeDefined();
  });

  // 13 competitors, 3 BYEs.
  for (const seedCount of [3, 4, 8]) {
    it(`n=13, ${seedCount} seed(s): exactly the top ${Math.min(seedCount, 3)} seeds receive BYEs`, () => {
      assertRecipientRule(13, seedCount);
    });
  }

  // 17 competitors, 15 BYEs. The current implementation fails at S5.
  for (const seedCount of [4, 5, 6, 8]) {
    it(`n=17, ${seedCount} seed(s): exactly the top ${seedCount} seeds receive BYEs`, () => {
      assertRecipientRule(17, seedCount);
    });
  }

  it('n=17, 5 seeds: S5 receives a BYE (current implementation seats it on a match)', () => {
    const a = assertRecipientRule(17, 5);
    const result = generateRandomDraw(17, 5);
    expect(seedRecipientsOf(result)).toEqual([1, 2, 3, 4, 5]);
    expect(a.positionBySeed.get(5)).toBeDefined();
  });

  // 25 competitors, 7 BYEs. The current implementation only gives BYEs
  // to S1..S3 here.
  for (const seedCount of [4, 5, 6, 7, 8]) {
    it(`n=25, ${seedCount} seed(s): exactly the top ${Math.min(seedCount, 7)} seeds receive BYEs`, () => {
      assertRecipientRule(25, seedCount);
    });
  }

  it('n=25, 7 seeds: all of S1..S7 receive BYEs (current implementation gives BYEs only to S1..S3)', () => {
    const a = assertRecipientRule(25, 7);
    const result = generateRandomDraw(25, 7);
    expect(seedRecipientsOf(result)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(a.positionBySeed.get(7)).toBeDefined();
  });
});

describe('Seeding never changes BYE distribution (BYE invariance)', () => {
  for (const n of [5, 6, 7, 9, 13, 17, 25]) {
    it(`n=${n}: BYE positions identical with 0 seeds and with a full seed set`, () => {
      const without = byePositionsOf(generateRandomDraw(n, 0));
      const withSeeds = byePositionsOf(generateRandomDraw(n, Math.min(8, n)));
      expect(withSeeds).toEqual(without);
    });
  }
});

describe('TRUE seeding structure is preserved alongside BYE recipients', () => {
  it('n=6: S1/S2 separated; non-recipient seeds occupy valid non-BYE slots', () => {
    const a = assertValidBracket(generateRandomDraw(6, 4), 6, seedsArray(6, 4));
    assertSeedSeparation(a);
  });

  it('n=9: S1/S2 and S3/S4 separated', () => {
    const a = assertValidBracket(generateRandomDraw(9, 4), 9, seedsArray(9, 4));
    assertSeedSeparation(a);
  });

  it('n=17: S1/S2 and S3/S4 separated', () => {
    const a = assertValidBracket(generateRandomDraw(17, 5), 17, seedsArray(17, 5));
    assertSeedSeparation(a);
  });

  it('n=25: S1/S2 and S3/S4 separated', () => {
    const a = assertValidBracket(generateRandomDraw(25, 7), 25, seedsArray(25, 7));
    assertSeedSeparation(a);
  });
});

describe('Random draw only affects unseeded fill order, never BYE recipients', () => {
  it('n=9, 4 seeds: BYE recipients identical across different draw orders', () => {
    const n = 9;
    const ids = Array.from({ length: n }, (_, i) => `c${i + 1}`);
    const orders = [ids, [...ids].reverse(), [ids[4], ids[1], ids[7], ids[2], ids[0], ids[8], ids[3], ids[6], ids[5]]];
    const first = seedRecipientsOf(generateRandomDraw(n, 4, orders[0]));
    const firstByes = byePositionsOf(generateRandomDraw(n, 4, orders[0]));
    for (const order of orders.slice(1)) {
      expect(seedRecipientsOf(generateRandomDraw(n, 4, order))).toEqual(first);
      expect(byePositionsOf(generateRandomDraw(n, 4, order))).toEqual(firstByes);
    }
  });

  it('n=25, 7 seeds: BYE recipients identical across different draw orders', () => {
    const n = 25;
    const ids = Array.from({ length: n }, (_, i) => `c${i + 1}`);
    const orders = [ids, [...ids].reverse()];
    const first = seedRecipientsOf(generateRandomDraw(n, 7, orders[0]));
    for (const order of orders.slice(1)) {
      expect(seedRecipientsOf(generateRandomDraw(n, 7, order))).toEqual(first);
    }
  });
});

describe('No-seed behavior is unchanged (BYE-only preservation)', () => {
  for (const n of [5, 6, 7, 9, 13, 17, 25]) {
    it(`n=${n}, 0 seeds: frozen BYE positions, all non-BYE slots filled`, () => {
      const result = generateRandomDraw(n, 0);
      const a = assertValidBracket(result, n, seedsArray(n, 0));
      expect(a.empty).toEqual([]);
    });
  }
});

// Keep the module self-contained for future manual inspection.
export type { EngineBracket };
