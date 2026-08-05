import type { EngineCompetitor } from '../types';
import type {
  CompetitorPlacementStrategy,
  PlacementInput,
} from '../engine/competitor-placement-strategy';
import { standardSeeding } from './seeding';
import { shuffleArray } from '../utils';

/**
 * Standard competitor placement derived from {@link standardSeeding}.
 *
 * Produces the same placement as the legacy engine:
 *
 * - **Manual draws** — treats the supplied placements map as a draw
 *   order and places competitors into the non-BYE positions, never
 *   occupying an official BYE slot.
 * - **Seeded draws** — places seeded competitors at non-BYE positions
 *   in seeding order, then fills remaining slots with unseeded
 *   competitors.
 * - **Random draws** — shuffles the competitor list first, then applies
 *   the seeded logic with virtual seeds.
 *
 * This preserves full backward compatibility.
 */
export class DefaultCompetitorPlacementStrategy
  implements CompetitorPlacementStrategy
{
  placeCompetitors(input: PlacementInput): readonly (EngineCompetitor | null)[] {
    const {
      competitors,
      generationContext,
      byePositions,
      drawType,
      manualPlacements,
    } = input;

    if (manualPlacements && manualPlacements.size > 0) {
      return placeSuppliedCompetitors(
        competitors,
        generationContext.bracketSize,
        byePositions,
        manualPlacements,
      );
    }

    const seeding = standardSeeding(generationContext.bracketSize);

    let ordered: readonly EngineCompetitor[];
    if (drawType === 'random') {
      ordered = shuffleArray(competitors);
    } else {
      ordered = competitors;
    }

    const seedMap = new Map<number, EngineCompetitor>();
    const unseeded: EngineCompetitor[] = [];
    for (const c of ordered) {
      if (
        c.seed !== null &&
        c.seed >= 1 &&
        c.seed <= generationContext.bracketSize &&
        !seedMap.has(c.seed)
      ) {
        seedMap.set(c.seed, c);
      } else {
        unseeded.push(c);
      }
    }

    const positions: (EngineCompetitor | null)[] = new Array(
      generationContext.bracketSize,
    ).fill(null);

    const nonByePositions: number[] = [];
    for (let pos = 0; pos < generationContext.bracketSize; pos++) {
      if (!byePositions.has(pos)) {
        nonByePositions.push(pos);
      }
    }

    let placeIdx = 0;
    for (const seed of seeding) {
      if (placeIdx >= nonByePositions.length) break;
      const competitor = seedMap.get(seed);
      if (competitor) {
        positions[nonByePositions[placeIdx]] = competitor;
        placeIdx++;
      }
    }

    for (let i = placeIdx; i < nonByePositions.length && unseeded.length > 0; i++) {
      positions[nonByePositions[i]] = unseeded.shift()!;
    }

    return positions;
  }
}

/**
 * Place competitors from a supplied placements map while respecting the
 * official BYE positions.
 *
 * The supplied map is treated as a draw ORDER, not a literal slot
 * assignment: BYE slots are reserved, and the competitors are placed
 * into the remaining non-BYE positions in the order their positions
 * appear in the map (ascending). Any competitor missing from the map
 * fills leftover non-BYE slots afterward.
 */
function placeSuppliedCompetitors(
  competitors: readonly EngineCompetitor[],
  bracketSize: number,
  byePositions: ReadonlySet<number>,
  manualPlacements: ReadonlyMap<number, string>,
): (EngineCompetitor | null)[] {
  const positions: (EngineCompetitor | null)[] = new Array(bracketSize).fill(null);
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));

  const nonByePositions: number[] = [];
  for (let pos = 0; pos < bracketSize; pos++) {
    if (!byePositions.has(pos)) {
      nonByePositions.push(pos);
    }
  }

  const orderedEntries = [...manualPlacements.entries()]
    .filter(([pos]) => pos >= 0 && pos < bracketSize)
    .sort((a, b) => a[0] - b[0]);

  const placedIds = new Set<string>();
  let placeIdx = 0;
  for (const [, competitorId] of orderedEntries) {
    const competitor = competitorMap.get(competitorId);
    if (!competitor || placedIds.has(competitor.id)) continue;
    if (placeIdx >= nonByePositions.length) break;
    positions[nonByePositions[placeIdx]] = competitor;
    placedIds.add(competitor.id);
    placeIdx++;
  }

  const unplaced = competitors.filter((c) => !placedIds.has(c.id));
  for (let i = placeIdx; i < nonByePositions.length && unplaced.length > 0; i++) {
    positions[nonByePositions[i]] = unplaced.shift()!;
  }

  return positions;
}
