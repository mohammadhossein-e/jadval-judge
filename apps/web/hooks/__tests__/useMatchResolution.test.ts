import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchResolution } from '../useMatchResolution';
import { generateBracket } from '@jadval/bracket-engine';
import type { EngineCompetitor } from '@jadval/bracket-engine';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

describe('useMatchResolution', () => {
  describe('initial state', () => {
    it('initializes with the provided bracket', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.bracket).toEqual(bracket);
    });

    it('starts with no champion', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.champion).toBeNull();
    });

    it('starts with isComplete false', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('resolveWinner', () => {
    it('advances winner to next match', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      const winnerId = match.competitorA!.id;

      const { result } = renderHook(() => useMatchResolution(bracket));
      act(() => {
        result.current.resolveWinner(match.id, winnerId);
      });

      const next = result.current.bracket!.matches.find((m) => m.id === match.nextMatchId);
      expect(next?.competitorA?.id).toBe(winnerId);
    });

    it('sets winner on the match', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      const winnerId = match.competitorA!.id;

      const { result } = renderHook(() => useMatchResolution(bracket));
      act(() => {
        result.current.resolveWinner(match.id, winnerId);
      });

      const resolved = result.current.bracket!.matches.find((m) => m.id === match.id);
      expect(resolved?.winner?.id).toBe(winnerId);
    });

    it('can resolve the final match', () => {
      const { bracket } = generateBracket(makeCompetitors(4));

      const { result } = renderHook(() => useMatchResolution(bracket));

      const round1Matches = bracket.matches.filter((m) => m.round === 1);
      for (const match of round1Matches) {
        act(() => {
          result.current.resolveWinner(match.id, match.competitorA!.id);
        });
      }

      const finalMatch = result.current.bracket!.matches.find(
        (m) => m.round === 2,
      )!;
      act(() => {
        result.current.resolveWinner(finalMatch.id, finalMatch.competitorA!.id);
      });

      expect(result.current.champion).not.toBeNull();
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('undoMatch', () => {
    it('removes winner from match', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      const winnerId = match.competitorA!.id;

      const { result } = renderHook(() => useMatchResolution(bracket));
      act(() => {
        result.current.resolveWinner(match.id, winnerId);
      });
      act(() => {
        result.current.undoMatch(match.id);
      });

      const resolved = result.current.bracket!.matches.find((m) => m.id === match.id);
      expect(resolved?.winner).toBeNull();
    });

    it('cascades undo to subsequent matches', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      const winnerId = match.competitorA!.id;

      const { result } = renderHook(() => useMatchResolution(bracket));
      act(() => {
        result.current.resolveWinner(match.id, winnerId);
      });

      const next = result.current.bracket!.matches.find((m) => m.id === match.nextMatchId);
      expect(next?.competitorA?.id).toBe(winnerId);

      act(() => {
        result.current.undoMatch(match.id);
      });

      const nextAfterUndo = result.current.bracket!.matches.find(
        (m) => m.id === match.nextMatchId,
      );
      expect(nextAfterUndo?.competitorA).toBeNull();
    });

    it('does nothing for match without winner', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;

      const { result } = renderHook(() => useMatchResolution(bracket));
      const before = result.current.bracket;
      act(() => {
        result.current.undoMatch(match.id);
      });

      expect(result.current.bracket).toEqual(before);
    });
  });

  describe('canResolveMatch', () => {
    it('returns true for non-bye match with both competitors', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;

      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.canResolveMatch(match.id)).toBe(true);
    });

    it('returns false for BYE match', () => {
      const { bracket } = generateBracket(makeCompetitors(3));
      const byeMatch = bracket.matches.find((m) => m.isBye)!;

      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.canResolveMatch(byeMatch.id)).toBe(false);
    });

    it('returns false for match with missing competitors', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 2)!;

      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.canResolveMatch(match.id)).toBe(false);
    });

    it('returns false for non-existent match', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.canResolveMatch('nonexistent')).toBe(false);
    });
  });

  describe('canUndoMatch', () => {
    it('returns true for resolved non-bye match', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;
      const winnerId = match.competitorA!.id;

      const { result } = renderHook(() => useMatchResolution(bracket));
      act(() => {
        result.current.resolveWinner(match.id, winnerId);
      });

      expect(result.current.canUndoMatch(match.id)).toBe(true);
    });

    it('returns false for unresolved match', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;

      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.canUndoMatch(match.id)).toBe(false);
    });

    it('returns false for BYE match', () => {
      const { bracket } = generateBracket(makeCompetitors(3));
      const byeMatch = bracket.matches.find((m) => m.isBye)!;

      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.canUndoMatch(byeMatch.id)).toBe(false);
    });

    it('returns false for non-existent match', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const { result } = renderHook(() => useMatchResolution(bracket));
      expect(result.current.canUndoMatch('nonexistent')).toBe(false);
    });
  });

  describe('bracket update on source change', () => {
    it('resets state when remounted with new bracket', () => {
      const { bracket: bracket1 } = generateBracket(makeCompetitors(4));
      const match1 = bracket1.matches.find((m) => m.round === 1 && m.position === 0)!;

      const { result, unmount } = renderHook(() => useMatchResolution(bracket1));

      act(() => {
        result.current.resolveWinner(match1.id, match1.competitorA!.id);
      });

      expect(result.current.bracket!.matches.find((m) => m.id === match1.id)?.winner).not.toBeNull();

      unmount();

      const { bracket: bracket2 } = generateBracket(makeCompetitors(4));
      const { result: result2 } = renderHook(() => useMatchResolution(bracket2));

      const r2Match1 = result2.current.bracket!.matches.find((m) => m.round === 1 && m.position === 0)!;
      expect(r2Match1.winner).toBeNull();
      expect(result2.current.canResolveMatch(r2Match1.id)).toBe(true);
    });
  });

  describe('does not mutate original bracket', () => {
    it('preserves original bracket after resolve', () => {
      const { bracket } = generateBracket(makeCompetitors(4));
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      const originalMatches = [...bracket.matches];

      const { result } = renderHook(() => useMatchResolution(bracket));
      act(() => {
        result.current.resolveWinner(match.id, match.competitorA!.id);
      });

      expect(bracket.matches).toEqual(originalMatches);
    });
  });
});
