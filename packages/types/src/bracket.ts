import type { Category } from './category';
import type { Competitor } from './competitor';
import type { Match } from './match';

export interface BracketData {
  category: Category;
  competitors: Competitor[];
  matches: Match[];
}

export interface BracketPreview {
  competitorCount: number;
  bracketSize: number;
  byeCount: number;
  totalRounds: number;
  seededByes: number[];
}
