import type { EngineCompetitor, DrawType } from '../types';
import { shuffleArray } from '../utils';
import { computeSeedClaims } from './seed-placement';
import { calculateByeDistribution } from './bye-distribution';

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
  const claims = computeSeedClaims(competitors, bracketSize);
  const byeSet = new Set(
    calculateByeDistribution(competitors.length).byePositions,
  );
  const positions: (EngineCompetitor | null)[] = new Array(bracketSize).fill(null);
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));
  const placedIds = new Set<string>();
  const occupied = new Set<number>();

  for (const claim of claims) {
    const competitor = claim.competitorId !== null ? competitorMap.get(claim.competitorId) : undefined;
    if (!competitor) continue;
    if (occupied.has(claim.position)) continue;
    if (placedIds.has(competitor.id)) continue;
    positions[claim.position] = competitor;
    placedIds.add(competitor.id);
    occupied.add(claim.position);
  }

  const unseeded = competitors.filter((c) => !placedIds.has(c.id));
  let idx = 0;
  for (let pos = 0; pos < bracketSize; pos++) {
    if (byeSet.has(pos)) continue;
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
