import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchCard } from './MatchCard';
import type { EngineMatch } from '@jadval/bracket-engine';

interface BracketRoundProps {
  roundName: string;
  matches: EngineMatch[];
  selectedMatchId: string | null;
  canResolveMatch: (matchId: string) => boolean;
  canUndoMatch: (matchId: string) => boolean;
  onSelectWinner: (matchId: string) => void;
  onUndo: (matchId: string) => void;
}

export function BracketRound({
  roundName,
  matches,
  selectedMatchId,
  canResolveMatch,
  canUndoMatch,
  onSelectWinner,
  onUndo,
}: BracketRoundProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{roundName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`grid gap-4 ${
            matches.length <= 2
              ? 'grid-cols-2'
              : matches.length <= 4
                ? 'grid-cols-4'
                : 'grid-cols-2'
          }`}
        >
          {matches.map((match) => {
            const competitorAName = match.competitorA?.name ?? 'TBD';
            const competitorBName = match.competitorB?.name ?? 'BYE';
            const hasWinner = match.winner !== null;
            const isSelected = selectedMatchId === match.id;
            const canResolve = canResolveMatch(match.id);

            return (
              <MatchCard
                key={match.id}
                position={match.position}
                isBye={match.isBye}
                isSelected={isSelected}
                competitorAName={competitorAName}
                competitorBName={competitorBName}
                hasWinner={hasWinner}
                winnerName={match.winner?.name ?? null}
                canResolve={canResolve}
                canUndo={canUndoMatch(match.id)}
                onSelectWinner={() => onSelectWinner(match.id)}
                onUndo={() => onUndo(match.id)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
