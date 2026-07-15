import type {
  EngineCompetitor,
  EngineMatch,
  EngineBracket,
  DrawType,
  GenerationResult,
} from '../types';
import { calculateBracketInfo } from './byes';
import { placeCompetitors } from './seeding';

export function generateBracket(
  competitors: readonly EngineCompetitor[],
  drawType: DrawType = 'random',
  manualPlacements?: Map<number, string>,
): GenerationResult {
  if (competitors.length < 2) {
    throw new Error('At least 2 competitors are required to generate a bracket');
  }
  if (competitors.length > 128) {
    throw new Error('Maximum 128 competitors allowed');
  }

  const { bracketSize, totalRounds: rounds, byeCount } = calculateBracketInfo(competitors.length);
  const positions = placeCompetitors(competitors, bracketSize, drawType, manualPlacements);
  const matches = buildMatches(positions, bracketSize, rounds);
  autoResolveByes(matches);

  const bracket: EngineBracket = { size: bracketSize, totalRounds: rounds, matches };
  const byes = collectByeInfo(matches);

  return { bracket, byes };
}

export function isBracketComplete(bracket: EngineBracket): boolean {
  return bracket.matches.every((m) => m.winner !== null);
}

export function getChampion(bracket: EngineBracket): EngineCompetitor | null {
  const final = bracket.matches.find(
    (m) => m.round === bracket.totalRounds && m.position === 0,
  );
  return final?.winner ?? null;
}

function buildMatches(
  positions: readonly (EngineCompetitor | null)[],
  bracketSize: number,
  rounds: number,
): EngineMatch[] {
  const matches: EngineMatch[] = [];
  const round1Count = bracketSize / 2;

  for (let p = 0; p < round1Count; p++) {
    const posA = p * 2;
    const posB = p * 2 + 1;
    const compA = positions[posA] ?? null;
    const compB = positions[posB] ?? null;
    const isBye = (compA === null) !== (compB === null);

    matches.push({
      id: `R1P${p}`,
      round: 1,
      position: p,
      competitorA: compA,
      competitorB: compB,
      winner: null,
      isBye,
      nextMatchId: rounds > 1 ? `R2P${Math.floor(p / 2)}` : null,
      nextSlot: rounds > 1 ? (p % 2 === 0 ? 'A' : 'B') : null,
    });
  }

  for (let r = 2; r <= rounds; r++) {
    const count = bracketSize / Math.pow(2, r);
    for (let p = 0; p < count; p++) {
      matches.push({
        id: `R${r}P${p}`,
        round: r,
        position: p,
        competitorA: null,
        competitorB: null,
        winner: null,
        isBye: false,
        nextMatchId: r < rounds ? `R${r + 1}P${Math.floor(p / 2)}` : null,
        nextSlot: r < rounds ? (p % 2 === 0 ? 'A' : 'B') : null,
      });
    }
  }

  return matches;
}

function autoResolveByes(matches: EngineMatch[]): void {
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

function collectByeInfo(matches: readonly EngineMatch[]): { competitorId: string; position: number }[] {
  const byes: { competitorId: string; position: number }[] = [];
  for (const match of matches) {
    if (match.round !== 1 || !match.isBye || !match.winner) continue;
    byes.push({ competitorId: match.winner.id, position: match.position * 2 });
  }
  return byes;
}
