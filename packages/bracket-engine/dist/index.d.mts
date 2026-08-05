interface EngineCompetitor {
    id: string;
    name: string;
    seed: number | null;
}
interface EngineMatch {
    id: string;
    round: number;
    position: number;
    competitorA: EngineCompetitor | null;
    competitorB: EngineCompetitor | null;
    winner: EngineCompetitor | null;
    isBye: boolean;
    nextMatchId: string | null;
    nextSlot: 'A' | 'B' | null;
}
interface EngineBracket {
    size: number;
    totalRounds: number;
    matches: EngineMatch[];
}
type DrawType = 'random' | 'manual';
interface GenerationResult {
    bracket: EngineBracket;
    byes: {
        competitorId: string;
        position: number;
    }[];
}
interface BracketPreview {
    competitorCount: number;
    bracketSize: number;
    byeCount: number;
    totalRounds: number;
    seededByes: number[];
}

declare function generateBracket(competitors: readonly EngineCompetitor[], drawType?: DrawType, manualPlacements?: Map<number, string>): GenerationResult;
declare function isBracketComplete(bracket: EngineBracket): boolean;
declare function getChampion(bracket: EngineBracket): EngineCompetitor | null;

declare function resolveMatch(bracket: EngineBracket, matchId: string, winnerId: string): EngineBracket;

declare function cascadeUndo(bracket: EngineBracket, matchId: string): EngineBracket;

declare function getBracketPreview(competitorCount: number, _seeds: readonly (number | null)[]): BracketPreview;

/**
 * BYE priority generation for single-elimination brackets.
 *
 * This module is completely independent from:
 *   - Seeding (standard, random, manual)
 *   - Province separation
 *   - Coach separation
 *   - Competitor placement
 *
 * It answers exactly one question:
 *   "Given a bracket size, in what order should positions be
 *   considered for BYE assignment?"
 *
 * Supported bracket sizes: 2, 4, 8, 16, 32, 64, 128, 256.
 *
 * The pipeline calls this module at step 2 (after bracket size
 * is determined, before any competitor is placed).
 */
/**
 * Generate an ordered list of bracket positions for BYE priority.
 *
 * Positions earlier in the array receive BYEs first. The engine
 * assigns at most one BYE per match (pair of adjacent positions).
 *
 * @param bracketSize  A power of 2 (2, 4, 8, 16, 32, 64, 128, or 256).
 * @returns A copy of the reference array for the given bracket size.
 *          Each element is a 0-based position index.
 * @throws {Error} If bracketSize is not a supported size.
 */
