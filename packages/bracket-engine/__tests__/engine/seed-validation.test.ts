import { describe, it, expect } from 'vitest';
import type { EngineCompetitor } from '../../src/types';
import type { GenerateInput } from '../../src/engine/validator';
import {
  DuplicateSeedsValidator,
  InvalidSeedValuesValidator,
  SeededCountValidator,
  validateSeeds,
} from '../../src/engine/validators/generate';
import { defaultGenerateValidators } from '../../src/engine/validators';
import { ValidationPipeline } from '../../src/engine/validator';
import { generateBracket } from '../../src/single-elimination/generator';

function makeCompetitors(seeds: readonly (number | null)[]): EngineCompetitor[] {
  return seeds.map((seed, i) => ({
    id: `c${i + 1}`,
    name: `Competitor ${i + 1}`,
    seed,
  }));
}

function makeInput(competitors: readonly EngineCompetitor[]): GenerateInput {
  return { competitors, drawType: 'random' };
}

describe('DuplicateSeedsValidator', () => {
  const v = new DuplicateSeedsValidator();

  it('accepts unique seeds', () => {
    expect(v.validate(makeInput(makeCompetitors([1, 2, 3])))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('accepts unseeded competitors', () => {
    expect(v.validate(makeInput(makeCompetitors([null, null])))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('rejects duplicate seed values', () => {
    const result = v.validate(makeInput(makeCompetitors([1, 1, 2])));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Duplicate seed 1');
    expect(result.errors[0]).toContain('c1');
    expect(result.errors[0]).toContain('c2');
  });
});

describe('InvalidSeedValuesValidator', () => {
  const v = new InvalidSeedValuesValidator();

  it('accepts positive integer seeds', () => {
    expect(v.validate(makeInput(makeCompetitors([1, 2, 8]))).valid).toBe(true);
  });

  it('rejects seed 0', () => {
    expect(v.validate(makeInput(makeCompetitors([0, 1]))).valid).toBe(false);
  });

  it('rejects negative seeds', () => {
    expect(v.validate(makeInput(makeCompetitors([-2, 1]))).valid).toBe(false);
  });

  it('rejects non-integer seeds', () => {
    expect(v.validate(makeInput(makeCompetitors([1.5, 1]))).valid).toBe(false);
  });

  it('rejects NaN and Infinity seeds', () => {
    expect(v.validate(makeInput(makeCompetitors([Number.NaN, 1]))).valid).toBe(false);
    expect(v.validate(makeInput(makeCompetitors([Number.POSITIVE_INFINITY, 1]))).valid).toBe(false);
  });

  it('ignores null seeds', () => {
    expect(v.validate(makeInput(makeCompetitors([null, null, 1]))).valid).toBe(true);
  });
});

describe('SeededCountValidator', () => {
  const v = new SeededCountValidator();

  it('accepts when seed count equals competitor count', () => {
    expect(v.validate(makeInput(makeCompetitors([1, 2, 3]))).valid).toBe(true);
  });

  it('accepts when seed count is below competitor count', () => {
    expect(v.validate(makeInput(makeCompetitors([1, null, null, 4]))).valid).toBe(true);
  });

  it('accepts when seed count is within bounds (never fires)', () => {
    expect(v.validate(makeInput(makeCompetitors([1, 2, null]))).valid).toBe(true);
  });
});

describe('validateSeeds', () => {
  it('returns empty errors for valid seeded input', () => {
    expect(validateSeeds(makeInput(makeCompetitors([1, 2, 3])))).toEqual([]);
  });

  it('collects duplicate and invalid seed errors together', () => {
    const errors = validateSeeds(makeInput(makeCompetitors([1, 1, 0])));
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('defaultGenerateValidators includes seed validators', () => {
  it('rejects duplicate seeds through the pipeline', () => {
    const pipeline = new ValidationPipeline<GenerateInput>(defaultGenerateValidators());
    const result = pipeline.run(makeInput(makeCompetitors([1, 1])));
    expect(result.valid).toBe(false);
  });

  it('rejects invalid seed values through the pipeline', () => {
    const pipeline = new ValidationPipeline<GenerateInput>(defaultGenerateValidators());
    const result = pipeline.run(makeInput(makeCompetitors([1.5, 2])));
    expect(result.valid).toBe(false);
  });

  it('accepts valid seeded input through the pipeline', () => {
    const pipeline = new ValidationPipeline<GenerateInput>(defaultGenerateValidators());
    const result = pipeline.run(makeInput(makeCompetitors([1, 2, 3, 4])));
    expect(result.valid).toBe(true);
  });
});

describe('generateBracket seed validation', () => {
  it('throws on duplicate seeds', () => {
    expect(() => generateBracket(makeCompetitors([1, 1, 2]))).toThrow('Duplicate seed');
  });

  it('throws on invalid seed values', () => {
    expect(() => generateBracket(makeCompetitors([0, 1, 2]))).toThrow('positive integers');
    expect(() => generateBracket(makeCompetitors([1.5, 2, 3]))).toThrow('positive integers');
  });

  it('generates a valid bracket for a valid seeded input', () => {
    const result = generateBracket(makeCompetitors([1, 2, 3, 4]));
    expect(result.bracket.size).toBe(4);
  });
});
