import type { EngineMatch } from '../types';

/**
 * Resolve every BYE match in the bracket.
 *
 * For each match flagged `isBye`, the sole competitor is declared the
 * winner and advanced to the correct slot in the next round.
 *
 * Mutates `matches` in place — callers should pass a fresh array if
 * immutability is required.
 */
export function autoResolveByes(matches: EngineMatch[]): void {
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  for (const match of matches) {
    if (!match.isBye) continue;

    const winner = match.competitorA ?? match.competitorB;
    if (!winner || !match.nextMatchId) continue;

    match.winner = winner;
    const next = matchMap.get(match.nextMatchId);
    if (next && match.nextSlot) {
      if (match.nextSlot === 'A') {
        next.competitorA = winner;
      } else {
        next.competitorB = winner;
      }
    }
  }
}
