import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { CategoryCompetitorsManager } from '@/components/competitor/CategoryCompetitorsManager';
import { getRepository } from '@/lib/repositories';
import type { Competitor } from '@jadval/types';

vi.mock('@/components/competitor/CategoryHeader', () => ({
  CategoryHeader: () => <div data-testid="category-header" />,
}));
vi.mock('@/components/competitor/DrawTypeSelector', () => ({
  DrawTypeSelector: () => <div />,
}));
vi.mock('@/components/competitor/RandomDrawCard', () => ({
  RandomDrawCard: () => <div />,
}));
vi.mock('@/components/competitor/ManualDrawCard', () => ({
  ManualDrawCard: () => <div />,
}));
vi.mock('@/components/competitor/BracketPreviewCard', () => ({
  BracketPreviewCard: () => <div />,
}));

const CATEGORY_ID = 'cat-1';

function seedCompetitors(categoryId: string, names: string[]): Competitor[] {
  return getRepository().setCompetitors(
    categoryId,
    names.map((name) => ({ name, club: `${name}'s Club`, seed: null })),
  );
}

function renderManager(categoryId: string = CATEGORY_ID) {
  render(<CategoryCompetitorsManager tournamentId="t-1" categoryId={categoryId} categoryName="Kata" />);
}

function editButtonForIndex(index: number): HTMLElement {
  return screen.getAllByRole('button', { name: 'Edit competitor' })[index];
}

function editForm(): HTMLElement {
  return screen.getByLabelText('Full Name *').closest('form') as HTMLElement;
}

function nameInput(): HTMLInputElement {
  return screen.getByLabelText('Full Name *') as HTMLInputElement;
}

