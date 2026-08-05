import type { Validator, ValidationResult, ResolveInput } from '../validator';

/**
 * Rejects when matchId is missing, empty, or whitespace-only.
 */
export class NonEmptyMatchIdValidator implements Validator<ResolveInput> {
  validate(input: ResolveInput): ValidationResult {
    if (typeof input.matchId !== 'string' || input.matchId.trim() === '') {
      return { valid: false, errors: ['Match ID is required'] };
    }
    return { valid: true, errors: [] };
  }
}

/**
 * Rejects when winnerId is missing, empty, or whitespace-only.
 */
export class NonEmptyWinnerIdValidator implements Validator<ResolveInput> {
  validate(input: ResolveInput): ValidationResult {
    if (typeof input.winnerId !== 'string' || input.winnerId.trim() === '') {
      return { valid: false, errors: ['Winner ID is required'] };
    }
    return { valid: true, errors: [] };
  }
}
