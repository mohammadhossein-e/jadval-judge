import type {
  EngineCompetitor,
  EngineBracket,
  DrawType,
  GenerationResult,
  BracketPreview,
} from '../types';
import type { GenerationContext } from './generation-context';

/**
 * Contract that every tournament format must implement.
 *
 * Each format (single-elimination, repechage, round-robin, etc.)
 * provides its own implementation of this interface. The format-specific
 * logic lives in a dedicated module (e.g. `src/single-elimination/`),
 * while this interface defines the uniform API that TournamentEngine
 * delegates to.
 *
 * All methods are pure: input in, output out. No side effects.
 */
export interface TournamentStrategy {
  /** Unique identifier for this format (e.g. 'single-elimination'). */
  readonly format: string;

  /** Human-readable name (e.g. 'Single Elimination'). */
  readonly name: string;

  /**
   * Generate a bracket from a list of competitors.
   *
   * The engine builds a {@link GenerationContext} after validation and
   * passes it in so that strategies can reuse the pre-computed values
   * (bracketSize, byeCount, roundCount) instead of recalculating.
   *
   * When `manualPlacements` is provided and non-empty, it takes priority
   * over `drawType`.
   *
   * `placementOrder` is the ordered competitor ids produced by a random
   * draw. It is a placement ORDER only — it never creates placement
   * claims. It defines the order in which remaining competitors fill
   * free positions after manual, filters, seeds, and BYE reservations
   * are resolved.
   *
   * @throws If fewer than 2 competitors are provided.
   * @throws If more than 128 competitors are provided.
   */
  generate(
    competitors: readonly EngineCompetitor[],
    drawType: DrawType,
    manualPlacements?: Map<number, string>,
    placementOrder?: readonly string[],
    context?: GenerationContext,
  ): GenerationResult;

  /**
   * Resolve a match by declaring a winner. Returns a new bracket with
   * the winner advanced to the next match slot.
   *
   * @throws If the match does not exist.
   * @throws If the winner is not one of the match competitors.
   * @throws If the match has missing competitors.
   */
  resolve(
    bracket: EngineBracket,
    matchId: string,
    winnerId: string,
  ): EngineBracket;

  /**
   * Undo a match result and cascade the removal of the old winner
   * through subsequent rounds.
   */
  undo(
    bracket: EngineBracket,
    matchId: string,
  ): EngineBracket;

  /**
   * Check whether every match in the bracket has a winner.
   */
  isComplete(bracket: EngineBracket): boolean;

  /**
   * Return the champion (final match winner), or null if the bracket
   * is not yet complete.
   */
  getChampion(bracket: EngineBracket): EngineCompetitor | null;

  /**
   * Return preview information about the bracket that would be generated
   * for a given number of competitors and seed assignments.
   */
  getPreview(
    competitorCount: number,
    seeds: readonly (number | null)[],
  ): BracketPreview;
}
