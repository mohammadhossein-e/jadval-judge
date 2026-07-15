'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  resolveMatch,
  cascadeUndo,
  isBracketComplete,
  getChampion,
  type EngineBracket,
  type EngineCompetitor,
  type EngineMatch,
} from '@jadval/bracket-engine';

export interface UseMatchResolutionReturn {
  bracket: EngineBracket | null;
  champion: EngineCompetitor | null;
  isComplete: boolean;
  resolveWinner: (matchId: string, winnerId: string) => void;
  undoMatch: (matchId: string) => void;
  canResolveMatch: (matchId: string) => boolean;
  canUndoMatch: (matchId: string) => boolean;
}

export function useMatchResolution(
  sourceBracket: EngineBracket | null,
): UseMatchResolutionReturn {
  const [bracket, setBracket] = useState<EngineBracket | null>(sourceBracket);
  const [prevSource, setPrevSource] = useState(sourceBracket);

  if (sourceBracket !== prevSource) {
    setPrevSource(sourceBracket);
    setBracket(sourceBracket);
  }

  const resolveBracket = bracket ?? sourceBracket;

  const matchMap = useMemo(() => {
    if (!resolveBracket) return null;
    return new Map<string, EngineMatch>(resolveBracket.matches.map((m) => [m.id, m]));
  }, [resolveBracket]);

  const champion = useMemo(
    () => (resolveBracket ? getChampion(resolveBracket) : null),
    [resolveBracket],
  );

  const isComplete = useMemo(
    () => (resolveBracket ? isBracketComplete(resolveBracket) : false),
    [resolveBracket],
  );

  const resolveWinner = useCallback(
    (matchId: string, winnerId: string) => {
      setBracket((prev) => {
        const current = prev ?? sourceBracket;
        if (!current) return prev;
        return resolveMatch(current, matchId, winnerId);
      });
    },
    [sourceBracket],
  );

  const undoMatch = useCallback(
    (matchId: string) => {
      setBracket((prev) => {
        const current = prev ?? sourceBracket;
        if (!current) return prev;
        return cascadeUndo(current, matchId);
      });
    },
    [sourceBracket],
  );

  const canResolveMatch = useCallback(
    (matchId: string) => {
      if (!matchMap) return false;
      const match = matchMap.get(matchId);
      if (!match) return false;
      if (match.isBye) return false;
      if (!match.competitorA || !match.competitorB) return false;
      return true;
    },
    [matchMap],
  );

  const canUndoMatch = useCallback(
    (matchId: string) => {
      if (!matchMap) return false;
      const match = matchMap.get(matchId);
      if (!match) return false;
      return match.winner !== null && !match.isBye;
    },
    [matchMap],
  );

  return {
    bracket: resolveBracket,
    champion,
    isComplete,
    resolveWinner,
    undoMatch,
    canResolveMatch,
    canUndoMatch,
  };
}
