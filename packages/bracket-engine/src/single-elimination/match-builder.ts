import type { EngineCompetitor, EngineMatch } from '../types';
import type { BracketSkeleton } from '../engine/bracket-skeleton';
import type { PositionMap } from '../engine/position-map';

/**
 * Populate an empty bracket skeleton with placed competitors.
 *
 * Uses the position map as the single source of truth for mapping
 * placement indices to match/slot locations.  No hardcoded index
 * arithmetic is used.
 *
 * For each skeleton match whose ID appears in the position map
 * (round-1 matches), competitors are read from the placements array.
 * The `isBye` flag is set when exactly one side is null.
 * All other matches (round 2+) remain empty.
 *
 * This is the single source of truth for match construction.
 * Both {@link generateBracket} and the pipeline's MatchPopulation
 * step delegate here.
 */
export function buildBracketMatches(
  skeleton: BracketSkeleton,
  positionMap: PositionMap,
  placements: readonly (EngineCompetitor | null)[],
): EngineMatch[] {
  const slotByMatch = new Map<string, { A: number; B: number }>();
  for (const entry of positionMap) {
    let record = slotByMatch.get(entry.matchId);
    if (!record) {
      record = { A: 0, B: 0 };
      slotByMatch.set(entry.matchId, record);
    }
    record[entry.slot] = entry.index;
  }

  return skeleton.matches.map((skelMatch) => {
    const slots = slotByMatch.get(skelMatch.id);
    if (slots) {
      const compA = placements[slots.A] ?? null;
      const compB = placements[slots.B] ?? null;
      const isBye = (compA === null) !== (compB === null);

      return {
        id: skelMatch.id,
        round: skelMatch.round,
        position: skelMatch.position,
        competitorA: compA,
        competitorB: compB,
        winner: null,
        isBye,
        nextMatchId: skelMatch.nextMatchId,
        nextSlot: skelMatch.nextSlot,
      };
    }

    return {
      id: skelMatch.id,
      round: skelMatch.round,
      position: skelMatch.position,
      competitorA: null,
      competitorB: null,
      winner: null,
      isBye: false,
      nextMatchId: skelMatch.nextMatchId,
      nextSlot: skelMatch.nextSlot,
    };
  });
}
