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

declare function generateBracket(competitors: readonly EngineCompetitor[], drawType?: DrawType, manualPlacements?: Map<number, string>, placementOrder?: readonly string[]): GenerationResult;
declare function isBracketComplete(bracket: EngineBracket): boolean;
declare function getChampion(bracket: EngineBracket): EngineCompetitor | null;

declare function resolveMatch(bracket: EngineBracket, matchId: string, winnerId: string): EngineBracket;

declare function cascadeUndo(bracket: EngineBracket, matchId: string): EngineBracket;

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
 * A single, atomic claim produced by a placement rule.
 *
 * Claims never write directly into bracket positions — they are
 * resolved by the claim resolver according to the stable priority
 * chain. A claim either wins (the position is assigned) or is
 * silently skipped on conflict.
 */
interface PlacementClaim {
    /** 0-based bracket position being claimed. */
    readonly position: number;
    /**
     * Competitor id for this claim, or `null` for a pure reservation
     * (e.g. a BYE slot that must stay empty).
     */
    readonly competitorId: string | null;
    /** Name of the rule that produced the claim (debugging/reporting). */
    readonly source: string;
}
/** An ordered, readonly collection of {@link PlacementClaim}s. */
type PlacementClaims = readonly PlacementClaim[];
/**
 * Immutable input bundle passed to every {@link PlacementRule}.
 *
 * The strategy must NOT mutate any of these values.
 */
interface PlacementRuleInput {
    /** All competitors that need to be placed. */
    readonly competitors: readonly EngineCompetitor[];
    /** Format-independent values (bracket size, BYE count, etc.). */
    readonly generationContext: GenerationContext;
    /** Structural map of position indices to match slots. */
    readonly positionMap: PositionMap;
    /** Positions reserved for BYEs (determined upstream). */
    readonly byePositions: ReadonlySet<number>;
    /**
     * Claims already accepted from higher-priority rules. Lower-priority
     * rules may inspect these (e.g. separation filters) but must never
     * conflict — the resolver drops conflicting claims.
     */
    readonly claimed: PlacementClaims;
}
/**
 * Stable placement priority chain.
 *
 * Lower number = higher priority = applied first and wins conflicts.
 * This ordering must remain stable — future rules (Province/Club/Coach
 * separation) slot into the `filter` level.
 */
declare const PlacementPriority: {
    /** Manual placements — highest priority. */
    readonly manual: 1;
    /** Placement filters (Province / Club / Coach / Country). */
    readonly filter: 2;
    /** Tournament seeding (official seeded positions). */
    readonly seed: 3;
    /** BYE reservations. */
    readonly bye: 4;
    /** Fill remaining competitors. */
    readonly fill: 5;
};
type PlacementPriority = (typeof PlacementPriority)[keyof typeof PlacementPriority];
/**
 * A placement rule.
 *
 * Rules are decoupled: each produces {@link PlacementClaims} from the
 * input only. They never write competitors into positions and never
 * depend on other rules' internals. The claim resolver applies them in
 * `priority` order and resolves conflicts.
 */
interface PlacementRule {
    /** Human-readable rule name (used in claim `source`). */
    readonly name: string;
    /** Priority level from {@link PlacementPriority}. */
    readonly priority: number;
    /**
     * Produce the positions this rule claims.
     *
     * @param input  Placement-relevant values plus already-accepted
     *               claims from higher-priority rules.
     * @returns An ordered list of claims. Conflicts with higher-priority
     *          claims are resolved (skipped) by the resolver.
     */
    claim(input: PlacementRuleInput): PlacementClaims;
}

/**
 * Input passed to a {@link SeedPlacementStrategy}.
 *
 * Extends the generic {@link PlacementRuleInput} with draw entry
 * metadata so seed strategies can tailor their behaviour to how the
 * competitors entered the bracket.
 */
interface SeedPlacementInput extends PlacementRuleInput {
    /** Draw type (random or manual). */
    readonly drawType: DrawType;
    /** Manual position-to-competitor mappings (if applicable). */
    readonly manualPlacements?: ReadonlyMap<number, string>;
}
/**
 * Strategy for seeding — decides which positions seeded competitors
 * claim.
 *
 * Seeding is an independent placement rule, NOT a draw type. It can be
 * enabled together with either a random or a manual draw. Implementations
 * produce {@link PlacementClaims} (official seeded positions) and let the
 * claim resolver apply the stable priority chain.
 *
 * Extends {@link PlacementRule} so it can be handed directly to the
 * resolver at the `seed` priority level.
 */
