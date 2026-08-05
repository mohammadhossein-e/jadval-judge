import { Trophy } from 'lucide-react';
import type { EngineCompetitor } from '@jadval/bracket-engine';

interface ChampionBannerProps {
  champion: EngineCompetitor | null;
  isComplete: boolean;
}

export function ChampionBanner({ champion, isComplete }: ChampionBannerProps) {
  if (!isComplete || !champion) return null;

  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 via-yellow-500/10 to-yellow-500/5 p-4">
      <Trophy className="size-7 text-yellow-500 shrink-0" />
      <div className="text-center min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Champion</p>
        <p className="text-lg font-bold truncate">{champion.name}</p>
      </div>
      <Trophy className="size-7 text-yellow-500 shrink-0" />
    </div>
  );
}
