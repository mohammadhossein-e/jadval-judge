import { LocalStorageRepository } from './local-storage-repository';
import type { TournamentRepository } from './types';

let instance: TournamentRepository | null = null;

export function getRepository(): TournamentRepository {
  if (!instance) {
    instance = new LocalStorageRepository();
  }
  return instance;
}

export type {
  TournamentRepository,
  CreateTournamentInput,
  UpdateTournamentInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './types';
