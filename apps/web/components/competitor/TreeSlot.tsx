import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TreeSlotProps {
  competitor: { id: string; name: string; seed: number | null } | null;
  isWinner: boolean;
  isBye: boolean;
}

export function TreeSlot({ competitor, isWinner, isBye }: TreeSlotProps) {
  const isEmpty = !competitor && !isBye;
  const isByeSlot = isBye && !competitor;
  const displayName = isByeSlot ? 'BYE' : competitor?.name ?? 'TBD';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-1.5 rounded px-2 py-1 text-sm transition-colors duration-150',
        isWinner && 'bg-emerald-500/10 font-semibold',
        isByeSlot && 'bg-muted/30 text-muted-foreground italic',
        !isWinner && !isByeSlot && competitor && 'bg-muted/50',
        isEmpty && 'bg-muted/20 text-muted-foreground',
      )}
      title={competitor?.name}
    >
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {isWinner && (
          <Check className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
        )}
        <span className="truncate text-[13px] leading-tight">
          {displayName}
        </span>
      </div>
      {competitor?.seed != null && (
        <Badge variant="outline" className="shrink-0 text-[10px] h-4 px-1">
          {competitor.seed}
        </Badge>
      )}
    </div>
  );
}
