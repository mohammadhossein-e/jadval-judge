export interface EngineCompetitor {
  id: string;
  name: string;
  seed: number | null;
}

export interface EngineMatch {
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

export interface EngineBracket {
  size: number;
  totalRounds: number;
  matches: EngineMatch[];
}

export type DrawType = 'random' | 'manual';

export interface GenerationResult {
  bracket: EngineBracket;
  byes: { competitorId: string; position: number }[];
}

export interface BracketPreview {
  competitorCount: number;
  bracketSize: number;
  byeCount: number;
  totalRounds: number;
  seededByes: number[];
}