interface SeedPlacementStrategy extends PlacementRule {
    /**
     * Produce the positions claimed for seeded competitors.
     *
     * @param input  Placement values plus draw metadata.
     * @returns Claims mapping each seeded competitor (seed ≤ bracket size)
     *          to its official seeded position.
     */
    placeSeeds(input: SeedPlacementInput): PlacementClaims;
}

/**
 * Compute the official seeded positions for a list of competitors.
 *
 * Every competitor with a seed in `1..bracketSize` claims a position
 * derived from {@link standardSeeding} (the single source of truth for
 * official tournament seeding). When a seed's standard slot is an
 * official BYE position, the seed moves to the OPPOSITE slot of that
 * same match (`standardPosition ^ 1`) so the BYE slot stays empty and
 * the seed receives the BYE in round 1.
 *
 * BYE-PRIORITY guarantee: the top k seeds — where k is the smaller of
 * the seeded competitor count and the BYE count — each receive a BYE.
 * Seed i is seated on the recipient slot (`p ^ 1`) of the i-th BYE in
 * BYE-priority order, so the i-th BYE match in priority order is won by
 * seed i. Displaced lower seeds swap into the vacated slots, keeping the
 * bracket fully packed and the seeding invariants (halves, quarters,
 * eighths) intact. Seeds beyond the top k keep their structural fold
 * positions; the claim resolver drops any that collide with a higher
 * priority claim and the fill step completes the bracket.
 *
 * Recipient slots are assigned in BYE-priority order (not ascending
 * position order) so top seeds land on opposite halves / distinct
 * quarters exactly like the classic recipient table.
 *
 * Claims are sorted by seed number ascending so that when a displaced
 * seed collides with another seed's standard slot the lower seed wins
 * and the higher seed falls through to the fill step.
 *
 * Seed values do NOT need to be consecutive, and duplicate seed values
 * collapse to the first competitor in the list (defensive — validators
 * reject duplicates upstream). Seeds above the bracket size have no
 * official slot and produce no claim; they are placed by the fill step.
 *
 * When `byePositions` is not supplied the official BYE set is derived
 * from `competitors.length` (legacy path). The claim-based pipeline
 * passes the authoritative set from the ByePlacement step so a custom
 * BYE strategy stays consistent.
 *
 * This function is pure and framework-free so both the legacy
 * `placeCompetitors` API and the claim-based pipeline share it.
 *
 * @returns Claims mapping each seeded competitor to its seeded
 *          position (displaced off official BYE slots).
 */
declare function computeSeedClaims(competitors: readonly EngineCompetitor[], bracketSize: number, byePositions?: ReadonlySet<number>): PlacementClaims;
/**
 * Default seeding strategy using official tournament positions.
 *
 * Produces claims exactly as {@link computeSeedClaims} (official seeded
 * positions, displaced off BYE slots onto the opposite slot of the same
 * match) and participates in the claim system at the `seed` priority
 * level. Seeding is applied automatically whenever competitors have
 * seeds; it never writes into positions directly.
 */
declare class DefaultSeedPlacementStrategy implements SeedPlacementStrategy {
    readonly name = "seeding";
    readonly priority: number;
    placeSeeds(input: SeedPlacementInput): PlacementClaims;
    claim(input: SeedPlacementInput): PlacementClaims;
}

/**
 * A pluggable placement filter (separation rule).
 *
 * Filters model constraints such as Province / Club / Coach / Country
 * separation. They operate purely on claims: given the placement input
 * and the claims already accepted by higher-priority rules (manual
 * placements), a filter produces additional claims that keep separated
 * competitors apart. The claim resolver silently skips any conflicting
 * claim, so filters never need to coordinate with each other.
 *
 * Filters are applied at the `filter` priority level, in registration
 * order, after manual placements and before seeding.
 */
interface PlacementFilter {
    /** Human-readable filter name (used in claim `source`). */
    readonly name: string;
    /**
     * Produce the positions this filter claims.
     *
     * @param input     Placement-relevant values (competitors, BYE
     *                  positions, etc.) plus already-accepted claims.
     * @param claimed   Claims accepted from higher-priority rules
     *                  (manual placements). Must be treated as taken.
     * @returns Additional claims. Conflicting claims are dropped by the
     *          resolver, never an error.
     */
    apply(input: PlacementRuleInput, claimed: PlacementClaims): PlacementClaims;
}

/**
 * Manual placement rule (priority {@link PlacementPriority.manual}).
 *
 * The supplied placements map is treated as a draw ORDER, not a literal
 * slot assignment: BYE slots are reserved and the competitors are placed
 * into the remaining non-BYE positions in ascending position order.
 * Unknown ids and duplicate ids are skipped without consuming a slot.
 */
