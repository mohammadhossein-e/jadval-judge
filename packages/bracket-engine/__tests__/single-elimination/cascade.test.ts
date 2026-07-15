import { describe, it, expect } from 'vitest';
import { cascadeUndo } from '../../src/single-elimination/cascade';
import { generateBracket } from '../../src/single-elimination/generator';
import { resolveMatch } from '../../src/single-elimination/advancement';
import type { EngineCompetitor } from '../../src/types';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

describe('cascadeUndo', () => {
  it('clears winner from the specified match', () => {
    let { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    bracket = resolveMatch(bracket, match.id, match.competitorA!.id);
    const undone = cascadeUndo(bracket, match.id);
    const undoneMatch = undone.matches.find((m) => m.id === match.id);
    expect(undoneMatch?.winner).toBeNull();
  });

  it('removes old winner from subsequent matches', () => {
    let { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    bracket = resolveMatch(bracket, match.id, match.competitorA!.id);
    const next = bracket.matches.find((m) => m.id === match.nextMatchId)!;
    expect(next.competitorA?.id).toBe(match.competitorA!.id);

    const undone = cascadeUndo(bracket, match.id);
    const undoneNext = undone.matches.find((m) => m.id === match.nextMatchId);
    expect(undoneNext?.competitorA).toBeNull();
  });

  it('cascades through multiple rounds', () => {
    let { bracket } = generateBracket(makeCompetitors(4));
    const m1 = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    bracket = resolveMatch(bracket, m1.id, m1.competitorA!.id);
    const m2 = bracket.matches.find((m) => m.round === 1 && m.position === 1)!;
    bracket = resolveMatch(bracket, m2.id, m2.competitorA!.id);
    const final = bracket.matches.find((m) => m.round === 2)!;
    bracket = resolveMatch(bracket, final.id, final.competitorA!.id);

    const undone = cascadeUndo(bracket, m1.id);
    const undoneFinal = undone.matches.find((m) => m.round === 2);
    expect(undoneFinal?.winner).toBeNull();
    expect(undoneFinal?.competitorA).toBeNull();
  });

  it('returns bracket unchanged if match has no winner', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;
    const undone = cascadeUndo(bracket, match.id);
    expect(undone).toStrictEqual(bracket);
  });

  it('returns bracket unchanged for non-existent match', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const undone = cascadeUndo(bracket, 'nonexistent');
    expect(undone).toStrictEqual(bracket);
  });

  it('does not mutate original bracket', () => {
    let { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    bracket = resolveMatch(bracket, match.id, match.competitorA!.id);
    const originalMatches = bracket.matches.map((m) => ({ ...m }));
    cascadeUndo(bracket, match.id);
    expect(bracket.matches).toEqual(originalMatches);
  });

  it('preserves other match results during cascade', () => {
    let { bracket } = generateBracket(makeCompetitors(4));
    const m1 = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    const m2 = bracket.matches.find((m) => m.round === 1 && m.position === 1)!;
    bracket = resolveMatch(bracket, m1.id, m1.competitorA!.id);
    bracket = resolveMatch(bracket, m2.id, m2.competitorA!.id);

    const undone = cascadeUndo(bracket, m1.id);
    const undoneM2 = undone.matches.find((m) => m.id === m2.id);
    expect(undoneM2?.winner?.id).toBe(m2.competitorA!.id);
  });
});
