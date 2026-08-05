import type { ByePlacementStrategy } from '../engine/bye-placement-strategy';
import type { GenerationContext } from '../engine/generation-context';
import type { PositionMap } from '../engine/position-map';
import { calculateByeDistribution } from './bye-distribution';

/**
 * Standard BYE placement derived from {@link standardSeeding}.
 *
 * Produces the same BYE positions as the legacy engine, where BYEs
 * fall on the slots whose seed number exceeds the competitor count.
 * This preserves full backward compatibility.
 */
export class DefaultByePlacementStrategy implements ByePlacementStrategy {
  placeByes(
    context: GenerationContext,
    _positionMap: PositionMap,
  ): readonly number[] {
    return calculateByeDistribution(context.competitorCount).byePositions;
  }
}
