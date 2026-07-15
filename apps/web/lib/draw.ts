import { shuffleArray } from '@jadval/bracket-engine';

export interface CompetitorInput {
  id: string;
  name: string;
  club: string;
  seed: number | null;
}

export interface DrawEntry {
  position: number;
  competitorId: string;
  name: string;
  club: string;
  seed: number | null;
}

export function performDraw(competitors: readonly CompetitorInput[]): DrawEntry[] {
  const shuffled = shuffleArray(competitors);
  return shuffled.map((c, i) => ({
    position: i + 1,
    competitorId: c.id,
    name: c.name,
    club: c.club,
    seed: c.seed,
  }));
}

export type ManualSlots = (DrawEntry | null)[];

export function createEmptySlots(count: number): ManualSlots {
  return Array.from({ length: count }, () => null);
}

export function getUnplacedCompetitors(
  competitors: readonly CompetitorInput[],
  slots: ManualSlots,
): CompetitorInput[] {
  const placedIds = new Set(
    slots.filter((s): s is DrawEntry => s !== null).map((s) => s.competitorId),
  );
  return competitors.filter((c) => !placedIds.has(c.id));
}

export function validateManualPlacement(
  competitors: readonly CompetitorInput[],
  slots: ManualSlots,
): { isComplete: boolean; placedCount: number; unplacedCount: number } {
  const placedCount = slots.filter((s): s is DrawEntry => s !== null).length;
  const unplacedCount = competitors.length - placedCount;
  return {
    isComplete: unplacedCount === 0 && competitors.length > 0,
    placedCount,
    unplacedCount,
  };
}

export function drawEntriesToPlacements(entries: DrawEntry[]): Map<number, string> {
  const placements = new Map<number, string>();
  for (const entry of entries) {
    placements.set(entry.position - 1, entry.competitorId);
  }
  return placements;
}

export function manualSlotsToPlacements(slots: ManualSlots): Map<number, string> {
  const placements = new Map<number, string>();
  slots.forEach((slot, index) => {
    if (slot) {
      placements.set(index, slot.competitorId);
    }
  });
  return placements;
}
