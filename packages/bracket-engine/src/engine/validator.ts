import type { EngineCompetitor, EngineBracket, DrawType } from '../types';

/**
 * Bundled input for the generate operation.
 */
export interface GenerateInput {
  competitors: readonly EngineCompetitor[];
  drawType: DrawType;
  manualPlacements?: Map<number, string>;
  /**
   * Ordered competitor ids produced by a random draw. This is a
   * placement ORDER only — it never creates placement claims and only
   * defines the order in which remaining competitors fill free positions.
   */
  placementOrder?: readonly string[];
}

/**
 * Bundled input for the resolve operation.
 */
export interface ResolveInput {
  bracket: EngineBracket;
  matchId: string;
  winnerId: string;
}

/**
 * Result of running validators against an input.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * A single validation rule.
 *
 * Implementations check one aspect of the input and report errors.
 * Validators must be pure — no side effects, no I/O.
 */
export interface Validator<TInput> {
  validate(input: TInput): ValidationResult;
}

/**
 * Runs a list of {@link Validator}s against an input and collects errors.
 *
 * If every validator passes the pipeline returns `{ valid: true, errors: [] }`.
 * If any validator fails, all errors are collected and returned together.
 *
 * With no validators registered the pipeline is a pass-through — it always
 * returns `{ valid: true, errors: [] }`.
 */
export class ValidationPipeline<TInput> {
  private readonly validators: ReadonlyArray<Validator<TInput>>;

  constructor(validators: readonly Validator<TInput>[] = []) {
    this.validators = validators;
  }

  run(input: TInput): ValidationResult {
    if (this.validators.length === 0) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    for (const validator of this.validators) {
      const result = validator.validate(input);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return errors.length === 0
      ? { valid: true, errors: [] }
      : { valid: false, errors };
  }
}

/**
 * Thrown when a validation pipeline rejects the input.
 */
export class ValidationError extends Error {
  public readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(`Validation failed: ${errors.join('; ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
