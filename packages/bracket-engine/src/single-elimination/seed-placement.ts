import type { EngineCompetitor } from '../types';
import { PlacementPriority } from '../engine/placement-claim';
import type {
  PlacementClaim,
  PlacementClaims,
} from '../engine/placement-claim';
import type {
  SeedPlacementInput,
  SeedPlacementStrategy,
} from '../engine/seed-placement-strategy';
import { standardSeeding } from './seeding';
import {
  calculateByeDistribution,
  generateByePriorityPositions,
} from './bye-distribution';

/**
 * Compute the official seeded positions for a list of competitors.
 *
 * Every competitor with a seed in `1..bracketSize` claims a position
 * derived from {@link standardSeeding} (the single source of truth for
 * official tournament seeding). When a seed's standard slot is an
 * official BYE position, the seed moves to the OPPOSITE slot of that
 * same match (`standardPosition ^ 1`) so the BYE slot stays empty and
 * the seed receives the BYE in round 1.
 *
 * BYE-PRIORITY guarantee: the top k seeds — where k is the smaller of
 * the seeded competitor count and the BYE count — each receive a BYE.
 * Seed i is seated on the recipient slot (`p ^ 1`) of the i-th BYE in
 * BYE-priority order, so the i-th BYE match in priority order is won by
 * seed i. Displaced lower seeds swap into the vacated slots, keeping the
 * bracket fully packed and the seeding invariants (halves, quarters,
 * eighths) intact. Seeds beyond the top k keep their structural fold
 * positions; the claim resolver drops any that collide with a higher
 * priority claim and the fill step completes the bracket.
 *
 * Recipient slots are assigned in BYE-priority order (not ascending
 * position order) so top seeds land on opposite halves / distinct
 * quarters exactly like the classic recipient table.
 *
 * Claims are sorted by seed number ascending so that when a displaced
 * seed collides with another seed's standard slot the lower seed wins
 * and the higher seed falls through to the fill step.
 *
 * Seed values do NOT need to be consecutive, and duplicate seed values
 * collapse to the first competitor in the list (defensive — validators
 * reject duplicates upstream). Seeds above the bracket size have no
 * official slot and produce no claim; they are placed by the fill step.
 *
 * When `byePositions` is not supplied the official BYE set is derived
 * from `competitors.length` (legacy path). The claim-based pipeline
 * passes the authoritative set from the ByePlacement step so a custom
 * BYE strategy stays consistent.
 *
 * This function is pure and framework-free so both the legacy
 * `placeCompetitors` API and the claim-based pipeline share it.
 *
 * @returns Claims mapping each seeded competitor to its seeded
 *          position (displaced off official BYE slots).
 */
export function computeSeedClaims(
  competitors: readonly EngineCompetitor[],
  bracketSize: number,
  byePositions?: ReadonlySet<number>,
): PlacementClaims {
  const seeding = standardSeeding(bracketSize);
  const byeSet =
    byePositions ??
    new Set(calculateByeDistribution(competitors.length).byePositions);
  const claimedSeeds = new Set<number>();
  const seedClaims: { seed: number; position: number; competitorId: string }[] = [];

  for (const competitor of competitors) {
    const { seed } = competitor;
    if (seed === null || seed < 1 || seed > bracketSize) continue;
    if (claimedSeeds.has(seed)) continue;

    const standardPosition = seeding.indexOf(seed);
    if (standardPosition === -1) continue;

    claimedSeeds.add(seed);
    seedClaims.push({
      seed,
      position: byeSet.has(standardPosition)
        ? standardPosition ^ 1
        : standardPosition,
      competitorId: competitor.id,
    });
  }

  seedClaims.sort((a, b) => a.seed - b.seed);

  guaranteeTopRecipients(seedClaims, byeSet, bracketSize);

  const claims: PlacementClaim[] = seedClaims.map(({ position, competitorId }) => ({
    position,
    competitorId,
    source: 'seeding',
  }));

  return claims;
}

/**
 * Number of top seeds guaranteed a BYE — all of them, up to the BYE
 * count. Unlike the earlier hardcoded top-3 guarantee, the BYE-priority
 * contract seats every seed that has an official BYE available
 * (k = min(seedCount, byeCount)).
 */

/**
 * Ensure the top k seeds (by seed number, k = min(seedCount, byeCount))
 * each land on a distinct BYE-recipient slot.
 *
 * A recipient slot is the non-BYE slot opposite an official BYE position
 * in the same round-1 match (`position ^ 1`). Seed i targets the
 * recipient of the i-th BYE in BYE-priority order, so the i-th BYE match
 * in priority order is won by seed i. Seeds already seated on their
 * target keep it. A seed that is not yet on its target moves there; the
 * structural occupant of that slot swaps into the seed's old position so
 * the bracket stays fully packed and the seeding invariants (halves,
 * quarters, eighths) are preserved. Seeds beyond the top k are left at
 * their structural positions and may collide — the claim resolver drops
 * the loser and the fill step completes the bracket.
 *
 * @param claims      structural seed claims, sorted by seed ascending
 * @param byeSet      official BYE positions (immutable)
 * @param bracketSize bracket leaf-slot count
 */
function guaranteeTopRecipients(
  claims: { seed: number; position: number; competitorId: string }[],
  byeSet: ReadonlySet<number>,
  bracketSize: number,
): void {
  const byeOrder = generateByePriorityPositions(bracketSize).filter((pos) =>
    byeSet.has(pos),
  );
  const guaranteedCount = Math.min(byeOrder.length, claims.length);

  for (let i = 0; i < guaranteedCount; i++) {
    const claim = claims[i];
    const target = byeOrder[i] ^ 1;

    if (claim.position === target) continue;

    const occupant = claims.find(
      (c) => c.position === target && c.seed > claim.seed,
    );
    if (occupant) {
      occupant.position = claim.position;
    }
    claim.position = target;
  }
}

/**
 * Default seeding strategy using official tournament positions.
 *
 * Produces claims exactly as {@link computeSeedClaims} (official seeded
 * positions, displaced off BYE slots onto the opposite slot of the same
 * match) and participates in the claim system at the `seed` priority
 * level. Seeding is applied automatically whenever competitors have
 * seeds; it never writes into positions directly.
 */
export class DefaultSeedPlacementStrategy implements SeedPlacementStrategy {
  readonly name = 'seeding';
  readonly priority: number = PlacementPriority.seed;

  placeSeeds(input: SeedPlacementInput): PlacementClaims {
    return computeSeedClaims(
      input.competitors,
      input.generationContext.bracketSize,
      input.byePositions,
    );
  }

  claim(input: SeedPlacementInput): PlacementClaims {
    return this.placeSeeds(input);
  }
}
