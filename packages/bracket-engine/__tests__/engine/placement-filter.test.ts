import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import type {
  PlacementClaims,
  PlacementFilter,
  PlacementRule,
  PlacementRuleInput,
} from '../../src/engine/placement-claim';
import { PlacementPriority } from '../../src/engine/placement-claim';
import { resolvePlacementClaims } from '../../src/engine/claim-resolver';
import { buildGenerationContext } from '../../src/engine/generation-context';
import {
  FilterPlacementRule,
  ManualPlacementRule,
} from '../../src/single-elimination/placement-rules';

interface ProvincedCompetitor extends EngineCompetitor {
  province: string;
}

function makeCompetitors(provinces: readonly string[]): ProvincedCompetitor[] {
  return provinces.map((province, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
    province,
  }));
}

function makeInput(competitors: readonly EngineCompetitor[]): PlacementRuleInput {
  return {
    competitors,
    generationContext: buildGenerationContext(competitors),
    positionMap: [],
    byePositions: new Set(),
    claimed: [],
  };
}

/**
 * A separation filter that sends every unclaimed competitor of a mapped
 * province to that province's target position. Competing claims for the
 * same position are resolved (dropped) by the claim resolver.
 */
function provinceFilter(name: string, provinces: Record<string, string>): PlacementFilter {
  return {
    name,
    apply(input: PlacementRuleInput, claimed: PlacementClaims): PlacementClaims {
      const taken = new Set(claimed.map((c) => c.position));
      const placedIds = new Set(claimed.map((c) => c.competitorId ?? ''));

      const claims: PlacementClaims = [];
      for (const c of input.competitors) {
        if (placedIds.has(c.id)) continue;
        const target = provinces[(c as ProvincedCompetitor).province];
        if (target === undefined) continue;
        const position = Number(target);
        if (
          position >= 0 &&
          position < input.generationContext.bracketSize &&
          !taken.has(position)
        ) {
          claims.push({ position, competitorId: c.id, source: name });
        }
      }
      return claims;
    },
  };
}

describe('PlacementFilter integration', () => {
  it('filter claims are applied at the filter priority level', () => {
    const competitors = makeCompetitors(['Tehran', 'Isfahan', 'Tehran', 'Isfahan']);
    const filter = provinceFilter('province', { Tehran: '0', Isfahan: '2' });

    const rules = [new FilterPlacementRule(filter)];
    const result = resolvePlacementClaims(makeInput(competitors), rules, competitors);

    expect(result[0]?.id).toBe('c1');
    expect(result[2]?.id).toBe('c2');
    expect(result.filter(Boolean)).toHaveLength(4);
  });

  it('conflicting filter claims are silently dropped', () => {
    const competitors = makeCompetitors(['Tehran', 'Tehran']);
    const filter = provinceFilter('province', { Tehran: '0' });

    const rules = [new FilterPlacementRule(filter)];
    const result = resolvePlacementClaims(makeInput(competitors), rules, competitors);

    expect(result[0]?.id).toBe('c1');
    expect(result.filter(Boolean)).toHaveLength(2);
    expect(result[1]?.id).toBe('c2');
  });

  it('filters never override higher-priority manual claims', () => {
    const competitors = makeCompetitors(['Tehran', 'Tehran']);
    const filter = provinceFilter('province', { Tehran: '0' });
    const manual = new ManualPlacementRule(new Map<number, string>([[0, 'c2']]));

    const rules: PlacementRule[] = [manual, new FilterPlacementRule(filter)];
    const result = resolvePlacementClaims(makeInput(competitors), rules, competitors);

    expect(result[0]?.id).toBe('c2');
  });

  it('wraps into a PlacementRule at the filter priority level', () => {
    const filter = provinceFilter('province', {});
    const rule = new FilterPlacementRule(filter);

    expect(rule.name).toBe('province');
    expect(rule.priority).toBe(PlacementPriority.filter);
  });

  it('filters can be composed: later filters see earlier filter claims', () => {
    const competitors = makeCompetitors(['Tehran', 'Isfahan', 'Tehran', 'Isfahan']);
    const filterA = provinceFilter('provinceA', { Tehran: '0' });
    const filterB = provinceFilter('provinceB', { Isfahan: '2' });

    const rules = [new FilterPlacementRule(filterA), new FilterPlacementRule(filterB)];
    const result = resolvePlacementClaims(makeInput(competitors), rules, competitors);

    expect(result[0]?.id).toBe('c1');
    expect(result[2]?.id).toBe('c2');
  });
});
