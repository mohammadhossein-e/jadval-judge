'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRandomDraw } from '@/hooks/useRandomDraw';
import type { CompetitorInput, DrawEntry } from '@/lib/draw';
import { Shuffle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export interface DrawStatus {
  hasDraw: boolean;
  drawResult: DrawEntry[] | null;
}

interface RandomDrawCardProps {
  competitors: readonly CompetitorInput[];
  onDrawStatusChange?: (status: DrawStatus) => void;
}

export function RandomDrawCard({ competitors, onDrawStatusChange }: RandomDrawCardProps) {
  const { drawResult, hasDraw, executeDraw } = useRandomDraw();
  const [showRedrawConfirm, setShowRedrawConfirm] = useState(false);

  useEffect(() => {
    onDrawStatusChange?.({ hasDraw, drawResult: drawResult ?? null });
  }, [hasDraw, drawResult, onDrawStatusChange]);

  const handleExecuteDraw = useCallback(() => {
    executeDraw(competitors);
    toast.success('Random draw completed');
  }, [competitors, executeDraw]);

  const handleDrawClick = useCallback(() => {
    if (hasDraw) {
      setShowRedrawConfirm(true);
    } else {
      handleExecuteDraw();
    }
  }, [hasDraw, handleExecuteDraw]);

  const handleConfirmRedraw = useCallback(() => {
    setShowRedrawConfirm(false);
    handleExecuteDraw();
  }, [handleExecuteDraw]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Random Draw</CardTitle>
          <CardDescription>
            Shuffle competitors into a random bracket order using Fisher-Yates algorithm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasDraw && drawResult && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Draw Order</p>
              <div className="space-y-1.5">
                {drawResult.map((entry) => (
                  <div
                    key={entry.competitorId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary" className="shrink-0">
                        {entry.position}
                      </Badge>
                      <span className="truncate text-sm font-medium">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{entry.club}</span>
                      {entry.seed != null && (
                        <Badge variant="outline" className="text-xs">
                          Seed {entry.seed}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="button"
            variant={hasDraw ? 'outline' : 'default'}
            className="w-full"
            disabled={competitors.length < 2}
            onClick={handleDrawClick}
          >
            {hasDraw ? (
              <>
                <RotateCcw className="size-4" />
                Re-draw
              </>
            ) : (
              <>
                <Shuffle className="size-4" />
                Random Draw
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showRedrawConfirm}
        onOpenChange={setShowRedrawConfirm}
        title="Replace existing draw?"
        description="A draw has already been performed. Re-drawing will replace the current draw order. This cannot be undone."
        confirmText="Re-draw"
        onConfirm={handleConfirmRedraw}
      />
    </>
  );
}
