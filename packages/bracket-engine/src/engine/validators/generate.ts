import type { Validator, ValidationResult, GenerateInput } from '../validator';

/**
 * Rejects when fewer than 2 competitors are provided.
 */
export class MinimumCompetitorsValidator implements Validator<GenerateInput> {
  validate(input: GenerateInput): ValidationResult {
    if (input.competitors.length < 2) {
      return { valid: false, errors: ['At least 2 competitors are required'] };
    }
    return { valid: true, errors: [] };
  }
}

/**
 * Rejects when more than 256 competitors are provided.
 */
export class MaximumCompetitorsValidator implements Validator<GenerateInput> {
  validate(input: GenerateInput): ValidationResult {
    if (input.competitors.length > 256) {
      return { valid: false, errors: ['Maximum 256 competitors allowed'] };
    }
    return { valid: true, errors: [] };
  }
}

/**
 * Rejects when two or more competitors share the same id.
 */
export class UniqueIdsValidator implements Validator<GenerateInput> {
  validate(input: GenerateInput): ValidationResult {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const c of input.competitors) {
      if (seen.has(c.id)) {
        duplicates.push(c.id);
      }
      seen.add(c.id);
    }

    if (duplicates.length > 0) {
      return {
        valid: false,
        errors: [`Duplicate competitor IDs: ${[...new Set(duplicates)].join(', ')}`],
      };
    }
    return { valid: true, errors: [] };
  }
}

/**
 * Rejects when any competitor has an empty or whitespace-only name.
 */
export class NonEmptyNamesValidator implements Validator<GenerateInput> {
  validate(input: GenerateInput): ValidationResult {
    const errors: string[] = [];

    for (const c of input.competitors) {
      if (typeof c.name !== 'string' || c.name.trim() === '') {
        errors.push(`Competitor "${c.id}" has empty or missing name`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }
}

/**
 * Rejects when two or more competitors share the same seed value.
 */
export class DuplicateSeedsValidator implements Validator<GenerateInput> {
  validate(input: GenerateInput): ValidationResult {
    const bySeed = new Map<number, string[]>();

    for (const c of input.competitors) {
      if (c.seed === null) continue;
      const ids = bySeed.get(c.seed) ?? [];
      ids.push(c.id);
      bySeed.set(c.seed, ids);
    }

    const duplicates = [...bySeed.entries()].filter(([, ids]) => ids.length > 1);
    if (duplicates.length > 0) {
      return {
        valid: false,
        errors: duplicates.map(
          ([seed, ids]) => `Duplicate seed ${seed} assigned to competitors: ${ids.join(', ')}`,
        ),
      };
    }
    return { valid: true, errors: [] };
  }
}

/**
 * Rejects when any seed is not a positive integer (0, negatives,
 * fractions, NaN, and Infinity are all invalid).
 */
export class InvalidSeedValuesValidator implements Validator<GenerateInput> {
  validate(input: GenerateInput): ValidationResult {
    const errors: string[] = [];

    for (const c of input.competitors) {
      if (c.seed === null) continue;
      if (!Number.isInteger(c.seed) || c.seed <= 0) {
        errors.push(
          `Competitor "${c.id}" has invalid seed ${String(c.seed)}: seeds must be positive integers`,
        );
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }
}

/**
 * Rejects when the number of seeded competitors exceeds the total number
 * of competitors. A defensive invariant guard — it can never fire since
 * every competitor carries at most one seed, but it documents the
 * constraint for consumers that supply a seed list.
 */
export class SeededCountValidator implements Validator<GenerateInput> {
  validate(input: GenerateInput): ValidationResult {
    const seedCount = input.competitors.reduce(
      (count, c) => (c.seed === null ? count : count + 1),
      0,
    );
    if (seedCount > input.competitors.length) {
      return {
        valid: false,
        errors: [
          `Seed count (${seedCount}) exceeds competitor count (${input.competitors.length})`,
        ],
      };
    }
    return { valid: true, errors: [] };
  }
}

/**
 * Run all seed validation rules and collect their errors.
 *
 * Used by `generateBracket()` (the primary API) so seed problems are
 * rejected even when the engine is used without a validation pipeline.
 */
export function validateSeeds(input: GenerateInput): string[] {
  const validators: readonly Validator<GenerateInput>[] = [
    new DuplicateSeedsValidator(),
    new InvalidSeedValuesValidator(),
    new SeededCountValidator(),
  ];

  const errors: string[] = [];
  for (const validator of validators) {
    const result = validator.validate(input);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }
  return errors;
}

/**
 * Rejects when any competitor is missing a non-empty `id` or a `name` of type string.
 */
export class RequiredFieldsValidator implements Validator<GenerateInput> {
  validate(input: GenerateInput): ValidationResult {
    const errors: string[] = [];

    for (const c of input.competitors) {
      if (typeof c.id !== 'string' || c.id === '') {
        errors.push('Every competitor must have a non-empty string "id"');
      }
      if (c.name !== undefined && typeof c.name !== 'string') {
        errors.push(`Competitor "${String(c.id)}" has non-string name`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  }
}
