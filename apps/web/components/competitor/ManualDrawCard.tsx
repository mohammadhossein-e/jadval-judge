'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useManualDraw } from '@/hooks/useManualDraw';
import type { CompetitorInput, ManualSlots } from '@/lib/draw';
import { resolveSlots } from '@/lib/draw';
import { RotateCcw } from 'lucide-react';
import { SlotGrid } from './SlotGrid';
import { UnplacedPool } from './UnplacedPool';

export interface PlacementStatus {
  isComplete: boolean;
  placedCount: number;
  unplacedCount: number;
  slots: ManualSlots;
}

interface ManualDrawCardProps {
  competitors: readonly CompetitorInput[];
  onPlacementStatusChange?: (status: PlacementStatus) => void;
}

interface DragData {
  competitorId: string;
  source: 'pool' | 'slot';
  sourcePosition?: number;
}

export function ManualDrawCard({ competitors, onPlacementStatusChange }: ManualDrawCardProps) {
  const {
    slots,
    unplacedCompetitors,
    isComplete,
    placedCount,
    unplacedCount,
    placeCompetitor,
    removeCompetitor,
    swapCompetitors,
    clearAll,
  } = useManualDraw(competitors);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragDataRef = useRef<DragData | null>(null);

  const competitorMap = useMemo(
    () => new Map(competitors.map((c) => [c.id, c])),
    [competitors],
  );

  const resolvedSlots = useMemo(
    () => resolveSlots(slots, competitorMap),
    [slots, competitorMap],
  );

  useEffect(() => {
    onPlacementStatusChange?.({ isComplete, placedCount, unplacedCount, slots });
  }, [isComplete, placedCount, unplacedCount, slots, onPlacementStatusChange]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, competitorId: string, source: 'pool' | 'slot', sourcePosition?: number) => {
      dragDataRef.current = { competitorId, source, sourcePosition };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', competitorId);
      setIsDragging(true);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    dragDataRef.current = null;
    setDragOverSlot(null);
    setIsDragging(false);
  }, []);

  const handleSlotDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleSlotDragEnter = useCallback((e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDragOverSlot(position);
  }, []);

  const handleSlotDragLeave = useCallback(
    (e: React.DragEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related && e.currentTarget.contains(related)) return;
      setDragOverSlot(null);
    },
    [],
  );

  const handleSlotDrop = useCallback(
    (e: React.DragEvent, targetPosition: number) => {
      e.preventDefault();
      setDragOverSlot(null);

      const data = dragDataRef.current;
      if (!data) return;

      const targetSlot = slots[targetPosition];

      if (data.source === 'slot' && data.sourcePosition !== undefined) {
        if (data.sourcePosition === targetPosition) return;
        if (targetSlot) {
          swapCompetitors(data.sourcePosition, targetPosition);
        } else {
          placeCompetitor(data.competitorId, targetPosition);
          removeCompetitor(data.sourcePosition);
        }
      } else {
        if (targetSlot) {
          removeCompetitor(targetPosition);
        }
        placeCompetitor(data.competitorId, targetPosition);
      }

      dragDataRef.current = null;
    },
    [slots, placeCompetitor, removeCompetitor, swapCompetitors],
  );

  const handlePoolDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const data = dragDataRef.current;
      if (!data || data.source !== 'slot' || data.sourcePosition === undefined) return;

      removeCompetitor(data.sourcePosition);
      dragDataRef.current = null;
    },
    [removeCompetitor],
  );

  const handleClearClick = useCallback(() => {
    if (placedCount === 0) return;
    setShowClearConfirm(true);
  }, [placedCount]);

  const handleConfirmClear = useCallback(() => {
    setShowClearConfirm(false);
    clearAll();
  }, [clearAll]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manual Draw</CardTitle>
          <CardDescription>
            Drag competitors into bracket positions. {placedCount}/{competitors.length} placed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SlotGrid
            slots={resolvedSlots}
            dragOverSlot={dragOverSlot}
            isDragging={isDragging}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleSlotDragOver}
            onDragEnter={handleSlotDragEnter}
            onDragLeave={handleSlotDragLeave}
            onDrop={handleSlotDrop}
            onRemove={removeCompetitor}
          />

          <UnplacedPool
            unplacedCompetitors={unplacedCompetitors}
            unplacedCount={unplacedCount}
            showPool={unplacedCount > 0}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handlePoolDrop}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={placedCount === 0}
            onClick={handleClearClick}
          >
            <RotateCcw className="size-4" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear all placements?"
        description="All competitors will be moved back to the unplaced pool. This cannot be undone."
        confirmText="Clear"
        onConfirm={handleConfirmClear}
      />
    </>
  );
}
