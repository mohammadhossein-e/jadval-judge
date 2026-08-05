import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React, { useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

function BracketGenerationHarness({
  initialIsGenerated,
  onGenerate,
}: {
  initialIsGenerated: boolean;
  onGenerate: () => void;
}) {
  const [isGenerated, setIsGenerated] = useState(initialIsGenerated);
  const [showRegenDialog, setShowRegenDialog] = useState(false);

  const handleGenerateClick = useCallback(() => {
    if (isGenerated) {
      setShowRegenDialog(true);
    } else {
      onGenerate();
    }
  }, [isGenerated, onGenerate]);

  return (
    <>
      <button onClick={handleGenerateClick}>Generate Bracket</button>
      <ConfirmDialog
        open={showRegenDialog}
        onOpenChange={setShowRegenDialog}
        title="Regenerate Bracket?"
        description="A bracket has already been generated. Regenerating it will discard all recorded match results. Continue?"
        confirmText="Regenerate"
        cancelText="Cancel"
        onConfirm={() => {
          setShowRegenDialog(false);
          onGenerate();
        }}
      />
    </>
  );
}

describe('Bracket regeneration confirmation', () => {
  const mockGenerate = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates bracket immediately on first generation (no dialog)', () => {
    render(
      <BracketGenerationHarness initialIsGenerated={false} onGenerate={mockGenerate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /generate bracket/i }));

    expect(screen.queryByText('Regenerate Bracket?')).toBeNull();
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('shows confirmation dialog when bracket already exists', () => {
    render(
      <BracketGenerationHarness initialIsGenerated={true} onGenerate={mockGenerate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /generate bracket/i }));

    expect(screen.getByText('Regenerate Bracket?')).toBeTruthy();
    expect(
      screen.getByText(
        'A bracket has already been generated. Regenerating it will discard all recorded match results. Continue?',
      ),
    ).toBeTruthy();
  });

  it('cancel closes dialog without regenerating', () => {
    render(
      <BracketGenerationHarness initialIsGenerated={true} onGenerate={mockGenerate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /generate bracket/i }));

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByText('Regenerate Bracket?')).toBeNull();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('regenerate closes dialog and performs generation', () => {
    render(
      <BracketGenerationHarness initialIsGenerated={true} onGenerate={mockGenerate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /generate bracket/i }));

    fireEvent.click(screen.getByRole('button', { name: /regenerate/i }));

    expect(screen.queryByText('Regenerate Bracket?')).toBeNull();
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});