declare class ManualPlacementRule implements PlacementRule {
    private readonly manualPlacements;
    readonly name = "manual";
    readonly priority: number;
    constructor(manualPlacements: ReadonlyMap<number, string>);
    claim(input: PlacementRuleInput): PlacementClaims;
}
/**
 * Placement filter adapter rule (priority {@link PlacementPriority.filter}).
 *
 * Wraps a {@link PlacementFilter} so it participates in the claim
 * resolution chain. Filters only ever ADD claims; the resolver drops any
 * claim that conflicts with higher-priority rules.
 */
declare class FilterPlacementRule implements PlacementRule {
    private readonly filter;
    readonly priority: number;
    constructor(filter: PlacementFilter);
    get name(): string;
    claim(input: PlacementRuleInput): PlacementClaims;
}
/**
 * Seeding adapter rule (priority {@link PlacementPriority.seed}).
 *
 * Wraps a {@link SeedPlacementStrategy} so it can be handed to the claim
 * resolver as a plain rule. The adapter rebuilds the full
 * {@link SeedPlacementInput} (draw type + manual placements) from the
 * values captured at strategy construction, since the generic rule input
 * does not carry draw metadata.
 */
declare class SeedPlacementRule implements PlacementRule {
    private readonly strategy;
    private readonly drawType;
    private readonly manualPlacements;
    readonly priority: number;
    constructor(strategy: SeedPlacementStrategy, drawType: DrawType, manualPlacements: ReadonlyMap<number, string> | undefined);
    get name(): string;
    claim(input: PlacementRuleInput): PlacementClaims;
}
/**
 * BYE reservation rule (priority {@link PlacementPriority.bye}).
 *
 * Produces a `null`-competitor claim for every official BYE position.
 * BYE slots lose the reservation when a higher-priority rule (manual,
 * filter, seeding) claims the same position — this is how a seed's
 * official position beats a BYE slot.
 */
