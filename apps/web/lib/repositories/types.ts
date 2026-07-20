import type {
  Tournament,
  TournamentType,
  Category,
  Gender,
  AgeGroup,
  BeltLevel,
} from '@jadval/types';

export interface CreateTournamentInput {
  name: string;
  date: string;
  organization: string | null;
  tournamentType: TournamentType;
  categories: {
    name: string;
    gender: Gender | null;
    ageGroup: AgeGroup | null;
    beltLevel: BeltLevel | null;
  }[];
}

export interface UpdateTournamentInput {
  name: string;
  date: string;
  organization: string | null;
}

export interface CreateCategoryInput {
  name: string;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  beltLevel: BeltLevel | null;
}

export interface UpdateCategoryInput {
  name: string;
}

export interface TournamentRepository {
  listTournaments(): Tournament[];
  getTournament(id: string): Tournament | null;
  createTournament(input: CreateTournamentInput): Tournament;
  updateTournament(id: string, input: UpdateTournamentInput): Tournament;
  listCategories(tournamentId: string): Category[];
  getCategory(id: string): Category | null;
  createCategory(tournamentId: string, input: CreateCategoryInput): Category;
  updateCategory(id: string, input: UpdateCategoryInput): Category;
  deleteCategory(id: string): void;
}
