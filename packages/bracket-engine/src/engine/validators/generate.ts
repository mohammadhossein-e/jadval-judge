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
