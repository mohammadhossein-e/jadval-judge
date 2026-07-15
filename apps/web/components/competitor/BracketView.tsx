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
import { getRoundLabel } from '@/lib/bracket-labels';
import { Trophy, RotateCcw } from 'lucide-react';

interface BracketViewProps {
  bracket: EngineBracket;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string | null) => void;
  onResolveWinner: (matchId: string, winnerId: string) => void;
  onUndoMatch: (matchId: string) => void;
  canResolveMatch: (matchId: string) => boolean;
  canUndoMatch: (matchId: string) => boolean;
}

function MatchCard({
  match,
  isSelected,
  isResolvable,
  isUndoable,
  onSelect,
  onUndo,
}: {
  match: EngineMatch;
  isSelected: boolean;
  isResolvable: boolean;
  isUndoable: boolean;
  onSelect: () => void;
  onUndo: (e: React.MouseEvent) => void;
}) {
  const isBye = match.isBye;

  return (
    <div
      className={`rounded-lg border p-2 min-w-[180px] transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : isResolvable
            ? 'border-border bg-card cursor-pointer hover:border-primary/50'
            : 'border-border bg-card'
      }`}
      onClick={isResolvable ? onSelect : undefined}
      role={isResolvable ? 'button' : undefined}
      aria-label={
        isBye
          ? `BYE match`
          : `Match ${match.position + 1}, Round ${match.round}${match.winner ? `, won by ${match.winner.name}` : ', unresolved'}`
      }
      tabIndex={isResolvable ? 0 : undefined}
      onKeyDown={
        isResolvable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs text-muted-foreground">
          {isBye ? 'BYE' : `Match ${match.position + 1}`}
        </span>
        <div className="flex items-center gap-1">
          {match.winner && (
            <Trophy className="size-3 text-yellow-500" />
          )}
          {isUndoable && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              onClick={onUndo}
              aria-label="Undo result"
              title="Undo result"
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <MatchSlotRow
          competitor={match.competitorA}
          isWinner={match.winner?.id === match.competitorA?.id}
        />
        <MatchSlotRow
          competitor={match.competitorB}
          isWinner={match.winner?.id === match.competitorB?.id}
        />
      </div>
    </div>
  );
}

function MatchSlotRow({
  competitor,
  isWinner,
}: {
  competitor: { id: string; name: string; seed: number | null } | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded px-2 py-1 text-sm ${
        isWinner
          ? 'bg-primary/10 font-semibold'
          : competitor
            ? 'bg-muted/50'
            : 'bg-muted/20 text-muted-foreground'
      }`}
    >
      <span className="truncate">
        {competitor?.name ?? 'TBD'}
      </span>
      {competitor?.seed != null && (
        <Badge variant="outline" className="shrink-0 text-xs">
          {competitor.seed}
        </Badge>
      )}
    </div>
  );
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

  const rounds = useMemo(
    () => Array.from({ length: bracket.totalRounds }, (_, i) => i + 1),
    [bracket.totalRounds],
  );

  const roundGroups = useMemo(() => {
    const groups = new Map<number, EngineMatch[]>();
    for (const match of bracket.matches) {
      const group = groups.get(match.round);
      if (group) {
        group.push(match);
      } else {
        groups.set(match.round, [match]);
      }
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.position - b.position);
    }
    return groups;
  }, [bracket.matches]);

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
        <div className="flex gap-6 overflow-x-auto pb-4">
          {rounds.map((round) => {
            const roundMatches = roundGroups.get(round) ?? [];

            return (
              <div key={round} className="flex flex-col gap-3 min-w-fit">
                <h3 className="text-sm font-semibold text-muted-foreground text-center">
                  {getRoundLabel(round, bracket.totalRounds)}
                </h3>
                <div
                  className="flex flex-col gap-3"
                  style={{
                    justifyContent: 'space-around',
                    minHeight: round === 1 ? 'auto' : `${roundMatches.length * 120}px`,
                  }}
                >
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isSelected={match.id === selectedMatchId}
                      isResolvable={canResolveMatch(match.id)}
                      isUndoable={canUndoMatch(match.id)}
                      onSelect={() => onSelectMatch(match.id)}
                      onUndo={(e) => {
                        e.stopPropagation();
                        onUndoMatch(match.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
