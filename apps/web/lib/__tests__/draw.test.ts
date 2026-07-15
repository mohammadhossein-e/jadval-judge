import { describe, it, expect } from 'vitest';
import {
  performDraw,
  createEmptySlots,
  getUnplacedCompetitors,
  validateManualPlacement,
  drawEntriesToPlacements,
  manualSlotsToPlacements,
  type CompetitorInput,
} from '../draw';

describe('performDraw', () => {
  const competitors: readonly CompetitorInput[] = [
    { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
    { id: 'c2', name: 'Bob', club: 'Osaka', seed: null },
    { id: 'c3', name: 'Carol', club: 'Kyoto', seed: 2 },
  ];

  it('returns entries for all competitors', () => {
    const result = performDraw(competitors);
    expect(result).toHaveLength(competitors.length);
  });

  it('assigns sequential positions starting at 1', () => {
    const result = performDraw(competitors);
    const positions = result.map((e) => e.position);
    expect(positions).toEqual([1, 2, 3]);
  });

  it('preserves all competitor data', () => {
    const result = performDraw(competitors);
    const ids = result.map((e) => e.competitorId).sort();
    expect(ids).toEqual(['c1', 'c2', 'c3']);

    for (const entry of result) {
      const source = competitors.find((c) => c.id === entry.competitorId)!;
      expect(entry.name).toBe(source.name);
      expect(entry.club).toBe(source.club);
      expect(entry.seed).toBe(source.seed);
    }
  });

  it('does not mutate the original array', () => {
    const original = [...competitors];
    performDraw(competitors);
    expect([...competitors]).toEqual(original);
  });

  it('works with an empty array', () => {
    const result = performDraw([]);
    expect(result).toEqual([]);
  });

  it('works with a single competitor', () => {
    const result = performDraw([competitors[0]]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      position: 1,
      competitorId: 'c1',
      name: 'Alice',
      club: 'Tokyo',
      seed: 1,
    });
  });

  it('preserves seed values including null', () => {
    const result = performDraw(competitors);
    const seeds = result.map((e) => e.seed).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(seeds).toEqual([null, 1, 2]);
  });

  it('works with 128 competitors', () => {
    const many = Array.from({ length: 128 }, (_, i) => ({
      id: `comp-${i}`,
      name: `Competitor ${i}`,
      club: 'Club',
      seed: null,
    }));

    const result = performDraw(many);
    expect(result).toHaveLength(128);

    const ids = result.map((e) => e.competitorId).sort();
    expect(ids).toEqual(many.map((c) => c.id).sort());

    const positions = result.map((e) => e.position);
    expect(positions).toEqual(Array.from({ length: 128 }, (_, i) => i + 1));
  });
});

describe('createEmptySlots', () => {
  it('creates an array of nulls with the given length', () => {
    expect(createEmptySlots(5)).toEqual([null, null, null, null, null]);
  });

  it('creates an empty array for count 0', () => {
    expect(createEmptySlots(0)).toEqual([]);
  });

  it('creates a single-element array for count 1', () => {
    expect(createEmptySlots(1)).toEqual([null]);
  });
});

describe('getUnplacedCompetitors', () => {
  const competitors: readonly CompetitorInput[] = [
    { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
    { id: 'c2', name: 'Bob', club: 'Osaka', seed: null },
    { id: 'c3', name: 'Carol', club: 'Kyoto', seed: 2 },
  ];

  it('returns all competitors when slots are empty', () => {
    const slots = createEmptySlots(3);
    const result = getUnplacedCompetitors(competitors, slots);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('returns no competitors when all slots are filled', () => {
    const slots = [
      { position: 1, competitorId: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 as number | null },
      { position: 2, competitorId: 'c2', name: 'Bob', club: 'Osaka', seed: null as number | null },
      { position: 3, competitorId: 'c3', name: 'Carol', club: 'Kyoto', seed: 2 as number | null },
    ];
    const result = getUnplacedCompetitors(competitors, slots);
    expect(result).toHaveLength(0);
  });

  it('excludes placed competitors', () => {
    const slots = [
      { position: 1, competitorId: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 as number | null },
      null,
      null,
    ];
    const result = getUnplacedCompetitors(competitors, slots);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(['c2', 'c3']);
  });

  it('handles empty competitor list', () => {
    const result = getUnplacedCompetitors([], createEmptySlots(0));
    expect(result).toHaveLength(0);
  });
});

describe('validateManualPlacement', () => {
  const competitors: readonly CompetitorInput[] = [
    { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
    { id: 'c2', name: 'Bob', club: 'Osaka', seed: null },
  ];

  it('reports incomplete when no competitors placed', () => {
    const result = validateManualPlacement(competitors, createEmptySlots(2));
    expect(result.isComplete).toBe(false);
    expect(result.placedCount).toBe(0);
    expect(result.unplacedCount).toBe(2);
  });

  it('reports incomplete when partially placed', () => {
    const slots = [
      { position: 1, competitorId: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 as number | null },
      null,
    ];
    const result = validateManualPlacement(competitors, slots);
    expect(result.isComplete).toBe(false);
    expect(result.placedCount).toBe(1);
    expect(result.unplacedCount).toBe(1);
  });

  it('reports complete when all placed', () => {
    const slots = [
      { position: 1, competitorId: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 as number | null },
      { position: 2, competitorId: 'c2', name: 'Bob', club: 'Osaka', seed: null as number | null },
    ];
    const result = validateManualPlacement(competitors, slots);
    expect(result.isComplete).toBe(true);
    expect(result.placedCount).toBe(2);
    expect(result.unplacedCount).toBe(0);
  });

  it('reports not complete for empty competitor list', () => {
    const result = validateManualPlacement([], createEmptySlots(0));
    expect(result.isComplete).toBe(false);
    expect(result.placedCount).toBe(0);
    expect(result.unplacedCount).toBe(0);
  });
});

describe('drawEntriesToPlacements', () => {
  it('converts 1-indexed DrawEntry positions to 0-indexed Map', () => {
    const entries = [
      { position: 1, competitorId: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
      { position: 2, competitorId: 'c2', name: 'Bob', club: 'Osaka', seed: null },
      { position: 3, competitorId: 'c3', name: 'Carol', club: 'Kyoto', seed: 2 },
    ];
    const result = drawEntriesToPlacements(entries);
    expect(result.size).toBe(3);
    expect(result.get(0)).toBe('c1');
    expect(result.get(1)).toBe('c2');
    expect(result.get(2)).toBe('c3');
  });

  it('returns empty Map for empty array', () => {
    const result = drawEntriesToPlacements([]);
    expect(result.size).toBe(0);
  });
});

describe('manualSlotsToPlacements', () => {
  it('converts ManualSlots to Map with 0-indexed positions', () => {
    const slots = [
      { position: 0, competitorId: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
      null,
      { position: 2, competitorId: 'c3', name: 'Carol', club: 'Kyoto', seed: 2 },
    ];
    const result = manualSlotsToPlacements(slots);
    expect(result.size).toBe(2);
    expect(result.get(0)).toBe('c1');
    expect(result.get(2)).toBe('c3');
    expect(result.has(1)).toBe(false);
  });

  it('returns empty Map for all-null slots', () => {
    const result = manualSlotsToPlacements([null, null, null]);
    expect(result.size).toBe(0);
  });

  it('returns empty Map for empty array', () => {
    const result = manualSlotsToPlacements([]);
    expect(result.size).toBe(0);
  });
});
