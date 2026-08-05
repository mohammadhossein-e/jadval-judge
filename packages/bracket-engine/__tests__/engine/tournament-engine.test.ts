import { describe, it, expect } from 'vitest';
import { TournamentEngine } from '../../src/engine/tournament-engine';
import { SingleEliminationStrategy } from '../../src/single-elimination/single-elimination-strategy';
import { ValidationError } from '../../src/engine/validator';
import type { Validator, GenerateInput, ResolveInput } from '../../src/engine/validator';
import type {
  EngineCompetitor,
  EngineBracket,
  TournamentStrategy,
  GenerationResult,
  BracketPreview,
  GenerationContext,
  DrawType,
} from '../../src/types';
import { defaultGenerateValidators, defaultResolveValidators } from '../../src/engine/validators';

function makeCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: null,
  }));
}

function makeSeededCompetitors(count: number): EngineCompetitor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed: i + 1,
  }));
}

class MockStrategy implements TournamentStrategy {
  readonly format = 'mock';
  readonly name = 'Mock Strategy';

  generateCalls: { competitors: readonly EngineCompetitor[]; drawType: DrawType }[] = [];
  resolveCalls: { bracket: EngineBracket; matchId: string; winnerId: string }[] = [];

  generate(
    competitors: readonly EngineCompetitor[],
    drawType: DrawType,
    _manualPlacements?: Map<number, string>,
    _context?: GenerationContext,
  ): GenerationResult {
    this.generateCalls.push({ competitors, drawType });
    return {
      bracket: { size: 2, totalRounds: 1, matches: [] },
      byes: [],
    };
  }

  resolve(
    bracket: EngineBracket,
    matchId: string,
    winnerId: string,
  ): EngineBracket {
    this.resolveCalls.push({ bracket, matchId, winnerId });
    return { ...bracket, matches: [...bracket.matches] };
  }

  undo(bracket: EngineBracket, _matchId: string): EngineBracket {
    return bracket;
  }

  isComplete(_bracket: EngineBracket): boolean {
    return false;
  }

  getChampion(_bracket: EngineBracket): EngineCompetitor | null {
    return null;
  }

  getPreview(competitorCount: number): BracketPreview {
    return {
      competitorCount,
      bracketSize: 0,
      byeCount: 0,
      totalRounds: 0,
      seededByes: [],
    };
  }
}

class FailingGenerateValidator implements Validator<GenerateInput> {
  validate(_input: GenerateInput) {
    return { valid: false, errors: ['Custom generate validation failed'] };
  }
}

class FailingResolveValidator implements Validator<ResolveInput> {
  validate(_input: ResolveInput) {
    return { valid: false, errors: ['Custom resolve validation failed'] };
  }
}

class PassingValidator implements Validator<GenerateInput> {
  validate(_input: GenerateInput) {
    return { valid: true, errors: [] };
  }
}

class AlwaysFailValidator implements Validator<GenerateInput> {
  validate(_input: GenerateInput) {
    return { valid: false, errors: ['Always fails'] };
  }
}

// ─── Constructor & strategy management ──────────────────────────

