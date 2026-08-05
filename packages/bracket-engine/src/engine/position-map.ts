import type { BracketSkeleton } from './bracket-skeleton';

/**
 * A single placement slot in the bracket.
 *
 * Maps a sequential position index to its structural location
 * (match + slot) inside the bracket tree. Contains no competitor data —
 * it describes *where* a competitor *could* go, not who is there.
 */
export interface PositionEntry {
  /**
   * Sequential position index (0-indexed).
   *
   * This is the index used by seeding algorithms, draw operations,
   * and placement maps. Position 0 is always the first slot of the
   * first round-1 match.
   */
  readonly index: number;

  /** Round number that this position belongs to. */
  readonly round: number;

  /** Position of the match within that round. */
  readonly matchPosition: number;

  /** Slot within the match ('A' or 'B'). */
  readonly slot: 'A' | 'B';

  /** Match ID from the bracket skeleton. */
  readonly matchId: string;
}

/**
 * An ordered list of every placement slot in a bracket.
 *
 * The map is format-independent: the type and shape are the same for
 * single elimination, repechage, round robin, etc. Only the builder
 * function is format-specific.
 *
 * For single elimination the map contains exactly `bracketSize` entries —
 * one for every slot in round 1. Rounds 2+ are filled by advancement
 * and are not represented here.
 */
export type PositionMap = readonly PositionEntry[];

/**
 * Build a {@link PositionMap} from a bracket skeleton.
 *
 * The returned map lists every placement slot in the bracket in
 * positional order (index 0, 1, 2, …). The builder decides which
 * slots are "placement" slots based on the tournament format.
 */
export type PositionMapBuilder = (skeleton: BracketSkeleton) => PositionMap;
