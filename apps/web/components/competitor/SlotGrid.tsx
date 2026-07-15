'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ManualSlots } from '@/lib/draw';
import { GripVertical, X } from 'lucide-react';

interface SlotGridProps {
  slots: ManualSlots;
  dragOverSlot: number | null;
  isDragging: boolean;
  onDragStart: (
    e: React.DragEvent,
    competitorId: string,
    source: 'pool' | 'slot',
    sourcePosition?: number,
  ) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, position: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, position: number) => void;
  onRemove: (position: number) => void;
}

export function SlotGrid({
  slots,
  dragOverSlot,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onRemove,
}: SlotGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {slots.map((slot, position) => (
        <div
          key={position}
          draggable={slot !== null}
          onDragStart={(e) =>
            slot && onDragStart(e, slot.competitorId, 'slot', position)
          }
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragEnter={(e) => onDragEnter(e, position)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, position)}
          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors ${
            dragOverSlot === position
              ? 'border-primary bg-primary/5'
              : slot
                ? 'border-border bg-card'
                : 'border-dashed border-muted-foreground/25 bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="secondary" className="shrink-0">
              {position + 1}
            </Badge>
            {slot ? (
              <span className="truncate text-sm font-medium">{slot.name}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Empty</span>
            )}
          </div>
          <div
            className={`flex items-center gap-1 shrink-0 ${isDragging ? 'pointer-events-none' : ''}`}
          >
            {slot && (
              <>
                {slot.seed != null && (
                  <Badge variant="outline" className="text-xs">
                    Seed {slot.seed}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{slot.club}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemove(position)}
                >
                  <X />
                  <span className="sr-only">Remove from slot</span>
                </Button>
              </>
            )}
            {slot && (
              <GripVertical className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