describe('TournamentEngine', () => {
  describe('constructor and strategy management', () => {
    it('accepts a strategy and options', () => {
      const strategy = new SingleEliminationStrategy();
      const engine = new TournamentEngine(strategy);
      expect(engine.getStrategy()).toBe(strategy);
    });

    it('getStrategy returns the current strategy', () => {
      const strategy = new SingleEliminationStrategy();
      const engine = new TournamentEngine(strategy);
      expect(engine.getStrategy().format).toBe('single-elimination');
    });

    it('setStrategy switches the active strategy', () => {
      const strategy1 = new SingleEliminationStrategy();
      const strategy2 = new MockStrategy();
      const engine = new TournamentEngine(strategy1);
      engine.setStrategy(strategy2);
      expect(engine.getStrategy()).toBe(strategy2);
      expect(engine.getStrategy().format).toBe('mock');
    });

    it('works without options (backward compatible)', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      const result = engine.generate(makeCompetitors(4), 'random');
      expect(result.bracket.size).toBe(4);
    });
  });

  // ─── generate ───────────────────────────────────────────────

  describe('generate', () => {
    describe('successful generation', () => {
      it('generates a valid bracket for 2 competitors', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const result = engine.generate(makeCompetitors(2), 'random');
        expect(result.bracket.size).toBe(2);
        expect(result.bracket.totalRounds).toBe(1);
        expect(result.bracket.matches).toHaveLength(1);
        expect(result.byes).toHaveLength(0);
      });

      it('generates a valid bracket with BYEs', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const result = engine.generate(makeCompetitors(3), 'random');
        expect(result.bracket.size).toBe(4);
        expect(result.byes).toHaveLength(1);
      });

      it('generates a full bracket for power-of-2 competitors', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const result = engine.generate(makeCompetitors(8), 'random');
        expect(result.bracket.size).toBe(8);
        expect(result.bracket.totalRounds).toBe(3);
        expect(result.bracket.matches).toHaveLength(7);
        expect(result.byes).toHaveLength(0);
      });

      it('generates bracket with seeded competitors', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const result = engine.generate(makeSeededCompetitors(4), 'random');
        expect(result.bracket.size).toBe(4);
        const round1 = result.bracket.matches.filter((m) => m.round === 1);
        expect(round1).toHaveLength(2);
      });

      it('generates bracket with random draw', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const result = engine.generate(makeCompetitors(6), 'random');
        expect(result.bracket.size).toBe(8);
        expect(result.byes).toHaveLength(2);
      });

      it('generates bracket with manual placements', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const competitors = makeCompetitors(4);
        const placements = new Map<number, string>([
          [0, 'c3'],
          [1, 'c1'],
          [2, 'c4'],
          [3, 'c2'],
        ]);
        const result = engine.generate(competitors, 'manual', placements);
        const round1 = result.bracket.matches.filter((m) => m.round === 1);
        expect(round1[0].competitorA?.id).toBe('c3');
        expect(round1[0].competitorB?.id).toBe('c1');
      });
    });

    describe('validation failures', () => {
      it('throws ValidationError for empty array', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          generateValidators: defaultGenerateValidators(),
        });
        expect(() => engine.generate([], 'random')).toThrow(ValidationError);
      });

      it('throws ValidationError for single competitor', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          generateValidators: defaultGenerateValidators(),
        });
        expect(() => engine.generate([makeCompetitors(1)[0]], 'random')).toThrow(ValidationError);
      });

      it('throws ValidationError for more than 256 competitors', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          generateValidators: defaultGenerateValidators(),
        });
        expect(() => engine.generate(makeCompetitors(257), 'random')).toThrow(ValidationError);
      });

      it('throws ValidationError for duplicate IDs', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          generateValidators: defaultGenerateValidators(),
        });
        const competitors: EngineCompetitor[] = [
          { id: 'a', name: 'Alice', seed: null },
          { id: 'a', name: 'Bob', seed: null },
        ];
        expect(() => engine.generate(competitors, 'random')).toThrow(ValidationError);
      });

      it('does not throw when no validators are registered', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        expect(() => engine.generate(makeCompetitors(2), 'random')).not.toThrow();
      });
    });

    describe('custom validator integration', () => {
      it('runs custom generate validators', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          generateValidators: [new FailingGenerateValidator()],
        });
        expect(() => engine.generate(makeCompetitors(4), 'random')).toThrow(ValidationError);
      });

      it('passes custom generate validator when input is valid', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          generateValidators: [new PassingValidator()],
        });
        const result = engine.generate(makeCompetitors(4), 'random');
        expect(result.bracket.size).toBe(4);
      });

      it('collects errors from multiple failing validators', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          generateValidators: [new FailingGenerateValidator(), new AlwaysFailValidator()],
        });
        try {
          engine.generate(makeCompetitors(4), 'random');
          expect.fail('should have thrown');
        } catch (e) {
          expect(e).toBeInstanceOf(ValidationError);
          const ve = e as ValidationError;
          expect(ve.errors).toHaveLength(2);
        }
      });

      it('custom validator receives the correct input', () => {
        let receivedInput: GenerateInput | null = null;
        const spy: Validator<GenerateInput> = {
          validate(input: GenerateInput) {
            receivedInput = input;
            return { valid: true, errors: [] };
          },
        };
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          generateValidators: [spy],
        });
        const competitors = makeCompetitors(4);
        engine.generate(competitors, 'random');
        expect(receivedInput).not.toBeNull();
        expect(receivedInput!.competitors).toBe(competitors);
        expect(receivedInput!.drawType).toBe('random');
      });
    });

    describe('strategy delegation', () => {
      it('delegates to the strategy for generate', () => {
        const mock = new MockStrategy();
        const engine = new TournamentEngine(mock);
        const competitors = makeCompetitors(4);
        engine.generate(competitors, 'random');
        expect(mock.generateCalls).toHaveLength(1);
        expect(mock.generateCalls[0].competitors).toBe(competitors);
        expect(mock.generateCalls[0].drawType).toBe('random');
      });

      it('returns the strategy result', () => {
        const mock = new MockStrategy();
        const engine = new TournamentEngine(mock);
        const result = engine.generate(makeCompetitors(4), 'random');
        expect(result.bracket.size).toBe(2);
        expect(result.bracket.matches).toHaveLength(0);
      });

      it('uses the active strategy after setStrategy', () => {
        const mock1 = new MockStrategy();
        const mock2 = new MockStrategy();
        const engine = new TournamentEngine(mock1);
        engine.setStrategy(mock2);
        engine.generate(makeCompetitors(4), 'random');
        expect(mock1.generateCalls).toHaveLength(0);
        expect(mock2.generateCalls).toHaveLength(1);
      });
    });
  });

  // ─── resolve ────────────────────────────────────────────────

  describe('resolve', () => {
    describe('successful resolution', () => {
      it('resolves a match and advances winner', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const { bracket } = engine.generate(makeCompetitors(4), 'random');
        const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
        const winnerId = match.competitorA!.id;
        const updated = engine.resolve(bracket, match.id, winnerId);
        const resolved = updated.matches.find((m) => m.id === match.id);
        expect(resolved?.winner?.id).toBe(winnerId);
      });

      it('advances winner to next match slot A', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const { bracket } = engine.generate(makeCompetitors(4), 'random');
        const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
        const winnerId = match.competitorA!.id;
        const updated = engine.resolve(bracket, match.id, winnerId);
        const next = updated.matches.find((m) => m.id === match.nextMatchId);
        expect(next?.competitorA?.id).toBe(winnerId);
      });

      it('advances winner to next match slot B', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const { bracket } = engine.generate(makeCompetitors(4), 'random');
        const match = bracket.matches.find((m) => m.round === 1 && m.position === 1)!;
        const winnerId = match.competitorA!.id;
        const updated = engine.resolve(bracket, match.id, winnerId);
        const next = updated.matches.find((m) => m.id === match.nextMatchId);
        expect(next?.competitorB?.id).toBe(winnerId);
      });
    });

    describe('validation failures', () => {
      it('throws ValidationError when match ID is empty', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          resolveValidators: defaultResolveValidators(),
        });
        const bracket: EngineBracket = { size: 2, totalRounds: 1, matches: [] };
        expect(() => engine.resolve(bracket, '', 'c1')).toThrow(ValidationError);
      });

      it('throws ValidationError when winner ID is empty', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          resolveValidators: defaultResolveValidators(),
        });
        const bracket: EngineBracket = { size: 2, totalRounds: 1, matches: [] };
        expect(() => engine.resolve(bracket, 'R1P0', '')).toThrow(ValidationError);
      });

      it('does not throw when no validators are registered', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const { bracket } = engine.generate(makeCompetitors(4), 'random');
        const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;
        expect(() => engine.resolve(bracket, match.id, match.competitorA!.id)).not.toThrow();
      });
    });

    describe('custom validator integration', () => {
      it('runs custom resolve validators', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          resolveValidators: [new FailingResolveValidator()],
        });
        const bracket: EngineBracket = { size: 2, totalRounds: 1, matches: [] };
        expect(() => engine.resolve(bracket, 'R1P0', 'c1')).toThrow(ValidationError);
      });

      it('passes custom resolve validator when input is valid', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy(), {
          resolveValidators: [{ validate: () => ({ valid: true, errors: [] }) }],
        });
        const { bracket } = engine.generate(makeCompetitors(4), 'random');
        const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;
        expect(() => engine.resolve(bracket, match.id, match.competitorA!.id)).not.toThrow();
      });
    });

    describe('strategy delegation', () => {
      it('delegates to the strategy for resolve', () => {
        const mock = new MockStrategy();
        const engine = new TournamentEngine(mock);
        const bracket: EngineBracket = { size: 2, totalRounds: 1, matches: [] };
        engine.resolve(bracket, 'R1P0', 'c1');
        expect(mock.resolveCalls).toHaveLength(1);
        expect(mock.resolveCalls[0].matchId).toBe('R1P0');
        expect(mock.resolveCalls[0].winnerId).toBe('c1');
      });
    });

    describe('immutability', () => {
      it('does not mutate the original bracket', () => {
        const engine = new TournamentEngine(new SingleEliminationStrategy());
        const { bracket } = engine.generate(makeCompetitors(4), 'random');
        const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;
        const originalMatches = bracket.matches.map((m) => ({ ...m }));
        engine.resolve(bracket, match.id, match.competitorA!.id);
        expect(bracket.matches).toEqual(originalMatches);
      });
    });
  });

  // ─── undo ───────────────────────────────────────────────────

  describe('undo', () => {
    it('clears the winner from the match', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(4), 'random');
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      bracket = engine.resolve(bracket, match.id, match.competitorA!.id);
      const undone = engine.undo(bracket, match.id);
      const undoneMatch = undone.matches.find((m) => m.id === match.id);
      expect(undoneMatch?.winner).toBeNull();
    });

    it('removes the old winner from subsequent matches', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(4), 'random');
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      bracket = engine.resolve(bracket, match.id, match.competitorA!.id);
      const next = bracket.matches.find((m) => m.id === match.nextMatchId)!;
      expect(next.competitorA?.id).toBe(match.competitorA!.id);

      const undone = engine.undo(bracket, match.id);
      const undoneNext = undone.matches.find((m) => m.id === match.nextMatchId);
      expect(undoneNext?.competitorA).toBeNull();
    });

    it('returns bracket unchanged if match has no winner', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      const { bracket } = engine.generate(makeCompetitors(4), 'random');
      const match = bracket.matches.find((m) => m.round === 1 && !m.isBye)!;
      const undone = engine.undo(bracket, match.id);
      expect(undone).toStrictEqual(bracket);
    });

    it('does not mutate the original bracket', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(4), 'random');
      const match = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      bracket = engine.resolve(bracket, match.id, match.competitorA!.id);
      const originalMatches = bracket.matches.map((m) => ({ ...m }));
      engine.undo(bracket, match.id);
      expect(bracket.matches).toEqual(originalMatches);
    });
  });

  // ─── isComplete ─────────────────────────────────────────────

  describe('isComplete', () => {
    it('returns false for unresolved bracket', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      const { bracket } = engine.generate(makeCompetitors(4), 'random');
      expect(engine.isComplete(bracket)).toBe(false);
    });

    it('returns true when all matches have winners', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(2), 'random');
      const match = bracket.matches[0];
      bracket = engine.resolve(bracket, match.id, match.competitorA!.id);
      expect(engine.isComplete(bracket)).toBe(true);
    });

    it('returns true after full tournament', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(4), 'random');
      for (let round = 1; round <= bracket.totalRounds; round++) {
        for (const match of bracket.matches.filter((m) => m.round === round && !m.isBye)) {
          bracket = engine.resolve(bracket, match.id, match.competitorA!.id);
        }
      }
      expect(engine.isComplete(bracket)).toBe(true);
    });
  });

  // ─── getChampion ────────────────────────────────────────────

  describe('getChampion', () => {
    it('returns null for unresolved bracket', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      const { bracket } = engine.generate(makeCompetitors(4), 'random');
      expect(engine.getChampion(bracket)).toBeNull();
    });

    it('returns the final match winner', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(2), 'random');
      const match = bracket.matches[0];
      const winnerId = match.competitorA!.id;
      bracket = engine.resolve(bracket, match.id, winnerId);
      const champion = engine.getChampion(bracket);
      expect(champion?.id).toBe(winnerId);
    });

    it('returns champion after full tournament', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(4), 'random');
      for (let round = 1; round <= bracket.totalRounds; round++) {
        for (const match of bracket.matches.filter((m) => m.round === round && !m.isBye)) {
          bracket = engine.resolve(bracket, match.id, match.competitorA!.id);
        }
      }
      const champion = engine.getChampion(bracket);
      expect(champion).not.toBeNull();
      expect(champion!.id).toBeDefined();
    });
  });

  // ─── getPreview ─────────────────────────────────────────────

  describe('getPreview', () => {
    it('returns correct preview for power-of-2 competitors', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      const preview = engine.getPreview(8, []);
      expect(preview.competitorCount).toBe(8);
      expect(preview.bracketSize).toBe(8);
      expect(preview.byeCount).toBe(0);
      expect(preview.totalRounds).toBe(3);
    });

    it('returns correct preview with BYEs', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      const preview = engine.getPreview(5, [1, 2, 3, 4, 5]);
      expect(preview.competitorCount).toBe(5);
      expect(preview.bracketSize).toBe(8);
      expect(preview.byeCount).toBe(3);
    });

    it('delegates to the strategy', () => {
      const mock = new MockStrategy();
      const engine = new TournamentEngine(mock);
      const preview = engine.getPreview(4, []);
      expect(preview.bracketSize).toBe(0);
      expect(mock.generateCalls).toHaveLength(0);
    });

    it('handles edge case: 0 competitors', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      const preview = engine.getPreview(0, []);
      expect(preview.bracketSize).toBe(0);
      expect(preview.byeCount).toBe(0);
      expect(preview.totalRounds).toBe(0);
    });

    it('handles edge case: 1 competitor', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      const preview = engine.getPreview(1, []);
      expect(preview.bracketSize).toBe(0);
      expect(preview.byeCount).toBe(0);
      expect(preview.totalRounds).toBe(0);
    });
  });

  // ─── Full integration flow ──────────────────────────────────

  describe('full integration flow', () => {
    it('generate → resolve all → isComplete → getChampion', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(4), 'random');

      expect(engine.isComplete(bracket)).toBe(false);
      expect(engine.getChampion(bracket)).toBeNull();

      for (let round = 1; round <= bracket.totalRounds; round++) {
        for (const match of bracket.matches.filter((m) => m.round === round && !m.isBye)) {
          bracket = engine.resolve(bracket, match.id, match.competitorA!.id);
        }
      }

      expect(engine.isComplete(bracket)).toBe(true);
      const champion = engine.getChampion(bracket);
      expect(champion).not.toBeNull();
      expect(champion!.id).toBeDefined();
    });

    it('generate → resolve → undo → re-resolve → getChampion', () => {
      const engine = new TournamentEngine(new SingleEliminationStrategy());
      let { bracket } = engine.generate(makeCompetitors(4), 'random');

      const match0 = bracket.matches.find((m) => m.round === 1 && m.position === 0)!;
      const match1 = bracket.matches.find((m) => m.round === 1 && m.position === 1)!;

      bracket = engine.resolve(bracket, match0.id, match0.competitorA!.id);
      expect(engine.getChampion(bracket)).toBeNull();

      bracket = engine.undo(bracket, match0.id);
      expect(engine.getChampion(bracket)).toBeNull();

      bracket = engine.resolve(bracket, match0.id, match0.competitorB!.id);
      bracket = engine.resolve(bracket, match1.id, match1.competitorA!.id);

      for (let round = 2; round <= bracket.totalRounds; round++) {
        for (const m of bracket.matches.filter((m) => m.round === round && !m.isBye)) {
          if (m.competitorA && m.competitorB) {
            bracket = engine.resolve(bracket, m.id, m.competitorA.id);
          }
        }
      }

      expect(engine.isComplete(bracket)).toBe(true);
      const champion = engine.getChampion(bracket);
      expect(champion).not.toBeNull();
    });
  });

  // ─── Error propagation from strategy ────────────────────────

  describe('error propagation from strategy', () => {
    it('propagates strategy errors from generate', () => {
      class ThrowingStrategy implements TournamentStrategy {
        readonly format = 'throwing';
        readonly name = 'Throwing';
        generate() { throw new Error('Strategy generate error'); }
        resolve() { throw new Error('not implemented'); }
        undo() { throw new Error('not implemented'); }
        isComplete() { return false; }
        getChampion() { return null; }
        getPreview() { return { competitorCount: 0, bracketSize: 0, byeCount: 0, totalRounds: 0, seededByes: [] }; }
      }

      const engine = new TournamentEngine(new ThrowingStrategy());
      expect(() => engine.generate(makeCompetitors(4), 'random')).toThrow('Strategy generate error');
    });

    it('propagates strategy errors from resolve', () => {
      class ThrowingResolveStrategy implements TournamentStrategy {
        readonly format = 'throwing';
        readonly name = 'Throwing';
        generate() {
          return {
            bracket: { size: 2, totalRounds: 1, matches: [{ id: 'R1P0', round: 1, position: 0, competitorA: null, competitorB: null, winner: null, isBye: false, nextMatchId: null, nextSlot: null }] },
            byes: [],
          };
        }
        resolve() { throw new Error('Strategy resolve error'); }
        undo() { throw new Error('not implemented'); }
        isComplete() { return false; }
        getChampion() { return null; }
        getPreview() { return { competitorCount: 0, bracketSize: 0, byeCount: 0, totalRounds: 0, seededByes: [] }; }
      }

      const engine = new TournamentEngine(new ThrowingResolveStrategy());
      const { bracket } = engine.generate(makeCompetitors(2), 'random');
      expect(() => engine.resolve(bracket, 'R1P0', 'c1')).toThrow('Strategy resolve error');
    });
  });
});
