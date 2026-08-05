import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BulkAddDialog } from '../BulkAddDialog';

describe('BulkAddDialog Tab key behavior', () => {
  afterEach(() => {
    cleanup();
  });

  function setup() {
    const onAdd = vi.fn();
    const onOpenChange = vi.fn();
    render(<BulkAddDialog open onOpenChange={onOpenChange} onAdd={onAdd} />);
    const textarea = screen.getByLabelText('Pasted Data') as HTMLTextAreaElement;
    return { textarea, onAdd, onOpenChange };
  }

  it('inserts a literal tab when Tab is pressed', () => {
    const { textarea } = setup();
    const name = 'Tanaka Kenji';

    fireEvent.change(textarea, { target: { value: name } });
    textarea.setSelectionRange(name.length, name.length);
    fireEvent.keyDown(textarea, { key: 'Tab' });

    expect(textarea.value).toBe(`${name}\t`);
  });

  it('places the cursor immediately after the inserted tab', async () => {
    const { textarea } = setup();
    const name = 'Tanaka Kenji';

    fireEvent.change(textarea, { target: { value: name } });
    textarea.setSelectionRange(name.length, name.length);
    fireEvent.keyDown(textarea, { key: 'Tab' });

    await waitFor(() => {
      expect(textarea.selectionStart).toBe(name.length + 1);
      expect(textarea.selectionEnd).toBe(name.length + 1);
    });
  });

  it('replaces the selected text with a tab', () => {
    const { textarea } = setup();

    fireEvent.change(textarea, { target: { value: 'Tanaka Kenji' } });
    textarea.setSelectionRange(0, 6);
    fireEvent.keyDown(textarea, { key: 'Tab' });

    expect(textarea.value).toBe('\t Kenji');
  });

  it('calls preventDefault only for the Tab key', () => {
    const { textarea } = setup();

    fireEvent.change(textarea, { target: { value: 'a' } });

    const tabResult = fireEvent.keyDown(textarea, { key: 'Tab' });
    expect(tabResult).toBe(false);

    const charResult = fireEvent.keyDown(textarea, { key: 'a' });
    expect(charResult).toBe(true);
  });

  it('parser produces name, club, seed from tab-separated input', () => {
    const { textarea, onAdd } = setup();

    fireEvent.change(textarea, {
      target: { value: 'Tanaka Kenji\tTokyo Karate Club\t1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add 1 competitor/i }));

    expect(onAdd).toHaveBeenCalledWith([
      { name: 'Tanaka Kenji', club: 'Tokyo Karate Club', seed: 1 },
    ]);
  });

  it('full manual entry via Tab produces expected TSV and parsed result', () => {
    const { textarea, onAdd } = setup();
    const name = 'Tanaka Kenji';
    const club = 'Tokyo Karate Club';
    const seed = '1';
    const expected = `${name}\t${club}\t${seed}`;

    fireEvent.change(textarea, { target: { value: name } });
    textarea.setSelectionRange(name.length, name.length);
    fireEvent.keyDown(textarea, { key: 'Tab' });

    const nameClub = `${name}\t${club}`;
    fireEvent.change(textarea, { target: { value: nameClub } });
    textarea.setSelectionRange(nameClub.length, nameClub.length);
    fireEvent.keyDown(textarea, { key: 'Tab' });

    fireEvent.change(textarea, { target: { value: expected } });

    expect(textarea.value).toBe(expected);

    fireEvent.click(screen.getByRole('button', { name: /add 1 competitor/i }));

    expect(onAdd).toHaveBeenCalledWith([
      { name: 'Tanaka Kenji', club: 'Tokyo Karate Club', seed: 1 },
    ]);
  });
});
