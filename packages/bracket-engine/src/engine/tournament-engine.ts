import type {
  EngineCompetitor,
  EngineBracket,
  DrawType,
  GenerationResult,
  BracketPreview,
} from '../types';
import type { TournamentStrategy } from './tournament-strategy';
import type { Validator } from './validator';
import {
  ValidationPipeline,
  ValidationError,
} from './validator';
import type { GenerateInput, ResolveInput } from './validator';
import { buildGenerationContext } from './generation-context';

export type { GenerateInput, ResolveInput } from './validator';

/**
 * Optional configuration for {@link TournamentEngine}.
 *
 * Validators are plugged in here. When omitted the engine behaves
 * exactly as a pure delegation layer — no validation runs.
 */
export interface TournamentEngineOptions {
  /** Validators applied before every {@link TournamentEngine.generate} call. */
  generateValidators?: readonly Validator<GenerateInput>[];
  /** Validators applied before every {@link TournamentEngine.resolve} call. */
  resolveValidators?: readonly Validator<ResolveInput>[];
}

/**
 * Main entry point for the bracket engine.
 *
 * Executes the approved pipeline for each operation:
 *
 * ```
 * Input → Validation → TournamentStrategy → Result
 * ```
 *
 * With no validators registered the validation stage is a pass-through,
 * so behaviour is identical to direct strategy delegation.
 *
 * @example
 * ```ts
 * const engine = new TournamentEngine(new SingleEliminationStrategy());
 * const result = engine.generate(competitors, 'random');
 * ```
 *
 * @example With validators:
 * ```ts
 * const engine = new TournamentEngine(strategy, {
 *   generateValidators: [new CompetitorCountValidator()],
 * });
 * ```
 */
export class TournamentEngine {
  private strategy: TournamentStrategy;
  private readonly generatePipeline: ValidationPipeline<GenerateInput>;
  private readonly resolvePipeline: ValidationPipeline<ResolveInput>;

  constructor(strategy: TournamentStrategy, options?: TournamentEngineOptions) {
    this.strategy = strategy;
    this.generatePipeline = new ValidationPipeline(options?.generateValidators);
    this.resolvePipeline = new ValidationPipeline(options?.resolveValidators);
  }

  /** Return the currently active strategy. */
  getStrategy(): TournamentStrategy {
    return this.strategy;
  }

  /** Switch to a different tournament format strategy. */
  setStrategy(strategy: TournamentStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Generate a bracket from a list of competitors.
   *
   * Pipeline: Input → Validation → Build Context → TournamentStrategy → Result
   *
   * 1. Runs the generate validation pipeline. If any validator fails,
   *    a {@link ValidationError} is thrown before anything else happens.
   * 2. Builds a {@link GenerationContext} from the validated competitor list.
   * 3. Delegates to the strategy, passing the context alongside the raw input.
   *
   * @throws {ValidationError} if validation fails.
   * @throws If fewer than 2 competitors are provided (strategy-level).
   * @throws If more than 128 competitors are provided (strategy-level).
   */
  generate(
    competitors: readonly EngineCompetitor[],
    drawType: DrawType,
    manualPlacements?: Map<number, string>,
  ): GenerationResult {
    const input: GenerateInput = { competitors, drawType, manualPlacements };
    const validation = this.generatePipeline.run(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    const context = buildGenerationContext(competitors);
    return this.strategy.generate(competitors, drawType, manualPlacements, context);
  }

  /**
   * Resolve a match by declaring a winner.
   *
   * Runs the resolve validation pipeline first. If any validator fails,
   * a {@link ValidationError} is thrown before the strategy is called.
   *
   * @throws {ValidationError} if validation fails.
   * @throws If the match does not exist (strategy-level).
   * @throws If the winner is not one of the match competitors (strategy-level).
   * @throws If the match has missing competitors (strategy-level).
   */
  resolve(
    bracket: EngineBracket,
    matchId: string,
    winnerId: string,
  ): EngineBracket {
    const input: ResolveInput = { bracket, matchId, winnerId };
    const validation = this.resolvePipeline.run(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    return this.strategy.resolve(bracket, matchId, winnerId);
  }

  /**
   * Undo a match result and cascade the changes.
   */
  undo(bracket: EngineBracket, matchId: string): EngineBracket {
    return this.strategy.undo(bracket, matchId);
  }

  /**
   * Check whether every match in the bracket has a winner.
   */
  isComplete(bracket: EngineBracket): boolean {
    return this.strategy.isComplete(bracket);
  }

  /**
   * Return the champion (final match winner), or null if unresolved.
   */
  getChampion(bracket: EngineBracket): EngineCompetitor | null {
    return this.strategy.getChampion(bracket);
  }

  /**
   * Return bracket preview information for a given competitor count.
   */
  getPreview(
    competitorCount: number,
    seeds: readonly (number | null)[],
  ): BracketPreview {
    return this.strategy.getPreview(competitorCount, seeds);
  }
}
