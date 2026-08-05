function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface CompetitorInput {
  id: string;
  name: string;
  club: string;
  seed: number | null;
}

export interface DrawEntry {
  position: number;
  competitorId: string;
}

export interface ResolvedSlot {
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
  }));
}

export type ManualSlots = (DrawEntry | null)[];
export type ResolvedSlots = (ResolvedSlot | null)[];

export function createEmptySlots(count: number): ManualSlots {
  return Array.from({ length: count }, () => null);
}

export function resolveSlots(
  slots: ManualSlots,
  competitorMap: Map<string, CompetitorInput>,
): ResolvedSlots {
  return slots.map((slot) => {
    if (slot === null) return null;
    const c = competitorMap.get(slot.competitorId);
    if (!c) return null;
    return {
      position: slot.position,
      competitorId: slot.competitorId,
      name: c.name,
      club: c.club,
      seed: c.seed,
    };
  });
}

export function resolveDrawEntries(
  entries: DrawEntry[],
  competitorMap: Map<string, CompetitorInput>,
): ResolvedSlot[] {
  return entries
    .map((entry) => {
      const c = competitorMap.get(entry.competitorId);
      if (!c) return null;
      return {
        position: entry.position,
        competitorId: entry.competitorId,
        name: c.name,
        club: c.club,
        seed: c.seed,
      };
    })
    .filter((e): e is ResolvedSlot => e !== null);
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

export function syncSlots(
  competitors: readonly CompetitorInput[],
  currentSlots: ManualSlots,
): ManualSlots {
  const validIds = new Set(competitors.map((c) => c.id));

  const cleaned: ManualSlots = [];
  for (const slot of currentSlots) {
    if (slot === null || validIds.has(slot.competitorId)) {
      cleaned.push(slot);
    }
  }

  while (cleaned.length < competitors.length) {
    cleaned.push(null);
  }

  while (cleaned.length > competitors.length) {
    const lastNull = cleaned.lastIndexOf(null);
    if (lastNull !== -1) {
      cleaned.splice(lastNull, 1);
    } else {
      cleaned.length = competitors.length;
    }
  }

  return cleaned.map((slot, i) => (slot ? { ...slot, position: i } : null));
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
