'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EngineBracket, EngineMatch } from '@jadval/bracket-engine';
import { BracketTree } from './BracketTree';

interface BracketViewProps {
  bracket: EngineBracket;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string | null) => void;
  onResolveWinner: (matchId: string, winnerId: string) => void;
  onUndoMatch: (matchId: string) => void;
  canResolveMatch: (matchId: string) => boolean;
  canUndoMatch: (matchId: string) => boolean;
}

function WinnerSelectionDialog({
  match,
  isOpen,
  onClose,
  onSelectWinner,
}: {
  match: EngineMatch | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectWinner: (winnerId: string) => void;
}) {
  if (!match) return null;

  const currentWinnerId = match.winner?.id ?? null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Winner</DialogTitle>
          <DialogDescription>
            Match {match.position + 1} — Round {match.round}
            {currentWinnerId && ' (changing result)'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {match.competitorA && (
            <Button
              variant={currentWinnerId === match.competitorA.id ? 'default' : 'outline'}
              className="w-full justify-between"
              onClick={() => onSelectWinner(match.competitorA!.id)}
            >
              <span>{match.competitorA.name}</span>
              {match.competitorA.seed != null && (
                <Badge variant="outline">Seed {match.competitorA.seed}</Badge>
              )}
            </Button>
          )}
          {match.competitorB && (
            <Button
              variant={currentWinnerId === match.competitorB.id ? 'default' : 'outline'}
              className="w-full justify-between"
              onClick={() => onSelectWinner(match.competitorB!.id)}
            >
              <span>{match.competitorB.name}</span>
              {match.competitorB.seed != null && (
                <Badge variant="outline">Seed {match.competitorB.seed}</Badge>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BracketView({
  bracket,
  selectedMatchId,
  onSelectMatch,
  onResolveWinner,
  onUndoMatch,
  canResolveMatch,
  canUndoMatch,
}: BracketViewProps) {
  const matchMap = useMemo(
    () => new Map<string, EngineMatch>(bracket.matches.map((m) => [m.id, m])),
    [bracket.matches],
  );

  const selectedMatch = selectedMatchId ? matchMap.get(selectedMatchId) ?? null : null;

  const handleSelectWinner = (winnerId: string) => {
    if (selectedMatchId) {
      onResolveWinner(selectedMatchId, winnerId);
      onSelectMatch(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bracket</CardTitle>
      </CardHeader>
      <CardContent>
        <BracketTree
          bracket={bracket}
          selectedMatchId={selectedMatchId}
          onSelectMatch={onSelectMatch}
          onResolveWinner={onResolveWinner}
          onUndoMatch={onUndoMatch}
          canResolveMatch={canResolveMatch}
          canUndoMatch={canUndoMatch}
        />
      </CardContent>

      <WinnerSelectionDialog
        match={selectedMatch}
        isOpen={selectedMatchId !== null && selectedMatch !== null}
        onClose={() => onSelectMatch(null)}
        onSelectWinner={handleSelectWinner}
      />
    </Card>
  );
}
