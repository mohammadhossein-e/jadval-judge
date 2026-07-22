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
  });
});
