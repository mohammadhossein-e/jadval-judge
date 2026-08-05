import type { BracketSkeleton } from '../engine/bracket-skeleton';
import type { PositionMap, PositionEntry } from '../engine/position-map';

/**
 * Build a {@link PositionMap} for a single-elimination bracket.
 *
 * Maps every round-1 slot to a sequential position index:
 *
 * ```
 * Index 0 → R1P0 slot A
 * Index 1 → R1P0 slot B
 * Index 2 → R1P1 slot A
 * Index 3 → R1P1 slot B
 * …
 * ```
 *
 * The returned map has exactly `skeleton.size` entries (one per bracket
 * slot). Rounds 2+ are excluded — those slots are filled by winner
 * advancement, not direct placement.
 */
export function buildSingleEliminationPositionMap(
  skeleton: BracketSkeleton,
): PositionMap {
  const entries: PositionEntry[] = [];
  let index = 0;

  const round1 = skeleton.matches.filter((m) => m.round === 1);

  for (const match of round1) {
    entries.push({
      index,
      round: match.round,
      matchPosition: match.position,
      slot: 'A',
      matchId: match.id,
    });
    index++;

    entries.push({
      index,
      round: match.round,
      matchPosition: match.position,
      slot: 'B',
      matchId: match.id,
    });
    index++;
  }

  return entries;
}
