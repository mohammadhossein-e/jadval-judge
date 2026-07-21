'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  createEmptySlots,
  getUnplacedCompetitors,
  syncSlots,
  validateManualPlacement,
  type CompetitorInput,
  type DrawEntry,
  type ManualSlots,
} from '@/lib/draw';

export interface UseManualDrawReturn {
  slots: ManualSlots;
  unplacedCompetitors: CompetitorInput[];
  isComplete: boolean;
  placedCount: number;
  unplacedCount: number;
  placeCompetitor: (competitorId: string, targetPosition: number) => void;
  removeCompetitor: (position: number) => void;
  swapCompetitors: (fromPosition: number, toPosition: number) => void;
  clearAll: () => void;
}

export function useManualDraw(competitors: readonly CompetitorInput[]): UseManualDrawReturn {
  const [slots, setSlots] = useState<ManualSlots>(() => createEmptySlots(competitors.length));

  const competitorMap = useMemo(
    () => new Map(competitors.map((c) => [c.id, c])),
    [competitors],
  );

  const [prevCompetitors, setPrevCompetitors] = useState(competitors);
  if (prevCompetitors !== competitors) {
    setPrevCompetitors(competitors);
    setSlots((prev) => syncSlots(competitors, prev));
  }

  const unplacedCompetitors = useMemo(
    () => getUnplacedCompetitors(competitors, slots),
    [competitors, slots],
  );

  const { isComplete, placedCount, unplacedCount } = useMemo(
    () => validateManualPlacement(competitors, slots),
    [competitors, slots],
  );

  const placeCompetitor = useCallback(
    (competitorId: string, targetPosition: number) => {
      const competitor = competitorMap.get(competitorId);
      if (!competitor) return;

      setSlots((prev) => {
        const next = [...prev];
        const existingIndex = next.findIndex(
          (s) => s !== null && s.competitorId === competitorId,
        );

        const entry: DrawEntry = {
          position: targetPosition,
          competitorId: competitor.id,
        };

        if (existingIndex !== -1) {
          next[existingIndex] = null;
        }
        next[targetPosition] = entry;

        return next;
      });
    },
    [competitorMap],
  );

  const removeCompetitor = useCallback((position: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[position] = null;
      return next;
    });
  }, []);

  const swapCompetitors = useCallback((fromPosition: number, toPosition: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const from = next[fromPosition];
      const to = next[toPosition];
      next[fromPosition] = to ? { ...to, position: fromPosition } : null;
      next[toPosition] = from ? { ...from, position: toPosition } : null;
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSlots(createEmptySlots(competitors.length));
  }, [competitors.length]);

  return {
    slots,
    unplacedCompetitors,
    isComplete,
    placedCount,
    unplacedCount,
    placeCompetitor,
    removeCompetitor,
    swapCompetitors,
    clearAll,
  };
}
