import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBracketGeneration } from '../useBracketGeneration';
import { useMatchResolution } from '../useMatchResolution';
import { LocalStorageRepository } from '../../lib/repositories/local-storage-repository';
import { getRepository } from '../../lib/repositories';
import type { CompetitorInput } from '../../lib/draw';
import type { EngineBracket } from '@jadval/bracket-engine';

const CAT_ID = 'test-category';

function makeCompetitors(count: number): CompetitorInput[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    club: `Club ${i + 1}`,
    seed: i + 1,
  }));
}

describe('Bracket persistence lifecycle', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository();
    // Ensure the singleton repository uses our clean repo
    (globalThis as Record<string, unknown>).__jadvalRepo = undefined;
  });

  describe('repository save/get/delete', () => {
    it('save and retrieve bracket', () => {
      const bracket: EngineBracket = { size: 4, totalRounds: 2, matches: [] };
      repo.saveBracket(CAT_ID, bracket);
      expect(repo.getBracket(CAT_ID)).toEqual(bracket);
    });

    it('get returns null when nothing saved', () => {
      expect(repo.getBracket(CAT_ID)).toBeNull();
    });

    it('delete removes bracket', () => {
      repo.saveBracket(CAT_ID, { size: 4, totalRounds: 2, matches: [] });
      repo.deleteBracket(CAT_ID);
      expect(repo.getBracket(CAT_ID)).toBeNull();
    });

    it('save overwrites previous bracket', () => {
      repo.saveBracket(CAT_ID, { size: 4, totalRounds: 2, matches: [] });
      const updated: EngineBracket = { size: 8, totalRounds: 3, matches: [] };
      repo.saveBracket(CAT_ID, updated);
      expect(repo.getBracket(CAT_ID)).toEqual(updated);
    });

    it('categories are isolated', () => {
      repo.saveBracket('cat-a', { size: 4, totalRounds: 2, matches: [] });
      repo.saveBracket('cat-b', { size: 8, totalRounds: 3, matches: [] });
      expect(repo.getBracket('cat-a')!.size).toBe(4);
      expect(repo.getBracket('cat-b')!.size).toBe(8);
      repo.deleteBracket('cat-a');
      expect(repo.getBracket('cat-a')).toBeNull();
      expect(repo.getBracket('cat-b')).not.toBeNull();
    });
  });

  describe('generate → save → hydrate', () => {
    it('bracket saved to repo after generation can be retrieved', () => {
      const competitors = makeCompetitors(4);
      const { result } = renderHook(() => useBracketGeneration(competitors, 'random'));

      let generatedBracket: EngineBracket;
      act(() => {
        generatedBracket = result.current.generate();
      });

      repo.saveBracket(CAT_ID, generatedBracket!);
      const saved = repo.getBracket(CAT_ID);
      expect(saved).not.toBeNull();
      expect(saved!.matches).toHaveLength(generatedBracket!.matches.length);
      expect(saved!.totalRounds).toBe(generatedBracket!.totalRounds);
    });

    it('hydrated bracket restores bracket state', () => {
      const competitors = makeCompetitors(4);
      const { result } = renderHook(() => useBracketGeneration(competitors, 'random'));

      let generatedBracket: EngineBracket;
      act(() => {
        generatedBracket = result.current.generate();
      });

      repo.saveBracket(CAT_ID, generatedBracket!);

      const savedBracket = repo.getBracket(CAT_ID)!;

      const { result: hydrated } = renderHook(() =>
        useBracketGeneration(competitors, 'random', savedBracket),
      );

      expect(hydrated.current.isGenerated).toBe(true);
      expect(hydrated.current.bracket).not.toBeNull();
      expect(hydrated.current.bracket!.matches).toHaveLength(savedBracket.matches.length);
    });
  });

  describe('resolve → save → hydrate', () => {
    it('bracket with resolved match persists and restores', () => {
      const competitors = makeCompetitors(4);
      const { result } = renderHook(() => useBracketGeneration(competitors, 'random'));

      let generatedBracket: EngineBracket;
      act(() => {
        generatedBracket = result.current.generate();
      });

      const match = generatedBracket!.matches.find((m) => m.round === 1 && !m.isBye)!;

      const { result: resolution } = renderHook(() => useMatchResolution(generatedBracket!));

      act(() => {
        resolution.current.resolveWinner(match.id, match.competitorA!.id);
      });

      const resolvedBracket = resolution.current.bracket!;
      repo.saveBracket(CAT_ID, resolvedBracket);

      const saved = repo.getBracket(CAT_ID)!;
      const savedMatch = saved.matches.find((m) => m.id === match.id)!;
      expect(savedMatch.winner).not.toBeNull();
      expect(savedMatch.winner!.id).toBe(match.competitorA!.id);

      const { result: hydrated } = renderHook(() =>
        useBracketGeneration(competitors, 'random', saved),
      );
      expect(hydrated.current.isGenerated).toBe(true);

      const { result: hydratedResolution } = renderHook(() =>
        useMatchResolution(hydrated.current.bracket),
      );
      const hydratedMatch = hydratedResolution.current.bracket!.matches.find(
        (m) => m.id === match.id,
      )!;
      expect(hydratedMatch.winner!.id).toBe(match.competitorA!.id);
    });
  });

  describe('undo → save → hydrate', () => {
    it('undone bracket persists and restores', () => {
      const competitors = makeCompetitors(4);
      const { result } = renderHook(() => useBracketGeneration(competitors, 'random'));

      let generatedBracket: EngineBracket;
      act(() => {
        generatedBracket = result.current.generate();
      });

      const match = generatedBracket!.matches.find((m) => m.round === 1 && !m.isBye)!;

      const { result: resolution } = renderHook(() => useMatchResolution(generatedBracket!));

      act(() => {
        resolution.current.resolveWinner(match.id, match.competitorA!.id);
      });
      act(() => {
        resolution.current.undoMatch(match.id);
      });

      const undoneBracket = resolution.current.bracket!;
      repo.saveBracket(CAT_ID, undoneBracket);

      const saved = repo.getBracket(CAT_ID)!;
      const savedMatch = saved.matches.find((m) => m.id === match.id)!;
      expect(savedMatch.winner).toBeNull();

      const { result: hydrated } = renderHook(() =>
        useBracketGeneration(competitors, 'random', saved),
      );
      const { result: hydratedResolution } = renderHook(() =>
        useMatchResolution(hydrated.current.bracket),
      );
      const hydratedMatch = hydratedResolution.current.bracket!.matches.find(
        (m) => m.id === match.id,
      )!;
      expect(hydratedMatch.winner).toBeNull();
    });
  });

  describe('reset → bracket deleted', () => {
    it('deleteBracket removes bracket from repo', () => {
      repo.saveBracket(CAT_ID, { size: 4, totalRounds: 2, matches: [] });
      expect(repo.getBracket(CAT_ID)).not.toBeNull();
      repo.deleteBracket(CAT_ID);
      expect(repo.getBracket(CAT_ID)).toBeNull();
    });
  });

  describe('competitor changes → bracket invalidated', () => {
    it('deleteBracket called on competitor change removes saved bracket', () => {
      repo.saveBracket(CAT_ID, { size: 4, totalRounds: 2, matches: [] });
      expect(repo.getBracket(CAT_ID)).not.toBeNull();
      repo.deleteBracket(CAT_ID);
      expect(repo.getBracket(CAT_ID)).toBeNull();
    });

    it('simulated competitor add flow invalidates bracket', () => {
      const competitors = makeCompetitors(4);
      const { result } = renderHook(() => useBracketGeneration(competitors, 'random'));

      let generatedBracket: EngineBracket;
      act(() => {
        generatedBracket = result.current.generate();
      });

      repo.saveBracket(CAT_ID, generatedBracket!);
      expect(repo.getBracket(CAT_ID)).not.toBeNull();

      // Simulate competitor change: delete bracket
      repo.deleteBracket(CAT_ID);
      expect(repo.getBracket(CAT_ID)).toBeNull();

      // Simulate hydration after competitor change: no bracket to restore
      const saved = repo.getBracket(CAT_ID);
      expect(saved).toBeNull();

      const { result: fresh } = renderHook(() =>
        useBracketGeneration(competitors, 'random', saved),
      );
      expect(fresh.current.isGenerated).toBe(false);
    });
  });

  describe('full lifecycle: generate → resolve → undo → reset', () => {
    it('complete tournament flow persists at each step', () => {
      const competitors = makeCompetitors(4);

      // Step 1: Generate
      const { result: genResult } = renderHook(() =>
        useBracketGeneration(competitors, 'random'),
      );
      let bracket: EngineBracket;
      act(() => {
        bracket = genResult.current.generate();
      });
      repo.saveBracket(CAT_ID, bracket!);
      expect(repo.getBracket(CAT_ID)).not.toBeNull();
      expect(repo.getBracket(CAT_ID)!.matches).toHaveLength(bracket!.matches.length);

      // Step 2: Resolve round 1 matches
      const { result: res1 } = renderHook(() => useMatchResolution(bracket!));
      const round1Matches = bracket!.matches.filter((m) => m.round === 1 && !m.isBye);
      for (const match of round1Matches) {
        act(() => {
          res1.current.resolveWinner(match.id, match.competitorA!.id);
        });
      }
      repo.saveBracket(CAT_ID, res1.current.bracket!);
      const afterRound1 = repo.getBracket(CAT_ID)!;
      for (const match of round1Matches) {
        const saved = afterRound1.matches.find((m) => m.id === match.id)!;
        expect(saved.winner).not.toBeNull();
      }

      // Step 3: Hydrate and verify round 1 persisted
      const { result: hydrated } = renderHook(() =>
        useBracketGeneration(competitors, 'random', afterRound1),
      );
      expect(hydrated.current.isGenerated).toBe(true);
      const { result: hydratedRes } = renderHook(() =>
        useMatchResolution(hydrated.current.bracket),
      );
      for (const match of round1Matches) {
        const m = hydratedRes.current.bracket!.matches.find((x) => x.id === match.id)!;
        expect(m.winner).not.toBeNull();
      }

      // Step 4: Undo one match
      const firstMatch = round1Matches[0];
      act(() => {
        hydratedRes.current.undoMatch(firstMatch.id);
      });
      repo.saveBracket(CAT_ID, hydratedRes.current.bracket!);
      const afterUndo = repo.getBracket(CAT_ID)!;
      const undoneMatch = afterUndo.matches.find((m) => m.id === firstMatch.id)!;
      expect(undoneMatch.winner).toBeNull();

      // Step 5: Reset — bracket deleted
      repo.deleteBracket(CAT_ID);
      expect(repo.getBracket(CAT_ID)).toBeNull();
    });
  });
});
