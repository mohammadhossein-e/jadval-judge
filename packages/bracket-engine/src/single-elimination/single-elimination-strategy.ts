import type {
  EngineCompetitor,
  EngineBracket,
  DrawType,
  GenerationResult,
  BracketPreview,
} from '../types';
import type { TournamentStrategy } from '../engine/tournament-strategy';
import type { GenerationContext } from '../engine/generation-context';
import type { ByePlacementStrategy } from '../engine/bye-placement-strategy';
import type { CompetitorPlacementStrategy } from '../engine/competitor-placement-strategy';
import type { PlacementFilter } from '../engine/placement-filter';
import type { SeedPlacementStrategy } from '../engine/seed-placement-strategy';
import {
  GenerationPipeline,
  createPipelineContext,
} from '../engine/pipeline';
import { generateBracket, isBracketComplete, getChampion } from './generator';
import { resolveMatch } from './advancement';
import { cascadeUndo } from './cascade';
import { getBracketPreview } from './byes';
import { createSingleEliminationSteps } from './generation-steps';
import { DefaultByePlacementStrategy } from './default-bye-placement';
import {
  DefaultCompetitorPlacementStrategy,
} from './default-competitor-placement';

/**
 * Configuration for {@link SingleEliminationStrategy}.
 *
 * Both strategies are optional — when omitted the same seeding-based
 * defaults that existed before this refactor are used.
 */
export interface SingleEliminationStrategyConfig {
  /** Strategy for determining which bracket positions are BYEs. */
  readonly byePlacement?: ByePlacementStrategy;
  /** Strategy for placing competitors into non-BYE positions. */
  readonly competitorPlacement?: CompetitorPlacementStrategy;
  /**
   * Seeding strategy (official seeded positions). Applied as an
   * independent placement rule at the `seed` priority level and
   * composed with the default competitor placement. Only used when
   * `competitorPlacement` is not provided.
   */
  readonly seedPlacement?: SeedPlacementStrategy;
  /**
   * Placement filters (Province / Club / Coach / Country separation).
   * Applied at the `filter` priority level after manual placements and
   * before seeding. Only used when `competitorPlacement` is not
   * provided.
   */
  readonly filters?: readonly PlacementFilter[];
}

/**
 * TournamentStrategy implementation for single-elimination format.
 *
 * Generate uses a {@link GenerationPipeline} that decomposes bracket
 * generation into discrete, testable steps.  All other operations
 * delegate directly to the existing single-elimination functions.
 *
 * Strategies are injected through the constructor.  When no config is
 * supplied the behaviour is identical to the pre-refactor defaults
 * (seeding-based BYE placement and seeding-based competitor placement).
 */
export class SingleEliminationStrategy implements TournamentStrategy {
  readonly format = 'single-elimination';
  readonly name = 'Single Elimination';

  private readonly byeStrategy: ByePlacementStrategy;
  private readonly competitorStrategy: CompetitorPlacementStrategy;
  private readonly pipeline: GenerationPipeline;

  constructor(config?: SingleEliminationStrategyConfig) {
    this.byeStrategy = config?.byePlacement ?? new DefaultByePlacementStrategy();
    this.competitorStrategy = buildCompetitorStrategy(config);
    this.pipeline = new GenerationPipeline(
      createSingleEliminationSteps(this.byeStrategy, this.competitorStrategy),
    );
  }

  generate(
    competitors: readonly EngineCompetitor[],
    drawType: DrawType,
    manualPlacements?: Map<number, string>,
    placementOrder?: readonly string[],
    context?: GenerationContext,
  ): GenerationResult {
    const pipelineContext = createPipelineContext(
      competitors,
      drawType,
      manualPlacements,
      placementOrder,
      context,
    );
    const result = this.pipeline.run(pipelineContext);
    return {
      bracket: result.bracket!,
      byes: result.byes!,
    };
  }

  resolve(
    bracket: EngineBracket,
    matchId: string,
    winnerId: string,
  ): EngineBracket {
    return resolveMatch(bracket, matchId, winnerId);
  }

  undo(bracket: EngineBracket, matchId: string): EngineBracket {
    return cascadeUndo(bracket, matchId);
  }

  isComplete(bracket: EngineBracket): boolean {
    return isBracketComplete(bracket);
  }

  getChampion(bracket: EngineBracket): EngineCompetitor | null {
    return getChampion(bracket);
  }

  getPreview(
    competitorCount: number,
    seeds: readonly (number | null)[],
  ): BracketPreview {
    return getBracketPreview(competitorCount, seeds);
  }
}

/**
 * Build the competitor placement strategy from the injected config.
 *
 * An explicit `competitorPlacement` always wins. Otherwise the default
 * strategy is configured with the optional seeding strategy and
 * placement filters (which default to the official seeding behavior and
 * no filters when omitted).
 */
function buildCompetitorStrategy(
  config?: SingleEliminationStrategyConfig,
): CompetitorPlacementStrategy {
  if (config?.competitorPlacement) {
    return config.competitorPlacement;
  }
  return new DefaultCompetitorPlacementStrategy({
    seedPlacement: config?.seedPlacement,
    filters: config?.filters,
  });
}
