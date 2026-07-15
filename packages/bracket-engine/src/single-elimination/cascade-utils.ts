import type { EngineMatch, EngineCompetitor } from '../types';

export function cascadeForward(
  matches: EngineMatch[],
  startMatchId: string,
  oldWinner: EngineCompetitor,
): void {
  const matchMap = new Map(matches.map((m) => [m.id, m]));
  let currentId: string | null = startMatchId;

  while (currentId) {
    const current = matchMap.get(currentId);
    if (!current?.nextMatchId) break;

    const next = matchMap.get(current.nextMatchId);
    if (!next) break;

    if (next.competitorA?.id === oldWinner.id) {
      next.competitorA = null;
    } else if (next.competitorB?.id === oldWinner.id) {
      next.competitorB = null;
    }

    if (next.winner?.id === oldWinner.id) {
      next.winner = null;
      currentId = next.id;
    } else {
      break;
    }
  }
}
