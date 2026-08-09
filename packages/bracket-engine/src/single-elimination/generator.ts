import type {
  EngineCompetitor,
  EngineBracket,
  DrawType,
  GenerationResult,
} from '../types';
import { GenerationPipeline, createPipelineContext } from '../engine/pipeline';
import { validateSeeds } from '../engine/validators/generate';
import { SINGLE_ELIMINATION_STEPS } from './generation-steps';

const pipeline = new GenerationPipeline(SINGLE_ELIMINATION_STEPS);

export function generateBracket(
  competitors: readonly EngineCompetitor[],
  drawType: DrawType = 'random',
  manualPlacements?: Map<number, string>,
  placementOrder?: readonly string[],
): GenerationResult {
  if (competitors.length < 2) {
    throw new Error('At least 2 competitors are required to generate a bracket');
  }
  if (competitors.length > 256) {
    throw new Error('Maximum 256 competitors allowed');
  }

  const seedErrors = validateSeeds({
    competitors,
    drawType,
    manualPlacements,
    placementOrder,
  });
  if (seedErrors.length > 0) {
    throw new Error(seedErrors.join('; '));
  }

  const ctx = createPipelineContext(
    competitors,
    drawType,
    manualPlacements,
    placementOrder,
  );
  const result = pipeline.run(ctx);
  return { bracket: result.bracket!, byes: result.byes! };
}

export function isBracketComplete(bracket: EngineBracket): boolean {
  return bracket.matches.every((m) => m.winner !== null);
}

export function getChampion(bracket: EngineBracket): EngineCompetitor | null {
  const final = bracket.matches.find(
    (m) => m.round === bracket.totalRounds && m.position === 0,
  );
  return final?.winner ?? null;
}
