import type { PlacementClaims, PlacementRuleInput } from './placement-claim';

/**
 * A pluggable placement filter (separation rule).
 *
 * Filters model constraints such as Province / Club / Coach / Country
 * separation. They operate purely on claims: given the placement input
 * and the claims already accepted by higher-priority rules (manual
 * placements), a filter produces additional claims that keep separated
 * competitors apart. The claim resolver silently skips any conflicting
 * claim, so filters never need to coordinate with each other.
 *
 * Filters are applied at the `filter` priority level, in registration
 * order, after manual placements and before seeding.
 */
export interface PlacementFilter {
  /** Human-readable filter name (used in claim `source`). */
  readonly name: string;

  /**
   * Produce the positions this filter claims.
   *
   * @param input     Placement-relevant values (competitors, BYE
   *                  positions, etc.) plus already-accepted claims.
   * @param claimed   Claims accepted from higher-priority rules
   *                  (manual placements). Must be treated as taken.
   * @returns Additional claims. Conflicting claims are dropped by the
   *          resolver, never an error.
   */
  apply(input: PlacementRuleInput, claimed: PlacementClaims): PlacementClaims;
}
