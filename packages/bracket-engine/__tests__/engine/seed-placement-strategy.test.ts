import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import type { PlacementRuleInput } from '../../src/engine/placement-claim';
import { PlacementPriority } from '../../src/engine/placement-claim';
import type { SeedPlacementInput } from '../../src/engine/seed-placement-strategy';
import { buildGenerationContext } from '../../src/engine/generation-context';
import {
  computeSeedClaims,
  DefaultSeedPlacementStrategy,
} from '../../src/single-elimination/seed-placement';
import { standardSeeding } from '../../src/single-elimination/seeding';

function makeCompetitors(
  seeds: readonly (number | null)[],
): EngineCompetitor[] {
  return seeds.map((seed, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed,
  }));
}

function makeInput(
  competitors: readonly EngineCompetitor[],
  drawType: 'random' | 'manual' = 'manual',
): SeedPlacementInput {
  return {
    competitors,
    generationContext: buildGenerationContext(competitors),
    positionMap: [],
    byePositions: new Set(),
    claimed: [],
    drawType,
  };
}

describe('computeSeedClaims', () => {
  it('claims official positions for seeds 1..bracketSize', () => {
    const competitors = makeCompetitors([1, 2, 3, 4]);
    const claims = computeSeedClaims(competitors, 4);

    expect(claims).toHaveLength(4);
    for (const claim of claims) {
      const seed = competitors.find((c) => c.id === claim.competitorId)!.seed!;
      expect(claim.position).toBe(standardSeeding(4).indexOf(seed));
    }
  });

  it('works for every official bracket size', () => {
    for (const size of [2, 4, 8, 16, 32, 64, 128, 256]) {
      const seeds = Array.from({ length: size }, (_, i) => i + 1);
      const competitors = makeCompetitors(seeds);
      const claims = computeSeedClaims(competitors, size);

      expect(claims).toHaveLength(size);
      const positions = claims.map((c) => c.position);
      expect(new Set(positions).size).toBe(size);
    }
  });

  it('skips competitors without a seed', () => {
    const competitors = makeCompetitors([null, 1, null, 3]);
    const claims = computeSeedClaims(competitors, 4);

    expect(claims.map((c) => c.competitorId)).toEqual(['c2', 'c4']);
  });

  it('skips seeds below 1 or above bracketSize', () => {
    const competitors = makeCompetitors([0, 1, 9]);
    const claims = computeSeedClaims(competitors, 8);

    expect(claims.map((c) => c.competitorId)).toEqual(['c2']);
  });

  it('allows non-consecutive seed values', () => {
    const competitors = makeCompetitors([1, null, null, null, 8]);
    const claims = computeSeedClaims(competitors, 8);

    expect(claims.map((c) => c.competitorId)).toEqual(['c1', 'c5']);
  });

  it('collapses duplicate seed values to the first competitor', () => {
    const competitors = makeCompetitors([1, 1, 2]);
    const claims = computeSeedClaims(competitors, 4);

    expect(claims.map((c) => c.competitorId)).toEqual(['c1', 'c3']);
  });
});

describe('DefaultSeedPlacementStrategy', () => {
  const strategy = new DefaultSeedPlacementStrategy();

  it('participates at the seed priority level', () => {
    expect(strategy.name).toBe('seeding');
    expect(strategy.priority).toBe(PlacementPriority.seed);
  });

  it('placeSeeds matches computeSeedClaims output', () => {
    const competitors = makeCompetitors([1, null, 3, 2]);
    const input = makeInput(competitors);

    expect(strategy.placeSeeds(input)).toEqual(computeSeedClaims(competitors, 4));
  });

  it('claim() delegates to placeSeeds()', () => {
    const competitors = makeCompetitors([1, 2]);
    const input = makeInput(competitors);

    expect(strategy.claim(input)).toEqual(strategy.placeSeeds(input));
  });

  it('is a valid PlacementRuleInput consumer (missing draw metadata not required)', () => {
    const competitors = makeCompetitors([1, 2, 3]);
    const plainInput: PlacementRuleInput = {
      competitors,
      generationContext: buildGenerationContext(competitors),
      positionMap: [],
      byePositions: new Set(),
      claimed: [],
    };

    expect(strategy.claim(plainInput)).toHaveLength(3);
  });
});
