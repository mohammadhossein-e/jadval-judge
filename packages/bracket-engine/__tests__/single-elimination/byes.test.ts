import { describe, it, expect } from 'vitest';
import { calculateBracketInfo, getBracketPreview } from '../../src/single-elimination/byes';
import { calculateByeDistribution } from '../../src/single-elimination/bye-distribution';
import { generateBracket } from '../../src/single-elimination/generator';

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
    const preview = getBracketPreview(8, Array(8).fill(null));
    expect(preview.competitorCount).toBe(8);
    expect(preview.bracketSize).toBe(8);
    expect(preview.byeCount).toBe(0);
    expect(preview.totalRounds).toBe(3);
    expect(preview.seededByes).toEqual([]);
  });

  it('places BYEs at the official priority positions', () => {
    const preview = getBracketPreview(9, Array(9).fill(null));
    expect(preview.competitorCount).toBe(9);
    expect(preview.bracketSize).toBe(16);
    expect(preview.byeCount).toBe(7);
    expect(preview.totalRounds).toBe(4);
    expect(preview.seededByes).toEqual([0, 15, 8, 7, 12, 3, 11]);
  });

  it('returns the expected BYE positions for common competitor counts', () => {
    const cases: [number, number[]][] = [
      [3, [0]],
      [5, [0, 7, 4]],
      [9, [0, 15, 8, 7, 12, 3, 11]],
      [13, [0, 15, 8]],
      [17, [0, 31, 16, 15, 24, 7, 23, 8, 28, 3, 27, 4, 20, 11, 19]],
    ];
    for (const [count, expected] of cases) {
      const preview = getBracketPreview(count, Array(count).fill(null));
      expect(preview.seededByes).toEqual(expected);
    }
  });

  it('matches the official BYE distribution used by the generation pipeline', () => {
    for (const count of [2, 3, 5, 8, 13, 17, 33, 65]) {
      const preview = getBracketPreview(count, Array(count).fill(null));
      const distribution = calculateByeDistribution(count);
      expect(preview.seededByes).toEqual([...distribution.byePositions]);
    }
  });

  it('does not derive BYEs from the seeds argument', () => {
    const seededPreview = getBracketPreview(9, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const unseededPreview = getBracketPreview(9, Array(9).fill(null));
    expect(seededPreview.seededByes).toEqual([0, 15, 8, 7, 12, 3, 11]);
    expect(seededPreview.seededByes).toEqual(unseededPreview.seededByes);
  });

  it('preview BYE positions match the actual generated bracket', () => {
    for (const count of [3, 5, 9, 13, 17]) {
      const competitors = Array.from({ length: count }, (_, i) => ({
        id: `c${i + 1}`,
        name: `Competitor ${i + 1}`,
        seed: i + 1,
      }));

      const preview = getBracketPreview(count, competitors.map((c) => c.seed));
      const { byes } = generateBracket(competitors, 'manual');
      const actual = byes.map((b) => b.position).sort((a, b) => a - b);

      expect(preview.seededByes.slice().sort((a, b) => a - b)).toEqual(actual);
    }
  });

  it('returns correct totalRounds for various sizes', () => {
    for (const [count, expectedRounds] of [[2, 1], [4, 2], [8, 3], [16, 4], [32, 5], [64, 6], [128, 7]]) {
      const preview = getBracketPreview(count as number, Array(count).fill(null));
      expect(preview.totalRounds).toBe(expectedRounds);
    }
  });
});
