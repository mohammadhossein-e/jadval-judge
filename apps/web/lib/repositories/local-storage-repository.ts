import type { Tournament, Category, Competitor } from '@jadval/types';
import type { EngineBracket } from '@jadval/bracket-engine';
import type {
  TournamentRepository,
  CreateTournamentInput,
  UpdateTournamentInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateCompetitorInput,
} from './types';

const STORAGE_PREFIX = 'jadval:';
const TOURNAMENTS_KEY = `${STORAGE_PREFIX}tournaments`;
const CATEGORIES_KEY = `${STORAGE_PREFIX}categories`;
const COMPETITORS_KEY = `${STORAGE_PREFIX}competitors`;
const BRACKETS_KEY = `${STORAGE_PREFIX}brackets`;

function readStore<T>(key: string): Record<string, T> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore<T>(key: string, data: Record<string, T>): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return crypto.randomUUID();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class LocalStorageRepository implements TournamentRepository {
  listTournaments(): Tournament[] {
    console.log('[LocalStorageRepository] listTournaments called');
    const store = readStore<Tournament>(TOURNAMENTS_KEY);
    console.log('[LocalStorageRepository] raw store keys:', Object.keys(store));
    const result = Object.values(store).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    console.log('[LocalStorageRepository] listTournaments returning', result.length, 'tournaments');
    return result;
  }

  getTournament(id: string): Tournament | null {
    const store = readStore<Tournament>(TOURNAMENTS_KEY);
    return store[id] ?? null;
  }

  createTournament(input: CreateTournamentInput): Tournament {
    console.log('[LocalStorageRepository] createTournament called');
    const now = new Date().toISOString();
    const tournamentId = generateId();

    const tournament: Tournament = {
      id: tournamentId,
      name: input.name,
      date: input.date,
      organization: input.organization,
      tournamentType: input.tournamentType,
      editPin: generateId().slice(0, 6),
      createdAt: now,
      updatedAt: now,
    };

    console.log('[LocalStorageRepository] tournament object built, id:', tournamentId);
    const tournamentStore = readStore<Tournament>(TOURNAMENTS_KEY);
    console.log('[LocalStorageRepository] existing store has', Object.keys(tournamentStore).length, 'entries');
    tournamentStore[tournamentId] = tournament;
    console.log('[LocalStorageRepository] BEFORE localStorage.setItem, key:', TOURNAMENTS_KEY);
    console.log('[LocalStorageRepository] stored object:', JSON.stringify(tournamentStore, null, 2));
    writeStore(TOURNAMENTS_KEY, tournamentStore);
    console.log('[LocalStorageRepository] AFTER localStorage.setItem');
    const verify = localStorage.getItem(TOURNAMENTS_KEY);
    console.log('[LocalStorageRepository] VERIFY localStorage.getItem:', verify);

    const categoryStore = readStore<Category>(CATEGORIES_KEY);
    for (const cat of input.categories) {
      const categoryId = generateId();
      const category: Category = {
        id: categoryId,
        tournamentId,
        name: cat.name,
        status: 'SETUP',
        gender: cat.gender,
        ageGroup: cat.ageGroup,
        beltLevel: cat.beltLevel,
        bracketSize: null,
        drawType: null,
        totalRounds: null,
        slug: slugify(cat.name),
        createdAt: now,
        updatedAt: now,
      };
      categoryStore[categoryId] = category;
    }
    writeStore(CATEGORIES_KEY, categoryStore);

    return tournament;
  }

  updateTournament(id: string, input: UpdateTournamentInput): Tournament {
    const store = readStore<Tournament>(TOURNAMENTS_KEY);
    const existing = store[id];
    if (!existing) {
      throw new Error(`Tournament ${id} not found`);
    }
    const updated: Tournament = {
      ...existing,
      name: input.name,
      date: input.date,
      organization: input.organization,
      updatedAt: new Date().toISOString(),
    };
    store[id] = updated;
    writeStore(TOURNAMENTS_KEY, store);
    return updated;
  }

  listCategories(tournamentId: string): Category[] {
    const store = readStore<Category>(CATEGORIES_KEY);
    return Object.values(store)
      .filter((c) => c.tournamentId === tournamentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getCategory(id: string): Category | null {
    const store = readStore<Category>(CATEGORIES_KEY);
    return store[id] ?? null;
  }

  createCategory(tournamentId: string, input: CreateCategoryInput): Category {
    const now = new Date().toISOString();
    const category: Category = {
      id: generateId(),
      tournamentId,
      name: input.name,
      status: 'SETUP',
      gender: input.gender,
      ageGroup: input.ageGroup,
      beltLevel: input.beltLevel,
      bracketSize: null,
      drawType: null,
      totalRounds: null,
      slug: slugify(input.name),
      createdAt: now,
      updatedAt: now,
    };
    const store = readStore<Category>(CATEGORIES_KEY);
    store[category.id] = category;
    writeStore(CATEGORIES_KEY, store);
    return category;
  }

  updateCategory(id: string, input: UpdateCategoryInput): Category {
    const store = readStore<Category>(CATEGORIES_KEY);
    const existing = store[id];
    if (!existing) {
      throw new Error(`Category ${id} not found`);
    }
    const updated: Category = {
      ...existing,
      name: input.name,
      slug: slugify(input.name),
      updatedAt: new Date().toISOString(),
    };
    store[id] = updated;
    writeStore(CATEGORIES_KEY, store);
    return updated;
  }

  deleteCategory(id: string): void {
    const categoryStore = readStore<Category>(CATEGORIES_KEY);
    delete categoryStore[id];
    writeStore(CATEGORIES_KEY, categoryStore);

    const competitorStore = readStore<Competitor>(COMPETITORS_KEY);
    for (const [key, competitor] of Object.entries(competitorStore)) {
      if (competitor.categoryId === id) {
        delete competitorStore[key];
      }
    }
    writeStore(COMPETITORS_KEY, competitorStore);

    const bracketStore = readStore<EngineBracket>(BRACKETS_KEY);
    delete bracketStore[id];
    writeStore(BRACKETS_KEY, bracketStore);
  }

  deleteTournament(id: string): void {
    const tournamentStore = readStore<Tournament>(TOURNAMENTS_KEY);
    if (!tournamentStore[id]) {
      throw new Error(`Tournament ${id} not found`);
    }
    delete tournamentStore[id];
    writeStore(TOURNAMENTS_KEY, tournamentStore);

    const categoryStore = readStore<Category>(CATEGORIES_KEY);
    const deletedCategoryIds: string[] = [];
    for (const [key, category] of Object.entries(categoryStore)) {
      if (category.tournamentId === id) {
        delete categoryStore[key];
        deletedCategoryIds.push(key);
      }
    }
    writeStore(CATEGORIES_KEY, categoryStore);

    const deletedCategoryIdSet = new Set(deletedCategoryIds);
    const competitorStore = readStore<Competitor>(COMPETITORS_KEY);
    for (const [key, competitor] of Object.entries(competitorStore)) {
      if (deletedCategoryIdSet.has(competitor.categoryId)) {
        delete competitorStore[key];
      }
    }
    writeStore(COMPETITORS_KEY, competitorStore);

    const bracketStore = readStore<EngineBracket>(BRACKETS_KEY);
    for (const categoryId of deletedCategoryIds) {
      delete bracketStore[categoryId];
    }
    writeStore(BRACKETS_KEY, bracketStore);
  }

  listCompetitors(categoryId: string): Competitor[] {
    const store = readStore<Competitor>(COMPETITORS_KEY);
    return Object.values(store)
      .filter((c) => c.categoryId === categoryId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  setCompetitors(
    categoryId: string,
    competitors: CreateCompetitorInput[],
  ): Competitor[] {
    const now = new Date().toISOString();
    const store = readStore<Competitor>(COMPETITORS_KEY);

    for (const [key, existing] of Object.entries(store)) {
      if (existing.categoryId === categoryId) {
        delete store[key];
      }
    }

    const created: Competitor[] = competitors.map((input) => ({
      id: generateId(),
      categoryId,
      name: input.name,
      club: input.club,
      seed: input.seed,
      createdAt: now,
    }));

    for (const competitor of created) {
      store[competitor.id] = competitor;
    }

    writeStore(COMPETITORS_KEY, store);
    return created;
  }

  saveBracket(categoryId: string, bracket: EngineBracket): void {
    const store = readStore<EngineBracket>(BRACKETS_KEY);
    store[categoryId] = bracket;
    writeStore(BRACKETS_KEY, store);
  }

  getBracket(categoryId: string): EngineBracket | null {
    const store = readStore<EngineBracket>(BRACKETS_KEY);
    return store[categoryId] ?? null;
  }

  deleteBracket(categoryId: string): void {
    const store = readStore<EngineBracket>(BRACKETS_KEY);
    delete store[categoryId];
    writeStore(BRACKETS_KEY, store);
  }
}
