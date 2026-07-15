'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw, Crown } from 'lucide-react';
import type { EngineBracket, EngineCompetitor } from '@jadval/bracket-engine';
import { BracketView } from '@/components/competitor/BracketView';

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
      {isComplete && champion && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <Crown className="size-8 text-yellow-500" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Champion</p>
            <p className="text-xl font-bold">{champion.name}</p>
          </div>
          <Crown className="size-8 text-yellow-500" />
        </div>
      )}
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
