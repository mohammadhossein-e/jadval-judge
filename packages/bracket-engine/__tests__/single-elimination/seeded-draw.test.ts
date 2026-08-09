import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import type { PlacementInput } from '../../src/engine/competitor-placement-strategy';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { DefaultCompetitorPlacementStrategy } from '../../src/single-elimination/default-competitor-placement';
import { DefaultSeedPlacementStrategy } from '../../src/single-elimination/seed-placement';
import { generateBracket } from '../../src/single-elimination/generator';
import { standardSeeding } from '../../src/single-elimination/seeding';
import { calculateByeDistribution } from '../../src/single-elimination/bye-distribution';

const SIZES = [2, 3, 5, 8, 9, 16, 17, 32, 64, 128, 256];

function makeCompetitors(count: number, seeded: boolean): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: seeded ? i + 1 : null,
  }));
}

function bracketSize(count: number): number {
  return 2 ** Math.ceil(Math.log2(count));
}

function placementInput(
  competitors: readonly EngineCompetitor[],
  drawType: 'random' | 'manual',
  byePositions: ReadonlySet<number>,
  manualPlacements?: Map<number, string>,
): PlacementInput {
  return {
    competitors,
    generationContext: buildGenerationContext(competitors),
    positionMap: [],
    byePositions,
    drawType,
    manualPlacements,
  };
}

function officialByePositions(count: number): number[] {
  return [...calculateByeDistribution(count).byePositions];
}

