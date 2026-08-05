'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  generateBracket,
  getBracketPreview,
  type EngineCompetitor,
  type EngineBracket,
  type GenerationResult,
  type BracketPreview,
} from '@jadval/bracket-engine';
import type { CompetitorInput } from '@/lib/draw';

export interface UseBracketGenerationReturn {
  bracket: EngineBracket | null;
  byes: GenerationResult['byes'];
  isGenerated: boolean;
  preview: BracketPreview;
  generate: (placements?: Map<number, string>) => EngineBracket;
  reset: () => void;
}

function toEngineCompetitor(c: CompetitorInput): EngineCompetitor {
  return { id: c.id, name: c.name, seed: c.seed };
}

export function useBracketGeneration(
  competitors: readonly CompetitorInput[],
  drawType: 'random' | 'manual',
  initialBracket: EngineBracket | null = null,
): UseBracketGenerationReturn {
  const [result, setResult] = useState<GenerationResult | null>(() =>
    initialBracket ? { bracket: initialBracket, byes: [] } : null,
  );

  const engineCompetitors = useMemo(
    () => competitors.map(toEngineCompetitor),
    [competitors],
  );

  const seeds = useMemo(() => competitors.map((c) => c.seed), [competitors]);

  const preview: BracketPreview = useMemo(
    () =>
      competitors.length >= 2
        ? getBracketPreview(competitors.length, seeds)
        : { competitorCount: competitors.length, bracketSize: 0, byeCount: 0, totalRounds: 0, seededByes: [] },
    [competitors.length, seeds],
  );

  const generate = useCallback(
    (placements?: Map<number, string>): EngineBracket => {
      const genResult = generateBracket(engineCompetitors, drawType, placements);
      setResult(genResult);
      return genResult.bracket;
    },
    [engineCompetitors, drawType],
  );

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    bracket: result?.bracket ?? null,
    byes: result?.byes ?? [],
    isGenerated: result !== null,
    preview,
    generate,
    reset,
  };
}
