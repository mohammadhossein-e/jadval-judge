import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import type { PlacementRule, PlacementRuleInput } from '../../src/engine/placement-claim';
import { PlacementPriority } from '../../src/engine/placement-claim';
import { resolvePlacementClaims } from '../../src/engine/claim-resolver';
import { buildGenerationContext } from '../../src/engine/generation-context';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

function makeInput(
  competitors: readonly EngineCompetitor[],
  byePositions: number[] = [],
): PlacementRuleInput {
  return {
    competitors,
    generationContext: buildGenerationContext(competitors),
    positionMap: [],
    byePositions: new Set(byePositions),
    claimed: [],
  };
}

function rule(name: string, priority: number, positions: number[]): PlacementRule {
  return {
    name,
    priority,
    claim: (input: PlacementRuleInput) =>
      positions.map((position, i) => ({
        position,
        competitorId: input.competitors[i]?.id ?? null,
        source: name,
      })),
  };
}

function nullRule(name: string, priority: number, positions: number[]): PlacementRule {
  return {
    name,
    priority,
    claim: () =>
      positions.map((position) => ({
        position,
        competitorId: null,
        source: name,
      })),
  };
}

describe('resolvePlacementClaims', () => {
  it('fills all remaining competitors into free positions', () => {
    const competitors = makeCompetitors(4);
    const result = resolvePlacementClaims(makeInput(competitors), [], competitors);

    expect(result).toHaveLength(4);
    expect(result.map((p) => p?.id)).toEqual(['c1', 'c2', 'c3', 'c4']);
  });

  it('applies rules in ascending priority order (lower wins)', () => {
    const competitors = makeCompetitors(4);
    const low = rule('low', PlacementPriority.seed, [0]);
    const high = rule('high', PlacementPriority.manual, [0]);

    const result = resolvePlacementClaims(makeInput(competitors), [low, high], competitors);

    expect(result[0]?.id).toBe('c1');
  });

  it('first claim for a position wins, later ones are skipped silently', () => {
    const competitors = makeCompetitors(4);
    const a = rule('a', 1, [0]);
    const b = rule('b', 2, [0]);

    const result = resolvePlacementClaims(makeInput(competitors), [a, b], competitors);

    expect(result[0]?.id).toBe('c1');
  });

  it('a competitor claimed twice is only placed once', () => {
    const competitors = makeCompetitors(4);
    const a = rule('a', 1, [0, 1]);

    const result = resolvePlacementClaims(makeInput(competitors), [a], competitors);

    const occurrences = result.filter((p) => p?.id === 'c1');
    expect(occurrences).toHaveLength(1);
    expect(result[1]?.id).not.toBe('c1');
  });

  it('unknown competitor ids are dropped without breaking placement', () => {
    const competitors = makeCompetitors(2);
    const unknown: PlacementRule = {
      name: 'unknown',
      priority: 1,
      claim: () => [{ position: 0, competitorId: 'nope', source: 'unknown' }],
    };

    const result = resolvePlacementClaims(makeInput(competitors), [unknown], competitors);

    expect(result[0]?.id).toBe('c1');
    expect(result[1]?.id).toBe('c2');
  });

  it('out-of-range positions are ignored', () => {
    const competitors = makeCompetitors(2);
    const out = rule('out', 1, [99]);

    const result = resolvePlacementClaims(makeInput(competitors), [out], competitors);

    expect(result[99]).toBeUndefined();
    expect(result[0]?.id).toBe('c1');
  });

  it('BYE reservations keep positions empty and prevent fill', () => {
    const competitors = makeCompetitors(3);
    const bye = nullRule('bye', PlacementPriority.bye, [1]);

    const result = resolvePlacementClaims(makeInput(competitors, [1]), [bye], competitors);

    expect(result[0]?.id).toBe('c1');
    expect(result[1]).toBeNull();
    expect(result[2]?.id).toBe('c2');
    expect(result[3]?.id).toBe('c3');
  });

  it('BYE reservation loses to a higher-priority competitor claim', () => {
    const competitors = makeCompetitors(3);
    const seed = rule('seeding', PlacementPriority.seed, [0]);
    const bye = nullRule('bye', PlacementPriority.bye, [0, 2]);

    const result = resolvePlacementClaims(makeInput(competitors, [0, 2]), [seed, bye], competitors);

    expect(result[0]?.id).toBe('c1');
    expect(result[2]).toBeNull();
  });

  it('claims from higher-priority rules are visible to later rules', () => {
    const competitors = makeCompetitors(4);
    let seen: string[] = [];
    const probe: PlacementRule = {
      name: 'probe',
      priority: PlacementPriority.filter,
      claim: (input) => {
        seen = input.claimed.map((c) => c.source);
        return [];
      },
    };
    const manual = rule('manual', PlacementPriority.manual, [0]);

    resolvePlacementClaims(makeInput(competitors), [manual, probe], competitors);

    expect(seen).toEqual(['manual']);
  });

  it('produces exactly bracketSize entries with correct occupancy', () => {
    for (const count of [2, 3, 5, 8, 9]) {
      const competitors = makeCompetitors(count);
      const result = resolvePlacementClaims(makeInput(competitors), [], competitors);
      const bracketSize = 2 ** Math.ceil(Math.log2(count));

      expect(result).toHaveLength(bracketSize);
      expect(result.filter(Boolean)).toHaveLength(count);
    }
  });

  it('returns a stable PlacementPriority ordering', () => {
    expect(PlacementPriority.manual).toBe(1);
    expect(PlacementPriority.filter).toBe(2);
    expect(PlacementPriority.seed).toBe(3);
    expect(PlacementPriority.bye).toBe(4);
    expect(PlacementPriority.fill).toBe(5);
  });
});
