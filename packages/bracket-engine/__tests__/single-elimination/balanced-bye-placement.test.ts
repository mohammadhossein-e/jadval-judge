import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import type { GenerationContext } from '../../src/engine/generation-context';
import type { PositionMap } from '../../src/engine/position-map';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { buildSingleEliminationSkeleton } from '../../src/single-elimination/single-elimination-skeleton';
import { buildSingleEliminationPositionMap } from '../../src/single-elimination/single-elimination-position-map';
import { placeByes } from '../../src/single-elimination/balanced-bye-placement';

function ctx(competitorCount: number): GenerationContext {
  const competitors: EngineCompetitor[] = Array.from({ length: competitorCount }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Name ${i + 1}`,
    seed: null,
  }));
  return buildGenerationContext(competitors);
}

function posMap(competitorCount: number): PositionMap {
  const c = ctx(competitorCount);
  const skeleton = buildSingleEliminationSkeleton(c);
  return buildSingleEliminationPositionMap(skeleton);
}

// ─── Exact expected outputs ─────────────────────────────────────

describe('balanced bye placement — exact outputs', () => {
  it('3 competitors → [3]', () => {
    expect(placeByes(ctx(3), posMap(3))).toEqual([3]);
  });

  it('5 competitors → [3,5,7]', () => {
    expect(placeByes(ctx(5), posMap(5))).toEqual([3, 5, 7]);
  });

  it('6 competitors → [3,7]', () => {
    expect(placeByes(ctx(6), posMap(6))).toEqual([3, 7]);
  });

  it('7 competitors → [7]', () => {
    expect(placeByes(ctx(7), posMap(7))).toEqual([7]);
  });

  it('10 competitors → [3,5,7,11,13,15]', () => {
    expect(placeByes(ctx(10), posMap(10))).toEqual([3, 5, 7, 11, 13, 15]);
  });

  it('13 competitors → [7,11,15]', () => {
    expect(placeByes(ctx(13), posMap(13))).toEqual([7, 11, 15]);
  });

  it('17 competitors', () => {
    const result = placeByes(ctx(17), posMap(17));
    expect(result).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31]);
  });

  it('24 competitors', () => {
    const result = placeByes(ctx(24), posMap(24));
    expect(result).toEqual([3, 7, 11, 15, 19, 23, 27, 31]);
  });

  it('27 competitors', () => {
    const result = placeByes(ctx(27), posMap(27));
    expect(result).toEqual([7, 15, 23, 27, 31]);
  });

  it('31 competitors', () => {
    const result = placeByes(ctx(31), posMap(31));
    expect(result).toEqual([31]);
  });

  it('33 competitors', () => {
    const result = placeByes(ctx(33), posMap(33));
    expect(result).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63]);
  });

  it('65 competitors', () => {
    const result = placeByes(ctx(65), posMap(65));
    expect(result).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119, 121, 123, 125, 127]);
  });

  it('127 competitors', () => {
    const result = placeByes(ctx(127), posMap(127));
    expect(result).toEqual([127]);
  });
});

// ─── Mathematical invariants ────────────────────────────────────

describe('balanced bye placement — invariants', () => {
  const counts = [2, 3, 5, 6, 7, 9, 10, 13, 17, 24, 27, 31, 33, 65, 100, 127, 128];

  for (const n of counts) {
    it(`count matches byeCount for ${n} competitors`, () => {
      const c = ctx(n);
      const result = placeByes(c, posMap(n));
      expect(result).toHaveLength(c.byeCount);
    });
  }

  for (const n of counts) {
    it(`indices are sorted for ${n} competitors`, () => {
      const result = placeByes(ctx(n), posMap(n));
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThan(result[i - 1]);
      }
    });
  }

  for (const n of counts) {
    it(`indices are unique for ${n} competitors`, () => {
      const result = placeByes(ctx(n), posMap(n));
      expect(new Set(result).size).toBe(result.length);
    });
  }

  for (const n of counts) {
    it(`indices are in valid range for ${n} competitors`, () => {
      const c = ctx(n);
      const result = placeByes(c, posMap(n));
      for (const idx of result) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(c.bracketSize);
      }
    });
  }

  it('returns [] when byeCount is 0', () => {
    expect(placeByes(ctx(8), posMap(8))).toEqual([]);
  });
});

// ─── Determinism ────────────────────────────────────────────────

describe('balanced bye placement — determinism', () => {
  for (const n of [3, 5, 10, 24, 65, 127]) {
    it(`consistent across calls for ${n} competitors`, () => {
      const c = ctx(n);
      const pm = posMap(n);
      const a = placeByes(c, pm);
      const b = placeByes(c, pm);
      expect(a).toEqual(b);
    });
  }
});

// ─── Recursive balance invariant ────────────────────────────────

describe('balanced bye placement — recursive balance', () => {
  /**
   * Verify the core balance invariant: at every recursive split of
   * the bracket, the absolute difference between left and right BYE
   * counts is ≤ 1.
   */
  function checkBalance(size: number, positions: readonly number[]): void {
    if (positions.length === 0 || size <= 1) return;

    const half = size / 2;
    const left = positions.filter((p) => p < half);
    const right = positions.filter((p) => p >= half);

    expect(Math.abs(left.length - right.length)).toBeLessThanOrEqual(1);

    checkBalance(half, left);
    checkBalance(half, right.map((p) => p - half));
  }

  const counts = [2, 3, 5, 6, 7, 9, 10, 13, 17, 24, 27, 31, 33, 65, 100, 127, 128];

  for (const n of counts) {
    it(`balanced at every split for ${n} competitors`, () => {
      const c = ctx(n);
      const result = placeByes(c, posMap(n));
      checkBalance(c.bracketSize, result);
    });
  }
});

// ─── No seeding dependency ──────────────────────────────────────

describe('balanced bye placement — independence', () => {
  it('does not depend on competitor seeds', () => {
    const c1: EngineCompetitor[] = [
      { id: 'a', name: 'A', seed: 1 },
      { id: 'b', name: 'B', seed: 2 },
      { id: 'c', name: 'C', seed: 3 },
    ];
    const c2: EngineCompetitor[] = [
      { id: 'x', name: 'X', seed: 3 },
      { id: 'y', name: 'Y', seed: 1 },
      { id: 'z', name: 'Z', seed: 2 },
    ];
    const gc1 = buildGenerationContext(c1);
    const gc2 = buildGenerationContext(c2);
    const pm1 = buildSingleEliminationPositionMap(buildSingleEliminationSkeleton(gc1));
    const pm2 = buildSingleEliminationPositionMap(buildSingleEliminationSkeleton(gc2));

    expect(placeByes(gc1, pm1)).toEqual(placeByes(gc2, pm2));
  });
});
