export type {
  EngineCompetitor,
  EngineMatch,
  EngineBracket,
  DrawType,
  GenerationResult,
  BracketPreview,
} from './types';

export {
  generateBracket,
  isBracketComplete,
  getChampion,
  resolveMatch,
  cascadeUndo,
  getBracketPreview,
} from './single-elimination';

export type { TournamentStrategy } from './engine';
export { TournamentEngine } from './engine';
export type { TournamentEngineOptions } from './engine';
export type { GenerateInput, ResolveInput, Validator, ValidationResult } from './engine';
export { ValidationPipeline, ValidationError } from './engine';
export type { GenerationContext } from './engine';
export { buildGenerationContext } from './engine';
export type { ByePlacementStrategy } from './engine';
export type { CompetitorPlacementStrategy, PlacementInput } from './engine';
export type { PlacementFilter } from './engine';
export type {
  PlacementClaim,
  PlacementClaims,
  PlacementPriority,
  PlacementRule,
  PlacementRuleInput,
} from './engine';
export type { SeedPlacementInput, SeedPlacementStrategy } from './engine';
export { resolvePlacementClaims } from './engine';
export type { PipelineContext, PipelineStep } from './engine';
export { GenerationPipeline, createPipelineContext } from './engine';
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
  NonEmptyMatchIdValidator,
  NonEmptyWinnerIdValidator,
  defaultGenerateValidators,
  defaultResolveValidators,
} from './engine';
export { SingleEliminationStrategy } from './single-elimination';
export type { SingleEliminationStrategyConfig } from './single-elimination';
export { DefaultByePlacementStrategy } from './single-elimination';
export { generateByePriority } from './single-elimination';
export {
  DefaultCompetitorPlacementStrategy,
} from './single-elimination';
export type { DefaultCompetitorPlacementConfig } from './single-elimination';
export { BalancedByePlacementStrategy } from './single-elimination';
export { computeSeedClaims, DefaultSeedPlacementStrategy } from './single-elimination';
export {
  ManualPlacementRule,
  FilterPlacementRule,
  SeedPlacementRule,
  ByePlacementRule,
} from './single-elimination';
