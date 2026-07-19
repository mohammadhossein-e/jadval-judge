import { Button } from '@/components/ui/button';
import { MatchSlotRow } from './MatchSlotRow';

interface MatchCardProps {
  position: number;
  isBye: boolean;
  isSelected: boolean;
  competitorAName: string;
  competitorBName: string;
  hasWinner: boolean;
  winnerName: string | null;
  canResolve: boolean;
  canUndo: boolean;
  onSelectWinner: () => void;
  onUndo: () => void;
}

function getStatusClasses({
  isBye,
  isSelected,
  hasWinner,
  canResolve,
}: {
  isBye: boolean;
  isSelected: boolean;
  hasWinner: boolean;
  canResolve: boolean;
}): string {
  if (isSelected) return 'ring-2 ring-primary border-primary/50 bg-primary/5';
  if (hasWinner) return 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30';
  if (canResolve) return 'border-dashed border-primary/40 hover:border-primary/70 hover:shadow-md';
  if (isBye) return 'border-muted bg-muted/30 opacity-60';
  return 'border-border';
}

export function MatchCard({
  position,
  isBye,
  isSelected,
  competitorAName,
  competitorBName,
  hasWinner,
  winnerName,
  canResolve,
  canUndo,
  onSelectWinner,
  onUndo,
}: MatchCardProps) {
  const statusClasses = getStatusClasses({ isBye, isSelected, hasWinner, canResolve });

  return (
    <div
      className={`w-52 rounded-lg border p-3 transition-shadow ${statusClasses}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Match {position + 1}
        </span>
        {isBye && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Bye
          </span>
        )}
        {hasWinner && !isBye && (
          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-green-700 dark:bg-green-900/50 dark:text-green-400">
            Decided
          </span>
        )}
      </div>

      <MatchSlotRow
        competitorAName={competitorAName}
        competitorBName={competitorBName}
        hasWinner={hasWinner}
        winnerName={winnerName}
      />

      <div className="mt-2.5 space-y-1.5">
        {canResolve && !hasWinner && (
          <Button size="sm" className="w-full" onClick={onSelectWinner}>
            Select Winner
          </Button>
        )}
        {canUndo && (
          <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={onUndo}>
            Undo
          </Button>
        )}
      </div>
    </div>
  );
}
