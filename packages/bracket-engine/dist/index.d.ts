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

declare function shuffleArray<T>(array: readonly T[]): T[];

declare function generateBracket(competitors: readonly EngineCompetitor[], drawType?: DrawType, manualPlacements?: Map<number, string>): GenerationResult;
declare function isBracketComplete(bracket: EngineBracket): boolean;
declare function getChampion(bracket: EngineBracket): EngineCompetitor | null;

declare function resolveMatch(bracket: EngineBracket, matchId: string, winnerId: string): EngineBracket;

declare function cascadeUndo(bracket: EngineBracket, matchId: string): EngineBracket;

declare function standardSeeding(bracketSize: number): number[];
declare function placeCompetitors(competitors: readonly EngineCompetitor[], bracketSize: number, drawType: DrawType, manualPlacements?: Map<number, string>): (EngineCompetitor | null)[];

declare function calculateBracketInfo(competitorCount: number): {
    bracketSize: number;
    totalRounds: number;
    byeCount: number;
};
declare function getBracketPreview(competitorCount: number, seeds: readonly (number | null)[]): BracketPreview;

export { type BracketPreview, type DrawType, type EngineBracket, type EngineCompetitor, type EngineMatch, type GenerationResult, calculateBracketInfo, cascadeUndo, generateBracket, getBracketPreview, getChampion, isBracketComplete, placeCompetitors, resolveMatch, shuffleArray, standardSeeding };
