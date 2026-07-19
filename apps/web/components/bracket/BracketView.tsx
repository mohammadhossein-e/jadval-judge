import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BracketRound } from './BracketRound';
import { ChampionBanner } from './ChampionBanner';
import type { EngineBracket, EngineCompetitor, EngineMatch } from '@jadval/bracket-engine';

interface BracketViewProps {
  bracket: EngineBracket;
  rounds: number[];
  roundNames: Record<number, string>;
  selectedMatchId: string | null;
  champion: EngineCompetitor | null;
  canResolveMatch: (matchId: string) => boolean;
  canUndoMatch: (matchId: string) => boolean;
  onSelectWinner: (matchId: string) => void;
  onUndo: (matchId: string) => void;
  onResolveWinner: (matchId: string, winnerId: string) => void;
  onCancelSelection: () => void;
}

export function BracketView({
  bracket,
  rounds,
  roundNames,
  selectedMatchId,
  champion,
  canResolveMatch,
  canUndoMatch,
  onSelectWinner,
  onUndo,
  onResolveWinner,
  onCancelSelection,
}: BracketViewProps) {
  const selectedMatch = selectedMatchId
    ? bracket.matches.find((m: EngineMatch) => m.id === selectedMatchId)
    : null;

  return (
    <>
      {rounds.map((round) => {
        const roundMatches = bracket.matches.filter((m: EngineMatch) => m.round === round);
        const roundName = roundNames[round];

        return (
          <div key={round}>
            <BracketRound
              roundName={roundName}
              matches={roundMatches}
              selectedMatchId={selectedMatchId}
              canResolveMatch={canResolveMatch}
              canUndoMatch={canUndoMatch}
              onSelectWinner={onSelectWinner}
              onUndo={onUndo}
            />

            {round < rounds[rounds.length - 1] && <Separator className="my-4" />}
          </div>
        );
      })}

      {champion && <ChampionBanner name={champion.name} />}

      {selectedMatch && selectedMatch.competitorA && selectedMatch.competitorB && (
        <Card className="fixed bottom-4 right-4 w-80 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm">Select Winner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={() => onResolveWinner(selectedMatch.id, selectedMatch.competitorA!.id)}
            >
              {selectedMatch.competitorA.name}
            </Button>
            <Button
              className="w-full"
              onClick={() => onResolveWinner(selectedMatch.id, selectedMatch.competitorB!.id)}
            >
              {selectedMatch.competitorB.name}
            </Button>
            <Button variant="outline" className="w-full" onClick={onCancelSelection}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
