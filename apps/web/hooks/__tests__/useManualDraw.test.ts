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
    it('stores full competitor data in slots', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c1', 0);
      });
      const entry = result.current.slots[0];
      expect(entry).toEqual({
        position: 0,
        competitorId: 'c1',
        name: 'Alice',
        club: 'Tokyo',
        seed: 1,
      });
    });

    it('stores array index as position in slot entries', () => {
      const { result } = renderHook(() => useManualDraw(competitors));
      act(() => {
        result.current.placeCompetitor('c3', 2);
      });
      expect(result.current.slots[2]?.position).toBe(2);
    });
  });
});