describe('TRUE seeding across bracket sizes', () => {
  const strategy = new DefaultCompetitorPlacementStrategy();

  describe('full seeding (seeds 1..n) keeps every BYE slot empty', () => {
    for (const count of SIZES) {
      it(`places ${count} competitors without occupying a BYE slot`, () => {
        const competitors = makeCompetitors(count, true);
        const size = bracketSize(count);
        const byes = new Set(officialByePositions(count));

        const result = strategy.placeCompetitors(
          placementInput(competitors, 'manual', byes),
        );

        expect(result).toHaveLength(size);
        for (const pos of byes) {
          expect(result[pos]).toBeNull();
        }
        expect(result.filter(Boolean)).toHaveLength(count);
      });
    }
  });

  describe('BYE interaction', () => {
    it('3 competitors: seed 1 gets the BYE, seeds 2 and 3 face each other', () => {
      const result = generateBracket(makeCompetitors(3, true), 'manual');
      const r1 = result.bracket.matches.filter((m) => m.round === 1);

      const byeMatch = r1.find((m) => m.isBye)!;
      expect(byeMatch.competitorA?.id ?? byeMatch.competitorB?.id).toBe('c1');

      const realMatch = r1.find((m) => !m.isBye)!;
      expect([realMatch.competitorA?.id, realMatch.competitorB?.id].sort()).toEqual(['c2', 'c3']);
    });

    it('5 competitors: seeds 1-3 get BYEs, seeds 4 and 5 face each other', () => {
      const result = generateBracket(makeCompetitors(5, true), 'manual');
      const r1 = result.bracket.matches.filter((m) => m.round === 1);

      const byeIds = r1.filter((m) => m.isBye).map((m) => m.competitorA?.id ?? m.competitorB?.id);
      expect(byeIds.sort()).toEqual(['c1', 'c2', 'c3']);

      const realMatch = r1.find((m) => !m.isBye)!;
      expect([realMatch.competitorA?.id, realMatch.competitorB?.id].sort()).toEqual(['c4', 'c5']);
    });

    it('9 competitors: seeds 1-7 get BYEs, seeds 8 and 9 face each other', () => {
      const result = generateBracket(makeCompetitors(9, true), 'manual');
      const r1 = result.bracket.matches.filter((m) => m.round === 1);

      const byeIds = r1.filter((m) => m.isBye).map((m) => m.competitorA?.id ?? m.competitorB?.id);
      expect(byeIds.sort()).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']);

      const realMatch = r1.find((m) => !m.isBye)!;
      expect([realMatch.competitorA?.id, realMatch.competitorB?.id].sort()).toEqual(['c8', 'c9']);
    });

    it('17 competitors: seeds 1-15 get BYEs, seeds 16 and 17 face each other', () => {
      const result = generateBracket(makeCompetitors(17, true), 'manual');
      const r1 = result.bracket.matches.filter((m) => m.round === 1);

      const byeIds = r1.filter((m) => m.isBye).map((m) => m.competitorA?.id ?? m.competitorB?.id);
      const expectedByes = Array.from({ length: 15 }, (_, i) => i + 1).map((s) => `c${s}`);
      expect(byeIds.sort()).toEqual(expectedByes.sort());

      const realMatch = r1.find((m) => !m.isBye)!;
      expect([realMatch.competitorA?.id, realMatch.competitorB?.id].sort()).toEqual(['c16', 'c17']);
    });

    it('seeded draws keep the exact BYE count', () => {
      for (const count of [3, 5, 9, 17]) {
        const result = generateBracket(makeCompetitors(count, true), 'manual');
        expect(result.byes).toHaveLength(bracketSize(count) - count);
      }
    });

    it('unseeded draws keep the official fixed BYE positions', () => {
      for (const count of [3, 5, 9, 13, 17]) {
        const competitors = makeCompetitors(count, false);
        const result = generateBracket(competitors, 'manual');
        const actual = result.byes.map((b) => b.position).sort((a, b) => a - b);
        expect(actual).toEqual(officialByePositions(count).sort((a, b) => a - b));
      }
    });
  });

  describe('placement invariants', () => {
    it('places every competitor exactly once for every size', () => {
      for (const count of SIZES) {
        const competitors = makeCompetitors(count, true);
        const size = bracketSize(count);
        const result = strategy.placeCompetitors(
          placementInput(competitors, 'manual', new Set(officialByePositions(count))),
        );

        const ids = result.filter(Boolean).map((c) => c!.id);
        expect(ids).toHaveLength(count);
        expect(new Set(ids).size).toBe(count);
        expect([...ids].sort()).toEqual(competitors.map((c) => c.id).sort());
      }
    });

    it('empty slots equal the BYE count for every size', () => {
      for (const count of SIZES) {
        const competitors = makeCompetitors(count, true);
        const size = bracketSize(count);
        const result = strategy.placeCompetitors(
          placementInput(competitors, 'manual', new Set(officialByePositions(count))),
        );

        expect(result.filter((p) => p === null)).toHaveLength(size - count);
      }
    });
  });

  describe('missing seed gaps', () => {
    it('handles non-consecutive seeds (1, 3, 5, 8) correctly', () => {
      const competitors = makeCompetitors(8, false);
      const seeds = [1, 3, 5, 8];
      for (let i = 0; i < seeds.length; i++) {
        competitors[i] = { ...competitors[i], seed: seeds[i] };
      }

      const result = strategy.placeCompetitors(
        placementInput(competitors, 'manual', new Set()),
      );

      const seeding = standardSeeding(8);
      expect(result[seeding.indexOf(1)]?.id).toBe('c1');
      expect(result[seeding.indexOf(3)]?.id).toBe('c2');
      expect(result[seeding.indexOf(5)]?.id).toBe('c3');
      expect(result[seeding.indexOf(8)]?.id).toBe('c4');
      expect(result.filter(Boolean)).toHaveLength(8);
    });

    it('seed order is preserved (lower seeds never swap slots)', () => {
      const competitors = makeCompetitors(16, true);
      const result = strategy.placeCompetitors(
        placementInput(competitors, 'manual', new Set()),
      );

      for (let seed = 1; seed <= 16; seed++) {
        const official = standardSeeding(16).indexOf(seed);
        expect(result[official]?.id).toBe(`c${seed}`);
      }
    });
  });

  describe('manual + seeding composition', () => {
    it('manual placements win over seed claims for the same position', () => {
      const competitors = makeCompetitors(4, true);
      const placements = new Map<number, string>([[0, 'c4']]);

      const result = strategy.placeCompetitors(
        placementInput(competitors, 'manual', new Set(), placements),
      );

      expect(result[0]?.id).toBe('c4');
    });

    it('manual draw order is preserved; a seed whose slot is a BYE never takes it', () => {
      const competitors = makeCompetitors(3, true);
      const placements = new Map<number, string>([
        [0, 'c3'],
        [1, 'c2'],
      ]);

      const result = strategy.placeCompetitors(
        placementInput(competitors, 'manual', new Set(officialByePositions(3)), placements),
      );

      expect(result[0]).toBeNull();
      expect(result[1]?.id).toBe('c3');
      expect(result[2]?.id).toBe('c2');
      expect(result[3]?.id).toBe('c1');
    });
  });

  describe('no competitor in an invalid BYE slot (unseeded fill)', () => {
    it('fill step never occupies an official BYE slot when no seeds claim it', () => {
      const competitors = makeCompetitors(6, false);
      const byes = new Set(officialByePositions(6));

      const result = strategy.placeCompetitors(placementInput(competitors, 'manual', byes));

      for (const pos of byes) {
        expect(result[pos]).toBeNull();
      }
    });
  });

  describe('DefaultSeedPlacementStrategy wiring', () => {
    it('a custom seed strategy is honored by the default placement strategy', () => {
      const competitors = makeCompetitors(4, true);
      let called = false;
      const custom = {
        ...new DefaultSeedPlacementStrategy(),
        placeSeeds() {
          called = true;
          return [{ position: 0, competitorId: 'c1', source: 'seeding' }];
        },
      };

      const s = new DefaultCompetitorPlacementStrategy({ seedPlacement: custom });
      s.placeCompetitors(placementInput(competitors, 'manual', new Set()));

      expect(called).toBe(true);
    });
  });
});
