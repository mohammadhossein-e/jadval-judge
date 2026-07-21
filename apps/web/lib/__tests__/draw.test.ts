import { describe, it, expect } from 'vitest';
import {
  performDraw,
  createEmptySlots,
  getUnplacedCompetitors,
  validateManualPlacement,
  drawEntriesToPlacements,
  manualSlotsToPlacements,
  resolveSlots,
  resolveDrawEntries,
  syncSlots,
  type CompetitorInput,
  type DrawEntry,
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

  it('preserves all competitor IDs', () => {
    const result = performDraw(competitors);
    const ids = result.map((e) => e.competitorId).sort();
    expect(ids).toEqual(['c1', 'c2', 'c3']);
  });

  it('does not include metadata in entries', () => {
    const result = performDraw(competitors);
    for (const entry of result) {
      expect(entry).not.toHaveProperty('name');
      expect(entry).not.toHaveProperty('club');
      expect(entry).not.toHaveProperty('seed');
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
    });
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

describe('resolveSlots', () => {
  const competitors: readonly CompetitorInput[] = [
    { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
    { id: 'c2', name: 'Bob', club: 'Osaka', seed: null },
    { id: 'c3', name: 'Carol', club: 'Kyoto', seed: 2 },
  ];
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));

  it('resolves placed entries with competitor data', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      null,
      { position: 2, competitorId: 'c3' },
    ];
    const result = resolveSlots(slots, competitorMap);
    expect(result[0]).toEqual({
      position: 0,
      competitorId: 'c1',
      name: 'Alice',
      club: 'Tokyo',
      seed: 1,
    });
    expect(result[1]).toBeNull();
    expect(result[2]).toEqual({
      position: 2,
      competitorId: 'c3',
      name: 'Carol',
      club: 'Kyoto',
      seed: 2,
    });
  });

  it('returns null for entries with unknown competitor IDs', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'unknown' },
    ];
    const result = resolveSlots(slots, competitorMap);
    expect(result[0]).toBeNull();
  });

  it('returns empty array for empty slots', () => {
    const result = resolveSlots([], competitorMap);
    expect(result).toEqual([]);
  });

  it('returns all nulls for all-null slots', () => {
    const result = resolveSlots([null, null], competitorMap);
    expect(result).toEqual([null, null]);
  });
});

