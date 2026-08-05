import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import type { EngineMatch } from '@jadval/bracket-engine';
import { TreeSlot } from './TreeSlot';

interface TreeMatchProps {
  match: EngineMatch;
  isSelected: boolean;
  isResolvable: boolean;
  isUndoable: boolean;
  isFinal: boolean;
  onSelect: () => void;
  onUndo: (e: React.MouseEvent) => void;
}

export function TreeMatch({
  match,
  isSelected,
  isResolvable,
  isUndoable,
  isFinal,
  onSelect,
  onUndo,
}: TreeMatchProps) {
  const isBye = match.isBye;
  const isWinnerA = match.winner?.id === match.competitorA?.id;
  const isWinnerB = match.winner?.id === match.competitorB?.id;

  return (
    <div
      className={cn(
        'tree-match group/match rounded-lg border p-2 transition-all duration-150',
        'flex flex-col justify-between',
        isSelected
          ? 'border-emerald-500/50 bg-emerald-500/5 shadow-sm'
          : isResolvable
            ? 'border-border bg-card cursor-pointer hover:border-primary/50 hover:shadow-sm'
            : 'border-border bg-card',
        isBye && 'border-dashed border-muted-foreground/30 bg-muted/20',
        isFinal && !isBye && 'border-foreground/20 ring-1 ring-foreground/5',
      )}
      style={{ width: 'var(--bracket-match-width, 200px)', height: 'var(--bracket-match-height, 80px)' }}
      onClick={isResolvable ? onSelect : undefined}
      role={isResolvable ? 'button' : undefined}
      aria-label={
        isBye
          ? `BYE match, Round ${match.round}`
          : `Match ${match.position + 1}, Round ${match.round}${match.winner ? `, won by ${match.winner.name}` : ', unresolved'}`
      }
      tabIndex={isResolvable ? 0 : undefined}
      onKeyDown={
        isResolvable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'text-xs font-medium',
            isBye ? 'text-muted-foreground' : 'text-muted-foreground',
          )}
        >
          {isBye ? 'BYE' : `Match ${match.position + 1}`}
        </span>
        {isUndoable && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover/match:opacity-100 transition-opacity duration-150"
            onClick={onUndo}
            aria-label="Undo result"
            title="Undo result"
          >
            <RotateCcw className="size-3" />
          </Button>
        )}
      </div>
      <div className="space-y-1">
        <TreeSlot
          competitor={match.competitorA}
          isWinner={isWinnerA}
          isBye={isBye && !!match.competitorA}
        />
        <TreeSlot
          competitor={match.competitorB}
          isWinner={isWinnerB}
          isBye={isBye && !!match.competitorB}
        />
      </div>
    </div>
  );
}
