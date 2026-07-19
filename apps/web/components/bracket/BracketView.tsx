import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <div className="inline-flex items-start gap-3 p-4">
          {rounds.map((round) => {
            const roundMatches = bracket.matches.filter((m: EngineMatch) => m.round === round);
            const roundName = roundNames[round];

            return (
              <div key={round} className="flex shrink-0 items-start gap-3">
                <BracketRound
                  roundName={roundName}
                  matches={roundMatches}
                  selectedMatchId={selectedMatchId}
                  canResolveMatch={canResolveMatch}
                  canUndoMatch={canUndoMatch}
                  onSelectWinner={onSelectWinner}
                  onUndo={onUndo}
                />

                {round < rounds[rounds.length - 1] && (
                  <div className="flex h-12 items-center text-muted-foreground/40">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {champion && (
        <div className="mt-2">
          <ChampionBanner name={champion.name} />
        </div>
      )}

      {selectedMatch && selectedMatch.competitorA && selectedMatch.competitorB && (
        <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-xl ring-1 ring-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Select Winner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start"
              onClick={() => onResolveWinner(selectedMatch.id, selectedMatch.competitorA!.id)}
            >
              {selectedMatch.competitorA.name}
            </Button>
            <Button
              className="w-full justify-start"
              onClick={() => onResolveWinner(selectedMatch.id, selectedMatch.competitorB!.id)}
            >
              {selectedMatch.competitorB.name}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onCancelSelection}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
