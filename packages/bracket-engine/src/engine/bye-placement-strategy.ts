import type { GenerationContext } from './generation-context';
import type { PositionMap } from './position-map';

/**
 * Strategy for determining which bracket positions are BYEs.
 *
 * Implementations return only BYE position indices — they have no
 * knowledge of competitors, seeds, names, or match construction.
 *
 * The pipeline uses this interface for dependency injection so that
 * different BYE placement algorithms can be swapped without
 * modifying the pipeline or any other step.
 */
export interface ByePlacementStrategy {
  /**
   * Determine which positions in the bracket are BYEs.
   *
   * @param context  Format-independent generation values (bracket
   *                 size, BYE count, etc.).
   * @param positionMap  Structural map of position indices to match
   *                     slots.  Provided for strategies that need
   *                     bracket topology; not required by all
   *                     implementations.
   * @returns Sorted, unique 0-based position indices that should
   *          be treated as BYEs.
   */
  placeByes(
    context: GenerationContext,
    positionMap: PositionMap,
  ): readonly number[];
}
