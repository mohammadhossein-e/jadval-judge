'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BulkAddResult {
  name: string;
  club: string;
  seed: number | null;
}

interface BulkAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (competitors: BulkAddResult[]) => void;
}

function parseBulkInput(text: string): { valid: BulkAddResult[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const valid: BulkAddResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/\t/);
    const name = parts[0]?.trim();
    if (!name) continue;

    const club = parts[1]?.trim() ?? '';
    if (!club) {
      errors.push(`Line ${i + 1}: "${name}" — club is required`);
      continue;
    }

    const seedRaw = parts[2]?.trim();
    const parsed = seedRaw ? parseInt(seedRaw, 10) : NaN;
    const seed = isNaN(parsed) ? null : parsed;

    valid.push({ name, club, seed });
  }

  return { valid, errors };
}

export function BulkAddDialog({ open, onOpenChange, onAdd }: BulkAddDialogProps) {
  const [text, setText] = useState('');

  const { valid, errors } = useMemo(
    () => (text.trim() ? parseBulkInput(text) : { valid: [], errors: [] }),
    [text],
  );
  const hasContent = valid.length > 0;
  const hasErrors = errors.length > 0;

  function handleConfirm(): void {
    if (!hasContent) return;
    onAdd(valid);
    setText('');
    onOpenChange(false);
  }

  function handleCancel(): void {
    setText('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Add Competitors</DialogTitle>
          <DialogDescription>
            Paste from Excel or a spreadsheet. Each line is one competitor. Use tabs to separate
            columns: Name, Club, Seed (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="bulk-paste">Pasted Data</Label>
          <textarea
            id="bulk-paste"
            rows={8}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            placeholder={
              'Tanaka Kenji\tTokyo Karate Club\t1\nSuzuki Yuki\tOsaka Dojo\t2\nYamamoto Takeshi\tKyoto Academy'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {hasContent && (
          <p className="text-xs text-muted-foreground">
            {valid.length} competitor{valid.length === 1 ? '' : 's'} detected
          </p>
        )}

        {hasErrors && (
          <div className="space-y-1">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-destructive">
                {err}
              </p>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={!hasContent} onClick={handleConfirm}>
            Add {hasContent ? valid.length : ''} Competitor{valid.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
