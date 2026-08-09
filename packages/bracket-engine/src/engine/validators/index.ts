import type { Validator, GenerateInput, ResolveInput } from '../validator';
import {
  MinimumCompetitorsValidator,
  MaximumCompetitorsValidator,
  UniqueIdsValidator,
  NonEmptyNamesValidator,
  RequiredFieldsValidator,
  DuplicateSeedsValidator,
  InvalidSeedValuesValidator,
  SeededCountValidator,
  validateSeeds,
} from './generate';
import {
  NonEmptyMatchIdValidator,
  NonEmptyWinnerIdValidator,
} from './resolve';

export {
  MinimumCompetitorsValidator,
  MaximumCompetitorsValidator,
  UniqueIdsValidator,
  NonEmptyNamesValidator,
  RequiredFieldsValidator,
  DuplicateSeedsValidator,
  InvalidSeedValuesValidator,
  SeededCountValidator,
  validateSeeds,
} from './generate';

export {
  NonEmptyMatchIdValidator,
  NonEmptyWinnerIdValidator,
} from './resolve';

/**
 * Returns the standard set of V1 generate-input validators.
 *
 * @example
 * ```ts
 * const engine = new TournamentEngine(strategy, {
 *   generateValidators: defaultGenerateValidators(),
 * });
 * ```
 */
export function defaultGenerateValidators(): readonly Validator<GenerateInput>[] {
  return [
    new RequiredFieldsValidator(),
    new MinimumCompetitorsValidator(),
    new MaximumCompetitorsValidator(),
    new UniqueIdsValidator(),
    new NonEmptyNamesValidator(),
    new DuplicateSeedsValidator(),
    new InvalidSeedValuesValidator(),
    new SeededCountValidator(),
  ];
}

/**
 * Returns the standard set of V1 resolve-input validators.
 */
export function defaultResolveValidators(): readonly Validator<ResolveInput>[] {
  return [
    new NonEmptyMatchIdValidator(),
    new NonEmptyWinnerIdValidator(),
  ];
}
