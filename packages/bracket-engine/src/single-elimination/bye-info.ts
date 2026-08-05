import type { EngineMatch } from '../types';
import type { PositionMap } from '../engine/position-map';

/**
 * Collect BYE metadata from a resolved bracket.
 *
 * Returns an array of objects describing every BYE that occurred in
 * round 1, each containing the competitor ID and the original bracket
 * position (index into the placement array) of the BYE slot itself.
 *
 * The position map is the single source of truth for mapping a
 * match + slot back to a placement index — slot B is never assumed
 * to have the same index as slot A.
 */
export function collectByeInfo(
  matches: readonly EngineMatch[],
  positionMap: PositionMap,
): { competitorId: string; position: number }[] {
  const indexByMatchSlot = new Map<string, number>();
  for (const entry of positionMap) {
    indexByMatchSlot.set(`${entry.matchId}:${entry.slot}`, entry.index);
  }

  const byes: { competitorId: string; position: number }[] = [];
  for (const match of matches) {
    if (match.round !== 1 || !match.isBye || !match.winner) continue;

    const byeSlot = match.competitorA === null ? 'A' : 'B';
    const position = indexByMatchSlot.get(`${match.id}:${byeSlot}`);
    if (position === undefined) continue;

    byes.push({ competitorId: match.winner.id, position });
  }
  return byes;
}
