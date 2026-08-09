import type { EngineCompetitor } from '../types';
import type { GenerationContext } from './generation-context';
import type { PositionMap } from './position-map';

/**
 * A single, atomic claim produced by a placement rule.
 *
 * Claims never write directly into bracket positions — they are
 * resolved by the claim resolver according to the stable priority
 * chain. A claim either wins (the position is assigned) or is
 * silently skipped on conflict.
 */
export interface PlacementClaim {
  /** 0-based bracket position being claimed. */
  readonly position: number;

  /**
   * Competitor id for this claim, or `null` for a pure reservation
   * (e.g. a BYE slot that must stay empty).
   */
  readonly competitorId: string | null;

  /** Name of the rule that produced the claim (debugging/reporting). */
  readonly source: string;
}

/** An ordered, readonly collection of {@link PlacementClaim}s. */
export type PlacementClaims = readonly PlacementClaim[];

/**
 * Immutable input bundle passed to every {@link PlacementRule}.
 *
 * The strategy must NOT mutate any of these values.
 */
export interface PlacementRuleInput {
  /** All competitors that need to be placed. */
  readonly competitors: readonly EngineCompetitor[];

  /** Format-independent values (bracket size, BYE count, etc.). */
  readonly generationContext: GenerationContext;

  /** Structural map of position indices to match slots. */
  readonly positionMap: PositionMap;

  /** Positions reserved for BYEs (determined upstream). */
  readonly byePositions: ReadonlySet<number>;

  /**
   * Claims already accepted from higher-priority rules. Lower-priority
   * rules may inspect these (e.g. separation filters) but must never
   * conflict — the resolver drops conflicting claims.
   */
  readonly claimed: PlacementClaims;
}

/**
 * Stable placement priority chain.
 *
 * Lower number = higher priority = applied first and wins conflicts.
 * This ordering must remain stable — future rules (Province/Club/Coach
 * separation) slot into the `filter` level.
 */
export const PlacementPriority = {
  /** Manual placements — highest priority. */
  manual: 1,
  /** Placement filters (Province / Club / Coach / Country). */
  filter: 2,
  /** Tournament seeding (official seeded positions). */
  seed: 3,
  /** BYE reservations. */
  bye: 4,
  /** Fill remaining competitors. */
  fill: 5,
} as const;

export type PlacementPriority = (typeof PlacementPriority)[keyof typeof PlacementPriority];

/**
 * A placement rule.
 *
 * Rules are decoupled: each produces {@link PlacementClaims} from the
 * input only. They never write competitors into positions and never
 * depend on other rules' internals. The claim resolver applies them in
 * `priority` order and resolves conflicts.
 */
export interface PlacementRule {
  /** Human-readable rule name (used in claim `source`). */
  readonly name: string;

  /** Priority level from {@link PlacementPriority}. */
  readonly priority: number;

  /**
   * Produce the positions this rule claims.
   *
   * @param input  Placement-relevant values plus already-accepted
   *               claims from higher-priority rules.
   * @returns An ordered list of claims. Conflicts with higher-priority
   *          claims are resolved (skipped) by the resolver.
   */
  claim(input: PlacementRuleInput): PlacementClaims;
}
