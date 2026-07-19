interface MatchSlotRowProps {
  competitorAName: string;
  competitorBName: string;
  hasWinner: boolean;
  winnerName: string | null;
}

export function MatchSlotRow({
  competitorAName,
  competitorBName,
  hasWinner,
  winnerName,
}: MatchSlotRowProps) {
  const isWinnerA = hasWinner && winnerName === competitorAName && winnerName !== 'BYE' && winnerName !== 'TBD';
  const isWinnerB = hasWinner && winnerName === competitorBName && winnerName !== 'BYE' && winnerName !== 'TBD';

  return (
    <div className="space-y-1.5">
      <div
        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
          isWinnerA
            ? 'bg-green-100 font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300'
            : hasWinner && !isWinnerA
              ? 'text-muted-foreground line-through opacity-60'
              : 'text-foreground'
        }`}
      >
        <span className="truncate">{competitorAName}</span>
        {isWinnerA && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div
        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
          isWinnerB
            ? 'bg-green-100 font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300'
            : hasWinner && !isWinnerB
              ? 'text-muted-foreground line-through opacity-60'
              : 'text-foreground'
        }`}
      >
        <span className="truncate">{competitorBName}</span>
        {isWinnerB && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </div>
  );
}
