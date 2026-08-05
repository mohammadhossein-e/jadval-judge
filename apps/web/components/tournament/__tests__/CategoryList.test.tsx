import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React, { useState } from 'react';
import { CategoryList } from '../CategoryList';
import type { Gender, AgeGroup, BeltLevel } from '@jadval/types';

vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock('@/lib/constants', () => ({
  GENDER_LABELS: { male: 'Male', female: 'Female' },
  AGE_GROUP_LABELS: { '18-34': '18-34', '35-44': '35-44' },
  BELT_LEVEL_LABELS: { black: 'Black', white: 'White' },
}));

vi.mock('lucide-react', () => ({
  Pencil: () => <span data-testid="icon-pencil" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Tag: () => <span data-testid="icon-tag" />,
}));

const categories: { id: string; name: string; gender: Gender | null; ageGroup: AgeGroup | null; beltLevel: BeltLevel | null }[] = [
  { id: 'cat-1', name: 'Kata', gender: null, ageGroup: null, beltLevel: null },
  { id: 'cat-2', name: 'Kumite', gender: 'male', ageGroup: '18-34', beltLevel: 'black' },
];

describe('CategoryList delete confirmation', () => {
  const mockOnRemove = vi.fn();
  const mockOnEdit = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows confirmation dialog when delete button is clicked', () => {
    render(
      <CategoryList categories={categories} onEdit={mockOnEdit} onRemove={mockOnRemove} />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: /remove category/i });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete this category?')).toBeTruthy();
    expect(
      screen.getByText(
        'This will permanently remove the category and all of its competitors. This action cannot be undone.',
      ),
    ).toBeTruthy();
  });

  it('cancel does not delete the category', () => {
    render(
      <CategoryList categories={categories} onEdit={mockOnEdit} onRemove={mockOnRemove} />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: /remove category/i });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete this category?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('confirm deletes the category', () => {
    render(
      <CategoryList categories={categories} onEdit={mockOnEdit} onRemove={mockOnRemove} />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: /remove category/i });
    fireEvent.click(deleteButtons[0]);

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(mockOnRemove).toHaveBeenCalledWith('cat-1');
  });

  it('shows confirmation dialog for every category regardless of status', () => {
    render(
      <CategoryList categories={categories} onEdit={mockOnEdit} onRemove={mockOnRemove} />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: /remove category/i });

    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText('Delete this category?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(mockOnRemove).toHaveBeenCalledWith('cat-1');

    fireEvent.click(deleteButtons[1]);
    expect(screen.getByText('Delete this category?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(mockOnRemove).toHaveBeenCalledWith('cat-2');
  });

  it('does not show dialog before delete button is clicked', () => {
    render(
      <CategoryList categories={categories} onEdit={mockOnEdit} onRemove={mockOnRemove} />,
    );

    expect(screen.queryByText('Delete this category?')).toBeNull();
  });
});
