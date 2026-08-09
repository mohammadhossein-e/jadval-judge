import type { DrawType, EngineCompetitor } from '../types';
import type {
  CompetitorPlacementStrategy,
  PlacementInput,
} from '../engine/competitor-placement-strategy';
import type { PlacementFilter } from '../engine/placement-filter';
import type { PlacementRule } from '../engine/placement-claim';
import type { SeedPlacementStrategy } from '../engine/seed-placement-strategy';
import { resolvePlacementClaims } from '../engine/claim-resolver';
import { shuffleArray } from '../utils';
import { DefaultSeedPlacementStrategy } from './seed-placement';
import {
  ByePlacementRule,
  FilterPlacementRule,
  ManualPlacementRule,
  SeedPlacementRule,
} from './placement-rules';

/**
 * Optional strategy parts for {@link DefaultCompetitorPlacementStrategy}.
 */
export interface DefaultCompetitorPlacementConfig {
  /** Seeding strategy. Defaults to official seeded positions. */
  readonly seedPlacement?: SeedPlacementStrategy;
  /** Placement filters (Province / Club / Coach / Country separation). */
  readonly filters?: readonly PlacementFilter[];
}

/**
 * Claim-based competitor placement for single elimination.
 *
 * Nothing writes competitors into positions directly. Every rule
 * ({@link PlacementRule}) produces claims which the claim resolver
 * applies in the stable priority chain:
 *
 *   1. Manual placements (draw order → non-BYE slots)
 *   2. Placement filters
 *   3. Seeding (official seeded positions)
 *   4. BYE reservations
 *   5. Fill remaining competitors
 *
 * Seeding is an independent, injectable rule — NOT a draw type — so it
 * composes with both random and manual draws. When no competitor has a
 * real seed the fixed BYE behavior (and the previous task's regression
 * tests) is preserved exactly: manual entries keep their draw order
 * among non-BYE slots and the fill step never occupies a BYE slot.
 */
export class DefaultCompetitorPlacementStrategy
  implements CompetitorPlacementStrategy
{
  private readonly seedStrategy: SeedPlacementStrategy;
  private readonly filters: readonly PlacementFilter[];

  constructor(config: DefaultCompetitorPlacementConfig = {}) {
    this.seedStrategy = config.seedPlacement ?? new DefaultSeedPlacementStrategy();
    this.filters = config.filters ?? [];
  }

  placeCompetitors(input: PlacementInput): readonly (EngineCompetitor | null)[] {
    const {
      competitors,
      generationContext,
      positionMap,
      byePositions,
      drawType,
      manualPlacements,
      placementOrder,
    } = input;

    const rules: PlacementRule[] = [];

    if (manualPlacements && manualPlacements.size > 0) {
      rules.push(new ManualPlacementRule(manualPlacements));
    }
    for (const filter of this.filters) {
      rules.push(new FilterPlacementRule(filter));
    }
    rules.push(new SeedPlacementRule(this.seedStrategy, drawType, manualPlacements));
    rules.push(new ByePlacementRule());

    const fillOrder: readonly EngineCompetitor[] = buildFillOrder(
      competitors,
      drawType,
      placementOrder,
    );

    return resolvePlacementClaims(
      {
        competitors,
        generationContext,
        positionMap,
        byePositions,
        claimed: [],
      },
      rules,
      fillOrder,
    );
  }
}

/**
 * Builds the order in which remaining competitors fill free positions
 * after manual, filters, seeds, and BYE reservations are resolved.
 *
 * When a `placementOrder` (the result of a random draw) is provided it is
 * used as-is — it is a placement ORDER only and never creates placement
 * claims. Unknown or duplicated ids are ignored. Otherwise it falls back to
 * the existing behavior: a shuffle for random draws, the given order for
 * manual draws.
 */
function buildFillOrder(
  competitors: readonly EngineCompetitor[],
  drawType: DrawType,
  placementOrder?: readonly string[],
): readonly EngineCompetitor[] {
  if (placementOrder) {
    const byId = new Map(competitors.map((competitor) => [competitor.id, competitor]));
    const seen = new Set<string>();
    const order: EngineCompetitor[] = [];
    for (const id of placementOrder) {
      const competitor = byId.get(id);
      if (competitor && !seen.has(id)) {
        seen.add(id);
        order.push(competitor);
      }
    }
    if (order.length > 0) {
      return order;
    }
  }
  return drawType === 'random' ? shuffleArray(competitors) : competitors;
}
