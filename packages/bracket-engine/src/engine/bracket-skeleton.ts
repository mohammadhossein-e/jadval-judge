/**
 * A single match in an empty bracket tree.
 *
 * Contains only structural information — no competitors, no winners,
 * no BYE flags. Those are filled in by later pipeline stages.
 */
export interface SkeletonMatch {
  /** Unique match identifier (e.g. "R1P0", "R2P1"). */
  readonly id: string;

  /** Round number (1-indexed). */
  readonly round: number;

  /** Position within the round (0-indexed). */
  readonly position: number;

  /** ID of the match this feeds into, or null for the final. */
  readonly nextMatchId: string | null;

  /** Which slot (A or B) in the next match, or null for the final. */
  readonly nextSlot: 'A' | 'B' | null;
}

/**
 * An empty tournament bracket tree.
 *
 * Contains the correct number of rounds and matches with parent/child
 * relationships, but no competitors, no BYEs, and no resolved winners.
 * This is the structural foundation that competitor placement and BYE
 * assignment build on top of.
 */
export interface BracketSkeleton {
  /** Bracket grid size (smallest power of 2 ≥ competitor count). */
  readonly size: number;

  /** Total number of rounds. */
  readonly totalRounds: number;

  /** All matches across all rounds, in round-then-position order. */
  readonly matches: readonly SkeletonMatch[];
}
