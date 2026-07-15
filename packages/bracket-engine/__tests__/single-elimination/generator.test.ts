import { describe, it, expect } from 'vitest';
import { generateBracket, isBracketComplete, getChampion } from '../../src/single-elimination/generator';
import { resolveMatch } from '../../src/single-elimination/advancement';
import type { EngineCompetitor } from '../../src/types';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

function makeSeededCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: i + 1,
  }));
}

describe('generateBracket', () => {
  describe('validation', () => {
    it('throws for fewer than 2 competitors', () => {
      expect(() => generateBracket([])).toThrow('At least 2');
      expect(() => generateBracket([makeCompetitors(1)[0]])).toThrow('At least 2');
    });

    it('throws for more than 128 competitors', () => {
      expect(() => generateBracket(makeCompetitors(129))).toThrow('Maximum 128');
    });
  });

  describe('bracket sizes', () => {
    it('generates 2-slot bracket for 2 competitors', () => {
      const result = generateBracket(makeCompetitors(2));
      expect(result.bracket.size).toBe(2);
      expect(result.bracket.totalRounds).toBe(1);
      expect(result.bracket.matches).toHaveLength(1);
      expect(result.byes).toHaveLength(0);
    });

    it('generates 4-slot bracket for 3 competitors (1 BYE)', () => {
      const result = generateBracket(makeCompetitors(3));
      expect(result.bracket.size).toBe(4);
      expect(result.bracket.totalRounds).toBe(2);
      expect(result.bracket.matches).toHaveLength(3);
      expect(result.byes).toHaveLength(1);
    });

    it('generates 4-slot bracket for 4 competitors', () => {
      const result = generateBracket(makeCompetitors(4));
      expect(result.bracket.size).toBe(4);
      expect(result.bracket.totalRounds).toBe(2);
      expect(result.bracket.matches).toHaveLength(3);
      expect(result.byes).toHaveLength(0);
    });

    it('generates 8-slot bracket for 5 competitors (3 BYEs)', () => {
      const result = generateBracket(makeCompetitors(5));
      expect(result.bracket.size).toBe(8);
      expect(result.bracket.totalRounds).toBe(3);
      expect(result.bracket.matches).toHaveLength(7);
      expect(result.byes).toHaveLength(3);
    });

    it('generates 8-slot bracket for 8 competitors', () => {
      const result = generateBracket(makeCompetitors(8));
      expect(result.bracket.size).toBe(8);
      expect(result.bracket.totalRounds).toBe(3);
      expect(result.byes).toHaveLength(0);
    });

    it('generates 16-slot bracket for 9 competitors', () => {
      const result = generateBracket(makeCompetitors(9));
      expect(result.bracket.size).toBe(16);
      expect(result.bracket.totalRounds).toBe(4);
      expect(result.byes).toHaveLength(7);
    });

    it('generates 128-slot bracket for 128 competitors', () => {
      const result = generateBracket(makeCompetitors(128));
      expect(result.bracket.size).toBe(128);
      expect(result.bracket.totalRounds).toBe(7);
      expect(result.byes).toHaveLength(0);
      expect(result.bracket.matches).toHaveLength(127);
    });

    it('generates 128-slot bracket for 100 competitors', () => {
      const result = generateBracket(makeCompetitors(100));
      expect(result.bracket.size).toBe(128);
      expect(result.bracket.totalRounds).toBe(7);
      expect(result.byes).toHaveLength(28);
    });
  });

  describe('match structure', () => {
    it('creates correct number of matches per round', () => {
      const result = generateBracket(makeCompetitors(8));
      const round1 = result.bracket.matches.filter((m) => m.round === 1);
      const round2 = result.bracket.matches.filter((m) => m.round === 2);
      const round3 = result.bracket.matches.filter((m) => m.round === 3);
      expect(round1).toHaveLength(4);
      expect(round2).toHaveLength(2);
      expect(round3).toHaveLength(1);
    });

    it('sets nextMatchId and nextSlot correctly', () => {
      const result = generateBracket(makeCompetitors(4));
      const round1 = result.bracket.matches.filter((m) => m.round === 1);
      expect(round1[0].nextMatchId).toBe('R2P0');
      expect(round1[0].nextSlot).toBe('A');
      expect(round1[1].nextMatchId).toBe('R2P0');
      expect(round1[1].nextSlot).toBe('B');
      const final = result.bracket.matches.find((m) => m.round === 2);
      expect(final?.nextMatchId).toBeNull();
      expect(final?.nextSlot).toBeNull();
    });

    it('final match has position 0', () => {
      const result = generateBracket(makeCompetitors(4));
      const final = result.bracket.matches.find((m) => m.round === 2);
      expect(final?.position).toBe(0);
    });
  });

  describe('BYE auto-resolution', () => {
    it('auto-resolves BYE matches with winner advanced', () => {
      const result = generateBracket(makeCompetitors(3));
      const byeMatch = result.bracket.matches.find((m) => m.isBye);
      expect(byeMatch).toBeDefined();
      expect(byeMatch?.winner).not.toBeNull();

      const nextMatch = result.bracket.matches.find(
        (m) => m.id === byeMatch?.nextMatchId,
      );
      if (byeMatch?.nextSlot === 'A') {
        expect(nextMatch?.competitorA?.id).toBe(byeMatch.winner?.id);
      } else {
        expect(nextMatch?.competitorB?.id).toBe(byeMatch.winner?.id);
      }
    });

    it('does not auto-resolve non-BYE matches', () => {
      const result = generateBracket(makeCompetitors(4));
      const round1 = result.bracket.matches.filter((m) => m.round === 1);
      for (const match of round1) {
        expect(match.winner).toBeNull();
        expect(match.isBye).toBe(false);
      }
    });
  });

  describe('BYE collection', () => {
    it('collects BYE info with competitor IDs and positions', () => {
      const result = generateBracket(makeCompetitors(3));
      expect(result.byes.length).toBe(1);
      expect(result.byes[0].competitorId).toBeDefined();
      expect(typeof result.byes[0].position).toBe('number');
    });
  });

  describe('random draw', () => {
    it('generates valid bracket with random draw', () => {
      const result = generateBracket(makeCompetitors(8), 'random');
      expect(result.bracket.size).toBe(8);
      expect(result.bracket.matches).toHaveLength(7);
    });

    it('random draw places all competitors', () => {
      const competitors = makeCompetitors(6);
      const result = generateBracket(competitors, 'random');
      const placed = result.bracket.matches
        .filter((m) => !m.isBye)
        .flatMap((m) => [m.competitorA, m.competitorB])
        .filter(Boolean);
      expect(placed).toHaveLength(6);
    });
  });

  describe('manual draw', () => {
    it('places competitors at specified positions', () => {
      const competitors = makeCompetitors(4);
      const placements = new Map<number, string>([
        [0, 'c3'],
        [1, 'c1'],
        [2, 'c4'],
        [3, 'c2'],
      ]);
      const result = generateBracket(competitors, 'manual', placements);
      const round1 = result.bracket.matches.filter((m) => m.round === 1);
      expect(round1[0].competitorA?.id).toBe('c3');
      expect(round1[0].competitorB?.id).toBe('c1');
      expect(round1[1].competitorA?.id).toBe('c4');
      expect(round1[1].competitorB?.id).toBe('c2');
    });

    it('fills unplaced slots sequentially', () => {
      const competitors = makeCompetitors(4);
      const placements = new Map<number, string>([
        [0, 'c4'],
      ]);
      const result = generateBracket(competitors, 'manual', placements);
      const round1 = result.bracket.matches.filter((m) => m.round === 1);
      expect(round1[0].competitorA?.id).toBe('c4');
      expect(round1[0].competitorB).not.toBeNull();
    });
  });
});

describe('isBracketComplete', () => {
  it('returns false for unresolved bracket', () => {
    const result = generateBracket(makeCompetitors(4));
    expect(isBracketComplete(result.bracket)).toBe(false);
  });

  it('returns true when all matches have winners', () => {
    const result = generateBracket(makeCompetitors(2));
    const match = result.bracket.matches[0];
    const updated = resolveMatch(result.bracket, match.id, match.competitorA!.id);
    expect(isBracketComplete(updated)).toBe(true);
  });
});

describe('getChampion', () => {
  it('returns null for unresolved bracket', () => {
    const result = generateBracket(makeCompetitors(4));
    expect(getChampion(result.bracket)).toBeNull();
  });

  it('returns the final match winner', () => {
    const result = generateBracket(makeCompetitors(2));
    const match = result.bracket.matches[0];
    const updated = resolveMatch(result.bracket, match.id, match.competitorA!.id);
    const champion = getChampion(updated);
    expect(champion?.id).toBe(match.competitorA!.id);
  });
});