describe('resolveDrawEntries', () => {
  const competitors: readonly CompetitorInput[] = [
    { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
    { id: 'c2', name: 'Bob', club: 'Osaka', seed: null },
  ];
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));

  it('resolves entries with competitor data', () => {
    const entries: DrawEntry[] = [
      { position: 1, competitorId: 'c1' },
      { position: 2, competitorId: 'c2' },
    ];
    const result = resolveDrawEntries(entries, competitorMap);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      position: 1,
      competitorId: 'c1',
      name: 'Alice',
      club: 'Tokyo',
      seed: 1,
    });
    expect(result[1]).toEqual({
      position: 2,
      competitorId: 'c2',
      name: 'Bob',
      club: 'Osaka',
      seed: null,
    });
  });

  it('filters out entries with unknown competitor IDs', () => {
    const entries: DrawEntry[] = [
      { position: 1, competitorId: 'c1' },
      { position: 2, competitorId: 'unknown' },
    ];
    const result = resolveDrawEntries(entries, competitorMap);
    expect(result).toHaveLength(1);
    expect(result[0].competitorId).toBe('c1');
  });

  it('returns empty array for empty entries', () => {
    const result = resolveDrawEntries([], competitorMap);
    expect(result).toEqual([]);
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
    const slots: DrawEntry[] = [
      { position: 1, competitorId: 'c1' },
      { position: 2, competitorId: 'c2' },
      { position: 3, competitorId: 'c3' },
    ];
    const result = getUnplacedCompetitors(competitors, slots);
    expect(result).toHaveLength(0);
  });

  it('excludes placed competitors', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 1, competitorId: 'c1' },
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
    const slots: (DrawEntry | null)[] = [
      { position: 1, competitorId: 'c1' },
      null,
    ];
    const result = validateManualPlacement(competitors, slots);
    expect(result.isComplete).toBe(false);
    expect(result.placedCount).toBe(1);
    expect(result.unplacedCount).toBe(1);
  });

  it('reports complete when all placed', () => {
    const slots: DrawEntry[] = [
      { position: 1, competitorId: 'c1' },
      { position: 2, competitorId: 'c2' },
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
    const entries: DrawEntry[] = [
      { position: 1, competitorId: 'c1' },
      { position: 2, competitorId: 'c2' },
      { position: 3, competitorId: 'c3' },
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
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      null,
      { position: 2, competitorId: 'c3' },
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

describe('syncSlots', () => {
  const competitors: readonly CompetitorInput[] = [
    { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
    { id: 'c2', name: 'Bob', club: 'Osaka', seed: null },
    { id: 'c3', name: 'Carol', club: 'Kyoto', seed: 2 },
  ];

  it('preserves existing placements when competitors unchanged', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      null,
      { position: 2, competitorId: 'c3' },
    ];
    const result = syncSlots(competitors, slots);
    expect(result[0]).toEqual({ position: 0, competitorId: 'c1' });
    expect(result[1]).toBeNull();
    expect(result[2]).toEqual({ position: 2, competitorId: 'c3' });
  });

  it('appends null slots when competitor is added', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      null,
    ];
    const newCompetitors = [...competitors];
    const result = syncSlots(newCompetitors, slots);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ position: 0, competitorId: 'c1' });
    expect(result[1]).toBeNull();
    expect(result[2]).toBeNull();
  });

  it('compacts array when placed competitor is deleted', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      { position: 1, competitorId: 'c2' },
      { position: 2, competitorId: 'c3' },
    ];
    const remaining = competitors.filter((c) => c.id !== 'c2');
    const result = syncSlots(remaining, slots);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ position: 0, competitorId: 'c1' });
    expect(result[1]).toEqual({ position: 1, competitorId: 'c3' });
  });

  it('shifts later entries left when placed competitor is deleted from middle', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      { position: 1, competitorId: 'c2' },
      { position: 2, competitorId: 'c3' },
    ];
    const remaining = competitors.filter((c) => c.id !== 'c1');
    const result = syncSlots(remaining, slots);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ position: 0, competitorId: 'c2' });
    expect(result[1]).toEqual({ position: 1, competitorId: 'c3' });
  });

  it('preserves positions of remaining entries after delete', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      null,
      { position: 2, competitorId: 'c3' },
    ];
    const remaining = competitors.filter((c) => c.id !== 'c3');
    const result = syncSlots(remaining, slots);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ position: 0, competitorId: 'c1' });
    expect(result[1]).toBeNull();
  });

  it('handles remove and add simultaneously (same length)', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      { position: 1, competitorId: 'c2' },
    ];
    const updated = [
      { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 as number | null },
      { id: 'c4', name: 'Dave', club: 'Nagoya', seed: null as number | null },
    ];
    const result = syncSlots(updated, slots);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ position: 0, competitorId: 'c1' });
    expect(result[1]).toBeNull();
  });

  it('handles bulk add', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
    ];
    const expanded = [
      ...competitors,
      { id: 'c4', name: 'Dave', club: 'Nagoya', seed: null },
      { id: 'c5', name: 'Eve', club: 'Osaka', seed: null },
    ];
    const result = syncSlots(expanded, slots);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ position: 0, competitorId: 'c1' });
    expect(result[1]).toBeNull();
    expect(result[2]).toBeNull();
    expect(result[3]).toBeNull();
    expect(result[4]).toBeNull();
  });

  it('returns all nulls for empty competitor list', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
    ];
    const result = syncSlots([], slots);
    expect(result).toEqual([]);
  });

  it('returns all nulls for empty slots and empty competitors', () => {
    const result = syncSlots([], []);
    expect(result).toEqual([]);
  });

  it('truncates slots that exceed new competitor count', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      { position: 1, competitorId: 'c2' },
      { position: 2, competitorId: 'c3' },
    ];
    const reduced = competitors.filter((c) => c.id !== 'c3');
    const result = syncSlots(reduced, slots);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ position: 0, competitorId: 'c1' });
    expect(result[1]).toEqual({ position: 1, competitorId: 'c2' });
  });

  it('evicts valid entry when it falls outside new length', () => {
    const slots: (DrawEntry | null)[] = [
      null,
      null,
      { position: 2, competitorId: 'c3' },
    ];
    const reduced = competitors.filter((c) => c.id !== 'c3');
    const result = syncSlots(reduced, slots);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
  });

  it('does not mutate the original slots array', () => {
    const slots: (DrawEntry | null)[] = [
      { position: 0, competitorId: 'c1' },
      null,
    ];
    const original = [...slots];
    syncSlots(competitors, slots);
    expect(slots).toEqual(original);
  });
});
