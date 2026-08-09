import type { DrawType } from '../types';
import { PlacementPriority } from '../engine/placement-claim';
import type {
  PlacementClaim,
  PlacementClaims,
  PlacementRule,
  PlacementRuleInput,
} from '../engine/placement-claim';
import type { PlacementFilter } from '../engine/placement-filter';
import type {
  SeedPlacementInput,
  SeedPlacementStrategy,
} from '../engine/seed-placement-strategy';

/**
 * Manual placement rule (priority {@link PlacementPriority.manual}).
 *
 * The supplied placements map is treated as a draw ORDER, not a literal
 * slot assignment: BYE slots are reserved and the competitors are placed
 * into the remaining non-BYE positions in ascending position order.
 * Unknown ids and duplicate ids are skipped without consuming a slot.
 */
export class ManualPlacementRule implements PlacementRule {
  readonly name = 'manual';
  readonly priority: number = PlacementPriority.manual;

  constructor(private readonly manualPlacements: ReadonlyMap<number, string>) {}

  claim(input: PlacementRuleInput): PlacementClaims {
    const { competitors, generationContext, byePositions } = input;
    const bracketSize = generationContext.bracketSize;
    const knownIds = new Set(competitors.map((c) => c.id));

    const nonByePositions: number[] = [];
    for (let pos = 0; pos < bracketSize; pos++) {
      if (!byePositions.has(pos)) {
        nonByePositions.push(pos);
      }
    }

    const orderedEntries = [...this.manualPlacements.entries()]
      .filter(([pos]) => pos >= 0 && pos < bracketSize)
      .sort((a, b) => a[0] - b[0]);

    const claims: PlacementClaim[] = [];
    const claimedCompetitors = new Set<string>();
    let placeIdx = 0;

    for (const [, competitorId] of orderedEntries) {
      if (!knownIds.has(competitorId) || claimedCompetitors.has(competitorId)) continue;
      if (placeIdx >= nonByePositions.length) break;
      claims.push({
        position: nonByePositions[placeIdx],
        competitorId,
        source: this.name,
      });
      claimedCompetitors.add(competitorId);
      placeIdx++;
    }

    return claims;
  }
}

/**
 * Placement filter adapter rule (priority {@link PlacementPriority.filter}).
 *
 * Wraps a {@link PlacementFilter} so it participates in the claim
 * resolution chain. Filters only ever ADD claims; the resolver drops any
 * claim that conflicts with higher-priority rules.
 */
export class FilterPlacementRule implements PlacementRule {
  readonly priority: number = PlacementPriority.filter;

  constructor(private readonly filter: PlacementFilter) {}

  get name(): string {
    return this.filter.name;
  }

  claim(input: PlacementRuleInput): PlacementClaims {
    return this.filter.apply(input, input.claimed);
  }
}

/**
 * Seeding adapter rule (priority {@link PlacementPriority.seed}).
 *
 * Wraps a {@link SeedPlacementStrategy} so it can be handed to the claim
 * resolver as a plain rule. The adapter rebuilds the full
 * {@link SeedPlacementInput} (draw type + manual placements) from the
 * values captured at strategy construction, since the generic rule input
 * does not carry draw metadata.
 */
export class SeedPlacementRule implements PlacementRule {
  readonly priority: number = PlacementPriority.seed;

  constructor(
    private readonly strategy: SeedPlacementStrategy,
    private readonly drawType: DrawType,
    private readonly manualPlacements: ReadonlyMap<number, string> | undefined,
  ) {}

  get name(): string {
    return this.strategy.name;
  }

  claim(input: PlacementRuleInput): PlacementClaims {
    const seedInput: SeedPlacementInput = {
      ...input,
      drawType: this.drawType,
      manualPlacements: this.manualPlacements,
    };
    return this.strategy.placeSeeds(seedInput);
  }
}

/**
 * BYE reservation rule (priority {@link PlacementPriority.bye}).
 *
 * Produces a `null`-competitor claim for every official BYE position.
 * BYE slots lose the reservation when a higher-priority rule (manual,
 * filter, seeding) claims the same position — this is how a seed's
 * official position beats a BYE slot.
 */
export class ByePlacementRule implements PlacementRule {
  readonly name = 'bye';
  readonly priority: number = PlacementPriority.bye;

  claim(input: PlacementRuleInput): PlacementClaims {
    return [...input.byePositions]
      .sort((a, b) => a - b)
      .map((position) => ({ position, competitorId: null, source: this.name }));
  }
}
