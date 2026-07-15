import { describe, it, expect } from 'vitest';
import { standardSeeding, placeCompetitors } from '../../src/single-elimination/seeding';
import type { EngineCompetitor } from '../../src/types';

describe('standardSeeding', () => {
  it('returns [1, 2] for bracket size 2', () => {
    expect(standardSeeding(2)).toEqual([1, 2]);
  });

  it('returns correct seeding for bracket size 4', () => {
    const seeding = standardSeeding(4);
    expect(seeding).toEqual([1, 4, 2, 3]);
  });

  it('returns correct seeding for bracket size 8', () => {
    const seeding = standardSeeding(8);
    expect(seeding).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('ensures seed 1 and seed 2 are in opposite halves', () => {
    for (const size of [4, 8, 16, 32]) {
      const seeding = standardSeeding(size);
      const pos1 = seeding.indexOf(1);
      const pos2 = seeding.indexOf(2);
      const half = size / 2;
      const sameHalf =
        (pos1 < half && pos2 < half) || (pos1 >= half && pos2 >= half);
      expect(sameHalf).toBe(false);
    }
  });

  it('ensures seed 1 and seed 2 can only meet in the final', () => {
    for (const size of [4, 8, 16]) {
      const seeding = standardSeeding(size);
      const pos1 = seeding.indexOf(1);
      const pos2 = seeding.indexOf(2);
      expect(pos1).toBeLessThan(size / 2);
      expect(pos2).toBeGreaterThanOrEqual(size / 2);
    }
  });

  it('produces correct bracket size', () => {
    for (const size of [2, 4, 8, 16, 32]) {
      expect(standardSeeding(size)).toHaveLength(size);
    }
  });
});

describe('placeCompetitors', () => {
  function makeCompetitors(count: number): EngineCompetitor[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `c${i + 1}`,
      name: `Competitor ${i + 1}`,
      seed: i + 1,
    }));
  }

  describe('seeded placement', () => {
    it('places seeded competitors at correct positions for 8-slot bracket', () => {
      const competitors = makeCompetitors(8);
      const positions = placeCompetitors(competitors, 8, 'random');
      expect(positions).toHaveLength(8);
      const placed = positions.filter(Boolean);
      expect(placed).toHaveLength(8);
    });

    it('places all competitors in a 128-slot bracket', () => {
      const competitors = makeCompetitors(64);
      const positions = placeCompetitors(competitors, 128, 'random');
      expect(positions).toHaveLength(128);
      const placed = positions.filter(Boolean);
      expect(placed).toHaveLength(64);
      const empty = positions.filter((p) => p === null);
      expect(empty).toHaveLength(64);
    });
  });

  describe('random placement', () => {
    it('places all competitors', () => {
      const competitors = makeCompetitors(6);
      const positions = placeCompetitors(competitors, 8, 'random');
      const placed = positions.filter(Boolean);
      expect(placed).toHaveLength(6);
    });

    it('leaves empty slots for BYEs', () => {
      const competitors = makeCompetitors(5);
      const positions = placeCompetitors(competitors, 8, 'random');
      const empty = positions.filter((p) => p === null);
      expect(empty).toHaveLength(3);
    });

    it('produces different orders across runs', () => {
      const competitors = makeCompetitors(8);
      const orders = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const positions = placeCompetitors(competitors, 8, 'random');
        const order = positions
          .filter(Boolean)
          .map((c) => c!.id)
          .join(',');
        orders.add(order);
      }
      expect(orders.size).toBeGreaterThan(1);
    });
  });

  describe('manual placement', () => {
    it('places competitors at specified positions', () => {
      const competitors = makeCompetitors(4);
      const placements = new Map<number, string>([
        [0, 'c3'],
        [3, 'c1'],
      ]);
      const positions = placeCompetitors(competitors, 4, 'manual', placements);
      expect(positions[0]?.id).toBe('c3');
      expect(positions[3]?.id).toBe('c1');
    });

    it('fills remaining slots with unplaced competitors', () => {
      const competitors = makeCompetitors(4);
      const placements = new Map<number, string>([
        [0, 'c4'],
      ]);
      const positions = placeCompetitors(competitors, 4, 'manual', placements);
      expect(positions[0]?.id).toBe('c4');
      const remaining = positions.slice(1).filter(Boolean).map((p) => p!.id);
      expect(remaining).toHaveLength(3);
      expect(remaining).not.toContain('c4');
    });

    it('ignores out-of-range positions', () => {
      const competitors = makeCompetitors(4);
      const placements = new Map<number, string>([
        [0, 'c1'],
        [10, 'c2'],
      ]);
      const positions = placeCompetitors(competitors, 4, 'manual', placements);
      expect(positions[0]?.id).toBe('c1');
      expect(positions[10]).toBeUndefined();
    });

    it('ignores unknown competitor IDs and fills sequentially', () => {
      const competitors = makeCompetitors(2);
      const placements = new Map<number, string>([
        [0, 'unknown'],
      ]);
      const positions = placeCompetitors(competitors, 4, 'manual', placements);
      expect(positions[0]?.id).toBe('c1');
      expect(positions[1]?.id).toBe('c2');
      expect(positions.filter(Boolean)).toHaveLength(2);
    });
  });

  describe('provided placements override drawType', () => {
    it('uses provided placements even with random drawType', () => {
      const competitors = makeCompetitors(4);
      const placements = new Map<number, string>([
        [0, 'c2'],
        [1, 'c4'],
        [2, 'c1'],
        [3, 'c3'],
      ]);
      const positions = placeCompetitors(competitors, 8, 'random', placements);
      expect(positions[0]?.id).toBe('c2');
      expect(positions[1]?.id).toBe('c4');
      expect(positions[2]?.id).toBe('c1');
      expect(positions[3]?.id).toBe('c3');
    });
  });
});
