import type {
  EngineCompetitor,
  EngineMatch,
  EngineBracket,
  DrawType,
} from '../types';
import type { GenerationContext } from './generation-context';
import type { BracketSkeleton } from './bracket-skeleton';
import type { PositionMap } from './position-map';
import { buildGenerationContext } from './generation-context';

/**
 * Mutable state bag passed sequentially through every
 * {@link PipelineStep}.  Each step reads the fields it needs and
 * writes the fields it produces.
 *
 * Fields start as `null` and are populated by steps in order:
 *
 * 1. {@link SkeletonBuilder}    → `skeleton`
 * 2. {@link PositionMapBuilder} → `positionMap`
 * 3. {@link ByePlacement}       → `byePositions`
 * 4. {@link CompetitorPlacement} → `placements`
 * 5. {@link MatchPopulation}    → `matches`
 * 6. {@link ByeResolution}      → (resolves BYEs in `matches`)
 * 7. {@link BracketAssembly}    → `bracket`, `byes`
 */
export interface PipelineContext {
  /** Original competitors list (immutable input). */
  readonly competitors: readonly EngineCompetitor[];

  /** Draw type (immutable input). */
  readonly drawType: DrawType;

  /** Optional manual placements (immutable input). */
  readonly manualPlacements?: Map<number, string>;

  /**
   * Optional ordered competitor ids (immutable input) produced by a
   * random draw. This is a placement ORDER only — it never creates
   * placement claims. It defines the order in which remaining
   * competitors fill free positions after manual, filters, seeds,
   * and BYE reservations are resolved.
   */
  readonly placementOrder?: readonly string[];

  /** Pre-computed format-independent values. */
  readonly generationContext: GenerationContext;

  /** Empty bracket tree — set by SkeletonBuilder. */
  skeleton: BracketSkeleton | null;

  /** Position-to-slot mapping — set by PositionMapBuilder. */
  positionMap: PositionMap | null;

  /** BYE position indices — set by ByePlacement. */
  byePositions: ReadonlySet<number> | null;

  /** Competitor / null placement array — set by CompetitorPlacement. */
  placements: readonly (EngineCompetitor | null)[] | null;

  /** Populated EngineMatch array — set by MatchPopulation. */
  matches: EngineMatch[] | null;

  /** Final bracket — set by BracketAssembly. */
  bracket: EngineBracket | null;

  /** BYE info list — set by BracketAssembly. */
  byes: { competitorId: string; position: number }[] | null;
}

/**
 * Create an initial {@link PipelineContext} with all step-output
 * fields set to `null`.
 */
export function createPipelineContext(
  competitors: readonly EngineCompetitor[],
  drawType: DrawType,
  manualPlacements?: Map<number, string>,
  placementOrder?: readonly string[],
  context?: GenerationContext,
): PipelineContext {
  return {
    competitors,
    drawType,
    manualPlacements,
    placementOrder,
    generationContext: context ?? buildGenerationContext(competitors),
    skeleton: null,
    positionMap: null,
    byePositions: null,
    placements: null,
    matches: null,
    bracket: null,
    byes: null,
  };
}

/**
 * A single step in the generation pipeline.
 *
 * Steps are pure: they read from the context, compute, and return
 * a new context.  No step performs I/O or mutates external state.
 */
export interface PipelineStep {
  /** Human-readable name (used in error messages and debugging). */
  readonly name: string;

  /** Execute the step, returning the updated context. */
  execute(context: PipelineContext): PipelineContext;
}

/**
 * Runs a sequence of {@link PipelineStep}s to produce a
 * {@link PipelineContext} with all output fields populated.
 *
 * The pipeline is a simple sequential runner — no branching, no
 * error recovery, no parallelism.  If a step throws, execution stops
 * and the error propagates to the caller.
 */
export class GenerationPipeline {
  private readonly steps: readonly PipelineStep[];

  constructor(steps: readonly PipelineStep[]) {
    this.steps = steps;
  }

  /** Execute every step in order and return the final context. */
  run(context: PipelineContext): PipelineContext {
    let current = context;
    for (const step of this.steps) {
      current = step.execute(current);
    }
    return current;
  }
}
