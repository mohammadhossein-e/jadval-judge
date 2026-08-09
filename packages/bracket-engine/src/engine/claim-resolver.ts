import type { EngineCompetitor } from '../types';
import type { PlacementClaim, PlacementRule, PlacementRuleInput } from './placement-claim';

/**
 * Resolve a set of placement claims into a final placement array.
 *
 * Rules are applied in ascending priority order (lower = higher
 * priority). For each rule's claims, the first winning claim for a
 * position and for a competitor wins; later conflicting claims are
 * silently skipped. BYE reservations (competitorId `null`) occupy a
 * position without assigning a competitor, so the fill step never
 * touches them. After all rules, the remaining competitors in
 * `fillOrder` are placed into the first free position.
 *
 * The result always has exactly `competitorCount` occupied slots and
 * `bracketSize - competitorCount` empty slots, provided the input is
 * valid (unique ids, distinct competitor claims).
 */
export function resolvePlacementClaims(
  input: PlacementRuleInput,
  rules: readonly PlacementRule[],
  fillOrder: readonly EngineCompetitor[],
): readonly (EngineCompetitor | null)[] {
  const { competitors, generationContext, byePositions } = input;
  const bracketSize = generationContext.bracketSize;

  const positions: (EngineCompetitor | null)[] = new Array(bracketSize).fill(null);
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));
  const claimedCompetitors = new Set<string>();
  const claimedPositions = new Set<number>();
  const acceptedClaims: PlacementClaim[] = [];

  const baseInput: PlacementRuleInput = {
    competitors,
    generationContext,
    positionMap: input.positionMap,
    byePositions,
    claimed: acceptedClaims,
  };

  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    const ruleClaims = rule.claim(baseInput);

    for (const claim of ruleClaims) {
      const { position, competitorId } = claim;

      if (position < 0 || position >= bracketSize) continue;
      if (claimedPositions.has(position)) continue;

      if (competitorId === null) {
        claimedPositions.add(position);
        acceptedClaims.push(claim);
        continue;
      }

      if (claimedCompetitors.has(competitorId)) continue;
      const competitor = competitorMap.get(competitorId);
      if (!competitor) continue;

      positions[position] = competitor;
      claimedCompetitors.add(competitorId);
      claimedPositions.add(position);
      acceptedClaims.push(claim);
    }
  }

  for (const competitor of fillOrder) {
    if (claimedCompetitors.has(competitor.id)) continue;
    for (let pos = 0; pos < bracketSize; pos++) {
      if (!claimedPositions.has(pos)) {
        positions[pos] = competitor;
        claimedCompetitors.add(competitor.id);
        claimedPositions.add(pos);
        break;
      }
    }
  }

  return positions;
}
