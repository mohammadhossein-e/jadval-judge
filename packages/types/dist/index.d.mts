type TournamentType = 'kata' | 'kumite';
interface Tournament {
    id: string;
    name: string;
    date: string;
    organization: string | null;
    tournamentType: TournamentType;
    editPin: string;
    createdAt: string;
    updatedAt: string;
}

type CategoryStatus = 'SETUP' | 'IN_PROGRESS' | 'COMPLETED';
type DrawType = 'RANDOM' | 'MANUAL';
type Gender = 'male' | 'female';
type AgeGroup = 'under-12' | '12-14' | '15-17' | '18-34' | '35-44' | '45-54' | '55-64' | '65-plus';
type BeltLevel = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black' | 'all';
interface Category {
    id: string;
    tournamentId: string;
    name: string;
    status: CategoryStatus;
    gender: Gender | null;
    ageGroup: AgeGroup | null;
    beltLevel: BeltLevel | null;
    bracketSize: number | null;
    drawType: DrawType | null;
    totalRounds: number | null;
    slug: string;
    createdAt: string;
    updatedAt: string;
}

interface Competitor {
    id: string;
    categoryId: string;
    name: string;
    club: string;
    seed: number | null;
    createdAt: string;
}

type MatchSlot = 'A' | 'B';
interface Match {
    id: string;
    categoryId: string;
    round: number;
    position: number;
    competitorAId: string | null;
    competitorBId: string | null;
    winnerId: string | null;
    isBye: boolean;
    nextMatchId: string | null;
    nextSlot: MatchSlot | null;
    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface BracketData {
    category: Category;
    competitors: Competitor[];
    matches: Match[];
}
interface BracketPreview {
    competitorCount: number;
    bracketSize: number;
    byeCount: number;
    totalRounds: number;
    seededByes: number[];
}

export type { AgeGroup, BeltLevel, BracketData, BracketPreview, Category, CategoryStatus, Competitor, DrawType, Gender, Match, MatchSlot, Tournament, TournamentType };
