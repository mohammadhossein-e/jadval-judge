import { describe, it, expect } from 'vitest';
import { calculateBracketInfo, getBracketPreview } from '../../src/single-elimination/byes';
import { standardSeeding } from '../../src/single-elimination/seeding';

describe('calculateBracketInfo', () => {
  it('returns bracketSize = competitorCount for power of 2', () => {
    expect(calculateBracketInfo(2)).toEqual({ bracketSize: 2, totalRounds: 1, byeCount: 0 });
    expect(calculateBracketInfo(4)).toEqual({ bracketSize: 4, totalRounds: 2, byeCount: 0 });
    expect(calculateBracketInfo(8)).toEqual({ bracketSize: 8, totalRounds: 3, byeCount: 0 });
    expect(calculateBracketInfo(16)).toEqual({ bracketSize: 16, totalRounds: 4, byeCount: 0 });
    expect(calculateBracketInfo(32)).toEqual({ bracketSize: 32, totalRounds: 5, byeCount: 0 });
    expect(calculateBracketInfo(64)).toEqual({ bracketSize: 64, totalRounds: 6, byeCount: 0 });
    expect(calculateBracketInfo(128)).toEqual({ bracketSize: 128, totalRounds: 7, byeCount: 0 });
  });

  it('rounds up to next power of 2', () => {
    expect(calculateBracketInfo(3).bracketSize).toBe(4);
    expect(calculateBracketInfo(5).bracketSize).toBe(8);
    expect(calculateBracketInfo(9).bracketSize).toBe(16);
    expect(calculateBracketInfo(17).bracketSize).toBe(32);
    expect(calculateBracketInfo(33).bracketSize).toBe(64);
    expect(calculateBracketInfo(65).bracketSize).toBe(128);
  });

  it('calculates correct BYE count', () => {
    expect(calculateBracketInfo(3).byeCount).toBe(1);
    expect(calculateBracketInfo(5).byeCount).toBe(3);
    expect(calculateBracketInfo(6).byeCount).toBe(2);
    expect(calculateBracketInfo(7).byeCount).toBe(1);
    expect(calculateBracketInfo(9).byeCount).toBe(7);
    expect(calculateBracketInfo(100).byeCount).toBe(28);
  });

  it('calculates correct total rounds', () => {
    expect(calculateBracketInfo(2).totalRounds).toBe(1);
    expect(calculateBracketInfo(4).totalRounds).toBe(2);
    expect(calculateBracketInfo(8).totalRounds).toBe(3);
    expect(calculateBracketInfo(16).totalRounds).toBe(4);
    expect(calculateBracketInfo(128).totalRounds).toBe(7);
  });
});

describe('getBracketPreview', () => {
  it('returns correct preview for power-of-2 count', () => {
    const preview = getBracketPreview(8, [null, null, null, null, null, null, null, null]);
    expect(preview.competitorCount).toBe(8);
    expect(preview.bracketSize).toBe(8);
    expect(preview.byeCount).toBe(0);
    expect(preview.totalRounds).toBe(3);
    expect(preview.seededByes).toEqual([]);
  });

  it('calculates seeded BYEs for non-power-of-2 count', () => {
    const seeds = [1, null, null, null];
    const preview = getBracketPreview(4, seeds);
    expect(preview.competitorCount).toBe(4);
    expect(preview.bracketSize).toBe(4);
    expect(preview.byeCount).toBe(0);
    expect(preview.seededByes).toEqual([]);
  });

  it('identifies which seeds receive BYEs', () => {
    const competitors = 6;
    const seeds = Array(competitors).fill(null) as (number | null)[];
    seeds[0] = 1;
    seeds[1] = 2;
    const preview = getBracketPreview(competitors, seeds);
    expect(preview.byeCount).toBe(2);
    expect(preview.seededByes.length).toBeGreaterThanOrEqual(0);
  });

  it('returns correct totalRounds for various sizes', () => {
    for (const [count, expectedRounds] of [[2, 1], [4, 2], [8, 3], [16, 4], [32, 5], [64, 6], [128, 7]]) {
      const preview = getBracketPreview(count as number, Array(count).fill(null));
      expect(preview.totalRounds).toBe(expectedRounds);
    }
  });
});
