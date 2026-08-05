import type { ByePlacementStrategy } from '../engine/bye-placement-strategy';
import type { GenerationContext } from '../engine/generation-context';
import type { PositionMap } from '../engine/position-map';

/**
 * Recursively distribute `byeCount` positions across `size` slots,
 * keeping the left/right split balanced (difference ≤ 1 at every level).
 */
function distribute(size: number, byeCount: number): number[] {
  if (byeCount === 0) return [];
  if (byeCount === size) {
    return Array.from({ length: size }, (_, i) => i);
  }

  const half = size / 2;
  const left = Math.floor(byeCount / 2);
  const right = byeCount - left;

  const leftPositions = distribute(half, left);
  const rightPositions = distribute(half, right).map((i) => i + half);

  return leftPositions.concat(rightPositions);
}

/**
 * Balanced BYE placement using recursive half-splitting.
 *
 * Distributes BYE slots across the bracket so that at every
 * recursive split the left and right halves differ by at most 1.
 * The result is completely independent of seeding, competitor
 * names, or any other competitor information.
 *
 * @returns Sorted, unique BYE position indices (0-based).
 */
export function placeByes(
  context: GenerationContext,
  positionMap: PositionMap,
): readonly number[] {
  const { bracketSize, byeCount } = context;

  if (byeCount === 0) return [];

  const positions = distribute(bracketSize, byeCount);

  return positions.sort((a, b) => a - b);
}

/**
 * Balanced BYE placement using recursive half-splitting.
 *
 * Distributes BYE slots across the bracket so that at every
 * recursive split the left and right halves differ by at most 1.
 * The result is completely independent of seeding, competitor
 * names, or any other competitor information.
 */
export class BalancedByePlacementStrategy implements ByePlacementStrategy {
  placeByes(
    context: GenerationContext,
    positionMap: PositionMap,
  ): readonly number[] {
    return placeByes(context, positionMap);
  }
}
