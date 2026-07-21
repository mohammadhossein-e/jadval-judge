import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useManualDraw } from '../useManualDraw';
import type { CompetitorInput } from '@/lib/draw';

const competitors: CompetitorInput[] = [
  { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 },
  { id: 'c2', name: 'Bob', club: 'Osaka', seed: null },
  { id: 'c3', name: 'Carol', club: 'Kyoto', seed: 2 },
];

describe('useManualDraw', () => {
  describe('initial state', () => {
    it('starts with all empty slots', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      expect(result.current.slots).toEqual([null, null, null]);
    });

    it('starts with all competitors unplaced', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      expect(result.current.unplacedCompetitors).toHaveLength(3);
      expect(result.current.unplacedCompetitors.map((c) => c.id)).toEqual([
        'c1',
        'c2',
        'c3',
      ]);
    });

    it('starts with isComplete false', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      expect(result.current.isComplete).toBe(false);
      expect(result.current.placedCount).toBe(0);
      expect(result.current.unplacedCount).toBe(3);
    });
  });

  describe('placeCompetitor', () => {
    it('places a competitor in the target slot', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      expect(result.current.slots[0]).not.toBeNull();
      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[0]?.position).toBe(0);
    });

    it('removes competitor from unplaced pool when placed', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      expect(result.current.unplacedCompetitors).toHaveLength(2);
      expect(
        result.current.unplacedCompetitors.find((c) => c.id === 'c1'),
      ).toBeUndefined();
    });

    it('increments placedCount', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      expect(result.current.placedCount).toBe(1);
      expect(result.current.unplacedCount).toBe(2);
    });

    it('re-places an already placed competitor to a new position', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.placeCompetitor('c1', 2);
      });
      expect(result.current.slots[0]).toBeNull();
      expect(result.current.slots[2]?.competitorId).toBe('c1');
      expect(result.current.placedCount).toBe(1);
    });

    it('does nothing for unknown competitor id', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('unknown', 0);
      });
      expect(result.current.slots).toEqual([null, null, null]);
    });

    it('fills a slot occupied by a different competitor', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.placeCompetitor('c2', 0);
      });
      expect(result.current.slots[0]?.competitorId).toBe('c2');
      expect(result.current.placedCount).toBe(1);
      expect(result.current.unplacedCompetitors.find((c) => c.id === 'c1')).toBeDefined();
    });

    it('marks complete when all competitors placed', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.placeCompetitor('c2', 1);
      });
      act(() => {
        result.current.placeCompetitor('c3', 2);
      });
      expect(result.current.isComplete).toBe(true);
      expect(result.current.unplacedCompetitors).toHaveLength(0);
    });
  });

  describe('removeCompetitor', () => {
    it('clears the slot at the given position', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.removeCompetitor(0);
      });
      expect(result.current.slots[0]).toBeNull();
    });

    it('moves removed competitor back to unplaced pool', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.removeCompetitor(0);
      });
      expect(result.current.unplacedCompetitors).toHaveLength(3);
      expect(
        result.current.unplacedCompetitors.find((c) => c.id === 'c1'),
      ).toBeDefined();
    });

    it('decrements placedCount', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.removeCompetitor(0);
      });
      expect(result.current.placedCount).toBe(0);
      expect(result.current.unplacedCount).toBe(3);
    });
  });

  describe('swapCompetitors', () => {
    it('swaps two placed competitors', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.placeCompetitor('c2', 1);
      });
      act(() => {
        result.current.swapCompetitors(0, 1);
      });
      expect(result.current.slots[0]?.competitorId).toBe('c2');
      expect(result.current.slots[1]?.competitorId).toBe('c1');
    });

    it('updates positions in swapped entries', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.placeCompetitor('c2', 1);
      });
      act(() => {
        result.current.swapCompetitors(0, 1);
      });
      expect(result.current.slots[0]?.position).toBe(0);
      expect(result.current.slots[1]?.position).toBe(1);
    });

    it('does not change placedCount', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.placeCompetitor('c2', 1);
      });
      act(() => {
        result.current.swapCompetitors(0, 1);
      });
      expect(result.current.placedCount).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('resets all slots to null', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.placeCompetitor('c2', 1);
      });
      act(() => {
        result.current.clearAll();
      });
      expect(result.current.slots).toEqual([null, null, null]);
    });

    it('moves all competitors back to unplaced pool', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      act(() => {
        result.current.placeCompetitor('c2', 1);
      });
      act(() => {
        result.current.clearAll();
      });
      expect(result.current.unplacedCompetitors).toHaveLength(3);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.placedCount).toBe(0);
    });
  });

  describe('slot data integrity', () => {
    it('stores id-only entry with position and competitorId', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      const entry = result.current.slots[0];
      expect(entry).toEqual({
        position: 0,
        competitorId: 'c1',
      });
    });

    it('does not store competitor metadata in slots', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      const entry = result.current.slots[0];
      expect(entry).not.toHaveProperty('name');
      expect(entry).not.toHaveProperty('club');
      expect(entry).not.toHaveProperty('seed');
    });

    it('stores array index as position in slot entries', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c3', 2);
      });
      expect(result.current.slots[2]?.position).toBe(2);
    });
  });

  describe('competitor synchronization', () => {
    it('preserves placements when a new competitor is added', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
        result.current.placeCompetitor('c3', 2);
      });
      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[2]?.competitorId).toBe('c3');

      const expanded = [
        ...competitors,
        { id: 'c4', name: 'Dave', club: 'Nagoya', seed: null },
      ];
      rerender({ comps: expanded });

      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[2]?.competitorId).toBe('c3');
      expect(result.current.slots).toHaveLength(4);
      expect(result.current.slots[3]).toBeNull();
    });

    it('new competitor appears in unplaced pool after add', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      expect(result.current.unplacedCompetitors.map((c) => c.id)).toEqual(['c2', 'c3']);

      const expanded = [
        ...competitors,
        { id: 'c4', name: 'Dave', club: 'Nagoya', seed: null },
      ];
      rerender({ comps: expanded });

      const unplacedIds = result.current.unplacedCompetitors.map((c) => c.id);
      expect(unplacedIds).toContain('c2');
      expect(unplacedIds).toContain('c3');
      expect(unplacedIds).toContain('c4');
    });

    it('compacts array when placed competitor is deleted', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
        result.current.placeCompetitor('c2', 1);
        result.current.placeCompetitor('c3', 2);
      });
      expect(result.current.placedCount).toBe(3);

      const reduced = competitors.filter((c) => c.id !== 'c2');
      rerender({ comps: reduced });

      expect(result.current.slots).toHaveLength(2);
      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[1]?.competitorId).toBe('c3');
      expect(result.current.placedCount).toBe(2);
    });

    it('removed competitor disappears from pool', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      const reduced = competitors.filter((c) => c.id !== 'c3');
      rerender({ comps: reduced });

      expect(result.current.unplacedCompetitors.find((c) => c.id === 'c3')).toBeUndefined();
      expect(result.current.unplacedCompetitors).toHaveLength(2);
    });

    it('compacts array and shifts entries when unplaced competitor is deleted', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
        result.current.placeCompetitor('c3', 2);
      });

      const reduced = competitors.filter((c) => c.id !== 'c2');
      rerender({ comps: reduced });

      expect(result.current.slots).toHaveLength(2);
      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[1]?.competitorId).toBe('c3');
    });

    it('handles remove and add simultaneously (same length)', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
        result.current.placeCompetitor('c2', 1);
      });

      const updated = [
        { id: 'c1', name: 'Alice', club: 'Tokyo', seed: 1 as number | null },
        { id: 'c4', name: 'Dave', club: 'Nagoya', seed: null as number | null },
      ];
      rerender({ comps: updated });

      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[1]).toBeNull();
      expect(result.current.unplacedCompetitors.map((c) => c.id)).toEqual(['c4']);
    });

    it('handles bulk add', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });

      const expanded = [
        ...competitors,
        { id: 'c4', name: 'Dave', club: 'Nagoya', seed: null },
        { id: 'c5', name: 'Eve', club: 'Osaka', seed: null },
      ];
      rerender({ comps: expanded });

      expect(result.current.slots).toHaveLength(5);
      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[3]).toBeNull();
      expect(result.current.slots[4]).toBeNull();
      expect(result.current.unplacedCompetitors.map((c) => c.id)).toEqual([
        'c2', 'c3', 'c4', 'c5',
      ]);
    });

    it('isComplete updates correctly after add', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
        result.current.placeCompetitor('c2', 1);
        result.current.placeCompetitor('c3', 2);
      });
      expect(result.current.isComplete).toBe(true);

      const expanded = [
        ...competitors,
        { id: 'c4', name: 'Dave', club: 'Nagoya', seed: null },
      ];
      rerender({ comps: expanded });

      expect(result.current.isComplete).toBe(false);
      expect(result.current.unplacedCount).toBe(1);
    });

    it('does not reset placements when only metadata changes (rename)', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
        result.current.placeCompetitor('c2', 1);
      });

      const renamed = competitors.map((c) =>
        c.id === 'c1' ? { ...c, name: 'Alicia' } : c,
      );
      rerender({ comps: renamed });

      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[1]?.competitorId).toBe('c2');
      expect(result.current.placedCount).toBe(2);
    });

    it('handles multiple add and remove operations', () => {
      const { result, rerender } = renderHook(
        ({ comps }) => useManualDraw(comps),
        { initialProps: { comps: competitors } },
      );
      act(() => {
        result.current.placeCompetitor('c1', 0);
        result.current.placeCompetitor('c2', 1);
      });

      let current = [
        ...competitors,
        { id: 'c4', name: 'Dave', club: 'Nagoya', seed: null },
      ];
      rerender({ comps: current });
      expect(result.current.slots).toHaveLength(4);
      expect(result.current.slots[0]?.competitorId).toBe('c1');
      expect(result.current.slots[1]?.competitorId).toBe('c2');

      current = current.filter((c) => c.id !== 'c1');
      rerender({ comps: current });
      expect(result.current.slots).toHaveLength(3);
      expect(result.current.slots[0]?.competitorId).toBe('c2');
      expect(result.current.slots[1]).toBeNull();
      expect(result.current.slots[2]).toBeNull();
    });
  });
});
