'use client';

import { useState, useMemo } from 'react';
import { generateBracket, generateByePriority } from '@jadval/bracket-engine';
import type { EngineBracket, EngineCompetitor, GenerationResult } from '@jadval/bracket-engine';
import { BracketTree } from '@/components/competitor/BracketTree';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const QUICK_COUNTS = [1, 2, 3, 5, 8, 13, 16, 32, 64, 128];

function createCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: i + 1,
  }));
}

function generateForOneCompetitor(): GenerationResult {
  const c: EngineCompetitor = { id: 'c1', name: 'Competitor 1', seed: 1 };
  return {
    bracket: {
      size: 2,
      totalRounds: 1,
      matches: [
        {
          id: 'R1P0',
          round: 1,
          position: 0,
          competitorA: null,
          competitorB: c,
          winner: c,
          isBye: true,
          nextMatchId: null,
          nextSlot: null,
        },
      ],
    },
    byes: [{ competitorId: 'c1', position: 0 }],
  };
}

interface PositionInfo {
  position: number;
  competitor: EngineCompetitor | null;
  isBye: boolean;
}

function getPositionMap(bracket: EngineBracket): PositionInfo[] {
  const round1 = bracket.matches.filter((m) => m.round === 1);
  const positions: PositionInfo[] = [];

  for (const match of round1) {
    const posA = match.position * 2;
    const posB = match.position * 2 + 1;

    if (match.isBye) {
      if (!match.competitorA) {
        positions.push({ position: posA, competitor: null, isBye: true });
        positions.push({ position: posB, competitor: match.competitorB, isBye: false });
      } else {
        positions.push({ position: posA, competitor: match.competitorA, isBye: false });
        positions.push({ position: posB, competitor: null, isBye: true });
      }
    } else {
      positions.push({ position: posA, competitor: match.competitorA, isBye: false });
      positions.push({ position: posB, competitor: match.competitorB, isBye: false });
    }
  }

  return positions.sort((a, b) => a.position - b.position);
}

export default function BracketDebugPage() {
  const [competitorCount, setCompetitorCount] = useState(5);

  const result = useMemo(() => {
    if (competitorCount === 1) {
      return { ...generateForOneCompetitor(), error: null as string | null };
    }
    if (competitorCount > 256) {
      return { bracket: null as EngineBracket | null, byes: [] as GenerationResult['byes'], error: 'Engine supports max 256 competitors' };
    }
    try {
      const competitors = createCompetitors(competitorCount);
      const { bracket, byes } = generateBracket(competitors, 'random');
      return { bracket, byes, error: null as string | null };
    } catch (e) {
      return { bracket: null as EngineBracket | null, byes: [] as GenerationResult['byes'], error: (e as Error).message };
    }
  }, [competitorCount]);

  const { bracket, byes, error } = result;

  const byePriority = useMemo(() => {
    if (!bracket) return [];
    return generateByePriority(bracket.size);
  }, [bracket]);

  const positionMap = useMemo(() => {
    if (!bracket) return [];
    return getPositionMap(bracket);
  }, [bracket]);

  const byePositions = useMemo(() => {
    return positionMap
      .filter((p) => p.isBye)
      .map((p) => p.position);
  }, [positionMap]);

  const priorityMatches =
    byePriority.length > 0 &&
    byePositions.length > 0 &&
    JSON.stringify(byePriority.slice(0, byePositions.length).sort((a, b) => a - b)) ===
      JSON.stringify([...byePositions].sort((a, b) => a - b));

  return (
    <div className="space-y-6 max-w-full">
      <h1 className="text-2xl font-bold">Bracket Engine Debug</h1>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Count</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={256}
              value={competitorCount}
              onChange={(e) => setCompetitorCount(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-2xl font-mono font-bold w-16 text-right">
              {competitorCount}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setCompetitorCount(n)}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-colors',
                  competitorCount === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {bracket && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Competitors</div>
                <div className="text-2xl font-bold">{competitorCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Bracket Size</div>
                <div className="text-2xl font-bold">{bracket.size}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">BYE Count</div>
                <div className="text-2xl font-bold">{byes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Rounds</div>
                <div className="text-2xl font-bold">{bracket.totalRounds}</div>
              </CardContent>
            </Card>
          </div>

          {/* BYE Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                BYE Information
                {byePositions.length > 0 && (
                  <Badge variant={priorityMatches ? 'default' : 'destructive'}>
                    {priorityMatches ? 'Positions Match' : 'Positions Differ'}
                  </Badge>
                )}
                {byePositions.length === 0 && <Badge variant="outline">No BYEs</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  BYE Priority (bracket size {bracket.size})
                </div>
                <div className="font-mono text-sm bg-muted/50 rounded px-3 py-2">
                  [{byePriority.join(', ')}]
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Actual BYE Positions Placed
                </div>
                <div className="font-mono text-sm bg-muted/50 rounded px-3 py-2">
                  [{byePositions.join(', ')}]
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Priority array length: {byePriority.length} | BYEs placed:{' '}
                {byePositions.length}
              </div>
            </CardContent>
          </Card>

          {/* Position Map */}
          <Card>
            <CardHeader>
              <CardTitle>Position Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {positionMap.map(({ position, competitor, isBye }) => (
                  <div
                    key={position}
                    className={cn(
                      'flex flex-col items-center justify-center rounded border min-w-[44px] h-[44px] px-1',
                      isBye
                        ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
                    )}
                  >
                    <span className="text-[9px] leading-none text-muted-foreground">
                      {position}
                    </span>
                    <span className="text-[11px] font-semibold leading-tight">
                      {isBye ? 'BYE' : `C${competitor?.seed}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300 dark:bg-amber-900/30 dark:border-amber-700" />
                  BYE
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" />
                  Competitor
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bracket Tree */}
          <Card>
            <CardHeader>
              <CardTitle>Bracket Tree</CardTitle>
            </CardHeader>
            <CardContent>
              <BracketTree
                bracket={bracket}
                selectedMatchId={null}
                onSelectMatch={() => {}}
                onResolveWinner={() => {}}
                onUndoMatch={() => {}}
                canResolveMatch={() => false}
                canUndoMatch={() => false}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
