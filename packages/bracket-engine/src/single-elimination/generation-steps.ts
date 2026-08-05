import type { EngineBracket } from '../types';
import type { PipelineStep, PipelineContext } from '../engine/pipeline';
import type { ByePlacementStrategy } from '../engine/bye-placement-strategy';
import type { CompetitorPlacementStrategy } from '../engine/competitor-placement-strategy';
import { buildSingleEliminationSkeleton } from './single-elimination-skeleton';
import { buildSingleEliminationPositionMap } from './single-elimination-position-map';
import { buildBracketMatches } from './match-builder';
import { autoResolveByes } from './bye-resolution';
import { collectByeInfo } from './bye-info';
import { DefaultByePlacementStrategy } from './default-bye-placement';
import { DefaultCompetitorPlacementStrategy } from './default-competitor-placement';

// ─── Step factories ───────────────────────────────────────────

/**
 * Create a ByePlacement pipeline step backed by the given strategy.
 *
 * The step determines which positions are BYEs and stores them on
 * the context for downstream steps.  Competitor placement is
 * handled separately by the CompetitorPlacement step.
 */
export function createByePlacementStep(strategy: ByePlacementStrategy): PipelineStep {
  return {
    name: 'ByePlacement',
    execute(context: PipelineContext): PipelineContext {
      const { generationContext, positionMap } = context;

      const byePositions = new Set(
        strategy.placeByes(generationContext, positionMap ?? []),
      );

      return { ...context, byePositions };
    },
  };
}

/**
 * Create a CompetitorPlacement pipeline step backed by the given
 * strategy.
 *
 * The step reads the BYE positions set by the upstream ByePlacement
 * step and delegates competitor placement to the injected strategy.
 */
export function createCompetitorPlacementStep(
  strategy: CompetitorPlacementStrategy,
): PipelineStep {
  return {
    name: 'CompetitorPlacement',
    execute(context: PipelineContext): PipelineContext {
      if (!context.positionMap) {
        throw new Error('CompetitorPlacement requires PositionMapBuilder to run first');
      }
      if (!context.byePositions) {
        throw new Error('CompetitorPlacement requires ByePlacement to run first');
      }

      const placements = strategy.placeCompetitors({
        competitors: context.competitors,
        generationContext: context.generationContext,
        positionMap: context.positionMap,
        byePositions: context.byePositions,
        drawType: context.drawType,
        manualPlacements: context.manualPlacements,
      });

      return { ...context, placements };
    },
  };
}

// ─── Default steps (backward-compatible) ──────────────────────

/**
 * ByePlacement step using the default seeding-based strategy.
 *
 * Equivalent to the legacy step — kept for backward compatibility.
 */
export const ByePlacement: PipelineStep = createByePlacementStep(
  new DefaultByePlacementStrategy(),
);

/**
 * CompetitorPlacement step using the default seeding-based strategy.
 *
 * Replaces the legacy no-op step — kept for backward compatibility.
 */
export const CompetitorPlacement: PipelineStep = createCompetitorPlacementStep(
  new DefaultCompetitorPlacementStrategy(),
);

// ─── Fixed steps (strategy-independent) ───────────────────────

/**
 * Step 1 — Build the empty bracket tree.
 *
 * Delegates to {@link buildSingleEliminationSkeleton} which creates
 * the correct number of rounds, matches, and parent/child links
 * with no competitors, no BYEs, and no winners.
 */
export const SkeletonBuilder: PipelineStep = {
  name: 'SkeletonBuilder',
  execute(context: PipelineContext): PipelineContext {
    const skeleton = buildSingleEliminationSkeleton(context.generationContext);
    return { ...context, skeleton };
  },
};

/**
 * Step 2 — Build the position map from the skeleton.
 *
 * Delegates to {@link buildSingleEliminationPositionMap} which maps
 * every sequential position index to its match + slot location in
 * the bracket tree.
 */
export const PositionMapBuilder: PipelineStep = {
  name: 'PositionMapBuilder',
  execute(context: PipelineContext): PipelineContext {
    if (!context.skeleton) {
      throw new Error('PositionMapBuilder requires SkeletonBuilder to run first');
    }
    const positionMap = buildSingleEliminationPositionMap(context.skeleton);
    return { ...context, positionMap };
  },
};

