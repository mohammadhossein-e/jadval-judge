import { describe, it, expect } from 'vitest';
import type { GenerateInput, ResolveInput, EngineBracket } from '../../src/types';
import {
  MinimumCompetitorsValidator,
  MaximumCompetitorsValidator,
  UniqueIdsValidator,
  NonEmptyNamesValidator,
  RequiredFieldsValidator,
  NonEmptyMatchIdValidator,
  NonEmptyWinnerIdValidator,
  defaultGenerateValidators,
  defaultResolveValidators,
} from '../../src/engine/validators';
import { ValidationPipeline, ValidationError } from '../../src/engine/validator';
import { TournamentEngine } from '../../src/engine/tournament-engine';
import { SingleEliminationStrategy } from '../../src/single-elimination/single-elimination-strategy';
import type { EngineCompetitor } from '../../src/types';

function makeInput(competitors: EngineCompetitor[]): GenerateInput {
  return { competitors, drawType: 'random' };
}

function makeResolveInput(
  overrides: Partial<ResolveInput> = {},
): ResolveInput {
  const bracket: EngineBracket = {
    size: 2,
    totalRounds: 1,
    matches: [],
  };
  return { bracket, matchId: 'R1P0', winnerId: 'c1', ...overrides };
}

function makeCompetitor(id: string, name = `Name ${id}`): EngineCompetitor {
  return { id, name, seed: null };
}

// ─── MinimumCompetitorsValidator ────────────────────────────────

