'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { EngineBracket, EngineCompetitor } from '@jadval/bracket-engine';
import { BracketView } from '@/components/competitor/BracketView';
import { ChampionBanner } from '@/components/competitor/ChampionBanner';

interface BracketResultSectionProps {
  bracket: EngineBracket;
  selectedMatchId: string | null;
  isComplete: boolean;
  champion: EngineCompetitor | null;
  onSelectMatch: (matchId: string | null) => void;
  onResolveWinner: (matchId: string, winnerId: string) => void;
  onUndoMatch: (matchId: string) => void;
  onResetBracket: () => void;
  canResolveMatch: (matchId: string) => boolean;
  canUndoMatch: (matchId: string) => boolean;
}

export function BracketResultSection({
  bracket,
  selectedMatchId,
  isComplete,
  champion,
  onSelectMatch,
  onResolveWinner,
  onUndoMatch,
  onResetBracket,
  canResolveMatch,
  canUndoMatch,
}: BracketResultSectionProps) {
  return (
    <>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onResetBracket}>
          <RotateCcw className="size-4" />
          Reset Bracket
        </Button>
      </div>
      <ChampionBanner champion={champion} isComplete={isComplete} />
      <BracketView
        bracket={bracket}
        selectedMatchId={selectedMatchId}
        onSelectMatch={onSelectMatch}
        onResolveWinner={onResolveWinner}
        onUndoMatch={onUndoMatch}
        canResolveMatch={canResolveMatch}
        canUndoMatch={canUndoMatch}
      />
    </>
  );
}
