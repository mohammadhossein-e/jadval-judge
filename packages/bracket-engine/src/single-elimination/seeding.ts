import type { EngineCompetitor, DrawType } from '../types';
import { shuffleArray } from '../utils';

export function standardSeeding(bracketSize: number): number[] {
  if (bracketSize < 2) return [];
  if (bracketSize === 2) return [1, 2];
  const half = standardSeeding(bracketSize / 2);
  const result: number[] = [];
  for (let i = 0; i < half.length; i++) {
    result.push(half[i]);
    result.push(bracketSize + 1 - half[i]);
  }
  return result;
}

export function placeCompetitors(
  competitors: readonly EngineCompetitor[],
  bracketSize: number,
  drawType: DrawType,
  manualPlacements?: Map<number, string>,
): (EngineCompetitor | null)[] {
  if (manualPlacements && manualPlacements.size > 0) {
    return manualPlacement(competitors, manualPlacements, bracketSize);
  }
  if (drawType === 'random') {
    return randomPlacement(competitors, bracketSize);
  }
  return seededPlacement(competitors, bracketSize);
}

function seededPlacement(
  competitors: readonly EngineCompetitor[],
  bracketSize: number,
): (EngineCompetitor | null)[] {
  const seeding = standardSeeding(bracketSize);
  const seedMap = new Map<number, EngineCompetitor>();
  const claimedSeeds = new Set<number>();
  const unseeded: EngineCompetitor[] = [];

  for (const c of competitors) {
    if (c.seed !== null && c.seed >= 1 && c.seed <= bracketSize && !claimedSeeds.has(c.seed)) {
      seedMap.set(c.seed, c);
      claimedSeeds.add(c.seed);
    } else {
      unseeded.push(c);
    }
  }

  const positions: (EngineCompetitor | null)[] = new Array(bracketSize).fill(null);
  for (let pos = 0; pos < bracketSize; pos++) {
    const competitor = seedMap.get(seeding[pos]);
    if (competitor) {
      positions[pos] = competitor;
    }
  }

  let idx = 0;
  for (let pos = 0; pos < bracketSize; pos++) {
    if (positions[pos] === null && idx < unseeded.length) {
      positions[pos] = unseeded[idx++];
    }
  }

  return positions;
}

function randomPlacement(
  competitors: readonly EngineCompetitor[],
  bracketSize: number,
): (EngineCompetitor | null)[] {
  const shuffled = shuffleArray(competitors);
  const virtualSeeded = shuffled.map((c, i) => ({ ...c, seed: i + 1 }));
  return seededPlacement(virtualSeeded, bracketSize);
}

function manualPlacement(
  competitors: readonly EngineCompetitor[],
  placements: Map<number, string>,
  bracketSize: number,
): (EngineCompetitor | null)[] {
  const positions: (EngineCompetitor | null)[] = new Array(bracketSize).fill(null);
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));
  const placedIds = new Set<string>();

  for (const [position, competitorId] of placements) {
    if (position < 0 || position >= bracketSize) continue;
    const competitor = competitorMap.get(competitorId);
    if (competitor) {
      positions[position] = competitor;
      placedIds.add(competitorId);
    }
  }

  const unplaced = competitors.filter((c) => !placedIds.has(c.id));
  let idx = 0;
  for (let pos = 0; pos < bracketSize; pos++) {
    if (positions[pos] === null && idx < unplaced.length) {
      positions[pos] = unplaced[idx++];
    }
  }

  return positions;
}