describe('MinimumCompetitorsValidator', () => {
  const v = new MinimumCompetitorsValidator();

  it('rejects empty array', () => {
    expect(v.validate(makeInput([]))).toEqual({
      valid: false,
      errors: ['At least 2 competitors are required'],
    });
  });

  it('rejects single competitor', () => {
    expect(v.validate(makeInput([makeCompetitor('a')]))).toEqual({
      valid: false,
      errors: ['At least 2 competitors are required'],
    });
  });

  it('accepts exactly 2 competitors', () => {
    expect(v.validate(makeInput([makeCompetitor('a'), makeCompetitor('b')]))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('accepts more than 2 competitors', () => {
    const competitors = Array.from({ length: 10 }, (_, i) => makeCompetitor(`c${i}`));
    expect(v.validate(makeInput(competitors)).valid).toBe(true);
  });
});

// ─── MaximumCompetitorsValidator ────────────────────────────────

describe('MaximumCompetitorsValidator', () => {
  const v = new MaximumCompetitorsValidator();

  it('accepts up to 256 competitors', () => {
    const competitors = Array.from({ length: 256 }, (_, i) => makeCompetitor(`c${i}`));
    expect(v.validate(makeInput(competitors))).toEqual({ valid: true, errors: [] });
  });

  it('rejects 257 competitors', () => {
    const competitors = Array.from({ length: 257 }, (_, i) => makeCompetitor(`c${i}`));
    expect(v.validate(makeInput(competitors))).toEqual({
      valid: false,
      errors: ['Maximum 256 competitors allowed'],
    });
  });

  it('rejects 300 competitors', () => {
    const competitors = Array.from({ length: 300 }, (_, i) => makeCompetitor(`c${i}`));
    expect(v.validate(makeInput(competitors))).toEqual({
      valid: false,
      errors: ['Maximum 256 competitors allowed'],
    });
  });

  it('accepts empty array (count check is MinimumCompetitorsValidator job)', () => {
    expect(v.validate(makeInput([]))).toEqual({ valid: true, errors: [] });
  });
});

// ─── UniqueIdsValidator ─────────────────────────────────────────

describe('UniqueIdsValidator', () => {
  const v = new UniqueIdsValidator();

  it('accepts all unique IDs', () => {
    const input = makeInput([
      makeCompetitor('a'),
      makeCompetitor('b'),
      makeCompetitor('c'),
    ]);
    expect(v.validate(input)).toEqual({ valid: true, errors: [] });
  });

  it('rejects duplicate IDs', () => {
    const input = makeInput([
      makeCompetitor('a'),
      makeCompetitor('a'),
      makeCompetitor('b'),
    ]);
    const result = v.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Duplicate competitor IDs');
    expect(result.errors[0]).toContain('a');
  });

  it('reports each duplicate ID only once', () => {
    const input = makeInput([
      makeCompetitor('x'),
      makeCompetitor('x'),
      makeCompetitor('x'),
      makeCompetitor('y'),
    ]);
    const result = v.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('x');
    expect(result.errors[0]).not.toContain('y');
  });

  it('reports multiple different duplicates', () => {
    const input = makeInput([
      makeCompetitor('a'),
      makeCompetitor('a'),
      makeCompetitor('b'),
      makeCompetitor('b'),
    ]);
    const result = v.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('a');
    expect(result.errors[0]).toContain('b');
  });

  it('accepts empty array', () => {
    expect(v.validate(makeInput([]))).toEqual({ valid: true, errors: [] });
  });
});

// ─── NonEmptyNamesValidator ─────────────────────────────────────

describe('NonEmptyNamesValidator', () => {
  const v = new NonEmptyNamesValidator();

  it('accepts all non-empty names', () => {
    const input = makeInput([
      makeCompetitor('a', 'Alice'),
      makeCompetitor('b', 'Bob'),
    ]);
    expect(v.validate(input)).toEqual({ valid: true, errors: [] });
  });

  it('rejects empty string name', () => {
    const input = makeInput([makeCompetitor('a', '')]);
    const result = v.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('a');
  });

  it('rejects whitespace-only name', () => {
    const input = makeInput([makeCompetitor('a', '   ')]);
    const result = v.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('rejects undefined name', () => {
    const input: GenerateInput = {
      competitors: [{ id: 'a', name: undefined as unknown as string, seed: null }],
      drawType: 'random',
    };
    const result = v.validate(input);
    expect(result.valid).toBe(false);
  });

  it('reports all invalid names', () => {
    const input: GenerateInput = {
      competitors: [
        { id: 'a', name: '', seed: null },
        { id: 'b', name: 'Valid', seed: null },
        { id: 'c', name: '   ', seed: null },
      ],
      drawType: 'random',
    };
    const result = v.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('accepts empty array', () => {
    expect(v.validate(makeInput([]))).toEqual({ valid: true, errors: [] });
  });
});

// ─── RequiredFieldsValidator ────────────────────────────────────

describe('RequiredFieldsValidator', () => {
  const v = new RequiredFieldsValidator();

  it('accepts valid competitors', () => {
    const input = makeInput([makeCompetitor('a', 'Alice')]);
    expect(v.validate(input)).toEqual({ valid: true, errors: [] });
  });

  it('rejects missing id', () => {
    const input: GenerateInput = {
      competitors: [{ id: '', name: 'Alice', seed: null }],
      drawType: 'random',
    };
    const result = v.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('id');
  });

  it('rejects non-string id', () => {
    const input: GenerateInput = {
      competitors: [{ id: 123 as unknown as string, name: 'Alice', seed: null }],
      drawType: 'random',
    };
    const result = v.validate(input);
    expect(result.valid).toBe(false);
  });

  it('rejects non-string name', () => {
    const input: GenerateInput = {
      competitors: [{ id: 'a', name: 42 as unknown as string, seed: null }],
      drawType: 'random',
    };
    const result = v.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('non-string name');
  });

  it('accepts null seed (seed is optional)', () => {
    const input = makeInput([{ id: 'a', name: 'Alice', seed: null }]);
    expect(v.validate(input).valid).toBe(true);
  });

  it('accepts empty array', () => {
    expect(v.validate(makeInput([]))).toEqual({ valid: true, errors: [] });
  });
});

// ─── NonEmptyMatchIdValidator ───────────────────────────────────

describe('NonEmptyMatchIdValidator', () => {
  const v = new NonEmptyMatchIdValidator();

  it('accepts valid match ID', () => {
    expect(v.validate(makeResolveInput({ matchId: 'R1P0' }))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('rejects empty string', () => {
    expect(v.validate(makeResolveInput({ matchId: '' }))).toEqual({
      valid: false,
      errors: ['Match ID is required'],
    });
  });

  it('rejects whitespace-only string', () => {
    expect(v.validate(makeResolveInput({ matchId: '   ' }))).toEqual({
      valid: false,
      errors: ['Match ID is required'],
    });
  });
});

// ─── NonEmptyWinnerIdValidator ──────────────────────────────────

describe('NonEmptyWinnerIdValidator', () => {
  const v = new NonEmptyWinnerIdValidator();

  it('accepts valid winner ID', () => {
    expect(v.validate(makeResolveInput({ winnerId: 'c1' }))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('rejects empty string', () => {
    expect(v.validate(makeResolveInput({ winnerId: '' }))).toEqual({
      valid: false,
      errors: ['Winner ID is required'],
    });
  });

  it('rejects whitespace-only string', () => {
    expect(v.validate(makeResolveInput({ winnerId: '   ' }))).toEqual({
      valid: false,
      errors: ['Winner ID is required'],
    });
  });
});

// ─── ValidationPipeline integration ─────────────────────────────

describe('ValidationPipeline', () => {
  it('pass-through with no validators', () => {
    const pipeline = new ValidationPipeline<GenerateInput>();
    const input = makeInput([makeCompetitor('a'), makeCompetitor('b')]);
    expect(pipeline.run(input)).toEqual({ valid: true, errors: [] });
  });

  it('collects errors from multiple failing validators', () => {
    const pipeline = new ValidationPipeline<GenerateInput>([
      new MinimumCompetitorsValidator(),
      new MaximumCompetitorsValidator(),
      new UniqueIdsValidator(),
    ]);
    const input = makeInput([]);
    const result = pipeline.run(input);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('stops collecting from a validator once it passes', () => {
    const pipeline = new ValidationPipeline<GenerateInput>([
      new MinimumCompetitorsValidator(),
      new UniqueIdsValidator(),
    ]);
    const input = makeInput([makeCompetitor('a'), makeCompetitor('a')]);
    const result = pipeline.run(input);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Duplicate');
  });
});

// ─── defaultGenerateValidators ──────────────────────────────────

describe('defaultGenerateValidators', () => {
  it('returns 5 validators', () => {
    expect(defaultGenerateValidators()).toHaveLength(5);
  });

  it('rejects empty input', () => {
    const pipeline = new ValidationPipeline<GenerateInput>(defaultGenerateValidators());
    expect(pipeline.run(makeInput([])).valid).toBe(false);
  });

  it('rejects over-limit input', () => {
    const pipeline = new ValidationPipeline<GenerateInput>(defaultGenerateValidators());
    const competitors = Array.from({ length: 257 }, (_, i) => makeCompetitor(`c${i}`));
    expect(pipeline.run(makeInput(competitors)).valid).toBe(false);
  });

  it('rejects duplicate IDs', () => {
    const pipeline = new ValidationPipeline<GenerateInput>(defaultGenerateValidators());
    const input = makeInput([
      makeCompetitor('a'),
      makeCompetitor('b'),
      makeCompetitor('a'),
    ]);
    expect(pipeline.run(input).valid).toBe(false);
  });

  it('accepts valid input', () => {
    const pipeline = new ValidationPipeline<GenerateInput>(defaultGenerateValidators());
    const competitors = Array.from({ length: 8 }, (_, i) => makeCompetitor(`c${i}`));
    expect(pipeline.run(makeInput(competitors))).toEqual({ valid: true, errors: [] });
  });
});

// ─── defaultResolveValidators ───────────────────────────────────

describe('defaultResolveValidators', () => {
  it('returns 2 validators', () => {
    expect(defaultResolveValidators()).toHaveLength(2);
  });

  it('rejects empty match ID', () => {
    const pipeline = new ValidationPipeline<ResolveInput>(defaultResolveValidators());
    expect(pipeline.run(makeResolveInput({ matchId: '' })).valid).toBe(false);
  });

  it('rejects empty winner ID', () => {
    const pipeline = new ValidationPipeline<ResolveInput>(defaultResolveValidators());
    expect(pipeline.run(makeResolveInput({ winnerId: '' })).valid).toBe(false);
  });

  it('accepts valid input', () => {
    const pipeline = new ValidationPipeline<ResolveInput>(defaultResolveValidators());
    expect(pipeline.run(makeResolveInput())).toEqual({ valid: true, errors: [] });
  });
});

// ─── TournamentEngine pipeline integration ──────────────────────

describe('TournamentEngine with validators', () => {
  it('rejects generate when validation fails', () => {
    const engine = new TournamentEngine(new SingleEliminationStrategy(), {
      generateValidators: defaultGenerateValidators(),
    });

    expect(() => engine.generate([], 'random')).toThrow(ValidationError);
  });

  it('passes generate when validation succeeds', () => {
    const engine = new TournamentEngine(new SingleEliminationStrategy(), {
      generateValidators: defaultGenerateValidators(),
    });

    const competitors = Array.from({ length: 4 }, (_, i) => makeCompetitor(`c${i}`));
    const result = engine.generate(competitors, 'random');
    expect(result.bracket.size).toBe(4);
  });

  it('rejects resolve when validation fails', () => {
    const engine = new TournamentEngine(new SingleEliminationStrategy(), {
      resolveValidators: defaultResolveValidators(),
    });

    expect(() => engine.resolve({ size: 2, totalRounds: 1, matches: [] }, '', 'c1')).toThrow(
      ValidationError,
    );
  });

  it('works without validators (backward compatible)', () => {
    const engine = new TournamentEngine(new SingleEliminationStrategy());

    const competitors = Array.from({ length: 4 }, (_, i) => makeCompetitor(`c${i}`));
    const result = engine.generate(competitors, 'random');
    expect(result.bracket.size).toBe(4);
  });
});