declare function generateByePriority(bracketSize: number): number[];

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
interface GenerationContext {
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
declare function buildGenerationContext(competitors: readonly EngineCompetitor[]): GenerationContext;

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
interface TournamentStrategy {
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
     * @throws If fewer than 2 competitors are provided.
     * @throws If more than 128 competitors are provided.
     */
    generate(competitors: readonly EngineCompetitor[], drawType: DrawType, manualPlacements?: Map<number, string>, context?: GenerationContext): GenerationResult;
    /**
     * Resolve a match by declaring a winner. Returns a new bracket with
     * the winner advanced to the next match slot.
     *
     * @throws If the match does not exist.
     * @throws If the winner is not one of the match competitors.
     * @throws If the match has missing competitors.
     */
    resolve(bracket: EngineBracket, matchId: string, winnerId: string): EngineBracket;
    /**
     * Undo a match result and cascade the removal of the old winner
     * through subsequent rounds.
     */
    undo(bracket: EngineBracket, matchId: string): EngineBracket;
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
    getPreview(competitorCount: number, seeds: readonly (number | null)[]): BracketPreview;
}

/**
 * A single match in an empty bracket tree.
 *
 * Contains only structural information — no competitors, no winners,
 * no BYE flags. Those are filled in by later pipeline stages.
 */
interface SkeletonMatch {
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
interface BracketSkeleton {
    /** Bracket grid size (smallest power of 2 ≥ competitor count). */
    readonly size: number;
    /** Total number of rounds. */
    readonly totalRounds: number;
    /** All matches across all rounds, in round-then-position order. */
    readonly matches: readonly SkeletonMatch[];
}

/**
 * A single placement slot in the bracket.
 *
 * Maps a sequential position index to its structural location
 * (match + slot) inside the bracket tree. Contains no competitor data —
 * it describes *where* a competitor *could* go, not who is there.
 */
interface PositionEntry {
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
type PositionMap = readonly PositionEntry[];

/**
 * Strategy for determining which bracket positions are BYEs.
 *
 * Implementations return only BYE position indices — they have no
 * knowledge of competitors, seeds, names, or match construction.
 *
 * The pipeline uses this interface for dependency injection so that
 * different BYE placement algorithms can be swapped without
 * modifying the pipeline or any other step.
 */
interface ByePlacementStrategy {
    /**
     * Determine which positions in the bracket are BYEs.
     *
     * @param context  Format-independent generation values (bracket
     *                 size, BYE count, etc.).
     * @param positionMap  Structural map of position indices to match
     *                     slots.  Provided for strategies that need
     *                     bracket topology; not required by all
     *                     implementations.
     * @returns Sorted, unique 0-based position indices that should
     *          be treated as BYEs.
     */
    placeByes(context: GenerationContext, positionMap: PositionMap): readonly number[];
}

/**
 * Input bundle passed to a {@link CompetitorPlacementStrategy}.
 *
 * Groups every value the strategy needs to decide which competitor
 * goes into which bracket position.  The strategy must NOT mutate
 * any of these values.
 */
interface PlacementInput {
    /** All competitors that need to be placed. */
    readonly competitors: readonly EngineCompetitor[];
    /** Format-independent values (bracket size, BYE count, etc.). */
    readonly generationContext: GenerationContext;
    /** Structural map of position indices to match slots. */
    readonly positionMap: PositionMap;
    /** Positions reserved for BYEs (determined upstream). */
    readonly byePositions: ReadonlySet<number>;
    /** Draw type (seeded, random, manual). */
    readonly drawType: DrawType;
    /** Manual position-to-competitor mappings (if applicable). */
    readonly manualPlacements?: Map<number, string>;
}
/**
 * Strategy for placing competitors into bracket positions.
 *
 * Implementations receive all placement-relevant data and return
 * a full placement array (one entry per bracket position, `null`
 * for BYE slots).  The strategy decides *which* competitor goes
 * *where* — it must NOT build matches, resolve BYEs, or know
 * about tournament progression.
 *
 * The pipeline uses this interface for dependency injection so that
 * different placement algorithms can be swapped without modifying
 * the pipeline or any other step.
 */
interface CompetitorPlacementStrategy {
    /**
     * Place competitors into bracket positions.
     *
     * @param input  All values needed to make placement decisions.
     * @returns An array of length `bracketSize` where each entry is
     *          either a competitor or `null` (BYE slot).
     */
    placeCompetitors(input: PlacementInput): readonly (EngineCompetitor | null)[];
}

/**
 * Configuration for {@link SingleEliminationStrategy}.
 *
 * Both strategies are optional — when omitted the same seeding-based
 * defaults that existed before this refactor are used.
 */
interface SingleEliminationStrategyConfig {
    /** Strategy for determining which bracket positions are BYEs. */
    readonly byePlacement?: ByePlacementStrategy;
    /** Strategy for placing competitors into non-BYE positions. */
    readonly competitorPlacement?: CompetitorPlacementStrategy;
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
declare class SingleEliminationStrategy implements TournamentStrategy {
    readonly format = "single-elimination";
    readonly name = "Single Elimination";
    private readonly byeStrategy;
    private readonly competitorStrategy;
    private readonly pipeline;
    constructor(config?: SingleEliminationStrategyConfig);
    generate(competitors: readonly EngineCompetitor[], drawType: DrawType, manualPlacements?: Map<number, string>, context?: GenerationContext): GenerationResult;
    resolve(bracket: EngineBracket, matchId: string, winnerId: string): EngineBracket;
    undo(bracket: EngineBracket, matchId: string): EngineBracket;
    isComplete(bracket: EngineBracket): boolean;
    getChampion(bracket: EngineBracket): EngineCompetitor | null;
    getPreview(competitorCount: number, seeds: readonly (number | null)[]): BracketPreview;
}

/**
 * Standard BYE placement derived from {@link standardSeeding}.
 *
 * Produces the same BYE positions as the legacy engine, where BYEs
 * fall on the slots whose seed number exceeds the competitor count.
 * This preserves full backward compatibility.
 */
declare class DefaultByePlacementStrategy implements ByePlacementStrategy {
    placeByes(context: GenerationContext, _positionMap: PositionMap): readonly number[];
}

/**
 * Standard competitor placement derived from {@link standardSeeding}.
 *
 * Produces the same placement as the legacy engine:
 *
 * - **Manual draws** — treats the supplied placements map as a draw
 *   order and places competitors into the non-BYE positions, never
 *   occupying an official BYE slot.
 * - **Seeded draws** — places seeded competitors at non-BYE positions
 *   in seeding order, then fills remaining slots with unseeded
 *   competitors.
 * - **Random draws** — shuffles the competitor list first, then applies
 *   the seeded logic with virtual seeds.
 *
 * This preserves full backward compatibility.
 */
declare class DefaultCompetitorPlacementStrategy implements CompetitorPlacementStrategy {
    placeCompetitors(input: PlacementInput): readonly (EngineCompetitor | null)[];
}

/**
 * Balanced BYE placement using recursive half-splitting.
 *
 * Distributes BYE slots across the bracket so that at every
 * recursive split the left and right halves differ by at most 1.
 * The result is completely independent of seeding, competitor
 * names, or any other competitor information.
 */
declare class BalancedByePlacementStrategy implements ByePlacementStrategy {
    placeByes(context: GenerationContext, positionMap: PositionMap): readonly number[];
}

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
interface PipelineContext {
    /** Original competitors list (immutable input). */
    readonly competitors: readonly EngineCompetitor[];
    /** Draw type (immutable input). */
    readonly drawType: DrawType;
    /** Optional manual placements (immutable input). */
    readonly manualPlacements?: Map<number, string>;
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
    byes: {
        competitorId: string;
        position: number;
    }[] | null;
}
/**
 * Create an initial {@link PipelineContext} with all step-output
 * fields set to `null`.
 */
declare function createPipelineContext(competitors: readonly EngineCompetitor[], drawType: DrawType, manualPlacements?: Map<number, string>, context?: GenerationContext): PipelineContext;
/**
 * A single step in the generation pipeline.
 *
 * Steps are pure: they read from the context, compute, and return
 * a new context.  No step performs I/O or mutates external state.
 */
interface PipelineStep {
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
declare class GenerationPipeline {
    private readonly steps;
    constructor(steps: readonly PipelineStep[]);
    /** Execute every step in order and return the final context. */
    run(context: PipelineContext): PipelineContext;
}

/**
 * Bundled input for the generate operation.
 */
interface GenerateInput {
    competitors: readonly EngineCompetitor[];
    drawType: DrawType;
    manualPlacements?: Map<number, string>;
}
/**
 * Bundled input for the resolve operation.
 */
interface ResolveInput {
    bracket: EngineBracket;
    matchId: string;
    winnerId: string;
}
/**
 * Result of running validators against an input.
 */
interface ValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * A single validation rule.
 *
 * Implementations check one aspect of the input and report errors.
 * Validators must be pure — no side effects, no I/O.
 */
interface Validator<TInput> {
    validate(input: TInput): ValidationResult;
}
/**
 * Runs a list of {@link Validator}s against an input and collects errors.
 *
 * If every validator passes the pipeline returns `{ valid: true, errors: [] }`.
 * If any validator fails, all errors are collected and returned together.
 *
 * With no validators registered the pipeline is a pass-through — it always
 * returns `{ valid: true, errors: [] }`.
 */
declare class ValidationPipeline<TInput> {
    private readonly validators;
    constructor(validators?: readonly Validator<TInput>[]);
    run(input: TInput): ValidationResult;
}
/**
 * Thrown when a validation pipeline rejects the input.
 */
declare class ValidationError extends Error {
    readonly errors: readonly string[];
    constructor(errors: readonly string[]);
}

/**
 * Optional configuration for {@link TournamentEngine}.
 *
 * Validators are plugged in here. When omitted the engine behaves
 * exactly as a pure delegation layer — no validation runs.
 */
interface TournamentEngineOptions {
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
declare class TournamentEngine {
    private strategy;
    private readonly generatePipeline;
    private readonly resolvePipeline;
    constructor(strategy: TournamentStrategy, options?: TournamentEngineOptions);
    /** Return the currently active strategy. */
    getStrategy(): TournamentStrategy;
    /** Switch to a different tournament format strategy. */
    setStrategy(strategy: TournamentStrategy): void;
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
    generate(competitors: readonly EngineCompetitor[], drawType: DrawType, manualPlacements?: Map<number, string>): GenerationResult;
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
    resolve(bracket: EngineBracket, matchId: string, winnerId: string): EngineBracket;
    /**
     * Undo a match result and cascade the changes.
     */
    undo(bracket: EngineBracket, matchId: string): EngineBracket;
    /**
     * Check whether every match in the bracket has a winner.
     */
    isComplete(bracket: EngineBracket): boolean;
    /**
     * Return the champion (final match winner), or null if unresolved.
     */
    getChampion(bracket: EngineBracket): EngineCompetitor | null;
    /**
     * Return bracket preview information for a given competitor count.
     */
    getPreview(competitorCount: number, seeds: readonly (number | null)[]): BracketPreview;
}

/**
 * Rejects when fewer than 2 competitors are provided.
 */
declare class MinimumCompetitorsValidator implements Validator<GenerateInput> {
    validate(input: GenerateInput): ValidationResult;
}
/**
 * Rejects when more than 256 competitors are provided.
 */
declare class MaximumCompetitorsValidator implements Validator<GenerateInput> {
    validate(input: GenerateInput): ValidationResult;
}
/**
 * Rejects when two or more competitors share the same id.
 */
declare class UniqueIdsValidator implements Validator<GenerateInput> {
    validate(input: GenerateInput): ValidationResult;
}
/**
 * Rejects when any competitor has an empty or whitespace-only name.
 */
declare class NonEmptyNamesValidator implements Validator<GenerateInput> {
    validate(input: GenerateInput): ValidationResult;
}
/**
 * Rejects when any competitor is missing a non-empty `id` or a `name` of type string.
 */
declare class RequiredFieldsValidator implements Validator<GenerateInput> {
    validate(input: GenerateInput): ValidationResult;
}

/**
 * Rejects when matchId is missing, empty, or whitespace-only.
 */
declare class NonEmptyMatchIdValidator implements Validator<ResolveInput> {
    validate(input: ResolveInput): ValidationResult;
}
/**
 * Rejects when winnerId is missing, empty, or whitespace-only.
 */
declare class NonEmptyWinnerIdValidator implements Validator<ResolveInput> {
    validate(input: ResolveInput): ValidationResult;
}

/**
 * Returns the standard set of V1 generate-input validators.
 *
 * @example
 * ```ts
 * const engine = new TournamentEngine(strategy, {
 *   generateValidators: defaultGenerateValidators(),
 * });
 * ```
 */
declare function defaultGenerateValidators(): readonly Validator<GenerateInput>[];
/**
 * Returns the standard set of V1 resolve-input validators.
 */
declare function defaultResolveValidators(): readonly Validator<ResolveInput>[];

export { BalancedByePlacementStrategy, type BracketPreview, type ByePlacementStrategy, type CompetitorPlacementStrategy, DefaultByePlacementStrategy, DefaultCompetitorPlacementStrategy, type DrawType, type EngineBracket, type EngineCompetitor, type EngineMatch, type GenerateInput, type GenerationContext, GenerationPipeline, type GenerationResult, MaximumCompetitorsValidator, MinimumCompetitorsValidator, NonEmptyMatchIdValidator, NonEmptyNamesValidator, NonEmptyWinnerIdValidator, type PipelineContext, type PipelineStep, type PlacementInput, RequiredFieldsValidator, type ResolveInput, SingleEliminationStrategy, type SingleEliminationStrategyConfig, TournamentEngine, type TournamentEngineOptions, type TournamentStrategy, UniqueIdsValidator, ValidationError, ValidationPipeline, type ValidationResult, type Validator, buildGenerationContext, cascadeUndo, createPipelineContext, defaultGenerateValidators, defaultResolveValidators, generateBracket, generateByePriority, getBracketPreview, getChampion, isBracketComplete, resolveMatch };
