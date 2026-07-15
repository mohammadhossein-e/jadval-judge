export type MatchSlot = 'A' | 'B';

export interface Match {
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
