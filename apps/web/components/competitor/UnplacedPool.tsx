'use client';

import { Badge } from '@/components/ui/badge';
import type { CompetitorInput } from '@/lib/draw';
import { GripVertical } from 'lucide-react';

interface UnplacedPoolProps {
  unplacedCompetitors: CompetitorInput[];
  unplacedCount: number;
  showPool: boolean;
  onDragStart: (
    e: React.DragEvent,
    competitorId: string,
    source: 'pool' | 'slot',
    sourcePosition?: number,
  ) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function UnplacedPool({
  unplacedCompetitors,
  unplacedCount,
  showPool,
  onDragStart,
  onDragEnd,
  onDrop,
}: UnplacedPoolProps) {
  if (!showPool) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Unplaced ({unplacedCount})
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={onDrop}
        className="flex flex-wrap gap-2 rounded-lg border border-dashed border-muted-foreground/25 p-3 min-h-[48px]"
      >
        {unplacedCompetitors.map((competitor) => (
          <div
            key={competitor.id}
            draggable
            onDragStart={(e) =>
              onDragStart(e, competitor.id, 'pool')
            }
            onDragEnd={onDragEnd}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="size-3 text-muted-foreground" />
            <span className="font-medium">{competitor.name}</span>
            {competitor.seed != null && (
              <Badge variant="outline" className="text-xs">
                {competitor.seed}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
