import type { EngineCompetitor, DrawType } from '../types';
import type { GenerationContext } from './generation-context';
import type { PositionMap } from './position-map';

/**
 * Input bundle passed to a {@link CompetitorPlacementStrategy}.
 *
 * Groups every value the strategy needs to decide which competitor
 * goes into which bracket position.  The strategy must NOT mutate
 * any of these values.
 */
export interface PlacementInput {
  /** All competitors that need to be placed. */
  readonly competitors: readonly EngineCompetitor[];

  /** Format-independent values (bracket size, BYE count, etc.). */
  readonly generationContext: GenerationContext;

  /** Structural map of position indices to match slots. */
  readonly positionMap: PositionMap;

  /** Positions reserved for BYEs (determined upstream). */
  readonly byePositions: ReadonlySet<number>;

  /** Draw type (seeded, random, manual). */
  readonly drawType: DrawType;

  /** Manual position-to-competitor mappings (if applicable). */
  readonly manualPlacements?: Map<number, string>;

  /**
   * Ordered competitor ids produced by a random draw (if applicable).
   * This is a placement ORDER only — it never creates placement claims.
   * It defines the order in which remaining competitors fill free
   * positions after manual, filters, seeds, and BYE reservations are
   * resolved.
   */
  readonly placementOrder?: readonly string[];
}

/**
 * Strategy for placing competitors into bracket positions.
 *
 * Implementations receive all placement-relevant data and return
 * a full placement array (one entry per bracket position, `null`
 * for BYE slots).  The strategy decides *which* competitor goes
 * *where* — it must NOT build matches, resolve BYEs, or know
 * about tournament progression.
 *
 * The pipeline uses this interface for dependency injection so that
 * different placement algorithms can be swapped without modifying
 * the pipeline or any other step.
 */
export interface CompetitorPlacementStrategy {
  /**
   * Place competitors into bracket positions.
   *
   * @param input  All values needed to make placement decisions.
   * @returns An array of length `bracketSize` where each entry is
   *          either a competitor or `null` (BYE slot).
   */
  placeCompetitors(
    input: PlacementInput,
  ): readonly (EngineCompetitor | null)[];
}
