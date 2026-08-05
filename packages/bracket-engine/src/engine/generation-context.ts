import type { EngineCompetitor } from '../types';
import { nextPowerOf2, logBase2 } from '../utils';

/**
 * Format-independent values derived from the validated competitor list.
 *
 * Built once by {@link TournamentEngine} after validation and passed into
 * every {@link TournamentStrategy.generate} call so that individual
 * strategies can reuse the pre-computed values instead of recalculating.
 *
 * All fields are pure arithmetic — no positions, no BYE assignments,
 * no match construction. Those are strategy-specific concerns.
 */
export interface GenerationContext {
  /** Number of competitors in the input list. */
  readonly competitorCount: number;

  /**
   * Smallest power of 2 that is ≥ `competitorCount`.
   * Determines the total number of slots in the bracket.
   */
  readonly bracketSize: number;

  /**
   * Number of BYE slots: `bracketSize − competitorCount`.
   * Always ≥ 0. A value of 0 means every slot is filled.
   */
  readonly byeCount: number;

  /**
   * Total number of rounds: `log2(bracketSize)`.
   * For example: 2 competitors → 1 round, 4 → 2, 8 → 3, 128 → 7.
   */
  readonly roundCount: number;
}

/**
 * Build a {@link GenerationContext} from a validated competitor list.
 *
 * Uses only format-independent arithmetic (power-of-2, log2).
 * No positions are assigned and no matches are created.
 */
export function buildGenerationContext(
  competitors: readonly EngineCompetitor[],
): GenerationContext {
  const competitorCount = competitors.length;
  const bracketSize = nextPowerOf2(competitorCount);
  const byeCount = bracketSize - competitorCount;
  const roundCount = logBase2(bracketSize);

  return { competitorCount, bracketSize, byeCount, roundCount };
}
