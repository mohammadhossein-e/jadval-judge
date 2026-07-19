'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useBracketGeneration } from '@/hooks/useBracketGeneration';
import { useMatchResolution } from '@/hooks/useMatchResolution';
import { useRandomDraw } from '@/hooks/useRandomDraw';
import type { CompetitorInput } from '@/lib/draw';
import { BracketView } from './BracketView';

const DEMO_COMPETITORS: readonly CompetitorInput[] = [
  { id: '1', name: 'Tanaka Kenji', club: 'Tokyo Karate Center', seed: 1 },
  { id: '2', name: 'Suzuki Yuki', club: 'Osaka Dojo', seed: 2 },
  { id: '3', name: 'Yamamoto Takeshi', club: 'Kyoto Karate Club', seed: 3 },
  { id: '4', name: 'Sato Hiroshi', club: 'Nagoya Martial Arts', seed: 4 },
  { id: '5', name: 'Watanabe Akiko', club: 'Yokohama Karate', seed: 5 },
  { id: '6', name: 'Kimura Ryo', club: 'Fukuoka Dojo', seed: 6 },
  { id: '7', name: 'Kobayashi Yui', club: 'Sapporo Karate Club', seed: 7 },
];

interface BracketContainerProps {
  tournamentId: string;
  categoryId: string;
}

export function BracketContainer({ tournamentId, categoryId }: BracketContainerProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const { executeDraw } = useRandomDraw();
  const {
    bracket: generatedBracket,
    isGenerated,
    generate,
    reset: resetGeneration,
  } = useBracketGeneration(DEMO_COMPETITORS, 'random');

  const {
    bracket: activeBracket,
    champion,
    resolveWinner,
    undoMatch,
    canResolveMatch,
    canUndoMatch,
  } = useMatchResolution(generatedBracket);

  const bracket = activeBracket ?? generatedBracket;

  const handleMatchClick = useCallback(
    (matchId: string) => {
      if (canResolveMatch(matchId)) {
        setSelectedMatchId(matchId);
      }
    },
    [canResolveMatch],
  );

  const handleResolveWinner = useCallback(
    (matchId: string, winnerId: string) => {
      resolveWinner(matchId, winnerId);
      setSelectedMatchId(null);
    },
    [resolveWinner],
  );

  const handleUndo = useCallback(
    (matchId: string) => {
      undoMatch(matchId);
    },
    [undoMatch],
  );

  const handleGenerate = useCallback(() => {
    executeDraw(DEMO_COMPETITORS);
    generate();
  }, [executeDraw, generate]);

  const handleReset = useCallback(() => {
    resetGeneration();
    setSelectedMatchId(null);
  }, [resetGeneration]);

  const rounds = bracket
    ? Array.from(new Set(bracket.matches.map((m) => m.round))).sort((a, b) => a - b)
    : [];

  const getRoundName = (round: number, totalRounds: number): string => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinals';
    if (round === totalRounds - 2) return 'Quarterfinals';
    return `Round ${round}`;
  };

  const roundNames: Record<number, string> = {};
  if (bracket) {
    for (const round of rounds) {
      roundNames[round] = getRoundName(round, bracket.totalRounds);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bracket</h1>
          <p className="text-muted-foreground">Male Kata Under 12 - Single Elimination</p>
        </div>
        <div className="flex gap-2">
          {!isGenerated && (
            <Button onClick={handleGenerate} disabled={isGenerated}>
              Generate Bracket
            </Button>
          )}
          {isGenerated && (
            <>
              <Link
                href={`/tournaments/${tournamentId}/categories/${categoryId}/public`}
                target="_blank"
              >
                <Button variant="outline">View Public</Button>
              </Link>
              <Button variant="destructive" onClick={handleReset}>
                Reset Bracket
              </Button>
            </>
          )}
        </div>
      </div>

      {isGenerated && bracket && (
        <BracketView
          bracket={bracket}
          rounds={rounds}
          roundNames={roundNames}
          selectedMatchId={selectedMatchId}
          champion={champion}
          canResolveMatch={canResolveMatch}
          canUndoMatch={canUndoMatch}
          onSelectWinner={handleMatchClick}
          onUndo={handleUndo}
          onResolveWinner={handleResolveWinner}
          onCancelSelection={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
}
