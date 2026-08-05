import type {
  EngineCompetitor,
  EngineBracket,
  DrawType,
  GenerationResult,
} from '../types';
import { GenerationPipeline, createPipelineContext } from '../engine/pipeline';
import { SINGLE_ELIMINATION_STEPS } from './generation-steps';

const pipeline = new GenerationPipeline(SINGLE_ELIMINATION_STEPS);

export function generateBracket(
  competitors: readonly EngineCompetitor[],
  drawType: DrawType = 'random',
  manualPlacements?: Map<number, string>,
): GenerationResult {
  if (competitors.length < 2) {
    throw new Error('At least 2 competitors are required to generate a bracket');
  }
  if (competitors.length > 256) {
    throw new Error('Maximum 256 competitors allowed');
  }

  const ctx = createPipelineContext(competitors, drawType, manualPlacements);
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
