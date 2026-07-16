interface MatchSlotRowProps {
  competitorAName: string;
  competitorBName: string;
}

export function MatchSlotRow({ competitorAName, competitorBName }: MatchSlotRowProps) {
  return (
    <div className="text-sm">
      {competitorAName} vs {competitorBName}
    </div>
  );
}
