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
  return (
    <div
      className={`space-y-2 rounded border p-3 ${
        isBye ? 'opacity-75' : ''
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="font-medium">Match {position + 1}</div>
      <MatchSlotRow competitorAName={competitorAName} competitorBName={competitorBName} />
      {isBye && (
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
          Auto-advance
        </span>
      )}
      {hasWinner && (
        <div className="text-sm font-medium text-green-600">Winner: {winnerName}</div>
      )}
      {canResolve && !hasWinner && (
        <Button size="sm" className="w-full" onClick={onSelectWinner}>
          Select Winner
        </Button>
      )}
      {canUndo && (
        <Button size="sm" variant="outline" className="w-full" onClick={onUndo}>
          Undo
        </Button>
      )}
    </div>
  );
}
