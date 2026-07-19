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
    <div className="flex flex-col gap-2">
      <div className="rounded-md bg-muted/50 px-3 py-1.5 text-center">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {roundName}
        </h3>
      </div>
      <div className="flex flex-col gap-3">
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
    </div>
  );
}
