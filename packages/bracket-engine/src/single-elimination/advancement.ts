import type { EngineBracket } from '../types';
import { cloneMatches } from '../utils';
import { cascadeForward } from './cascade-utils';

export function resolveMatch(
  bracket: EngineBracket,
  matchId: string,
  winnerId: string,
): EngineBracket {
  const matches = cloneMatches(bracket.matches);
  const match = matches.find((m) => m.id === matchId);
  if (!match) throw new Error(`Match not found: ${matchId}`);
  if (!match.competitorA || !match.competitorB) {
    throw new Error('Cannot resolve match with missing competitors');
  }
  if (match.isBye) {
    throw new Error('Cannot resolve BYE match directly');
  }

  const winner =
    match.competitorA.id === winnerId
      ? match.competitorA
      : match.competitorB.id === winnerId
        ? match.competitorB
        : null;
  if (!winner) throw new Error('Winner must be one of the match competitors');

  const oldWinner = match.winner;
  if (oldWinner?.id === winnerId) {
    return bracket;
  }

  if (oldWinner) {
    cascadeForward(matches, matchId, oldWinner);
  }

  match.winner = winner;

  if (match.nextMatchId && match.nextSlot) {
    const matchMap = new Map(matches.map((m) => [m.id, m]));
    const next = matchMap.get(match.nextMatchId);
    if (next) {
      if (match.nextSlot === 'A') {
        next.competitorA = winner;
      } else {
        next.competitorB = winner;
      }
    }
  }

  return { ...bracket, matches };
}
