import type { GenerationContext } from '../engine/generation-context';
import type { BracketSkeleton, SkeletonMatch } from '../engine/bracket-skeleton';

/**
 * Build an empty single-elimination bracket tree from a {@link GenerationContext}.
 *
 * The returned skeleton contains:
 * - Correct number of rounds (`log2(bracketSize)`)
 * - Correct number of matches (`bracketSize − 1`)
 * - Deterministic match IDs (`R{round}P{position}`)
 * - Parent/child links (`nextMatchId` + `nextSlot`)
 * - Empty participant slots (no competitors, no BYEs, no winners)
 *
 * This is pure structure — no competitor placement, no BYE assignment.
 */
export function buildSingleEliminationSkeleton(
  context: GenerationContext,
): BracketSkeleton {
  const matches: SkeletonMatch[] = [];
  const { bracketSize, roundCount } = context;

  const round1Count = bracketSize / 2;

  for (let p = 0; p < round1Count; p++) {
    matches.push({
      id: `R1P${p}`,
      round: 1,
      position: p,
      nextMatchId: roundCount > 1 ? `R2P${Math.floor(p / 2)}` : null,
      nextSlot: roundCount > 1 ? (p % 2 === 0 ? 'A' : 'B') : null,
    });
  }

  for (let r = 2; r <= roundCount; r++) {
    const count = bracketSize / Math.pow(2, r);
    for (let p = 0; p < count; p++) {
      matches.push({
        id: `R${r}P${p}`,
        round: r,
        position: p,
        nextMatchId: r < roundCount ? `R${r + 1}P${Math.floor(p / 2)}` : null,
        nextSlot: r < roundCount ? (p % 2 === 0 ? 'A' : 'B') : null,
      });
    }
  }

  return {
    size: bracketSize,
    totalRounds: roundCount,
    matches,
  };
}
