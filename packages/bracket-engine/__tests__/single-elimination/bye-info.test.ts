import { describe, it, expect } from 'vitest';
import { generateBracket } from '../../src/single-elimination/generator';
import { collectByeInfo } from '../../src/single-elimination/bye-info';
import { buildGenerationContext } from '../../src/engine/generation-context';
import { buildSingleEliminationSkeleton } from '../../src/single-elimination/single-elimination-skeleton';
import { buildSingleEliminationPositionMap } from '../../src/single-elimination/single-elimination-position-map';
import type { EngineCompetitor } from '../../src/types';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

function positionMapFor(competitorCount: number) {
  const skeleton = buildSingleEliminationSkeleton(
    buildGenerationContext(makeCompetitors(competitorCount)),
  );
  return buildSingleEliminationPositionMap(skeleton);
}

describe('collectByeInfo', () => {
  it('reports the BYE slot position, not the opponent slot', () => {
    const competitors = makeCompetitors(9);
    const { bracket, byes } = generateBracket(competitors, 'manual');

    const collected = collectByeInfo(bracket.matches, positionMapFor(9));
    const positions = collected.map((b) => b.position).sort((a, b) => a - b);

    expect(positions).toEqual([0, 3, 7, 8, 11, 12, 15]);
    expect(collected.map((b) => b.competitorId).sort()).toEqual(
      byes.map((b) => b.competitorId).sort(),
    );
  });

  it('handles BYEs in slot B correctly', () => {
    const competitors = makeCompetitors(9);
    const { bracket } = generateBracket(competitors, 'manual');
    const collected = collectByeInfo(bracket.matches, positionMapFor(9));
    const byPos = new Map(collected.map((b) => [b.position, b.competitorId]));

    const slotBPositions = [3, 7, 11, 15];
    for (const pos of slotBPositions) {
      expect(byPos.has(pos)).toBe(true);
    }
  });

  it('collects one BYE per bracket slot for each competitor count', () => {
    for (const count of [3, 5, 9, 13, 17]) {
      const competitors = makeCompetitors(count);
      const { bracket } = generateBracket(competitors, 'manual');
      const collected = collectByeInfo(bracket.matches, positionMapFor(count));

      const positionMap = positionMapFor(count);
      const expectedCount = positionMap.length - competitors.length;

      expect(collected).toHaveLength(expectedCount);
      const uniquePositions = new Set(collected.map((b) => b.position));
      expect(uniquePositions.size).toBe(collected.length);
    }
  });

  it('collects no BYEs when every slot is filled', () => {
    const competitors = makeCompetitors(8);
    const { bracket } = generateBracket(competitors, 'manual');
    expect(collectByeInfo(bracket.matches, positionMapFor(8))).toEqual([]);
  });
});
