import { describe, it, expect } from 'vitest';
import { resolveMatch } from '../../src/single-elimination/advancement';
import { generateBracket } from '../../src/single-elimination/generator';
import type { EngineCompetitor } from '../../src/types';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

describe('resolveMatch', () => {
  it('advances winner to next match slot A', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    const winnerId = match.competitorA!.id;
    const updated = resolveMatch(bracket, match.id, winnerId);
    const next = updated.matches.find((m) => m.id === match.nextMatchId);
    expect(next?.competitorA?.id).toBe(winnerId);
  });

  it('advances winner to next match slot B', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 1)!;
    const winnerId = match.competitorA!.id;
    const updated = resolveMatch(bracket, match.id, winnerId);
    const next = updated.matches.find((m) => m.id === match.nextMatchId);
    expect(next?.competitorB?.id).toBe(winnerId);
  });

  it('sets winner on the match', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    const winnerId = match.competitorA!.id;
    const updated = resolveMatch(bracket, match.id, winnerId);
    const resolved = updated.matches.find((m) => m.id === match.id);
    expect(resolved?.winner?.id).toBe(winnerId);
  });

  it('throws for non-existent match', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    expect(() => resolveMatch(bracket, 'nonexistent', 'c1')).toThrow('Match not found');
  });

  it('throws for invalid winner', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;
    expect(() => resolveMatch(bracket, match.id, 'invalid')).toThrow('Winner must be one');
  });

  it('throws for BYE match (missing competitors)', () => {
    const { bracket } = generateBracket(makeCompetitors(3));
    const byeMatch = bracket.matches.find((m) => m.isBye)!;
    expect(() => resolveMatch(bracket, byeMatch.id, byeMatch.winner!.id)).toThrow('missing competitors');
  });

  it('throws for match with missing competitors', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 2)!;
    expect(() => resolveMatch(bracket, match.id, 'c1')).toThrow('missing competitors');
  });

  it('returns same bracket if same winner is set again', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    const winnerId = match.competitorA!.id;
    const updated = resolveMatch(bracket, match.id, winnerId);
    const same = resolveMatch(updated, match.id, winnerId);
    expect(same).toBe(updated);
  });

  it('cascades when changing winner of already resolved match', () => {
    let { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    bracket = resolveMatch(bracket, match.id, match.competitorA!.id);
    const next = bracket.matches.find((m) => m.id === match.nextMatchId)!;

    bracket = resolveMatch(bracket, match.id, match.competitorB!.id);
    const updatedNext = bracket.matches.find((m) => m.id === match.nextMatchId);
    expect(updatedNext?.competitorA?.id).toBe(match.competitorB!.id);
  });

  it('does not mutate original bracket', () => {
    const { bracket } = generateBracket(makeCompetitors(4));
    const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
    const originalMatches = [...bracket.matches];
    resolveMatch(bracket, match.id, match.competitorA!.id);
    expect(bracket.matches).toEqual(originalMatches);
  });
});
