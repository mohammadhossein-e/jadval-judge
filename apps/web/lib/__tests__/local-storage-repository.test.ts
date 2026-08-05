import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from '../repositories/local-storage-repository';

function clearStorage(): void {
  localStorage.clear();
}

describe('LocalStorageRepository — competitors', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    clearStorage();
    repo = new LocalStorageRepository();
  });

  describe('setCompetitors', () => {
    it('creates competitors for a category', () => {
      const result = repo.setCompetitors('cat-1', [
        { name: 'Alice', club: 'Tokyo', seed: 1 },
        { name: 'Bob', club: 'Osaka', seed: null },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[0].categoryId).toBe('cat-1');
      expect(result[0].id).toBeTruthy();
      expect(result[0].createdAt).toBeTruthy();
      expect(result[1].name).toBe('Bob');
    });

    it('generates unique IDs for each competitor', () => {
      const result = repo.setCompetitors('cat-1', [
        { name: 'Alice', club: 'Tokyo', seed: 1 },
        { name: 'Bob', club: 'Osaka', seed: null },
      ]);
      expect(result[0].id).not.toBe(result[1].id);
    });

    it('replaces previous competitors for the same category', () => {
      repo.setCompetitors('cat-1', [
        { name: 'Alice', club: 'Tokyo', seed: 1 },
      ]);
      const second = repo.setCompetitors('cat-1', [
        { name: 'Carol', club: 'Kyoto', seed: 2 },
      ]);
      expect(second).toHaveLength(1);
      expect(second[0].name).toBe('Carol');
      expect(repo.listCompetitors('cat-1')).toHaveLength(1);
    });

    it('does not affect competitors in other categories', () => {
      repo.setCompetitors('cat-1', [
        { name: 'Alice', club: 'Tokyo', seed: 1 },
      ]);
      repo.setCompetitors('cat-2', [
        { name: 'Bob', club: 'Osaka', seed: null },
        { name: 'Carol', club: 'Kyoto', seed: 2 },
      ]);
      expect(repo.listCompetitors('cat-1')).toHaveLength(1);
      expect(repo.listCompetitors('cat-2')).toHaveLength(2);
    });

    it('returns empty array when given empty input', () => {
      const result = repo.setCompetitors('cat-1', []);
      expect(result).toEqual([]);
    });

    it('clears all competitors when set with empty array', () => {
      repo.setCompetitors('cat-1', [
        { name: 'Alice', club: 'Tokyo', seed: 1 },
      ]);
      repo.setCompetitors('cat-1', []);
      expect(repo.listCompetitors('cat-1')).toHaveLength(0);
    });
  });

  describe('listCompetitors', () => {
    it('returns empty array for category with no competitors', () => {
      expect(repo.listCompetitors('nonexistent')).toEqual([]);
    });

    it('returns competitors sorted by createdAt ascending', () => {
      repo.setCompetitors('cat-1', [
        { name: 'Bob', club: 'Osaka', seed: null },
        { name: 'Alice', club: 'Tokyo', seed: 1 },
      ]);
      const result = repo.listCompetitors('cat-1');
      expect(result[0].name).toBe('Bob');
      expect(result[1].name).toBe('Alice');
    });

    it('only returns competitors for the requested category', () => {
      repo.setCompetitors('cat-1', [
        { name: 'Alice', club: 'Tokyo', seed: 1 },
      ]);
      repo.setCompetitors('cat-2', [
        { name: 'Bob', club: 'Osaka', seed: null },
      ]);
      const result = repo.listCompetitors('cat-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('deleteCategory cascade', () => {
    it('deletes all competitors when category is deleted', () => {
      repo.setCompetitors('cat-1', [
        { name: 'Alice', club: 'Tokyo', seed: 1 },
        { name: 'Bob', club: 'Osaka', seed: null },
      ]);
      repo.setCompetitors('cat-2', [
        { name: 'Carol', club: 'Kyoto', seed: 2 },
      ]);
      repo.deleteCategory('cat-1');
      expect(repo.listCompetitors('cat-1')).toEqual([]);
      expect(repo.listCompetitors('cat-2')).toHaveLength(1);
    });

    it('deletes bracket when category is deleted', () => {
      const bracket = { size: 4, totalRounds: 2, matches: [] };
      repo.saveBracket('cat-1', bracket);
      expect(repo.getBracket('cat-1')).toEqual(bracket);
      repo.deleteCategory('cat-1');
      expect(repo.getBracket('cat-1')).toBeNull();
    });

    it('does not delete bracket for other categories', () => {
      repo.saveBracket('cat-1', { size: 4, totalRounds: 2, matches: [] });
      repo.saveBracket('cat-2', { size: 8, totalRounds: 3, matches: [] });
      repo.deleteCategory('cat-1');
      expect(repo.getBracket('cat-1')).toBeNull();
      expect(repo.getBracket('cat-2')).not.toBeNull();
    });
  });

  describe('saveBracket / getBracket / deleteBracket', () => {
    it('returns null for category with no saved bracket', () => {
      expect(repo.getBracket('cat-1')).toBeNull();
    });

    it('saves and retrieves a bracket', () => {
      const bracket = { size: 4, totalRounds: 2, matches: [] };
      repo.saveBracket('cat-1', bracket);
      expect(repo.getBracket('cat-1')).toEqual(bracket);
    });

    it('overwrites existing bracket on re-save', () => {
      repo.saveBracket('cat-1', { size: 4, totalRounds: 2, matches: [] });
      const updated = { size: 8, totalRounds: 3, matches: [{ id: 'm1', round: 1, position: 0, competitorA: null, competitorB: null, winner: null, isBye: false, nextMatchId: null, nextSlot: null as 'A' | 'B' | null }] };
      repo.saveBracket('cat-1', updated);
      expect(repo.getBracket('cat-1')).toEqual(updated);
    });

    it('does not affect brackets for other categories', () => {
      repo.saveBracket('cat-1', { size: 4, totalRounds: 2, matches: [] });
      repo.saveBracket('cat-2', { size: 8, totalRounds: 3, matches: [] });
      expect(repo.getBracket('cat-1')!.size).toBe(4);
      expect(repo.getBracket('cat-2')!.size).toBe(8);
    });

    it('deletes a bracket', () => {
      repo.saveBracket('cat-1', { size: 4, totalRounds: 2, matches: [] });
      repo.deleteBracket('cat-1');
      expect(repo.getBracket('cat-1')).toBeNull();
    });

    it('delete is idempotent', () => {
      repo.deleteBracket('nonexistent');
      expect(repo.getBracket('nonexistent')).toBeNull();
    });

    it('persists full bracket with matches', () => {
      const bracket = {
        size: 4,
        totalRounds: 2,
        matches: [
          { id: 'm1', round: 1, position: 0, competitorA: { id: 'c1', name: 'Alice', seed: 1 }, competitorB: { id: 'c2', name: 'Bob', seed: 2 }, winner: { id: 'c1', name: 'Alice', seed: 1 }, isBye: false, nextMatchId: 'm3', nextSlot: 'A' as const },
          { id: 'm2', round: 1, position: 1, competitorA: { id: 'c3', name: 'Carol', seed: 3 }, competitorB: null, winner: null, isBye: true, nextMatchId: 'm3', nextSlot: 'B' as const },
          { id: 'm3', round: 2, position: 0, competitorA: null, competitorB: null, winner: null, isBye: false, nextMatchId: null, nextSlot: null },
        ],
      };
      repo.saveBracket('cat-1', bracket);
      const retrieved = repo.getBracket('cat-1');
      expect(retrieved).toEqual(bracket);
      expect(retrieved!.matches).toHaveLength(3);
      expect(retrieved!.matches[0].winner!.name).toBe('Alice');
    });
  });
});
