import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import CategoryManagementPage from '@/app/tournaments/[tournamentId]/categories/[categoryId]/page';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/repositories', () => ({
  getRepository: vi.fn(),
}));

vi.mock('@/components/competitor/CategoryCompetitorsManager', () => ({
  CategoryCompetitorsManager: ({ categoryName }: { categoryName: string }) => (
    <div data-testid="category-manager">{categoryName}</div>
  ),
}));

import { getRepository } from '@/lib/repositories';

function createParams(tournamentId: string, categoryId: string) {
  return Promise.resolve({ tournamentId, categoryId });
}

describe('CategoryManagementPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(getRepository).mockReturnValue({ getCategory: vi.fn().mockReturnValue(null) } as never);

    render(<CategoryManagementPage params={createParams('t1', 'nonexistent')} />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows not-found when category does not exist', async () => {
    vi.mocked(getRepository).mockReturnValue({ getCategory: vi.fn().mockReturnValue(null) } as never);

    render(<CategoryManagementPage params={createParams('t1', 'nonexistent')} />);

    await waitFor(() => {
      expect(screen.getByText('Category not found')).toBeTruthy();
    });
  });

  it('shows not-found message and back link', async () => {
    vi.mocked(getRepository).mockReturnValue({ getCategory: vi.fn().mockReturnValue(null) } as never);

    render(<CategoryManagementPage params={createParams('t1', 'nonexistent')} />);

    await waitFor(() => {
      expect(screen.getByText('Category not found')).toBeTruthy();
      expect(screen.getByText('The category you are looking for does not exist.')).toBeTruthy();
      expect(screen.getByText('Back to Tournaments')).toBeTruthy();
    });
  });

  it('renders CategoryCompetitorsManager when category exists', async () => {
    const category = { id: 'c1', tournamentId: 't1', name: 'Kata', status: 'SETUP' };
    vi.mocked(getRepository).mockReturnValue({ getCategory: vi.fn().mockReturnValue(category) } as never);

    render(<CategoryManagementPage params={createParams('t1', 'c1')} />);

    await waitFor(() => {
      expect(screen.getByTestId('category-manager')).toBeTruthy();
      expect(screen.getByText('Kata')).toBeTruthy();
    });
  });

  it('does not show not-found when category exists', async () => {
    const category = { id: 'c1', tournamentId: 't1', name: 'Kumite', status: 'SETUP' };
    vi.mocked(getRepository).mockReturnValue({ getCategory: vi.fn().mockReturnValue(category) } as never);

    render(<CategoryManagementPage params={createParams('t1', 'c1')} />);

    await waitFor(() => {
      expect(screen.queryByText('Category not found')).toBeNull();
    });
  });

  it('shows not-found for different tournament with invalid category', async () => {
    vi.mocked(getRepository).mockReturnValue({ getCategory: vi.fn().mockReturnValue(null) } as never);

    render(<CategoryManagementPage params={createParams('t99', 'c99')} />);

    await waitFor(() => {
      expect(screen.getByText('Category not found')).toBeTruthy();
    });
  });
});
