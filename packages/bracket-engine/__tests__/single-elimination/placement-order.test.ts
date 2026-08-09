import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import type { PlacementInput } from '../../src/engine/competitor-placement-strategy';
import type { PlacementFilter } from '../../src/engine/placement-filter';
import type { PlacementClaim, PlacementRuleInput } from '../../src/engine/placement-claim';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { DefaultCompetitorPlacementStrategy } from '../../src/single-elimination/default-competitor-placement';
import { generateBracket } from '../../src/single-elimination/generator';
import { standardSeeding } from '../../src/single-elimination/seeding';
import { calculateByeDistribution } from '../../src/single-elimination/bye-distribution';

function makeCompetitors(seedMap: Record<string, number | null>): EngineCompetitor[] {
  return Object.entries(seedMap).map(([id, seed]) => ({
    id,
    name: id,
    seed,
  }));
}

function placementInput(
  competitors: readonly EngineCompetitor[],
  drawType: 'random' | 'manual',
  byePositions: ReadonlySet<number>,
  manualPlacements?: Map<number, string>,
  placementOrder?: readonly string[],
): PlacementInput {
  return {
    competitors,
    generationContext: buildGenerationContext(competitors),
    positionMap: [],
    byePositions,
    drawType,
    manualPlacements,
    placementOrder,
  };
}

function officialByePositions(count: number): number[] {
  return [...calculateByeDistribution(count).byePositions];
}

