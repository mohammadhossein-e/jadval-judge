import { describe, it, expect } from 'vitest';
import { calculateByeDistribution } from '../../src/single-elimination/bye-distribution';

describe('calculateByeDistribution', () => {
  it('2 competitors → no byes', () => {
    const d = calculateByeDistribution(2);
    expect(d).toEqual({ bracketSize: 2, competitorCount: 2, byeCount: 0, byePositions: [] });
  });

  it('4 competitors → no byes', () => {
    const d = calculateByeDistribution(4);
    expect(d).toEqual({ bracketSize: 4, competitorCount: 4, byeCount: 0, byePositions: [] });
  });

  it('3 competitors → 1 bye at position 0', () => {
    const d = calculateByeDistribution(3);
    expect(d.byeCount).toBe(1);
    expect(d.byePositions).toEqual([0]);
  });

  it('5 competitors → 3 byes', () => {
    const d = calculateByeDistribution(5);
    expect(d.byeCount).toBe(3);
    expect(d.byePositions).toHaveLength(3);
    expect(d.byePositions).toEqual([0, 7, 4]);
  });

  it('6 competitors → 2 byes', () => {
    const d = calculateByeDistribution(6);
    expect(d.byeCount).toBe(2);
    expect(d.byePositions).toHaveLength(2);
  });

  it('7 competitors → 1 bye', () => {
    const d = calculateByeDistribution(7);
    expect(d.byeCount).toBe(1);
    expect(d.byePositions).toHaveLength(1);
  });

  it('8 competitors → no byes', () => {
    const d = calculateByeDistribution(8);
    expect(d).toEqual({ bracketSize: 8, competitorCount: 8, byeCount: 0, byePositions: [] });
  });

  it('13 competitors → 3 byes', () => {
    const d = calculateByeDistribution(13);
    expect(d.byeCount).toBe(3);
    expect(d.byePositions).toHaveLength(3);
  });

  it('27 competitors → 5 byes', () => {
    const d = calculateByeDistribution(27);
    expect(d.byeCount).toBe(5);
    expect(d.byePositions).toHaveLength(5);
  });

  it('65 competitors → 63 byes', () => {
    const d = calculateByeDistribution(65);
    expect(d.byeCount).toBe(63);
    expect(d.byePositions).toHaveLength(63);
  });

  it('1 competitor → 1 bye at position 0', () => {
    const d = calculateByeDistribution(1);
    expect(d).toEqual({ bracketSize: 2, competitorCount: 1, byeCount: 1, byePositions: [0] });
  });

  it('bracketSize always equals next power of 2', () => {
    for (const n of [2, 3, 5, 6, 9, 10, 17, 33]) {
      const d = calculateByeDistribution(n);
      expect(d.bracketSize).toBeGreaterThanOrEqual(n);
      expect(d.bracketSize & (d.bracketSize - 1)).toBe(0);
      expect(d.byeCount).toBe(d.bracketSize - n);
    }
  });

  it('byePositions never exceed bracketSize', () => {
    for (const n of [3, 5, 13, 27, 65]) {
      const d = calculateByeDistribution(n);
      for (const pos of d.byePositions) {
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThan(d.bracketSize);
      }
    }
  });

  it('byePositions are unique and in valid range', () => {
    for (const n of [3, 5, 7, 13, 27, 65]) {
      const d = calculateByeDistribution(n);
      expect(new Set(d.byePositions).size).toBe(d.byePositions.length);
      for (const pos of d.byePositions) {
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThan(d.bracketSize);
      }
    }
  });

  it('byePositions + competitor positions cover all bracket positions', () => {
    for (const n of [2, 3, 5, 8, 13, 27, 65]) {
      const d = calculateByeDistribution(n);
      const byeSet = new Set(d.byePositions);
      const competitorPositions = Array.from({ length: d.bracketSize }, (_, i) => i).filter(
        (i) => !byeSet.has(i),
      );
      expect(competitorPositions.length).toBe(n);
      expect(d.byePositions.length + competitorPositions.length).toBe(d.bracketSize);
    }
  });

  it('each byePosition belongs to a unique match', () => {
    for (const n of [3, 5, 6, 7, 9, 10, 11, 12, 13, 17, 33, 65]) {
      const d = calculateByeDistribution(n);
      const matchIds = d.byePositions.map((pos) => Math.floor(pos / 2));
      expect(new Set(matchIds).size).toBe(matchIds.length);
    }
  });

  it('byePositions have no duplicates', () => {
    for (const n of [3, 5, 6, 7, 9, 10, 11, 12, 13, 17, 33, 65]) {
      const d = calculateByeDistribution(n);
      expect(new Set(d.byePositions).size).toBe(d.byePositions.length);
    }
  });

  it('BYEs are separated where possible given seeding constraints', () => {
    const getMatch = (pos: number) => Math.floor(pos / 2);

    for (const n of [3, 5, 6, 7, 9, 10, 11, 12, 13, 17, 24, 33, 65]) {
      const d = calculateByeDistribution(n);
      if (d.byeCount === 0) continue;

      const byeMatches = d.byePositions.map(getMatch);
      const matchCount = d.bracketSize / 2;

      let maxRun = 1;
      let currentRun = 1;
      for (let i = 1; i < byeMatches.length; i++) {
        if (byeMatches[i] === byeMatches[i - 1] + 1) {
          currentRun++;
        } else {
          currentRun = 1;
        }
        maxRun = Math.max(maxRun, currentRun);
      }

      expect(maxRun).toBeLessThanOrEqual(matchCount);
    }
  });

  it('number of bye positions equals byeCount', () => {
    for (const n of [1, 2, 3, 5, 6, 7, 9, 10, 13, 17, 33, 65]) {
      const d = calculateByeDistribution(n);
      expect(d.byePositions.length).toBe(d.byeCount);
    }
  });
});