// Asserts that `earlier` appears before `later` in document order.
function expectInOrder(earlier: Element, later: Element) {
  const relation = later.compareDocumentPosition(earlier);
  expect(relation & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
}

describe('CategoryCompetitorsManager — inline edit', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens the edit form directly under the selected competitor, not at the bottom', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B', 'Competitor C']);
    renderManager();

    fireEvent.click(editButtonForIndex(1));

    const form = editForm();
    expect(form).toBeTruthy();
    expect(nameInput().value).toBe('Competitor B');
    // Form sits between row B and row C — not after the last row.
    expectInOrder(screen.getByText('2. Competitor B'), form);
    expectInOrder(form, screen.getByText('3. Competitor C'));
  });

  it('opening the edit form for the first competitor keeps it under that row', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B', 'Competitor C']);
    renderManager();

    fireEvent.click(editButtonForIndex(0));

    const form = editForm();
    expectInOrder(screen.getByText('1. Competitor A'), form);
    expectInOrder(form, screen.getByText('2. Competitor B'));
  });

  it('edit form is closed by default', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A']);
    renderManager();
    expect(screen.queryByLabelText('Full Name *')).toBeNull();
  });

  it('save updates only the selected competitor and closes the form', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B', 'Competitor C']);
    renderManager();

    fireEvent.click(editButtonForIndex(1));
    fireEvent.change(nameInput(), { target: { value: 'Beatrice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(screen.queryByLabelText('Full Name *')).toBeNull();
    expect(screen.getByText('2. Beatrice')).toBeTruthy();
    expect(screen.getByText('1. Competitor A')).toBeTruthy();
    expect(screen.getByText('3. Competitor C')).toBeTruthy();
    expect(
      getRepository()
        .listCompetitors(CATEGORY_ID)
        .map((c) => c.name),
    ).toEqual(['Competitor A', 'Beatrice', 'Competitor C']);
  });

  it('cancel leaves all data unchanged and closes the form', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B', 'Competitor C']);
    renderManager();

    fireEvent.click(editButtonForIndex(1));
    fireEvent.change(nameInput(), { target: { value: 'Beatrice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Full Name *')).toBeNull();
    expect(screen.getByText('2. Competitor B')).toBeTruthy();
    expect(
      getRepository()
        .listCompetitors(CATEGORY_ID)
        .map((c) => c.name),
    ).toEqual(['Competitor A', 'Competitor B', 'Competitor C']);
  });

  it('switching from competitor A to competitor B does not leave stale edit state', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B', 'Competitor C']);
    renderManager();

    fireEvent.click(editButtonForIndex(0));
    fireEvent.change(nameInput(), { target: { value: 'Stale Name' } });

    fireEvent.click(editButtonForIndex(1));

    expect(nameInput().value).toBe('Competitor B');
  });

  it('edited competitor stays in the same list position after save', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B', 'Competitor C']);
    renderManager();

    fireEvent.click(editButtonForIndex(1));
    fireEvent.change(nameInput(), { target: { value: 'Beatrice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expectInOrder(screen.getByText('1. Competitor A'), screen.getByText('2. Beatrice'));
    expectInOrder(screen.getByText('2. Beatrice'), screen.getByText('3. Competitor C'));
  });

  it('handles large competitor lists: edit form opens under the middle row', () => {
    const names = Array.from({ length: 16 }, (_, i) => `C${i}`);
    seedCompetitors(CATEGORY_ID, names);
    renderManager();

    fireEvent.click(editButtonForIndex(8));

    const form = editForm();
    expect(nameInput().value).toBe('C8');
    expectInOrder(screen.getByText('9. C8'), form);
    expectInOrder(form, screen.getByText('10. C9'));
  });
});

describe('CategoryCompetitorsManager — delete all competitors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the Delete All action when competitors exist', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B']);
    renderManager();
    expect(
      (screen.getByRole('button', { name: /delete all/i }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('disables Delete All when there are no competitors', () => {
    renderManager();
    expect(
      (screen.getByRole('button', { name: /delete all/i }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('requires confirmation stating that ALL competitors will be removed', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B']);
    renderManager();

    fireEvent.click(screen.getByRole('button', { name: /delete all/i }));

    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Delete all competitors?')).toBeTruthy();
    expect(
      within(dialog).getByText(
        'This will remove ALL competitors from this category. This action cannot be undone.',
      ),
    ).toBeTruthy();
  });

  it('cancel performs no mutation', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B']);
    renderManager();

    fireEvent.click(screen.getByRole('button', { name: /delete all/i }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByText('1. Competitor A')).toBeTruthy();
    expect(screen.getByText('2. Competitor B')).toBeTruthy();
    expect(getRepository().listCompetitors(CATEGORY_ID)).toHaveLength(2);
  });

  it('confirm removes all competitors from the current category and shows empty state', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B', 'Competitor C']);
    seedCompetitors('cat-2', ['Competitor D', 'Competitor E']);
    renderManager();

    fireEvent.click(screen.getByRole('button', { name: /delete all/i }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete All' }),
    );

    expect(screen.getByText('No competitors yet')).toBeTruthy();
    expect(screen.getByText('0 / 128 competitors registered')).toBeTruthy();
    expect(getRepository().listCompetitors(CATEGORY_ID)).toHaveLength(0);

    // Another category is untouched.
    expect(
      getRepository()
        .listCompetitors('cat-2')
        .map((c) => c.name),
    ).toEqual(['Competitor D', 'Competitor E']);
  });

  it('removes the generated bracket for the category after delete all', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B']);
    getRepository().saveBracket(CATEGORY_ID, { size: 2, totalRounds: 1, matches: [] });
    renderManager();

    fireEvent.click(screen.getByRole('button', { name: /delete all/i }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete All' }),
    );

    expect(getRepository().getBracket(CATEGORY_ID)).toBeNull();
  });

  it('closes an in-progress edit form after delete all', () => {
    seedCompetitors(CATEGORY_ID, ['Competitor A', 'Competitor B']);
    renderManager();

    fireEvent.click(editButtonForIndex(0));
    expect(nameInput()).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /delete all/i }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete All' }),
    );

    expect(screen.queryByLabelText('Full Name *')).toBeNull();
  });
});
