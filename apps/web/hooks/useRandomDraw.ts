'use client';

import { useState, useCallback } from 'react';
import {
  performDraw,
  type CompetitorInput,
  type DrawEntry,
} from '@/lib/draw';

export interface UseRandomDrawReturn {
  drawResult: DrawEntry[] | null;
  hasDraw: boolean;
  executeDraw: (competitors: readonly CompetitorInput[]) => DrawEntry[];
  clearDraw: () => void;
}

export function useRandomDraw(): UseRandomDrawReturn {
  const [drawResult, setDrawResult] = useState<DrawEntry[] | null>(null);

  const executeDraw = useCallback((competitors: readonly CompetitorInput[]): DrawEntry[] => {
    const result = performDraw(competitors);
    setDrawResult(result);
    return result;
  }, []);

  const clearDraw = useCallback(() => {
    setDrawResult(null);
  }, []);

  return {
    drawResult,
    hasDraw: drawResult !== null,
    executeDraw,
    clearDraw,
  };
}
