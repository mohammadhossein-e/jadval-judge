'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BracketPreview } from '@jadval/bracket-engine';
import { getRoundLabel } from '@/lib/bracket-labels';
import { Zap } from 'lucide-react';

interface BracketPreviewCardProps {
  preview: BracketPreview;
  drawType: 'random' | 'manual';
  onGenerate: () => void;
}

export function BracketPreviewCard({ preview, drawType, onGenerate }: BracketPreviewCardProps) {
  const { competitorCount, bracketSize, byeCount, totalRounds, seededByes } = preview;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bracket Preview</CardTitle>
        <CardDescription>
          {drawType === 'random' ? 'Random' : 'Manual'} draw will generate the following bracket.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Competitors</p>
            <p className="text-2xl font-bold">{competitorCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Bracket Size</p>
            <p className="text-2xl font-bold">{bracketSize}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">BYEs</p>
            <p className="text-2xl font-bold">{byeCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Rounds</p>
            <p className="text-2xl font-bold">{totalRounds}</p>
          </div>
        </div>

        {seededByes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Seeded competitors receiving BYEs:
            </p>
            <div className="flex flex-wrap gap-2">
              {seededByes.map((seed) => (
                <Badge key={seed} variant="secondary">
                  Seed {seed}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Round structure:</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
              const matchCount = bracketSize / Math.pow(2, round);
              return (
                <Badge key={round} variant="outline">
                  {getRoundLabel(round, totalRounds)}: {matchCount} match{matchCount !== 1 ? 'es' : ''}
                </Badge>
              );
            })}
          </div>
        </div>

        <Button type="button" className="w-full" onClick={onGenerate}>
          <Zap className="size-4" />
          Generate Bracket
        </Button>
      </CardContent>
    </Card>
  );
}
