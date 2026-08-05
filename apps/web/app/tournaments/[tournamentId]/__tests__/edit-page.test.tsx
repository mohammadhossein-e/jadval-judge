import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import EditTournamentPage from '@/app/tournaments/[tournamentId]/edit/page';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/repositories', () => ({
  getRepository: vi.fn(),
}));

import { getRepository } from '@/lib/repositories';

function createParams(tournamentId: string) {
  return Promise.resolve({ tournamentId });
}

describe('EditTournamentPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(getRepository).mockReturnValue({ getTournament: vi.fn().mockReturnValue(null) } as never);

    render(<EditTournamentPage params={createParams('nonexistent')} />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows not-found when tournament does not exist', async () => {
    vi.mocked(getRepository).mockReturnValue({ getTournament: vi.fn().mockReturnValue(null) } as never);

    render(<EditTournamentPage params={createParams('nonexistent')} />);

    await waitFor(() => {
      expect(screen.getByText('Tournament not found')).toBeTruthy();
    });
  });

  it('shows not-found message and back link', async () => {
    vi.mocked(getRepository).mockReturnValue({ getTournament: vi.fn().mockReturnValue(null) } as never);

    render(<EditTournamentPage params={createParams('nonexistent')} />);

    await waitFor(() => {
      expect(screen.getByText('Tournament not found')).toBeTruthy();
      expect(screen.getByText('The tournament you are looking for does not exist.')).toBeTruthy();
      expect(screen.getByText('Back to Tournaments')).toBeTruthy();
    });
  });

  it('renders edit form when tournament exists', async () => {
    const tournament = { id: 't1', name: 'Spring Open', date: '2026-04-10', organization: 'KF', createdAt: '', updatedAt: '' };
    vi.mocked(getRepository).mockReturnValue({
      getTournament: vi.fn().mockReturnValue(tournament),
      listCategories: vi.fn().mockReturnValue([]),
    } as never);

    render(<EditTournamentPage params={createParams('t1')} />);

    await waitFor(() => {
      expect(screen.getByText('Manage Tournament')).toBeTruthy();
      expect(screen.getByDisplayValue('Spring Open')).toBeTruthy();
    });
  });

  it('does not show not-found when tournament exists', async () => {
    const tournament = { id: 't1', name: 'Test', date: '2026-01-01', organization: null, createdAt: '', updatedAt: '' };
    vi.mocked(getRepository).mockReturnValue({
      getTournament: vi.fn().mockReturnValue(tournament),
      listCategories: vi.fn().mockReturnValue([]),
    } as never);

    render(<EditTournamentPage params={createParams('t1')} />);

    await waitFor(() => {
      expect(screen.queryByText('Tournament not found')).toBeNull();
    });
  });
});
