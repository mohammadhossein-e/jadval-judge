import type { DrawType } from '../types';
import type { PlacementClaims, PlacementRule, PlacementRuleInput } from './placement-claim';

/**
 * Input passed to a {@link SeedPlacementStrategy}.
 *
 * Extends the generic {@link PlacementRuleInput} with draw entry
 * metadata so seed strategies can tailor their behaviour to how the
 * competitors entered the bracket.
 */
export interface SeedPlacementInput extends PlacementRuleInput {
  /** Draw type (random or manual). */
  readonly drawType: DrawType;

  /** Manual position-to-competitor mappings (if applicable). */
  readonly manualPlacements?: ReadonlyMap<number, string>;
}

/**
 * Strategy for seeding — decides which positions seeded competitors
 * claim.
 *
 * Seeding is an independent placement rule, NOT a draw type. It can be
 * enabled together with either a random or a manual draw. Implementations
 * produce {@link PlacementClaims} (official seeded positions) and let the
 * claim resolver apply the stable priority chain.
 *
 * Extends {@link PlacementRule} so it can be handed directly to the
 * resolver at the `seed` priority level.
 */
export interface SeedPlacementStrategy extends PlacementRule {
  /**
   * Produce the positions claimed for seeded competitors.
   *
   * @param input  Placement values plus draw metadata.
   * @returns Claims mapping each seeded competitor (seed ≤ bracket size)
   *          to its official seeded position.
   */
  placeSeeds(input: SeedPlacementInput): PlacementClaims;
}