declare class ByePlacementRule implements PlacementRule {
    readonly name = "bye";
    readonly priority: number;
    claim(input: PlacementRuleInput): PlacementClaims;
}

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
     * `placementOrder` is the ordered competitor ids produced by a random
     * draw. It is a placement ORDER only — it never creates placement
     * claims. It defines the order in which remaining competitors fill
     * free positions after manual, filters, seeds, and BYE reservations
     * are resolved.
     *
     * @throws If fewer than 2 competitors are provided.
     * @throws If more than 128 competitors are provided.
     */
    generate(competitors: readonly EngineCompetitor[], drawType: DrawType, manualPlacements?: Map<number, string>, placementOrder?: readonly string[], context?: GenerationContext): GenerationResult;
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
    /**
     * Ordered competitor ids produced by a random draw (if applicable).
     * This is a placement ORDER only — it never creates placement claims.
     * It defines the order in which remaining competitors fill free
     * positions after manual, filters, seeds, and BYE reservations are
     * resolved.
     */
    readonly placementOrder?: readonly string[];
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
declare class SingleEliminationStrategy implements TournamentStrategy {
    readonly format = "single-elimination";
    readonly name = "Single Elimination";
    private readonly byeStrategy;
    private readonly competitorStrategy;
    private readonly pipeline;
    constructor(config?: SingleEliminationStrategyConfig);
    generate(competitors: readonly EngineCompetitor[], drawType: DrawType, manualPlacements?: Map<number, string>, placementOrder?: readonly string[], context?: GenerationContext): GenerationResult;
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
 * Optional strategy parts for {@link DefaultCompetitorPlacementStrategy}.
 */
interface DefaultCompetitorPlacementConfig {
    /** Seeding strategy. Defaults to official seeded positions. */
    readonly seedPlacement?: SeedPlacementStrategy;
    /** Placement filters (Province / Club / Coach / Country separation). */
    readonly filters?: readonly PlacementFilter[];
}
/**
 * Claim-based competitor placement for single elimination.
 *
 * Nothing writes competitors into positions directly. Every rule
 * ({@link PlacementRule}) produces claims which the claim resolver
 * applies in the stable priority chain:
 *
 *   1. Manual placements (draw order → non-BYE slots)
 *   2. Placement filters
 *   3. Seeding (official seeded positions)
 *   4. BYE reservations
 *   5. Fill remaining competitors
 *
 * Seeding is an independent, injectable rule — NOT a draw type — so it
 * composes with both random and manual draws. When no competitor has a
 * real seed the fixed BYE behavior (and the previous task's regression
 * tests) is preserved exactly: manual entries keep their draw order
 * among non-BYE slots and the fill step never occupies a BYE slot.
 */
declare class DefaultCompetitorPlacementStrategy implements CompetitorPlacementStrategy {
    private readonly seedStrategy;
    private readonly filters;
    constructor(config?: DefaultCompetitorPlacementConfig);
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
    byes: {
        competitorId: string;
        position: number;
    }[] | null;
}
/**
 * Create an initial {@link PipelineContext} with all step-output
 * fields set to `null`.
 */
declare function createPipelineContext(competitors: readonly EngineCompetitor[], drawType: DrawType, manualPlacements?: Map<number, string>, placementOrder?: readonly string[], context?: GenerationContext): PipelineContext;
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
    /**
     * Ordered competitor ids produced by a random draw. This is a
     * placement ORDER only — it never creates placement claims and only
     * defines the order in which remaining competitors fill free positions.
     */
    placementOrder?: readonly string[];
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
    generate(competitors: readonly EngineCompetitor[], drawType: DrawType, manualPlacements?: Map<number, string>, placementOrder?: readonly string[]): GenerationResult;
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
 * Resolve a set of placement claims into a final placement array.
 *
 * Rules are applied in ascending priority order (lower = higher
 * priority). For each rule's claims, the first winning claim for a
 * position and for a competitor wins; later conflicting claims are
 * silently skipped. BYE reservations (competitorId `null`) occupy a
 * position without assigning a competitor, so the fill step never
 * touches them. After all rules, the remaining competitors in
 * `fillOrder` are placed into the first free position.
 *
 * The result always has exactly `competitorCount` occupied slots and
 * `bracketSize - competitorCount` empty slots, provided the input is
 * valid (unique ids, distinct competitor claims).
 */
declare function resolvePlacementClaims(input: PlacementRuleInput, rules: readonly PlacementRule[], fillOrder: readonly EngineCompetitor[]): readonly (EngineCompetitor | null)[];

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
 * Rejects when two or more competitors share the same seed value.
 */
declare class DuplicateSeedsValidator implements Validator<GenerateInput> {
    validate(input: GenerateInput): ValidationResult;
}
/**
 * Rejects when any seed is not a positive integer (0, negatives,
 * fractions, NaN, and Infinity are all invalid).
 */
declare class InvalidSeedValuesValidator implements Validator<GenerateInput> {
    validate(input: GenerateInput): ValidationResult;
}
/**
 * Rejects when the number of seeded competitors exceeds the total number
 * of competitors. A defensive invariant guard — it can never fire since
 * every competitor carries at most one seed, but it documents the
 * constraint for consumers that supply a seed list.
 */
declare class SeededCountValidator implements Validator<GenerateInput> {
    validate(input: GenerateInput): ValidationResult;
}
/**
 * Run all seed validation rules and collect their errors.
 *
 * Used by `generateBracket()` (the primary API) so seed problems are
 * rejected even when the engine is used without a validation pipeline.
 */
declare function validateSeeds(input: GenerateInput): string[];
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

export { BalancedByePlacementStrategy, type BracketPreview, ByePlacementRule, type ByePlacementStrategy, type CompetitorPlacementStrategy, DefaultByePlacementStrategy, type DefaultCompetitorPlacementConfig, DefaultCompetitorPlacementStrategy, DefaultSeedPlacementStrategy, type DrawType, DuplicateSeedsValidator, type EngineBracket, type EngineCompetitor, type EngineMatch, FilterPlacementRule, type GenerateInput, type GenerationContext, GenerationPipeline, type GenerationResult, InvalidSeedValuesValidator, ManualPlacementRule, MaximumCompetitorsValidator, MinimumCompetitorsValidator, NonEmptyMatchIdValidator, NonEmptyNamesValidator, NonEmptyWinnerIdValidator, type PipelineContext, type PipelineStep, type PlacementClaim, type PlacementClaims, type PlacementFilter, type PlacementInput, PlacementPriority, type PlacementRule, type PlacementRuleInput, RequiredFieldsValidator, type ResolveInput, type SeedPlacementInput, SeedPlacementRule, type SeedPlacementStrategy, SeededCountValidator, SingleEliminationStrategy, type SingleEliminationStrategyConfig, TournamentEngine, type TournamentEngineOptions, type TournamentStrategy, UniqueIdsValidator, ValidationError, ValidationPipeline, type ValidationResult, type Validator, buildGenerationContext, cascadeUndo, computeSeedClaims, createPipelineContext, defaultGenerateValidators, defaultResolveValidators, generateBracket, generateByePriority, getBracketPreview, getChampion, isBracketComplete, resolveMatch, resolvePlacementClaims, validateSeeds };