/**
 * Step 5 — Populate skeleton matches with placed competitors.
 *
 * Reads the skeleton (structure), the position map (slot locations),
 * and placements (competitor / null per position index) and produces
 * a full {@link EngineMatch} array.
 *
 * The position map is the single source of truth for mapping placement
 * indices to match/slot locations.  No hardcoded index arithmetic is
 * used.
 *
 * - Round 1: competitors come from the placements array via the
 *   position map.  `isBye` is set when exactly one side is null.
 * - Round 2+: empty slots, no BYEs (filled by advancement).
 */
export const MatchPopulation: PipelineStep = {
  name: 'MatchPopulation',
  execute(context: PipelineContext): PipelineContext {
    if (!context.skeleton) {
      throw new Error('MatchPopulation requires SkeletonBuilder to run first');
    }
    if (!context.positionMap) {
      throw new Error('MatchPopulation requires PositionMapBuilder to run first');
    }
    if (!context.placements) {
      throw new Error('MatchPopulation requires CompetitorPlacement to run first');
    }

    const matches = buildBracketMatches(context.skeleton, context.positionMap, context.placements);
    return { ...context, matches };
  },
};

/**
 * Step 6 — Resolve BYE matches.
 *
 * Delegates to {@link autoResolveByes} which sets winners on BYE
 * matches and advances them to the next round.  Does not assemble
 * the final bracket or collect BYE metadata.
 */
export const ByeResolution: PipelineStep = {
  name: 'ByeResolution',
  execute(context: PipelineContext): PipelineContext {
    if (!context.matches) {
      throw new Error('ByeResolution requires MatchPopulation to run first');
    }

    autoResolveByes(context.matches);

    return context;
  },
};

/**
 * Step 7 — Assemble the final bracket and collect BYE metadata.
 *
 * Builds the {@link EngineBracket} from the generation context and
 * resolved matches, then collects BYE metadata via
 * {@link collectByeInfo}.
 */
export const BracketAssembly: PipelineStep = {
  name: 'BracketAssembly',
  execute(context: PipelineContext): PipelineContext {
    if (!context.matches) {
      throw new Error('BracketAssembly requires MatchPopulation to run first');
    }
    if (!context.positionMap) {
      throw new Error('BracketAssembly requires PositionMapBuilder to run first');
    }

    const { generationContext } = context;
    const bracket: EngineBracket = {
      size: generationContext.bracketSize,
      totalRounds: generationContext.roundCount,
      matches: context.matches,
    };

    const byes = collectByeInfo(context.matches, context.positionMap);

    return { ...context, bracket, byes };
  },
};

// ─── Pipeline factories ───────────────────────────────────────

/**
 * Create the full set of single-elimination pipeline steps with
 * custom BYE and competitor placement strategies.
 *
 * All steps except ByePlacement and CompetitorPlacement are fixed —
 * only the strategies are injected.
 *
 * @param byeStrategy        Strategy for determining BYE positions.
 * @param competitorStrategy Strategy for placing competitors at
 *                           non-BYE positions.  Defaults to
 *                           {@link DefaultCompetitorPlacementStrategy}.
 */
export function createSingleEliminationSteps(
  byeStrategy: ByePlacementStrategy,
  competitorStrategy?: CompetitorPlacementStrategy,
): readonly PipelineStep[] {
  const cs = competitorStrategy ?? new DefaultCompetitorPlacementStrategy();
  return [
    SkeletonBuilder,
    PositionMapBuilder,
    createByePlacementStep(byeStrategy),
    createCompetitorPlacementStep(cs),
    MatchPopulation,
    ByeResolution,
    BracketAssembly,
  ];
}

/**
 * Default single-elimination pipeline steps.
 *
 * Uses the seeding-based strategies for both BYE placement and
 * competitor placement.  Kept for backward compatibility.
 */
export const SINGLE_ELIMINATION_STEPS: readonly PipelineStep[] =
  createSingleEliminationSteps(new DefaultByePlacementStrategy());
