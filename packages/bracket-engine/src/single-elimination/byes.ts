import type { BracketPreview } from '../types';
import { nextPowerOf2, logBase2 } from '../utils';
import { standardSeeding } from './seeding';

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
  seeds: readonly (number | null)[],
): BracketPreview {
  const { bracketSize, totalRounds: rounds, byeCount } = calculateBracketInfo(competitorCount);

  if (byeCount === 0) {
    return { competitorCount, bracketSize, byeCount, totalRounds: rounds, seededByes: [] };
  }

  const existingSeeds = new Set(
    seeds.filter((s): s is number => s !== null && s >= 1 && s <= bracketSize),
  );

  const seeding = standardSeeding(bracketSize);
  const seededByes: number[] = [];

  for (let i = 0; i < bracketSize; i += 2) {
    const seedA = seeding[i];
    const seedB = seeding[i + 1];
    const aExists = existingSeeds.has(seedA);
    const bExists = existingSeeds.has(seedB);

    if (aExists && !bExists) seededByes.push(seedA);
    else if (!aExists && bExists) seededByes.push(seedB);
  }

  seededByes.sort((a, b) => a - b);

  return {
    competitorCount,
    bracketSize,
    byeCount,
    totalRounds: rounds,
    seededByes,
  };
}
