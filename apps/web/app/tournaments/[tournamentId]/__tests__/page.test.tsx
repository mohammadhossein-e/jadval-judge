import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within, cleanup } from '@testing-library/react';
import TournamentDashboardPage from '@/app/tournaments/[tournamentId]/page';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/repositories', () => ({
  getRepository: vi.fn(),
}));

import { getRepository } from '@/lib/repositories';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function createParams(tournamentId: string) {
  return Promise.resolve({ tournamentId });
}

describe('TournamentDashboardPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), back: vi.fn() } as never);
  });

  it('shows loading state initially', () => {
    const mockGet = vi.fn().mockReturnValue(null);
    vi.mocked(getRepository).mockReturnValue({ getTournament: mockGet, listCategories: vi.fn() } as never);

    render(<TournamentDashboardPage params={createParams('nonexistent')} />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows not-found when tournament does not exist', async () => {
    const mockGet = vi.fn().mockReturnValue(null);
    vi.mocked(getRepository).mockReturnValue({ getTournament: mockGet, listCategories: vi.fn() } as never);

    render(<TournamentDashboardPage params={createParams('nonexistent')} />);

    await waitFor(() => {
      expect(screen.getByText('Tournament not found')).toBeTruthy();
    });
  });

  it('shows not-found message and back link', async () => {
    const mockGet = vi.fn().mockReturnValue(null);
    vi.mocked(getRepository).mockReturnValue({ getTournament: mockGet, listCategories: vi.fn() } as never);

    render(<TournamentDashboardPage params={createParams('nonexistent')} />);

    await waitFor(() => {
      expect(screen.getByText('Tournament not found')).toBeTruthy();
      expect(screen.getByText('The tournament you are looking for does not exist.')).toBeTruthy();
      expect(screen.getByText('Back to Tournaments')).toBeTruthy();
    });
  });

  it('renders tournament when it exists', async () => {
    const tournament = { id: 't1', name: 'Spring Open', date: '2026-04-10', organization: 'KF', createdAt: '', updatedAt: '' };
    const mockGet = vi.fn().mockReturnValue(tournament);
    const mockList = vi.fn().mockReturnValue([]);
    vi.mocked(getRepository).mockReturnValue({ getTournament: mockGet, listCategories: mockList } as never);

    render(<TournamentDashboardPage params={createParams('t1')} />);

    await waitFor(() => {
      expect(screen.getByText('Spring Open')).toBeTruthy();
      expect(screen.getByText('2026-04-10 • KF')).toBeTruthy();
    });
  });

  it('does not show not-found when tournament exists', async () => {
    const tournament = { id: 't1', name: 'Test', date: '2026-01-01', organization: null, createdAt: '', updatedAt: '' };
    vi.mocked(getRepository).mockReturnValue({ getTournament: vi.fn().mockReturnValue(tournament), listCategories: vi.fn().mockReturnValue([]) } as never);

    render(<TournamentDashboardPage params={createParams('t1')} />);

    await waitFor(() => {
      expect(screen.queryByText('Tournament not found')).toBeNull();
    });
  });

  describe('delete tournament', () => {
    const tournament = {
      id: 't1',
      name: 'Spring Open',
      date: '2026-04-10',
      organization: 'KF',
      createdAt: '',
      updatedAt: '',
    };

    function mockLoadedTournament(deleteTournament?: () => void) {
      vi.mocked(getRepository).mockReturnValue({
        getTournament: vi.fn().mockReturnValue(tournament),
        listCategories: vi.fn().mockReturnValue([]),
        deleteTournament: deleteTournament ?? vi.fn(),
      } as never);
    }

    async function openDeleteDialog() {
      render(<TournamentDashboardPage params={createParams('t1')} />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete tournament/i })).toBeTruthy();
      });
      fireEvent.click(screen.getByRole('button', { name: /delete tournament/i }));
    }

    it('shows a Delete Tournament action for the loaded tournament', async () => {
      mockLoadedTournament();
      render(<TournamentDashboardPage params={createParams('t1')} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete tournament/i })).toBeTruthy();
      });
    });

    it('clicking Delete Tournament opens a destructive confirmation dialog', async () => {
      mockLoadedTournament();
      await openDeleteDialog();

      const dialog = screen.getByRole('alertdialog');
      expect(within(dialog).getByText('Delete Tournament?')).toBeTruthy();
      expect(
        within(dialog).getByText(
          'This will permanently delete this tournament and its categories, competitors, and tournament data.',
        ),
      ).toBeTruthy();
      expect(
        within(dialog).getByRole('button', { name: 'Delete Tournament' }).className,
      ).toContain('bg-destructive');
    });

    it('cancel closes the dialog without deleting anything', async () => {
      const deleteTournament = vi.fn();
      mockLoadedTournament(deleteTournament);
      const push = vi.fn();
      vi.mocked(useRouter).mockReturnValue({ push, back: vi.fn() } as never);
      await openDeleteDialog();

      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(deleteTournament).not.toHaveBeenCalled();
      expect(screen.getByText('Spring Open')).toBeTruthy();
      expect(push).not.toHaveBeenCalled();
    });

    it('confirm deletes the selected tournament and navigates to the tournaments list', async () => {
      const deleteTournament = vi.fn();
      mockLoadedTournament(deleteTournament);
      const push = vi.fn();
      vi.mocked(useRouter).mockReturnValue({ push, back: vi.fn() } as never);
      await openDeleteDialog();

      fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete Tournament' }),
      );

      expect(deleteTournament).toHaveBeenCalledWith('t1');
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Tournament deleted');
      expect(push).toHaveBeenCalledWith('/tournaments');
    });

    it('deletion failure keeps the tournament available and does not navigate', async () => {
      mockLoadedTournament(() => {
        throw new Error('boom');
      });
      const push = vi.fn();
      vi.mocked(useRouter).mockReturnValue({ push, back: vi.fn() } as never);
      await openDeleteDialog();

      fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete Tournament' }),
      );

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('boom');
      expect(push).not.toHaveBeenCalled();
      expect(screen.getByText('Spring Open')).toBeTruthy();
    });
  });
});
