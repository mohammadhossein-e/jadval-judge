import type { BracketPreview } from '../types';
import { nextPowerOf2, logBase2 } from '../utils';
import { calculateByeDistribution } from './bye-distribution';

export function calculateBracketInfo(competitorCount: number): {
  bracketSize: number;
  totalRounds: number;
  byeCount: number;
} {
  const bracketSize = nextPowerOf2(competitorCount);
  return {
    bracketSize,
    totalRounds: logBase2(bracketSize),
    byeCount: bracketSize - competitorCount,
  };
}

export function getBracketPreview(
  competitorCount: number,
  _seeds: readonly (number | null)[],
): BracketPreview {
  if (competitorCount < 2) {
    return { competitorCount, bracketSize: 0, byeCount: 0, totalRounds: 0, seededByes: [] };
  }

  const { bracketSize, totalRounds: rounds } = calculateBracketInfo(competitorCount);
  const { byeCount, byePositions } = calculateByeDistribution(competitorCount);

  return {
    competitorCount,
    bracketSize,
    byeCount,
    totalRounds: rounds,
    seededByes: [...byePositions],
  };
}
