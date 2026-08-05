import { nextPowerOf2 } from '../utils';
import { generateByePriority } from './bye-priority';

export interface ByeDistribution {
  readonly bracketSize: number;
  readonly competitorCount: number;
  readonly byeCount: number;
  readonly byePositions: readonly number[];
}

/**
 * Generate the BYE priority positions for a bracket of the given size.
 *
 * Delegates to {@link generateByePriority} — the single source of truth
 * for BYE ordering. This function adds only the edge-case guards
 * (bracketSize < 2) and the readonly wrap.
 */
export function generateByePriorityPositions(bracketSize: number): readonly number[] {
  if (bracketSize < 2) return [];
  return generateByePriority(bracketSize);
}

export function calculateByeDistribution(competitorCount: number): ByeDistribution {
  if (competitorCount <= 0) {
    return { bracketSize: 0, competitorCount: 0, byeCount: 0, byePositions: [] };
  }

  const bracketSize = Math.max(2, nextPowerOf2(competitorCount));
  const byeCount = bracketSize - competitorCount;

  if (byeCount === 0) {
    return { bracketSize, competitorCount, byeCount, byePositions: [] };
  }

  const priority = generateByePriorityPositions(bracketSize);

  const maxByes = priority.length;
  const effectiveByeCount = Math.min(byeCount, maxByes);

  const byePositions: number[] = [];
  const matchHasBye = new Set<number>();

  for (let i = 0; i < priority.length && byePositions.length < effectiveByeCount; i++) {
    const pos = priority[i];
    const matchIdx = Math.floor(pos / 2);
    if (!matchHasBye.has(matchIdx)) {
      matchHasBye.add(matchIdx);
      byePositions.push(pos);
    }
  }

  return { bracketSize, competitorCount, byeCount: byePositions.length, byePositions };
}
