import type { EngineBracket } from '../types';
import { cloneMatches } from '../utils';
import { cascadeForward } from './cascade-utils';

export function cascadeUndo(bracket: EngineBracket, matchId: string): EngineBracket {
  const matches = cloneMatches(bracket.matches);

  const match = matches.find((m) => m.id === matchId);
  if (!match?.winner) return { ...bracket, matches };

  const oldWinner = match.winner;
  match.winner = null;

  cascadeForward(matches, matchId, oldWinner);

  return { ...bracket, matches };
}