describe('placement order vs manual placement (TRUE seeding)', () => {
  const strategy = new DefaultCompetitorPlacementStrategy();

  describe('random draw order never blocks seed claims', () => {
    it('places seed 1 at its official position regardless of draw order', () => {
      const competitors = makeCompetitors({ A: 1, B: null, C: null, D: null, E: null, F: null, G: null, H: null });
      const order = ['F', 'A', 'D', 'G', 'B', 'H', 'C', 'E'];

      const result = strategy.placeCompetitors(
        placementInput(competitors, 'random', new Set(), undefined, order),
      );

      const official = standardSeeding(8).indexOf(1);
      expect(result[official]?.id).toBe('A');
    });

    it('fill follows the random draw order (excluding claimed seeds)', () => {
      const competitors = makeCompetitors({ A: 1, B: null, C: null, D: null, E: null, F: null, G: null, H: null });
      const order = ['F', 'A', 'D', 'G', 'B', 'H', 'C', 'E'];

      const result = strategy.placeCompetitors(
        placementInput(competitors, 'random', new Set(), undefined, order),
      );

      const remaining = order.filter((id) => id !== 'A');
      const filled = result.slice(1).map((c) => c?.id ?? null);
      expect(filled).toEqual(remaining);
    });

    it('generateBracket: random draw + seeds puts the seed at the official position', () => {
      const competitors = makeCompetitors({ A: 1, B: null, C: null, D: null, E: null, F: null, G: null, H: null });
      const order = ['F', 'A', 'D', 'G', 'B', 'H', 'C', 'E'];

      const result = generateBracket(competitors, 'random', undefined, order);
      const r1 = result.bracket.matches.filter((m) => m.round === 1);

      expect(r1[0].competitorA?.id ?? r1[0].competitorB?.id).toBe('A');
    });
  });

  describe('seeds take official positions before fill', () => {
    it('seeds 1 and 2 land on their official positions; rest follow draw order', () => {
      const competitors = makeCompetitors({ A: 1, B: 2, C: null, D: null, E: null, F: null, G: null, H: null });
      const order = ['C', 'D', 'E', 'F', 'G', 'H'];

      const result = strategy.placeCompetitors(
        placementInput(competitors, 'random', new Set(), undefined, order),
      );

      const seeding = standardSeeding(8);
      expect(result[seeding.indexOf(1)]?.id).toBe('A');
      expect(result[seeding.indexOf(2)]?.id).toBe('B');
      const remaining = ['C', 'D', 'E', 'F', 'G', 'H'];
      const seededSlots = new Set([seeding.indexOf(1), seeding.indexOf(2)]);
      const filled = result
        .map((c, i) => ({ id: c?.id ?? null, i }))
        .filter(({ i }) => !seededSlots.has(i))
        .map(({ id }) => id);
      expect(filled).toEqual(remaining);
    });

    it('missing seed gaps are respected (seeds 1, 3, 5, 8)', () => {
      const competitors = makeCompetitors({ A: 1, B: 3, C: 5, D: 8, E: null, F: null, G: null, H: null });
      const order = ['E', 'F', 'G', 'H'];

      const result = strategy.placeCompetitors(
        placementInput(competitors, 'random', new Set(), undefined, order),
      );

      const seeding = standardSeeding(8);
      expect(result[seeding.indexOf(1)]?.id).toBe('A');
      expect(result[seeding.indexOf(3)]?.id).toBe('B');
      expect(result[seeding.indexOf(5)]?.id).toBe('C');
      expect(result[seeding.indexOf(8)]?.id).toBe('D');
    });
  });

  describe('manual placement still overrides every other rule', () => {
    it('manual claims win over seed claims; unclaimed seed falls back to fill', () => {
      const competitors = makeCompetitors({ A: 1, B: null, C: null, D: null, E: null, F: null, G: null, H: null });
      const placements = new Map<number, string>([
        [0, 'F'],
        [1, 'E'],
      ]);

      const result = strategy.placeCompetitors(
        placementInput(competitors, 'manual', new Set(), placements),
      );

      expect(result[0]?.id).toBe('F');
      expect(result[1]?.id).toBe('E');
      expect(result[2]?.id).toBe('A');
    });
  });

  describe('placement filters slot in without pipeline changes', () => {
    it('filter claims apply between manual and seeds', () => {
      const competitors = makeCompetitors({ A: 1, B: null, C: null, D: null, E: null, F: null, G: null, H: null });

      const filter: PlacementFilter = {
        name: 'test-filter',
        apply(_input: PlacementRuleInput, _claimed: readonly PlacementClaim[]): PlacementClaim[] {
          return [{ position: 2, competitorId: 'B', source: 'filter' }];
        },
      };

      const s = new DefaultCompetitorPlacementStrategy({ filters: [filter] });
      const result = s.placeCompetitors(
        placementInput(competitors, 'random', new Set(), undefined, ['C', 'D', 'E', 'F', 'G', 'H']),
      );

      expect(result[0]?.id).toBe('A');
      expect(result[2]?.id).toBe('B');
    });

    it('filter claims win over seed claims at the same position', () => {
      const competitors = makeCompetitors({ A: 1, B: null, C: null, D: null, E: null, F: null, G: null, H: null });

      const filter: PlacementFilter = {
        name: 'test-filter',
        apply(_input: PlacementRuleInput, _claimed: readonly PlacementClaim[]): PlacementClaim[] {
          return [{ position: 0, competitorId: 'B', source: 'filter' }];
        },
      };

      const s = new DefaultCompetitorPlacementStrategy({ filters: [filter] });
      const result = s.placeCompetitors(
        placementInput(competitors, 'random', new Set(), undefined, ['C', 'A', 'D', 'E', 'F', 'G', 'H']),
      );

      expect(result[0]?.id).toBe('B');
      expect(result.some((c) => c?.id === 'A')).toBe(true);
    });
  });

  describe('BYE interaction with placement order', () => {
    it('seeded random draw: seed 1 receives the BYE and every BYE stays on an official position', () => {
      const competitors = makeCompetitors({
        A: 1, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null,
      });
      const order = ['C', 'E', 'B', 'G', 'F', 'D', 'H', 'I'];

      const result = generateBracket(competitors, 'random', undefined, order);

      const official = new Set(officialByePositions(9));

      const r1 = result.bracket.matches.filter((m) => m.round === 1);
      const seedMatch = r1.find((m) => m.position === 0)!;
      expect(seedMatch.isBye).toBe(true);
      expect(seedMatch.competitorA?.id ?? seedMatch.competitorB?.id).toBe('A');

      expect(result.byes).toHaveLength(7);
      for (const bye of result.byes) {
        expect(official.has(bye.position)).toBe(true);
      }
    });

    it('unseeded random draw keeps the official fixed BYE positions', () => {
      const competitors = makeCompetitors({
        A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null,
      });
      const order = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

      const result = generateBracket(competitors, 'random', undefined, order);

      const actual = result.byes.map((b) => b.position).sort((a, b) => a - b);
      expect(actual).toEqual(officialByePositions(9).sort((a, b) => a - b));

      const r1 = result.bracket.matches.filter((m) => m.round === 1);
      expect(r1.filter((m) => m.isBye)).toHaveLength(7);

      const placed = r1.flatMap((m) => [m.competitorA?.id, m.competitorB?.id]).filter(Boolean);
      expect(placed).toHaveLength(9);
      expect(new Set(placed).size).toBe(9);
    });
  });
});
